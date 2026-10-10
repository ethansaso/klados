# Klados

Web platform for learning to identify organisms through resources like collaborative visual guides built on a structured glossary (features, characters, traits) and a taxon hierarchy. Links to GBIF and iNaturalist for IDs, names, and media.

## Stack

TanStack Start (React 19, Router, Query) · Radix Themes · react-hook-form + zod · Drizzle ORM on Postgres · better-auth · nice-modal-react · Vite.

## Commands

- `npm run dev`: dev server on :3000 (Postgres via `docker compose up -d`, port 5434)
- `npm run typecheck` and `npm run lint`: what CI enforces; run both before calling work done
- `npm run db:generate` / `npm run db:migrate`: after schema changes in `db/schema/`
- There is no meaningful test suite yet; verify with typecheck, lint, and targeted scripts.

## Layout

- `db/schema/`: Drizzle tables. `db/` may only import from `db/`.
- `src/lib/domain/<area>/`: server logic as `service.ts` (transactions, invariants) → `repo.ts` (queries), plus `types.ts` and `validation.ts` (zod).
- `src/lib/server-fns/<area>/`: `createServerFn` wrappers that validate input and call a domain service. Curator-only writes use `requireCuratorMiddleware`.
- `src/lib/queries/`: React Query `queryOptions` factories.
- `src/routes/`: file-based routes. Folders prefixed `-` (`-components`, `-hooks`, `-external`) are route-private, not routes. `routeTree.gen.ts` is generated.
- `src/components/`: shared UI.
- **Out of scope by default:** the LLM extraction feature (`src/llms/`, `src/lib/domain/extraction/`, `src/lib/server-fns/extraction/`, `src/routes/api/_unauthenticated/extraction.ts`, `ExtractionModal.tsx`). Don't read, reference, or account for it unless the user brings it up.

## Conventions

- **File order:** types → `UPPER_CASE` consts → other variables (schemas, `NiceModal.create` components) → functions. Prefer function declarations over arrow-function consts for helpers.
- **`types.ts` files hold only types.** Helpers go in their own files.
- **Backend layers**: `repo` holds database logic, `service` holds business logic, `serverFn` generally wraps service except in rare cases where additional logic is required.
- **Query options** live in `src/lib/queries/`, use camelCase keys (`["inatTaxonImport", id]`), and are passed straight to `useQuery(...)`.
- **Comments are brief.** Only explain a non-obvious "why"; never restate a name or obvious logic.
- **Modals:** `NiceModal.create`, closed with `remove()`, plus an exported promise helper (`pickX`/`selectX`) that resolves to the result or `null`.
- **Forms:** label rows use `Label.Root` + `ConditionalAlert`, inputs spread `a11yProps(errorId, invalid)`. Notifications use `toast()` from `src/lib/utils/toast`.
- **Backend is resilient, frontend stays simple:** normalize or dedupe messy input (e.g. external names, repeated media ids) in the service layer instead of in every caller.
- **CSS:** It is preferable to make identically named, sibling CSS files that components import, rather than adding styles to the assets CSS directory.
- **Formatting:** Prettier.

## Workflow

- Work is tracked as GitHub issues.
- Never commit, push, or stage.
- For UI or UX changes, discuss the approach before building unless told to go ahead.
