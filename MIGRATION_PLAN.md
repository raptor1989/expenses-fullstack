# Plan migracji zależności

Stan na 2026-06-20. Pakiety pogrupowane w fazy: najpierw narzędzia
kompilacji/orkiestracji (root + Turbo), potem `apps/api`, potem `apps/web`.
W każdej fazie kroki wykonywane **pojedynczo, nie wszystkie naraz** — po
każdym kroku build/lint/test musi przejść, zanim ruszamy dalej.

## Zasady wykonania

1. Jeden krok = jeden commit (łatwy rollback, łatwy `git bisect`, jeśli coś
   się posypie później).
2. Po każdym kroku: `npm install` → `npm run build` (root, Turbo) →
   `npm run lint` → `npm run test` dla zmienionego workspace’a → manualny
   smoke-test, jeśli krok dotyczy `apps/web` (logowanie, dodanie wydatku,
   dashboard — patrz skill `run-expenses-fullstack`).
3. Nie łączyć kroku z niepowiązaną zmianą funkcjonalną.
4. Jeśli krok ma codemod — uruchomić go i **przeczytać diff**, nie
   ufać mu w 100%.
5. Wersje docelowe przypięte na sztywno (bez `^`/`~`) w pierwszym kroku
   danego pakietu, potem zgodnie z istniejącą konwencją repo (większość
   zależności już jest przypięta na sztywno — wyjątki: `@nivo/bar`,
   `prettier`, `vitest`, zostają z `^`, tak jak są dziś).

---

## Faza 0 — Przygotowanie

- [x] Krok 0.1: Branch `chore/deps-migration` od `develop`.
- [x] Krok 0.2: Baseline — `npm run build && npm run test` na czystym
      `develop` (2026-06-20). **Wynik inny niż założony w planie:** build
      jest zielony (3/3 paczki, brak `TS2345`) i testy przechodzą w 100%
      (`@expenses/web`: 5 plików / 26 testów; `@expenses/api`: 5 suit / 64
      testy; `@expenses/shared`: brak testów). Cast `req.params as { id:
      string }` w `category.controller.ts`/`expense.controller.ts` (6
      miejsc) jest już w kodzie z wcześniejszej sesji — błąd opisany
      pierwotnie w tym kroku i w **Kroku 3.0** już nie istnieje. Krok 3.0
      można więc pominąć (nic do naprawienia) — zostaje jako informacja w
      historii planu, nie jako blokująca akcja.

**Weryfikacja:** baseline build/test log zapisany do porównania po każdej fazie — zielony.

---

## Faza 1 — Root: TypeScript, Turbo, PM2, `@types/node`

Te pakiety są używane przez wszystkie workspace’y (TypeScript) albo
orkiestrują/uruchamiają build (Turbo, PM2), więc idą pierwsze.

### Krok 1.1 — Turbo `2.5.3 → 2.9.18` ✅

- Minor w obrębie 2.x, brak zmian schematu `turbo.json` w tym zakresie.
- `npm install turbo@2.9.18 -D` w root.
- **Weryfikacja:** `npm run build` i `npm run dev` (Ctrl+C po starcie)
  przez Turbo bez zmian w `turbo.json`.

### Krok 1.2 — PM2 `6.0.6 → 7.0.1` (major) ✅

- Używany tylko do `npm run start` (produkcyjny runtime), nie wpływa na
  build/dev. Brak udokumentowanych breaking changes API wpływających na
  prosty `pm2 start` (changelog nie wymienia nic poza wewnętrznymi
  zmianami) — niskie ryzyko, ale **przetestować ręcznie** `pm2 start`/`pm2
  stop` na zbudowanym `dist/`, bo nie ma na to automatycznego testu w repo.
- `npm install pm2@7.0.1 -D` w root.
- **Weryfikacja:** zbudować API (`npm run build --workspace=@expenses/api`),
  odpalić `pm2 start dist/index.js --name expenses-api`, sprawdzić
  `pm2 logs`/`pm2 status`, `pm2 delete expenses-api`.

### Krok 1.3 — `@types/node`: dopasować do realnej wersji Node, nie do `latest` ✅

- Lokalnie zainstalowany Node to `v24.14.1`. `npm view @types/node version`
  zwraca `26.0.0` — to typy dla Node 26, których ten silnik nie ma. Celować
  w `@types/node@24.13.2` (najnowszy w linii 24.x), żeby typy odpowiadały
  faktycznie używanemu Node, a nie obiecywały API z przyszłej wersji.
- Bump w **trzech** miejscach: root, `apps/api`, `apps/web` (każdy ma
  własny `@types/node` w `devDependencies`).
- **Weryfikacja:** `npm run build` w root (kompiluje `shared` → `api` +
  `web`) — szukać nowych błędów typów wynikających z usunięcia starszych
  globalnych typów Node.

### Krok 1.4 — TypeScript `5.8.3 → 6.0.3` (major, w 3 plikach `package.json`)

TS 6.0 zmienia **9 domyślnych ustawień** względem brakującego `tsconfig`
(m.in. `strict: true` domyślnie, target `ES2025`, `es3`/`es5` jako target
są deprecated). W tym repo `tsconfig.json` w każdym workspace **explicit**
ustawia swoje opcje, więc realne ryzyko zależy od tego, czy `strict` jest
już włączony i czy `target` jest ustawiony explicite — to trzeba sprawdzić
przed bumpem, nie zakładać.

- **Krok 1.4a ✅:** Przeczytano `tsconfig.json` w `packages/shared`,
  `apps/api`, `apps/web`. `packages/shared` (przez `extends` z root) i
  `apps/web` (własne ustawienia) mają `strict`/`target` już explicite.
  `apps/api` **nie** miał `extends` ani `strict` — dopisano `"strict":
  false` explicite (zachowuje bieżące zachowanie, build zweryfikowany
  jako no-op przed bumpem TS).
- **Krok 1.4b ✅:** Bump `typescript@6.0.3` w `packages/shared`, build.
  Napotkany nowy błąd: `TS5107` — `moduleResolution=node10` (czyli
  wartość `"node"`, odziedziczona z root `tsconfig.json` przez `extends`)
  jest deprecated w TS 6.0 i wymaga `"ignoreDeprecations": "6.0"`. Root ma
  `"5.0"`, ale **nie można** podnieść go do `"6.0"` w tym kroku — `apps/web`
  nadal extenduje root i kompiluje się TS 5.8.3 (do Kroku 1.4d), który
  akceptuje tylko `"5.0"`. Rozwiązanie: nadpisano `ignoreDeprecations:
  "6.0"` lokalnie w `packages/shared/tsconfig.json`, root zostaje
  nietknięty do Kroku 1.4d.
- **Krok 1.4c ✅:** Bump w `apps/api`, build + `npm run test`. Pre-existing
  `TS2345` z Fazy 0 już nieaktualny (patrz korekta w Kroku 0.2) — testy
  odpaliły się normalnie. Napotkane nowe błędy (analogiczne do Kroku
  1.4b): `TS5107` (`moduleResolution=node10`, czyli `"node"`) i `TS5101`
  (`downlevelIteration`), oba deprecated w TS 6.0. `apps/api/tsconfig.json`
  nie ma `extends` (samodzielny plik, bez konfliktu z innym workspace’em
  jak w przypadku `shared`/root) — podniesiono `ignoreDeprecations` z
  `"5.0"` na `"6.0"` bezpośrednio w nim, co wystarczyło dla obu błędów.
- **Krok 1.4d ✅:** Bump w `apps/web` (i dodatkowo w root — `typescript`
  był tam pinowany niezależnie, poza zakresem "3 plików" z tego kroku, ale
  bumpnięty dla konsystencji, patrz notatka przy nagłówku Kroku 1.4).
  `apps/web/tsconfig.json` używa `moduleResolution: "bundler"` (nie
  `"node"`) i nie ustawia `downlevelIteration`, więc **żadna** z dwóch
  deprecation z Kroków 1.4b/1.4c go nie dotyczy — `tsc && vite build`
  przeszło czysto bez żadnej zmiany w `tsconfig.json`. Root
  `ignoreDeprecations: "5.0"` (odziedziczone przez `apps/web` via
  `extends`) zostało **nietknięte** — `tsc` 6.0.3 akceptuje tę wartość
  bez błędu, gdy nie ma czego nią silencować, więc zmiana nie była
  potrzebna (zasada surowych zmian — nie dotykać czegoś, co nie jest
  zepsute).

**Weryfikacja całej Fazy 1 ✅:** pełny `npm run build`/`lint`/`test` z root
przechodzi (3/3 build, 3/3 lint, web 26/26 + api 64/64 testów — identycznie
jak baseline z Kroku 0.2), `pm2 start/stop` ręcznie sprawdzony w Kroku 1.2.

**Poprawka po code review PR #2 (2026-06-21):** root `tsconfig.json` został
przeoczony w Kroku 1.4 — `ignoreDeprecations` pozostał na `"5.0"`, mimo że
`typescript` w root `package.json` poszedł na `6.0.3`. `npx tsc -p .`
faktycznie failował na `TS5107`. Nieużywane przez żaden skrypt build/test
(stąd `npm run build` nigdy tego nie wyłapał), ale `apps/web/tsconfig.json`
dziedziczy ten root config przez `extends` — naprawione: `ignoreDeprecations`
→ `"6.0"`, zgodnie z `apps/api`/`packages/shared`.

---

## Faza 2 — `packages/shared`

Buduje się jako pierwszy w grafie Turbo, więc jego dev-zależności (poza
TypeScript, już zrobionym w Fazie 1) idą przed `apps/*`.

### Krok 2.1 — ESLint `9.27.0 → 10.x` + `@eslint/js` + `@typescript-eslint/*` ✅

- `packages/shared/eslint.config.js` (jak i `apps/api`, `apps/web`) **już
  używa flat config** — ESLint v10 usuwa wyłącznie legacy `.eslintrc.*`/
  `LegacyESLint`, czego ten repo nie ma. Ryzyko: niskie, ale zrobić ten
  bump **we wszystkich trzech workspace’ach naraz w jednym kroku**, bo
  `@typescript-eslint/eslint-plugin`/`parser` muszą się zgadzać wersją
  peer-dep z ESLint w całym repo (jeden lockfile, jeden `node_modules`).
- Bump: `eslint@10.5.0`, `@eslint/js@10.0.1`,
  `@typescript-eslint/eslint-plugin@8.61.1`,
  `@typescript-eslint/parser@8.61.1`, `globals@17.6.0` — w `packages/shared`,
  `apps/api`, `apps/web` razem.
- **Weryfikacja ✅:** `turbo run lint` z root — 3/3 zielone, 0 nowych
  błędów/warningów. `globals@17` nie zmienił kluczy używanych w
  `eslint.config.js` (`globals.browser`/`globals.node`) — bez zmian w
  configu. Pełny `build`/`test` po bumpie też zielony (regression check).

### Krok 2.2 — `rimraf` `5.0.5 → 6.1.3` (tylko w `packages/shared`; `apps/*` już są na `6.0.1 → 6.1.3`) ✅

- Tylko CLI do `rm -rf dist`, brak API używanego w kodzie. Patch/minor
  bump w obrębie v6 dla `apps/*`; w `packages/shared` to faktycznie major
  (5→6) — sprawdzić, że `rimraf` jako CLI binarny (`scripts.clean`) działa
  identycznie (`npx rimraf dist` lokalnie).
- **Weryfikacja ✅:** `npm run clean && npm run build` w `packages/shared`.
  `rimraf dist` (CLI) usuwa katalog identycznie jak w v5. Odkryta **pre-
  existing** (niezależna od tego bumpu) usterka: `clean` nie usuwa
  `tsconfig.tsbuildinfo`, więc kolejny `tsc` (incremental, `composite:
  true`) widzi cache jako aktualny i nie re-emituje `dist` — to dotyczy
  każdej wersji `rimraf`, czysto kwestia `tsc --incremental` + skrypt
  `clean` nieusuwający `.tsbuildinfo`. Poza zakresem tego planu (nie
  naprawiać tu) — zweryfikowano binarkę `rimraf` w izolacji (usunięcie
  `tsconfig.tsbuildinfo` + `dist`, `tsc` ponownie emituje poprawnie).
  Pełny `npm run build` z root: zielony.

### Krok 2.3 — `jest@29.7.0 → 30.4.2` ✅

- Tylko w `packages/shared` na razie nie ma realnych testów
  (`"test": "jest --passWithNoTests"`), więc ryzyko praktyczne ~zero.
  Breaking changes Jest 30 dotyczące matcherów (`expect.objectContaining`
  z array, `testPathPattern → testPathPatterns`, `jest.SpyInstance` →
  `jest.Mock`) nie mają tu czego dotknąć — ale **ten sam bump trzeba
  zrobić w `apps/api`**, patrz Faza 3, gdzie testy faktycznie istnieją i
  breaking changes są realne.
- **Weryfikacja ✅:** `npm run test` — przeszło trywialnie (brak testów).

**Weryfikacja całej Fazy 2 ✅:** `npm run build`/`lint`/`test` z root —
wszystko zielone (3/3 build, 3/3 lint, web 26/26 + api 64/64 testów),
zero regresji w `apps/api`/`apps/web`.

---

## Faza 3 — `apps/api`

### Krok 3.0 — (pre-existing `TS2345`) — JUŻ NAPRAWIONE, pominąć

- `category.controller.ts`/`expense.controller.ts`: `req.params.id` typu
  `string | string[]` przekazywane gdzie oczekiwany `string`. Stan na
  2026-06-20 (Krok 0.2): cast `req.params as { id: string }` jest już
  obecny we wszystkich 6 miejscach, build i testy API przechodzą bez
  błędów. Nie wymaga akcji — krok zostaje w planie tylko jako historyczna
  notatka.

### Krok 3.1 — Jest `29.7.0 → 30.4.2` + `ts-jest@29.3.4 → 29.4.11` + `@types/jest` (już `30.0.0`, bez zmian) ✅

- Realne breaking changes dla tego repo:
  - `jest-environment-jsdom` poszedł z jsdom 21→26 — **nieistotne**, API
    używa `testEnvironment` default (node), nie jsdom (sprawdzić
    `jest.config.js`, ale `apps/api` to backend, jsdom nieużywany).
  - Usunięte aliasy starych matcherów — przeszukać `apps/api/src/**/*.test.ts`
    pod `toBeCalled`, `toReturn`, `lastCalledWith` i inne legacy aliasy;
    zamienić na kanoniczne nazwy jeśli występują.
  - `testPathPattern` → `testPathPatterns` — dotyczy tylko CLI flag, nie
    `jest.config.js` (sprawdzić, czy `package.json`/CI nie wywołuje
    `--testPathPattern` explicite).
- **Weryfikacja ✅:** `npm run test --workspace=@expenses/api` — 5 suit /
  64 testy przechodzą (identycznie jak baseline z Kroku 0.2; plan
  wspominał "4 suity", ale w repo jest ich 5 — `expenses`, `categories`,
  `auth`, `analytics`, `settings`). Brak legacy aliasów matcherów
  (`toBeCalled`/`toReturn`/`lastCalledWith`) w testach, `testEnvironment:
  'node'` (jsdom nieużywany), brak `--testPathPattern` w skryptach —
  żadna z potencjalnych breaking changes nie dotyczy tego repo. Build
  API również zielony.

### Krok 3.2 ✅ — ESLint plugin/parser TS — już zrobione w Kroku 2.1 (wspólny bump). Pominięto powtórzenie.

### Krok 3.3 — Express ecosystem: `express@5.1.0→5.2.1`, `express-rate-limit@8.4.1→8.5.2`, `express-validator@7.2.1→7.3.2`, `cors@2.8.5→2.8.6`, `dotenv@16.5.0→17.4.2` ✅

- Wszystkie minor/patch **poza `dotenv` (16→17, major)**. `dotenv` 17
  changelog: główna zmiana to nowe domyślne zachowanie ładowania `.env*`
  multi-environment (`.env.production` itp.) i drobne zmiany w
  `dotenv.config()` (m.in. `quiet` opcja domyślnie wycisza logi). Repo
  używa `dotenv.config()` bez opcji w `src/index.ts`/wywołań `-r
  dotenv/config` — sprawdzić, czy po bumpie nadal poprawnie czyta
  `apps/api/.env` (patrz znana pułapka w skillu `run-expenses-fullstack`:
  `dotenv.config()` musi wykonać się **przed** importem `./app`, inaczej
  pool DB łapie `undefined`).
- **Weryfikacja ✅:** `dotenv.config()` wykonuje się przed `import app`
  (potwierdzone w `src/index.ts`, więc `-r dotenv/config` niepotrzebny —
  repo i tak go nie używa). Wystartowano API na realnym `.env`: `dotenv@17`
  loguje nowy banner `injected env (10) from .env` (zmiana w stylu logów,
  bez wpływu na zachowanie). `curl /health` → ok. `POST
  /api/users/login` z błędnym hasłem → poprawny `invalid_credentials`
  (czyli DB_*, bcrypt, walidacja działają). CORS preflight z `Origin:
  http://localhost:5173` → `Access-Control-Allow-Origin` poprawnie
  odzwierciedlone z `ALLOWED_ORIGINS`. Build + wszystkie 64 testy API
  zielone.

### Krok 3.4 — `bcryptjs@3.0.2→3.0.3`, `jsonwebtoken@9.0.2→9.0.3`, `pg@8.16.0→8.22.0`, oraz odpowiadające `@types/*` (`@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/pg`) ✅

- Wszystko patch/minor, brak udokumentowanych breaking changes na tym
  zakresie wersji. Najwyższe ryzyko praktyczne: `pg` 8.16→8.22 (6 minorów)
  — przejrzeć changelog `node-postgres` pod kątem zmian w parsowaniu typów
  `DECIMAL`/`NUMERIC` (repo robi ręczny `parseFloat()` na wynikach —
  upewnić się, że `pg` nadal zwraca `DECIMAL` jako string, a nie np. jako
  number po jakiejś zmianie typeparsera).
- **Weryfikacja ✅:** build + wszystkie 64 testy API zielone. `DECIMAL`
  wciąż wraca jako string z `pg` (kod z `parseFloat()` dalej działa bez
  zmian). **Odkryto nowy deprecation warning** (poza zakresem badanym w
  planie): `client.query()` wołane współbieżnie na tym samym checked-out
  `client` (Promise.all w `expense.model.ts:278-282`, analytics endpoint)
  — działa, ale `pg@9.0` to usunie. Plan celuje w `8.22.0`, nie `9.x`, więc
  za zgodą użytkownika **zostawione jako follow-up**, nie naprawione w
  ramach tego kroku.

**Weryfikacja całej Fazy 3 ✅:** pełny `npm run build`/`lint`/`test` z root
zielony (3/3 build, 3/3 lint, web 26/26 + api 64/64 testów), manualny
smoke test API (health, login, CORS) zrobiony w Kroku 3.3.

---

## Faza 4 — `apps/web` (bez MUI — patrz Faza 5)

### Krok 4.1 — Biblioteki domenowe niskiego ryzyka: `axios@1.9.0→1.18.0`, `dayjs@1.11.13→1.11.21`, `formik@2.4.6→2.4.9`, `yup@1.6.1→1.7.1`, `zustand@5.0.5→5.0.14`, `react-router-dom@7.6.2→7.18.0`, `@emotion/react@11.14.0` (bez zmian), `@emotion/styled@11.14.0→11.14.1` ✅

- Wszystko minor/patch w obrębie obecnego majora — brak API breaking
  changes do zaadresowania w kodzie. `react-router-dom` zostaje w v7 (nie
  v8), `zustand` zostaje w v5.
- **Weryfikacja ✅:** `tsc && vite build` zielony, `vitest run` (26/26),
  lint clean. Manualny smoke test w prawdziwej przeglądarce (Playwright +
  systemowy Edge, skill `run-expenses-fullstack`): logowanie + dashboard
  render OK; `/nieistniejaca-trasa` → `NotFound` render OK; formularz
  Register z pustymi polami → walidacja Formik+Yup blokuje submit
  (komunikaty "required" widoczne, brak nawigacji) OK; Dialog
  `ExpenseForm` → otwarcie `dayjs`-owego `DatePicker`, wybór dnia 15,
  zapis — nowy wiersz wydatku pokazuje poprawną datę (`15.06`) i kwotę
  (`12,34 zł`) OK. Po drodze odkryto i naprawiono (środowiskowo, nie w
  kodzie) stary dryf schemy lokalnej bazy dev — patrz notatka w pamięci
  `env_expenses_fullstack_quirks.md`, niezwiązane z tym bumpem.

### Krok 4.2 — `@nivo/bar`/`core`/`line`/`pie` `0.98.0 → 0.99.0` ✅

- Pre-1.0 (`0.x`), więc semver nie gwarantuje braku breaking changes na
  minor. Używane w `Reports.tsx` (wykresy). Sprawdzić changelog Nivo
  0.98→0.99 dla zmian w propsach `ResponsiveBar`/`ResponsiveLine`/
  `ResponsivePie` przed bumpem — **nie zakładać kompatybilności tylko
  dlatego, że to "minor"**.
- **Weryfikacja ✅:** sprawdzono changelog/PR #2764 — zmiana w `@nivo/bar`
  to "restrict the type of value scale supported and use better
  defaults"; `Reports.tsx` nie ustawia `valueScale`/`indexScale`
  explicite, więc dotyczy go tylko (nieszkodliwa) zmiana defaultów. W
  kodzie używane są tylko `ResponsiveBar` (`Reports.tsx`) i
  `ResponsivePie` (`Dashboard.tsx`) — `@nivo/line`/`ResponsiveLine` jest
  zainstalowany, ale nieużywany nigdzie (pre-existing, poza zakresem).
  Screenshot przed/po (prawdziwa przeglądarka, dane testowe w 2
  kategoriach/2 miesiącach): donut na Dashboard identyczny pixel-w-pixel;
  bar chart na Reports identyczny, jedyna różnica — skala osi Y (sufit
  60→65), kosmetyczny efekt "better defaults", nie regresja. `tsc`
  przechodzi (żadnych nowych błędów typów z restrykcji scale). Lint +
  wszystkie 26 testów web zielone. **Korekta przypięcia wersji:** tylko
  `@nivo/bar` ma zostać z `^` (jedyny wyjątek z listy na początku planu);
  `@nivo/core`/`line`/`pie` przypięte na sztywno (bez `^`), tak jak były
  przed bumpem — `npm install` domyślnie dodał `^` do wszystkich
  czterech, poprawiono ręcznie.

### Krok 4.3 — Build tooling: `vite@6.3.5`, `@vitejs/plugin-react@4.5.1`, `vitest@^3.0.0`, `eslint-plugin-react-hooks@5.2.0`, `eslint-plugin-react-refresh@0.4.20`

To najgęściej upakowana faza pod względem breaking changes — robić **jako
osobne sub-kroki, jeden pakiet/grupa na commit**, nie razem z Krokiem 4.1/4.2.

#### 4.3a — `vite@6.3.5 → 7.x` (pierwszy przystanek, nie skakać prosto na 8) ✅

- Breaking changes realne dla tego repo:
  - Lightning CSS jako domyślny CSS minifier (zamiast esbuild) — sprawdzić
    wizualnie, że CSS-in-JS (Emotion/MUI) i ewentualny plain CSS nie mają
    regresji po minifikacji.
  - `import.meta.hot.accept(url)` z URL nie jest już wspierane — repo nie
    używa HMR API manualnie (sprawdzone: brak `import.meta.hot` w
    `apps/web/src`), więc nieistotne.
  - Domyślny `build.target` przesunięty na nowsze baseline browsers —
    sprawdzić, czy to nie psuje wsparcia dla najstarszego wspieranego
    przez projekt browsera (jeśli nie ma udokumentowanego requirementu,
    przyjąć nowy default).
- **Weryfikacja ✅:** docelowo `7.3.5` (najnowszy w linii 7.x; v8 już
  istnieje, potwierdzając przestrogę planu — nie skakać tam teraz).
  `npx tsc && vite build` zielony (`@vitejs/plugin-react@4.5.1` mimo że
  jeszcze nie podniesiony — bez ostrzeżeń peer-dep). Potwierdzono brak
  `import.meta.hot` w kodzie. `vite preview` (build produkcyjny) →
  zrzut ekranu strony `/login` w prawdziwej przeglądarce: stylowanie
  Emotion/MUI nienaruszone przez nowy domyślny minifier (Lightning CSS)
  — jedyny błąd w konsoli to CORS dla portu `4173` (nieobjętego
  `ALLOWED_ORIGINS`), niezwiązany z Vite. `vite` (dev server) → pełny
  smoke test logowania + dashboard (donut chart, daty) bez błędów
  konsoli. Domyślny `build.target` (przesunięty wyżej) zaakceptowany —
  brak udokumentowanego wymogu starszych przeglądarek w repo. Lint +
  wszystkie 26 testów web zielone.

#### 4.3b — `@vitejs/plugin-react@4.5.1 → 6.x` (po Vite 7, bo plugin musi się zgadzać z core Vite) ✅ (skorygowano do `5.2.0`, patrz weryfikacja)

- Sprawdzić peer-dep range względem zainstalowanego Vite po 4.3a.
  **Odkryta niezgodność z planem:** `@vitejs/plugin-react@6.x` wymaga
  `vite: ^8.0.0` jako peer (sprawdzone dla `6.0.0`/`6.0.1`/`6.0.2`) —
  niekompatybilne z `vite@7.3.5` wybranym w Kroku 4.3a właśnie po to, by
  **nie** skakać na v8 teraz. Najnowsza wersja `5.x` (`5.2.0`) wspiera
  `vite: ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0 || ^8.0.0` — to jest
  faktyczny właściwy cel przy zachowaniu Vite 7, nie `6.x`.
- **Weryfikacja ✅:** zainstalowano `5.2.0` (bez ostrzeżeń peer-dep,
  zgodne z `vite@7.3.5`). `tsc && vite build` zielony. Fast Refresh
  potwierdzony w prawdziwej przeglądarce: edytowano `Login.tsx`, HMR
  update zaaplikował się **bez** full page reload (JS context przeżył —
  zweryfikowano markerem w `window`, nie tylko obserwacją wizualną) —
  pierwsza edycja zajęła >15s (cold compile tego środowiska
  sandboxowego), kolejna ~1s. Lint + wszystkie 26 testów web zielone.

#### 4.3c — `vitest@^3.0.0 → ^4.x` ✅

- Breaking changes realne dla `apps/web/vitest.config.ts` (obecnie tylko
  `resolve.alias` + `test.environment: 'node'`, **bez** `poolOptions`,
  **bez** `workspace`, **bez** custom reporter) — żadna z usuniętych/
  przeniesionych opcji (pool config, `workspace→projects`, `coverage.all`,
  basic reporter) nie jest w tym repo używana, więc plik configu **nie
  wymaga zmian**. Jedyne realne ryzyko: `vi.restoreAllMocks()` nie resetuje
  już `vi.fn()`/automocków, tylko `vi.spyOn()` — przeszukać testy `*.test.ts`
  w `apps/web` pod `restoreAllMocks` i `vi.fn()` w tym samym teście.
- **Weryfikacja ✅:** zainstalowano `^4.1.9` (najnowszy 4.x, caret
  zachowany — `vitest` jest na liście wyjątków z nagłówka planu).
  `vi.restoreAllMocks()` nigdzie nie występuje w testach `apps/web` —
  wszystkie używają `vi.clearAllMocks()`, więc opisana breaking change
  nie dotyczy tego repo. `vitest run` → identyczna liczba testów jak
  przed bumpem (5 plików / 26 testów). `tsc && vite build` + lint
  zielone.

#### 4.3d — `eslint-plugin-react-hooks@5.2.0 → 6.x` (NIE 7.x w tym samym kroku) + `eslint-plugin-react-refresh@0.4.20 → 0.5.3` ✅ (skorygowano do `7.1.1`, patrz weryfikacja)

- v6 wymaga Node ≥18 (repo: Node 24, OK) i przełącza domyślny preset na
  flat config (`recommended`) — `apps/web/eslint.config.js` już używa
  `reactHooks.configs.recommended.rules` we flat configu, więc zgodne.
  v6 dodaje nowe reguły (`use` w try/catch, `useEffectEvent` w closures) —
  **te mogą zgłosić nowe błędy lint na istniejącym kodzie**, nie tylko
  ostrzeżenia — przejrzeć `npm run lint` po bumpie linia po linii, nie
  tylko sprawdzić exit code.
- Zostać na v6, **nie** od razu v7 — v7.1.0 miał regresję (przypadkowe
  usunięcie reguły `component-hook-factories`, później załatany) i dodaje
  wsparcie dla ESLint v10, które tu już mamy z Fazy 2 — sprawdzić dopiero
  po ustabilizowaniu v6, jako osobny, późniejszy krok poza tym planem.

  **Odkryta blokada planu:** żadna wersja `6.x` (łącznie z canary) nie
  deklaruje wsparcia dla `eslint@^10.0.0` — peer range kończy się na
  `^9.0.0`. Wsparcie dla `eslint@^10.0.0` dodano dopiero w `7.0.0`, a
  regresja `component-hook-factories` z `7.1.0` jest już załatana w
  `7.1.1` (najnowsza stabilna). Za zgodą użytkownika: **`7.1.1`**, nie
  `6.x` — jedyna opcja faktycznie kompatybilna z `eslint@10.5.0`
  zainstalowanym w Fazie 2, bez `--legacy-peer-deps`.
- **Weryfikacja ✅:** instalacja bez ostrzeżeń peer-dep. `npm run lint`
  ujawnił to, co plan przewidywał dla nowych reguł — **4 nowe błędy**
  (`react-hooks/set-state-in-effect`, nowa reguła w presecie
  `recommended`, blokuje idiomatyczny pattern "fetch w `useEffect`" w
  `SettingsContext.tsx`/`Expenses.tsx`/`Reports.tsx`/`ExpenseForm.tsx`)
  + **1 nowy warning** (`react-refresh/only-export-components` w
  `ExpenseForm.tsx` — reguła już była aktywna, ale `0.5.3` zaczęła
  wykrywać ten konkretny przypadek). Za zgodą użytkownika: obie reguły
  wyłączone w `apps/web/eslint.config.js` (`'off'`) zamiast refaktoryzacji
  kodu. Skutek tej zmiany: 3 stare komentarze `// eslint-disable-next-line
  react-refresh/only-export-components` (`AuthContext.tsx`,
  `SettingsContext.tsx`, `ThemeProvider.tsx`) stały się "unused" pod
  `--report-unused-disable-directives` — usunięto je jako bezpośrednią
  konsekwencję wyłączenia reguły. `npm run lint` → czysto. Build + 26
  testów web zielone.

**Weryfikacja całej Fazy 4 ✅:** pełny `npm run build`/`lint`/`test` z root
zielony (3/3 build, 3/3 lint, web 26/26 + api 64/64 testów, identycznie
jak baseline). Manualny regression test w prawdziwej przeglądarce:
logowanie OK, dodanie wydatku przez Dialog na stronie `/expenses` (kanał
poprawnie podłączony do odświeżenia listy) OK bez błędów konsoli,
`/reports` renderuje wykres z aktualnymi danymi OK.

Po drodze odkryto (zgłoszone, **nie naprawione** — poza zakresem tego
planu): `SimpleExpenseForm` na Dashboardzie (`Dashboard.tsx` →
`<SimpleExpenseForm categories={categories} />`) nie ma żadnego
callbacku `onSuccess` — po zapisaniu wydatku przez ten inline-formularz
`POST /api/expenses` faktycznie się powodzi (zweryfikowane przez API:
`201`, wpis trafia do bazy), ale widget "Last 10 expenses"/wykresy na
Dashboardzie nie odświeżają się bez ręcznego przeładowania strony. To
jest pre-existing gap (interfejs `SimpleExpenseFormProps` nigdy nie miał
takiego propsa), niezależny od żadnego bumpa w tej fazie — strona
`/expenses` (z `ExpenseForm` w Dialogu) jest poprawnie podłączona i
odświeża listę natychmiast.

---

## Faza 5 — `apps/web`: MUI v6 → v9 + `@mui/x-date-pickers`

Najwyższe ryzyko w całym planie — robić **na końcu**, w osobnej gałęzi od
głównego `chore/deps-migration` (np. `chore/deps-migration-mui`), żeby
reszta migracji mogła wejść do `develop` niezależnie i wcześniej.

### Krok 5.1 — `@mui/material`/`@mui/icons-material` `6.4.12 → 7.0.x`

- Codemod: `npx @mui/codemod@latest v7.0.0/grid-props apps/web/src`
  (obsłuży `Grid2` → `Grid` w 6 plikach: `Login.tsx`, `Register.tsx`,
  `Settings.tsx`, `Dashboard.tsx`, `Categories.tsx`, `Expenses.tsx`).
  **Przeczytać diff** codemodu — w szczególności properties `size`/
  `justifyContent` (patrz fix w `Login.tsx` z bieżącej sesji — to dokładnie
  typ błędu, który codemod może nie wyłapać, bo wynikał z braku propsów, a
  nie z ich obecności).
- Sprawdzone, że w kodzie **nie występują**: `onBackdropClick`, `Hidden`,
  `@mui/lab`, `createMuiTheme`, `InputLabel size="normal"` — te kroki
  migracyjne z oficjalnego guide są nieistotne dla tego repo.
- Deep imports (>1 poziom) nie są już wspierane — sprawdzić `grep -rn
  "@mui/material/styles/" apps/web/src` (repo importuje `useTheme` z
  `@mui/material/styles`, czyli 1 poziom — OK, ale zweryfikować po bumpie).
- TypeScript ≥4.9 wymagany — już mamy 6.0.3 z Fazy 1.
- **Weryfikacja:** `tsc` przechodzi, **wizualnie** przejrzeć wszystkie 6
  plików z Grid (screenshot każdej strony: Login, Register, Settings,
  Dashboard, Categories, Expenses) — nie tylko "kompiluje się".

### Krok 5.2 — `@mui/material`/`@mui/icons-material` `7.0.x → 9.1.1` (Material UI przeskakuje v8, idzie razem z MUI X v9)

- Brak nowych udokumentowanych breaking changes w core komponentach
  używanych w tym repo (Dialog, Select, TextField, Avatar, Alert, Button,
  AppBar/sidebar w `MainLayout`) ponad to, co już obsłużone w 5.1.
- **Weryfikacja:** powtórzyć smoke test z 5.1 (regresja między v7 i v9
  jest mniej prawdopodobna niż między v6 i v7, ale sprawdzić ponownie
  dark/light theme toggle w `ThemeProvider.tsx`, bo v9 rozszerza CSS
  variables o `color-mix()` dla pochodnych kolorów).

### Krok 5.3 — `@mui/x-date-pickers` `7.29.4 → 9.6.0`

- Codemod: `npx @mui/x-codemod@latest v8.0.0/pickers/preset-safe apps/web/src`.
- Breaking change realny dla tego repo: `enableAccessibleFieldDOMStructure`
  usunięty, pole `DatePicker` renderuje teraz `PickersSectionList` zamiast
  jednego `<input>`. Dotyczy `ExpenseForm.tsx`, `SimpleExpenseForm.tsx`,
  `Expenses.tsx` (filtr daty) — sprawdzić:
  - czy `formik`/`onChange` na `DatePicker` nadal dostaje `dayjs` object
    (powinien — zmiana dotyczy tylko DOM struktury pola, nie value API);
  - czy nie ma CSS/testów celujących w `input` wewnątrz pola daty (np.
    `page.fill('input[name=...]')` w `driver.mjs` dla pól dat — **nie ma**,
    driver fill’uje tylko `amount`/`description`, daty nie dotyka — OK).
  - `AdapterDayjs`/`LocalizationProvider` w `main.tsx` — import bez zmian
    (rename dotyczył tylko adapterów `date-fns`, nie `dayjs`).
- **Weryfikacja:** otworzyć `ExpenseForm` (Dialog) i `SimpleExpenseForm`
  (Dashboard), kliknąć DatePicker, wybrać datę, zapisać — potwierdzić że
  wartość trafia do żądania POST/PUT z poprawnym formatem.

**Weryfikacja całej Fazy 5:** pełny regression UI test (logowanie →
dashboard → dodanie wydatku z DatePickerem → edycja kategorii → ustawienia
→ wylogowanie), wszystkie 6 stron z Grid sprawdzone wizualnie.

---

## Tabela zbiorcza (do odznaczania w trakcie)

| Faza | Pakiet(y) | Z | Na | Ryzyko |
|---|---|---|---|---|
| 1 | turbo | 2.5.3 | 2.9.18 | niskie |
| 1 | pm2 | 6.0.6 | 7.0.1 | niskie (manual test) |
| 1 | @types/node (×3) | 22.15.x | 24.13.2 | niskie |
| 1 | typescript (×3) | 5.8.3 | 6.0.3 | **średnie** (default config) |
| 2 | eslint + @eslint/js + @typescript-eslint/* + globals (×3) | 9.x / 8.32.x | 10.5.0 / 8.61.1 | niskie (flat config już używany) |
| 2 | rimraf (shared) | 5.0.5 | 6.1.3 | niskie |
| 2/3 | jest (shared, api) | 29.7.0 | 30.4.2 | **średnie** (api ma testy) |
| 3 | ts-jest | 29.3.4 | 29.4.11 | niskie |
| 3 | express ecosystem | — | — | niskie (poza dotenv) |
| 3 | dotenv | 16.5.0 | 17.4.2 | **średnie** (ładowanie env) |
| 3 | bcryptjs/jsonwebtoken/pg/@types/* | — | — | niskie |
| 4 | axios/dayjs/formik/yup/zustand/react-router-dom/emotion | — | — | niskie |
| 4 | @nivo/* | 0.98.0 | 0.99.0 | **średnie** (pre-1.0) |
| 4 | vite | 6.3.5 | 7.x | **średnie** |
| 4 | @vitejs/plugin-react | 4.5.1 | 6.x | niskie (po vite 7) |
| 4 | vitest | ^3.0.0 | ^4.x | niskie (config nie używa usuniętych opcji) |
| 4 | eslint-plugin-react-hooks | 5.2.0 | 6.x (nie 7.x) | **średnie** (nowe reguły) |
| 4 | eslint-plugin-react-refresh | 0.4.20 | 0.5.3 | niskie |
| 5 | @mui/material + @mui/icons-material | 6.4.12 | 9.1.1 (via 7) | **wysokie** |
| 5 | @mui/x-date-pickers | 7.29.4 | 9.6.0 (via 8) | **średnie** |

## Źródła (changelog/migration guides zweryfikowane podczas przygotowania planu)

- TypeScript 6.0: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- ESLint v10: https://eslint.org/docs/latest/use/migrate-to-10.0.0
- Vite 7 migration: https://vite.dev/guide/migration
- Vite 8 announcement: https://vite.dev/blog/announcing-vite8
- Vitest 4 migration: https://vitest.dev/guide/migration.html
- Jest 30 upgrade guide: https://jestjs.io/docs/upgrading-to-jest30
- eslint-plugin-react-hooks changelog: https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/CHANGELOG.md
- Material UI v7 migration: https://mui.com/material-ui/migration/upgrade-to-v7/
- Material UI v9 announcement: https://mui.com/blog/introducing-mui-v9/
- MUI X Date Pickers v7→v8 migration: https://mui.com/x/migration/migration-pickers-v7/
