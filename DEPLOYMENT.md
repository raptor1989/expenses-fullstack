# Wdrożenie na produkcję

Instrukcja uruchomienia Household Expenses Manager na serwerze
produkcyjnym (Linux VM) oraz opis tego, co robi pipeline w Azure DevOps.
Oparta na faktycznej zawartości repo (stan: 2026-11-07).

## Jak to działa w produkcji

```
przeglądarka ──HTTPS──▶ reverse proxy (nginx / Caddy)
                          ├─ /api/*  ──▶ localhost:4000  (PM2 expenses-api, Express)
                          └─ /*      ──▶ localhost:5173  (PM2 expenses-web, sirv --single)
```

- Dwa procesy PM2 z `pm2.config.js` w katalogu głównym repo:
  `expenses-api` (`apps/api/dist/index.js`, port 4000) i `expenses-web`
  (`npm run serve:dist` w `apps/web`, czyli `sirv dist --single --host 0.0.0.0 --port 5173`,
  statyczny serwer z fallbackiem SPA).
- **API nie ma prefiksu `/api`** — trasy są montowane w korzeniu
  (`/users`, `/expenses`, `/categories`, `/settings`, `/health`). Jeśli
  frontend ma wołać `https://domena/api/...`, proxy musi **obciąć** prefiks
  `/api` (konfiguracja niżej). Alternatywa: osobna subdomena dla API, ale
  wtedy cookie sesyjne (`sameSite: 'strict'`) przestaje działać między
  różnymi site'ami — nie rób tego bez dodania CSRF i zmiany `sameSite`.
- Web i API muszą być pod jedną domeną: sesja to cookie `token`
  (`httpOnly`, `sameSite: 'strict'`, `secure` przy `NODE_ENV=production`),
  więc produkcja wymaga HTTPS.
- Baza: PostgreSQL osiągalny z VM. Pool `pg` nie ma włączonego SSL, więc
  baza powinna być lokalna albo w sieci prywatnej.

## Wymagania wstępne na VM

- Node.js ≥ 22.12 (pipeline buduje na Node 24), npm 11+
- PostgreSQL ≥ 12 (testowane z 17)
- `pm2` globalnie (`npm install -g pm2`) — pipeline woła `pm2` po nazwie,
  bez `npx`
- reverse proxy z TLS (nginx albo Caddy)

## 1. Pierwsze wdrożenie (ręcznie)

### 1.1. Klon i zależności

```bash
sudo mkdir -p /var/app && sudo chown "$USER" /var/app
git clone https://github.com/raptor1989/expenses-fullstack.git /var/app/expenses-fullstack
cd /var/app/expenses-fullstack
npm install
```

`package-lock.json` nie jest w repo (jest w `.gitignore`) — `npm install`
rozwiązuje wersje przypięte na sztywno w `package.json`.

### 1.2. Zmienne środowiskowe API — `apps/api/.env`

Plik nie jest w repo i pipeline go **nie tworzy ani nie nadpisuje**.

```env
PORT=4000
NODE_ENV=production

DB_USER=...
DB_PASSWORD=...
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=expenses_db

JWT_SECRET=<długi, losowy sekret — bez niego serwer odmawia startu>
JWT_EXPIRES_IN=7D

ALLOWED_ORIGINS=https://twoja-domena.pl
FRONTEND_URL=https://twoja-domena.pl
TRUST_PROXY=true
```

- `ALLOWED_ORIGINS` musi zawierać dokładny origin frontendu (protokół +
  host + ewentualny port); puste = CORS wyłączony i przeglądarka nie
  przejdzie logowania. Przy proxy pod jedną domeną wpisz ją tutaj.
- `FRONTEND_URL` to baza linku resetu hasła.
- `TRUST_PROXY=true` włącza `app.set('trust proxy', 1)`, dzięki czemu
  limity żądań liczą się per adres klienta z `X-Forwarded-For`, a nie
  per adres proxy.
- `DB_PORT` ustawiaj zawsze jawnie — domyślna wartość w kodzie
  (`apps/api/src/db/index.ts`) to 5433, nie 5432.

### 1.3. Zmienna frontendu — `apps/web/.env.production`

`VITE_API_URL` jest **wbudowywany w bundle podczas `vite build`**, nie
czytany w runtime. Przy proxy obcinającym `/api`:

```env
VITE_API_URL=https://twoja-domena.pl/api
```

Pipeline tego pliku również nie tworzy. Zmiana wartości wymaga
ponownego builda.

### 1.4. Baza i schemat

```bash
sudo -u postgres createdb expenses_db      # albo przez psql
cd /var/app/expenses-fullstack
npm run db:migrate --workspace=@expenses/api
```

`db:migrate` uruchamia `apps/api/src/db/migrate.ts` (`ts-node`) w jednej
transakcji. Skrypt jest idempotentny (`CREATE TABLE IF NOT EXISTS`,
`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`,
`DROP TRIGGER IF EXISTS`), więc można go powtarzać po każdej zmianie
schematu — pipeline robi to przy każdym wdrożeniu.

### 1.5. Build

```bash
npm run build
```

Kolejność (Turbo): `packages/shared` → `apps/api` + `apps/web`.
Efekt: `packages/shared/dist/`, `apps/api/dist/`, `apps/web/dist/`.

### 1.6. Start procesów PM2

```bash
npm start          # = pm2 start pm2.config.js
pm2 save
pm2 startup        # wypisze polecenie rejestrujące PM2 jako usługę — wykonaj je z sudo
pm2 status
```

`pm2 save` i `pm2 startup` to jedyne kroki, których pipeline nie wykona
za Ciebie; same procesy pipeline rejestruje lub restartuje przez
`pm2 startOrRestart pm2.config.js`. `scripts/start-pm2.js` robi to samo
programowo i jest zostawiony dla kompatybilności.

### 1.7. Reverse proxy i TLS

Przykład nginx (trailing slash w `proxy_pass` obcina prefiks `/api/`):

```nginx
server {
    listen 443 ssl http2;
    server_name twoja-domena.pl;
    # ssl_certificate / ssl_certificate_key ...

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_set_header Host $host;
    }
}
```

Caddy: `handle_path /api/* { reverse_proxy 127.0.0.1:4000 }` plus
`reverse_proxy 127.0.0.1:5173` dla reszty (`handle_path` obcina prefiks).
`sirv` nie kompresuje odpowiedzi — włącz gzip/brotli na proxy.

### 1.8. Weryfikacja

```bash
curl -i https://twoja-domena.pl/api/health          # 200 {"status":"ok",...}
curl -i https://twoja-domena.pl/api/users/session   # 200 {"user":null} — bez cookie to normalne
curl -I https://twoja-domena.pl/                    # 200, index.html
curl -I https://twoja-domena.pl/expenses            # 200, index.html (fallback SPA z sirv --single)
```

Potem w przeglądarce: rejestracja, logowanie, dodanie wydatku, odświeżenie
strony (sesja z cookie powinna przetrwać), wylogowanie.

## 2. Kolejne wdrożenia — pipeline Azure DevOps

`azure-pipelines.yml`, trigger: push do `master`.

1. **BuildAndTest** (agent `ubuntu-latest`, Node 24, kontener `postgres:17`):
   `npm install` → `npm run build` → `npm run lint` → `npm test`
   (testy integracyjne API łączą się z kontenerem; dane logowania są
   zgodne z `apps/api/.env.test`) → `npx playwright install --with-deps chromium`
   → `npm run test:e2e` (testy smoke na zbudowanej aplikacji, własna baza
   `expenses_e2e_db` w tym samym kontenerze). Przy niepowodzeniu smoke
   testów raport Playwrighta trafia do artefaktu `playwright-report`.
2. **Deploy** (environment `production`, tylko dla `refs/heads/master`):
   - `CopyFilesOverSSH@0` — kopiuje repo (bez `node_modules` i `.git`) do
     `$(deployPath)` = `/var/app/expenses-fullstack` przez service
     connection SSH `mikrus-vps-expenses`, z nadpisywaniem;
   - `SSH@0` — na VM: `npm install --no-audit --no-fund`, `npm run build`,
     `npm run db:migrate --workspace=@expenses/api`,
     `pm2 startOrRestart pm2.config.js --update-env`. Skrypt staje na
     pierwszym nieudanym poleceniu (`set -e`), a o wyniku kroku decyduje
     kod wyjścia: ostrzeżenia npm (np. `npm warn deprecated`) to zwykłe
     linie logu, nie błąd (`failOnStdErr: false`, stderr przekierowany
     na stdout).

Wymagania po stronie Azure DevOps i VM, których nie da się ustawić w
samym pliku:

- service connection typu SSH o nazwie `mikrus-vps-expenses`;
- na VM: Node ≥ 22.12, `pm2` na `PATH` użytkownika SSH, istniejący katalog
  `deployPath` z już obecnymi `apps/api/.env` i `apps/web/.env.production`
  (sekcje 1.2–1.3; pliki są w `.gitignore`, więc kopiowanie ich nie
  nadpisuje);
- baza `expenses_db` utworzona (sekcja 1.4) — migracja tworzy tabele,
  ale nie bazę.

Czego pipeline **nie robi**:

- nie usuwa z VM plików skasowanych w repo (kopiowanie tylko nadpisuje);
- nie tworzy bazy ani plików `.env`;
- nie wykonuje `pm2 save` / `pm2 startup` (sekcja 1.6).

Dodatkowo `.github/workflows/ci.yml` (GitHub Actions, Node 22) uruchamia
te same kroki build/lint/test/smoke dla pushy i PR-ów do `master` i
`develop`, bez wdrożenia.

## 3. Eksploatacja

- **Logi:** `pm2 logs expenses-api`, `pm2 logs expenses-web`.
- **Reset hasła:** aplikacja nie wysyła maili. Link resetu trafia do
  logu procesu i do pliku `apps/api/logs/password-resets.log` na VM
  (katalog `logs/` jest w `.gitignore`); link jest ważny 1 godzinę.
  Przekaż go użytkownikowi ręcznie.
- **Limity żądań:** 20 prób / 15 min na rejestrację, logowanie i reset
  hasła, 300 / 15 min na pozostałe trasy (odpowiedź 429
  `rate_limit_exceeded`). Liczniki są w pamięci procesu — restart je
  zeruje. Wymagają `TRUST_PROXY=true` za proxy (sekcja 1.2).
- **Utrata połączenia z bazą:** zerwane bezczynne połączenie jest
  logowane (`Unexpected error on idle PostgreSQL client`), a pool nawiąże
  nowe przy kolejnym zapytaniu; jeśli PostgreSQL leży, API odpowiada
  500 do czasu jego powrotu.
- **Zmiana `VITE_API_URL` albo domeny:** wymaga `npm run build` i
  `pm2 restart expenses-web`; zmiana `.env` API — `pm2 restart expenses-api`.

## 4. Najczęstsze problemy

| Objaw | Przyczyna / rozwiązanie |
|---|---|
| `FATAL: JWT_SECRET environment variable is not set` w logu API | brak `apps/api/.env` albo pustego `JWT_SECRET` |
| przeglądarka: błąd CORS przy logowaniu | `ALLOWED_ORIGINS` nie zawiera dokładnego originu frontendu |
| logowanie działa, ale po odświeżeniu sesja znika | cookie `secure` wymaga HTTPS; albo web i API są pod różnymi site'ami (`sameSite: 'strict'`) |
| `404 {"code":"not_found"}` dla `/api/users/login` z API | proxy nie obcina prefiksu `/api` (brak trailing slash w `proxy_pass`) |
| `ECONNREFUSED` do bazy mimo poprawnego `.env` | sprawdź `DB_PORT` (domyślna w kodzie to 5433) i czy PostgreSQL słucha na podanym hoście |
| 429 dla wszystkich użytkowników naraz | brak `TRUST_PROXY=true` — limit liczy się dla adresu proxy |
| pipeline: `pm2: command not found` | `pm2` nie jest na `PATH` użytkownika SSH (`npm install -g pm2`) |
| pipeline: krok SSH kończy się błędem | szukaj w logu ostatniego polecenia przed błędem: skrypt przerywa na pierwszym niezerowym kodzie wyjścia, więc migracja i restart PM2 się wtedy nie wykonują; same linie `npm warn` nie są przyczyną |
| po wdrożeniu błędy SQL o brakującej kolumnie/tabeli | krok migracji w pipeline nie przeszedł — uruchom `npm run db:migrate --workspace=@expenses/api` ręcznie i sprawdź log |
