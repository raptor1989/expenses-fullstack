# Wdrożenie na produkcję

Instrukcja krok po kroku dla uruchomienia Household Expenses Manager na
serwerze produkcyjnym (Linux VM). Oparta na rzeczywistej zawartości repo,
nie na opisach w `README.md` / root `package.json`, które są nieaktualne
(patrz krok 6).

## Wymagania wstępne

- Node.js ≥ 20 (wymóg z `engines` w root `package.json`)
- PostgreSQL ≥ 12, dostępny i osiągalny z serwera produkcyjnego
- npm 11+
- PM2 (instalowany jako devDependency w root `package.json`, dostępny przez `npx pm2`)

## 1. Klon i instalacja zależności

```bash
git clone <repo>
cd expenses-fullstack
npm install
```

## 2. Konfiguracja zmiennych środowiskowych API

Skopiuj i wypełnij `apps/api/.env` (na podstawie `apps/api/.env.example`):

```env
PORT=4000
NODE_ENV=production

DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
DB_NAME=expenses_db

JWT_SECRET=<długi, losowy sekret — bez tego serwer odmawia startu, patrz apps/api/src/index.ts>
JWT_EXPIRES_IN=7D

ALLOWED_ORIGINS=https://twoja-domena.pl
```

`ALLOWED_ORIGINS` musi zawierać dokładny origin (protokół+host+port)
frontendu — inaczej CORS zablokuje żądania (`apps/api/src/app.ts`).

## 3. Konfiguracja zmiennej dla frontendu (build-time!)

`VITE_API_URL` jest wbudowywany w bundle podczas builda Vite
(`apps/web/src/services/api.ts`), nie czytany w runtime. Utwórz
`apps/web/.env.production`:

```env
VITE_API_URL=https://twoja-domena.pl/api
```

## 4. Migracja bazy danych

```bash
cd apps/api
NODE_ENV=production npm run db:migrate
cd ../..
```

`db:migrate` uruchamia `apps/api/src/db/migrate.ts` w transakcji — sprawdź
ten plik, jeśli masz wątpliwości co do idempotentności przy powtórnym
uruchomieniu.

## 5. Build

Z katalogu root (build order: `shared` → `api` + `web` równolegle,
wymuszony przez Turbo):

```bash
npm run build
```

Efekt: `apps/api/dist/`, `apps/web/dist/`, `packages/shared/dist/`.

## 6. Start procesów

Repo zawiera własny skrypt PM2 (`scripts/start-pm2.js`), ale **nie jest on
podpięty pod żaden npm script** — mimo że README i opis w root
`package.json` sugerują `npm run start:pm2` / `npm run start`. Uruchamia
się go bezpośrednio:

```bash
node scripts/start-pm2.js
```

Odpala dwa procesy pod PM2:

- `expenses-api` — `apps/api/dist/index.js`, port 4000
- `expenses-web` — statyczny serwer (`serve -s dist`) na porcie 5173,
  serwujący zbudowany bundle z `apps/web/dist`

Po starcie, dla przetrwania restartu serwera:

```bash
npx pm2 save
npx pm2 startup   # generuje komendę rejestrującą PM2 jako usługę systemową — wykonaj ją z uprawnieniami administratora
```

## 7. Reverse proxy / TLS

Frontend (5173) i API (4000) to dwa procesy na różnych portach — w
produkcji potrzebny jest reverse proxy (nginx/Caddy), który:

- terminuje TLS (HTTPS),
- kieruje `/api/*` → `localhost:4000`,
- kieruje resztę → `localhost:5173`,
- ustawia jedną domenę dla obu, żeby cookie sesyjne (`sameSite: 'strict'`,
  httpOnly) działało — model auth zakłada, że web i API są na tej samej
  (sub)domenie.

## 8. Weryfikacja

```bash
curl -i https://twoja-domena.pl/api/users/me   # powinno dać 401 auth_required, nie błąd połączenia
```

Następnie przetestuj logowanie i podstawowy przepływ w przeglądarce.
