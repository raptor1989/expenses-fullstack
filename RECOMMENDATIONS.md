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

## 3. Martwy kod i nieużywane zależności

### 3.1 `chart.js` + `react-chartjs-2` nieużywane
[apps/web/package.json](apps/web/package.json) deklaruje `chart.js` i
`react-chartjs-2`, ale w całym `apps/web/src` nie ma ani jednego importu z
tych pakietów — wykresy są realizowane przez `@nivo/pie` (Dashboard) i
ręczne tabele (Reports). Zalecam usunięcie tych dwóch zależności (zbędny
rozmiar bundla).

### 3.2 `zustand` zainstalowany, ale w ogóle nieużyty
`store/` z opisu w CLAUDE.md nawet nie istnieje jako katalog. Cały stan
feature'owy (expenses, categories, pagination) jest lokalny `useState` per
strona. Albo zacznij używać zustand tam, gdzie się przyda (np. współdzielony
cache kategorii pomiędzy Dashboard/Expenses/Reports — dziś każda strona
osobno odpytuje `/categories`), albo usuń zależność, żeby nie sugerowała
istniejącego wzorca, którego nie ma.

### 3.3 `Budget` / `BudgetProgress` — typ bez żadnej implementacji
[packages/shared/src/types.ts:56-71](packages/shared/src/types.ts#L56-L71)
definiuje `Budget` i `BudgetProgress`, ale:
- nie ma tabeli `budgets` w [migrate.ts](apps/api/src/db/migrate.ts),
- nie ma modelu/kontrolera/routingu w `apps/api`,
- typy nie są importowane nigdzie w `apps/web`.

To martwy kontrakt API. Albo to zaplanowany feature do dokończenia (wtedy
warto to nazwać i zaplanować jako kolejny krok, idąc checklistą z CLAUDE.md:
typ → migracja → model → kontroler → route → serwis → strona), albo usunąć
typy, żeby nie wprowadzały w błąd.

### 3.4 `Settings.tsx` to placeholder
[Settings.tsx](apps/web/src/pages/Settings.tsx) renderuje tylko statyczny
tekst „Settings page content would go here” — strona jest dostępna w
nawigacji, ale nie robi nic. Warto albo dodać realną treść (np. zmiana
hasła, preferencje waluty/motywu), albo usunąć wpis z sidebar, żeby nie
mylić użytkowników końcowych.

## 4. Wydajność

### 4.1 N+1 zapytania w `ExpenseModel.getExpensesByMonth`
[expense.model.ts:233-308](apps/api/src/models/expense.model.ts#L233-L308):
dla każdego miesiąca zwróconego przez zapytanie zbiorcze wykonywane są
**dwa dodatkowe zapytania** (rozkład po kategoriach + top 5 wydatków) w
pętli `for`. Dla pełnego roku to do 1 + 12×2 = 25 zapytań na jedno wywołanie
endpointu `/expenses/by-month`. Da się to sprowadzić do 2-3 zapytań
zagregowanych (CTE/window functions z `PARTITION BY EXTRACT(MONTH FROM date)`
albo `json_agg` per miesiąc), bez zmiany kontraktu `ExpenseByMonth`.

## 5. Niekonsekwencja walidacji

[expense.routes.ts](apps/api/src/routes/expense.routes.ts) i
[user.routes.ts](apps/api/src/routes/user.routes.ts) używają
`express-validator` (middleware `validate`), natomiast
`category.routes.ts`/[category.controller.ts](apps/api/src/controllers/category.controller.ts)
robią tylko ręczne `if (!name)` bez walidacji długości, formatu koloru
(`#RRGGBB`) czy `icon`. Warto ujednolicić — dodać `express-validator` też do
kategorii, albo udokumentować, że dla prostych zasobów wystarcza walidacja
ręczna (i trzymać się tego konsekwentnie).

**Uwaga do CLAUDE.md**: dokument w sekcji „Known gaps” twierdzi „No
`express-validator` currently used” — to nieaktualne, biblioteka jest już
używana dla `users` i `expenses`. Warto zaktualizować ten zapis, żeby nie
wprowadzał w błąd przy kolejnych zmianach.

## 6. Testy

`apps/api/src/__tests__` ma sensowne pokrycie (auth, expenses, categories,
analytics) z helperami do bazy testowej. **`apps/web` nie ma ani jednego
testu** — przy stronach z formularzami (Formik+Yup) i logiką biznesową
(Dashboard, Reports, Expenses) brak nawet podstawowych testów serwisów
(`services/*.ts`) czy walidacji formularzy zostawia regresje niewykryte do
testów manualnych.

## 7. Drobne uwagi

- **Dokumentacja auth jest nieaktualna**: CLAUDE.md opisuje frontendowy
  „request interceptor attaches Bearer token from localStorage”, ale
  [api.ts](apps/web/src/services/api.ts) nie czyta żadnego tokenu z
  `localStorage` — całość auth idzie przez `withCredentials` + ciasteczko
  `httpOnly`. To dobra, bezpieczniejsza implementacja, ale dokument ją źle
  opisuje.
- `auth.middleware.ts` akceptuje token zarówno z ciasteczka, jak i z nagłówka
  `Authorization: Bearer`, ale żaden klient w repo nie wysyła nagłówka —
  warto potwierdzić, czy to zostało dodane pod przyszłych klientów (np.
  mobile/API), czy to martwa ścieżka kodu.
- Kolumna `users.password` to `VARCHAR(100)` — dla bcrypt (zawsze 60 znaków)
  wystarcza, ale `TEXT` byłby bezpieczniejszy na przyszłość (zmiana
  algorytmu hashowania nie wymagałaby migracji schematu).

## Podsumowanie priorytetów

| Priorytet | Co | Gdzie |
|---|---|---|
| Krytyczny | Zrewokować token GitHub (poza samym repo) | GitHub settings |
| Wysoki | [NAPRAWIONE] Naprawić `eslint.config.js` w `apps/api`/`apps/web` | tooling |
| Wysoki | N+1 w `getExpensesByMonth` | `expense.model.ts` |
| Średni | [NAPRAWIONE] Dodać CI (build+test+lint) | `.github/workflows` |
| Średni | Usunąć/dokończyć `Budget`, dokończyć `Settings.tsx` | shared/web |
| Średni | Usunąć nieużywane zależności (`chart.js`, `react-chartjs-2`, ew. `zustand`) | `apps/web` |
| Niski | Ujednolicić walidację kategorii vs. expenses/users | `apps/api` |
| Niski | Testy dla `apps/web` | `apps/web` |
| Niski | Zaktualizować CLAUDE.md (auth flow, express-validator) | `CLAUDE.md` |
