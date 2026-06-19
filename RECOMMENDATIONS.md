# Rekomendacje zmian w projekcie

Dokument na podstawie przeglądu struktury repozytorium (`apps/api`, `apps/web`,
`packages/shared`) wykonanego 2026-06-17. Pozycje uporządkowane od
najważniejszych (bezpieczeństwo, zepsute tooling) do drobnych usprawnień.

## 1. Bezpieczeństwo

### 1.1 [NAPRAWIONE] Token GitHub zacommitowany w `package.json`
W polu `repository.url` w [package.json](package.json) był zapisany żywy
Personal Access Token GitHuba wraz z danymi logowania
(`https://raptor1989:ghp_...@github.com/...`). Usunąłem go z bieżącej wersji
pliku, ale to **nie usuwa go z historii git** — jeśli repozytorium jest (lub
będzie) publiczne albo token nie został jeszcze zrewokowany:
- zrewokuj token na https://github.com/settings/tokens,
- rozważ przepisanie historii (`git filter-repo` / BFG) jeśli repo jest publiczne.

### 1.2 [NAPRAWIONE] Brak ochrony CSRF poza `SameSite=Strict`
[auth.middleware.ts](apps/api/src/middlewares/auth.middleware.ts) i logowanie
w [user.controller.ts](apps/api/src/controllers/user.controller.ts) opierają
się wyłącznie na ciasteczku `httpOnly` z `sameSite: 'strict'`. To wystarczające
zabezpieczenie w typowym scenariuszu, ale warto mieć to świadomie odnotowane —
jeśli kiedyś frontend i API znajdą się na różnych (sub)domenach, `sameSite:
'strict'` może zacząć blokować legalne żądania, a osłabienie go do `'lax'`
otworzy częściowo CSRF. Brak osobnego tokenu CSRF.

### 1.3 [NAPRAWIONE] Rate limiting tylko na endpointach auth
[user.routes.ts](apps/api/src/routes/user.routes.ts) ma `express-rate-limit`
na `/register` i `/login`, ale [expense.routes.ts](apps/api/src/routes/expense.routes.ts)
i `category.routes.ts` nie mają żadnego limitu. W połączeniu z problemem N+1
opisanym w sekcji 4.1 (`/expenses/by-month`), zalogowany użytkownik (lub
przejęte konto) może wygenerować dużą liczbę kosztownych zapytań do bazy bez
żadnego throttlingu.

### 1.4 [NAPRAWIONE] Wykrywanie błędu „kategoria ma wydatki” przez `String.includes`
W [category.controller.ts:148](apps/api/src/controllers/category.controller.ts#L148)
błąd usunięcia kategorii z powiązanymi wydatkami jest rozpoznawany przez
`error.message.includes('associated expenses')`. To bardzo kruche — zmiana
treści komunikatu w modelu (lub w komunikacie błędu Postgresa) bezgłośnie
zepsuje mapowanie na kod `category_has_expenses`. Lepiej: dedykowana klasa
błędu (`ApiError` z `code`) rzucana explicite w `CategoryModel.delete`, albo
rozpoznawanie po kodzie błędu Postgresa (`error.code === '23503'` dla
foreign-key violation).

## 2. Zepsute / niekompletne tooling

### 2.1 [NAPRAWIONE] `npm run lint` najprawdopodobniej nie działa
`apps/api` i `apps/web` mają zainstalowany **ESLint 9**, który wymaga
„flat config” (`eslint.config.js`). W repo nie istnieje żaden taki plik (ani
żaden `.eslintrc*` poza tymi wewnątrz `node_modules` zależności). Skrypty
`lint` w obu `package.json` prawdopodobnie kończą się błędem „ESLint couldn't
find a configuration file”. Trzeba dodać `eslint.config.js` w obu apkach
(web ma już zainstalowane `@typescript-eslint/*`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh` — czyli config był planowany, ale nigdy nie
dodany).

### 2.2 [NAPRAWIONE] Brak CI
Katalog `.github/workflows` nie istnieje / jest pusty. Build, testy i lint
nie są dziś weryfikowane automatycznie na PR-ach — całość odpowiedzialności
spada na lokalne odpalenie przez dewelopera. Sugeruję prosty workflow:
`npm ci && npm run build && npm test` (i `lint`, po naprawieniu punktu 2.1).

## 3. [NAPRAWIONE] Martwy kod i nieużywane zależności

### 3.1 [NAPRAWIONE] `chart.js` + `react-chartjs-2` nieużywane
[apps/web/package.json](apps/web/package.json) deklarowało `chart.js` i
`react-chartjs-2`, ale w całym `apps/web/src` nie było ani jednego importu z
tych pakietów — wykresy są realizowane przez `@nivo/pie` (Dashboard) i
ręczne tabele (Reports). **Naprawione**: usunięto `chart.js` i
`react-chartjs-2`. Reports rzeczywiście potrzebował kolejnego wykresu
(„Monthly Total” był renderowany ręcznie z `<div>`-ów jako placeholder) —
zamiast wracać do chart.js, dodano `@nivo/bar` (ta sama rodzina co już
zainstalowane `@nivo/core`/`@nivo/line`/`@nivo/pie`, więc jedna biblioteka
wykresów obsługuje pie/line/bar) i podmieniono placeholder na realny
`ResponsiveBar` w [Reports.tsx](apps/web/src/pages/Reports.tsx).

### 3.2 [NAPRAWIONE] `zustand` zainstalowany, ale w ogóle nieużyty
`store/` z opisu w CLAUDE.md nawet nie istniał jako katalog. Cały stan
feature'owy (expenses, categories, pagination) był lokalnym `useState` per
strona, a Dashboard/Expenses/Categories osobno odpytywały `/categories`.
**Naprawione**: dodano [store/categoryStore.ts](apps/web/src/store/categoryStore.ts)
— współdzielony cache kategorii (fetch/add/edit/remove + `reset()` wołany
przy logout w `AuthContext`). Dashboard, Expenses i Categories korzystają
teraz z tego store zamiast własnych kopii stanu i osobnych zapytań.

### 3.3 [NAPRAWIONE] `Budget` / `BudgetProgress` — typ bez żadnej implementacji
`packages/shared/src/types.ts` definiowało `Budget` i `BudgetProgress`, ale
nie miały tabeli, modelu, kontrolera, routingu ani jednego użycia we
froncie — martwy kontrakt API. **Naprawione**: usunięto oba typy z
`packages/shared/src/types.ts` (i wpis z
[shared.instructions.md](.github/instructions/shared.instructions.md)).

### 3.4 [NAPRAWIONE] `Settings.tsx` to placeholder
[Settings.tsx](apps/web/src/pages/Settings.tsx) renderowało tylko statyczny
tekst „Settings page content would go here”. **Naprawione**: strona ma
teraz trzy realne sekcje — Profile (username/email/firstName/lastName,
korzysta z istniejącego, dotąd nieużywanego we froncie `PUT /users/profile`),
Change Password (nowy endpoint `PUT /api/users/password`,
`UserModel.findPasswordById`/`updatePassword`) i Preferences (currency +
theme). Ustawienia mają swoje miejsce w bazie: nowa tabela `user_settings`
(`user_id` PK/FK, `currency`, `theme`, trigger tworzący domyślny wiersz przy
rejestracji + backfill dla istniejących userów w
[migrate.ts](apps/api/src/db/migrate.ts)), nowy model/kontroler/route
(`GET`/`PUT /api/settings`), nowe typy `UserSettings`/`UserSettingsUpdateInput`/
`SUPPORTED_CURRENCIES` w `packages/shared`. Currency wpływa realnie na
wyświetlane kwoty (Dashboard, Reports, `ExpenseTable`, `formatCurrency`
przyjmuje teraz opcjonalny kod waluty), a zmiana theme w Settings i w
przełączniku w AppBar zapisuje się do `user_settings` (oprócz
dotychczasowego `localStorage`). Uwaga: `apps/api` kompiluje się do
CommonJS, a `@expenses/shared` do ESM (`"type": "module"` w jego
`package.json`) — dotąd nieproblematyczne, bo każdy import z `shared` w
`apps/api` był tylko typem (wycinany przez `tsc`). `SUPPORTED_CURRENCIES`
jest pierwszą realną (nie tylko typową) wartością eksportowaną z `shared` i
konsumowaną w czasie działania API — `require()` ESM-owego `dist/index.js`
wywalałoby się w runtime, więc w
[settings.routes.ts](apps/api/src/routes/settings.routes.ts) lista walut
jest zduplikowana lokalnie (z komentarzem czemu) zamiast importowana z
`shared`. Jeśli `shared` zacznie eksportować więcej wartości runtime
potrzebnych w `apps/api`, warto rozważyć zmianę `module` w
`packages/shared/tsconfig.json` na coś dual-CJS/ESM albo na `commonjs` (Vite
po stronie `apps/web` obsłużyłby to bez problemu).

## 4. Wydajność

### 4.1 N+1 zapytania w `ExpenseModel.getExpensesByMonth`
[expense.model.ts:233-308](apps/api/src/models/expense.model.ts#L233-L308):
dla każdego miesiąca zwróconego przez zapytanie zbiorcze wykonywane są
**dwa dodatkowe zapytania** (rozkład po kategoriach + top 5 wydatków) w
pętli `for`. Dla pełnego roku to do 1 + 12×2 = 25 zapytań na jedno wywołanie
endpointu `/expenses/by-month`. Da się to sprowadzić do 2-3 zapytań
zagregowanych (CTE/window functions z `PARTITION BY EXTRACT(MONTH FROM date)`
albo `json_agg` per miesiąc), bez zmiany kontraktu `ExpenseByMonth`.

## 5. [NAPRAWIONE] Niekonsekwencja walidacji

[expense.routes.ts](apps/api/src/routes/expense.routes.ts) i
[user.routes.ts](apps/api/src/routes/user.routes.ts) używają
`express-validator` (middleware `validate`), natomiast
`category.routes.ts`/[category.controller.ts](apps/api/src/controllers/category.controller.ts)
robią tylko ręczne `if (!name)` bez walidacji długości, formatu koloru
(`#RRGGBB`) czy `icon`. Warto ujednolicić — dodać `express-validator` też do
kategorii, albo udokumentować, że dla prostych zasobów wystarcza walidacja
ręczna (i trzymać się tego konsekwentnie).

`category.routes.ts` ma już `express-validator` (`categoryBodyValidation`/
`categoryUpdateValidation`, walidujące długość, format koloru i `icon`) —
walidacja jest teraz konsekwentna we wszystkich trzech zasobach. Zostawiłem
nietknięty redundantny `if (!name)` w `category.controller.ts` (martwa,
ale niegroźna asekuracja sprzed dodania walidatora) — niewymagane przez to
zadanie do usunięcia.

**Uwaga do CLAUDE.md**: dokument w sekcji „Known gaps” twierdzi „No
`express-validator` currently used” — to nieaktualne, biblioteka jest już
używana dla `users` i `expenses`. Warto zaktualizować ten zapis, żeby nie
wprowadzał w błąd przy kolejnych zmianach.

Zapis w CLAUDE.md zaktualizowany, żeby opisywał faktyczny stan
(`express-validator` na routingu dla users/expenses/categories).

## 6. [NAPRAWIONE] Testy

`apps/api/src/__tests__` ma sensowne pokrycie (auth, expenses, categories,
analytics) z helperami do bazy testowej. **`apps/web` nie ma ani jednego
testu** — przy stronach z formularzami (Formik+Yup) i logiką biznesową
(Dashboard, Reports, Expenses) brak nawet podstawowych testów serwisów
(`services/*.ts`) czy walidacji formularzy zostawia regresje niewykryte do
testów manualnych.

Dodano Vitest (`apps/web/vitest.config.ts`, `npm run test` →
`vitest run`) i podstawowe testy: `services/expenseService.test.ts`,
`categoryService.test.ts`, `authService.test.ts` (mockują `./api`,
sprawdzają budowane URL-e/payloady i odpakowywanie `.data`) oraz
`components/ExpenseForm.test.ts` dla `ExpenseSchema` (Yup) — wymagane
pola, dodatnia kwota, długość opisu, data nie z przyszłości. To
fundament do rozbudowy (Dashboard/Reports/Expenses logika, więcej
schematów walidacji), nie pełne pokrycie.

## 7. [NAPRAWIONE] Drobne uwagi

- **Dokumentacja auth jest nieaktualna**: CLAUDE.md opisuje frontendowy
  „request interceptor attaches Bearer token from localStorage”, ale
  [api.ts](apps/web/src/services/api.ts) nie czyta żadnego tokenu z
  `localStorage` — całość auth idzie przez `withCredentials` + ciasteczko
  `httpOnly`. To dobra, bezpieczniejsza implementacja, ale dokument ją źle
  opisuje. **Naprawione**: poprawiono opis w CLAUDE.md (sekcje „Service
  layer” i „Auth flow”).
- `auth.middleware.ts` akceptuje token zarówno z ciasteczka, jak i z nagłówka
  `Authorization: Bearer`, ale żaden klient w repo nie wysyła nagłówka —
  warto potwierdzić, czy to zostało dodane pod przyszłych klientów (np.
  mobile/API), czy to martwa ścieżka kodu. **Naprawione (dokumentacyjnie)**:
  odnotowano w CLAUDE.md jako celowe wsparcie dla przyszłych
  klientów niewykorzystujących ciasteczek — nie usuwano kodu.
- Kolumna `users.password` to `VARCHAR(100)` — dla bcrypt (zawsze 60 znaków)
  wystarcza, ale `TEXT` byłby bezpieczniejszy na przyszłość (zmiana
  algorytmu hashowania nie wymagałaby migracji schematu). **Naprawione**:
  `migrate.ts` teraz tworzy kolumnę jako `TEXT` i dodaje idempotentny
  `ALTER TABLE users ALTER COLUMN password TYPE TEXT` dla istniejących baz
  (zweryfikowane: świeża baza, powtórne odpalenie, baza z istniejącą
  kolumną `VARCHAR(100)`).

## Podsumowanie priorytetów

| Priorytet | Co | Gdzie |
|---|---|---|
| Krytyczny | Zrewokować token GitHub (poza samym repo) | GitHub settings |
| Wysoki | [NAPRAWIONE] Naprawić `eslint.config.js` w `apps/api`/`apps/web` | tooling |
| Wysoki | N+1 w `getExpensesByMonth` | `expense.model.ts` |
| Średni | [NAPRAWIONE] Dodać CI (build+test+lint) | `.github/workflows` |
| Średni | [NAPRAWIONE] Usunąć/dokończyć `Budget`, dokończyć `Settings.tsx` | shared/web |
| Średni | [NAPRAWIONE] Usunąć nieużywane zależności (`chart.js`, `react-chartjs-2`), wykorzystać `zustand` | `apps/web` |
| Niski | [NAPRAWIONE] Ujednolicić walidację kategorii vs. expenses/users | `apps/api` |
| Niski | [NAPRAWIONE] Testy dla `apps/web` | `apps/web` |
| Niski | [NAPRAWIONE] Zaktualizować CLAUDE.md (auth flow, express-validator) | `CLAUDE.md` |
