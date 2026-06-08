# Frontend structure & conventions

How the `js/` frontend (React 18 + Vite + TypeScript) is organized. Read this before adding
pages, features, or data hooks so new code lands in the right place.

Stack: React Router v6, TanStack Query, Mantine 8, Zod, MSW, `openapi-typescript` (types
generated from the backend's OpenAPI spec). Path alias `@/* → src/*`. ESLint enforces absolute
imports (`@`-prefixed) and import sorting; `/api` is proxied to the Spring backend.

## The shape

```
js/src/
  main.tsx                         # entry
  app/                             # APP SHELL — bootstrapping, NOT pages
    router/
      router.tsx                   # central route tree: guards + layouts + page mounts
      guards/
        RequireAuth.tsx            # redirect to /login if no session
        RequireAdmin.tsx           # redirect/403 if not admin
    layouts/
      PublicLayout.tsx             # public chrome
      AppLayout.tsx                # authed chrome (sidebar, user menu)
      AdminLayout.tsx              # admin chrome
    providers/
      QueryProvider.tsx            # TanStack Query provider
      theme.tsx                    # Mantine theme
  features/                        # DOMAINS — one folder per bounded context
    <domain>/                      # e.g. pairings, profile, intake, admin
      <Name>.page.tsx              # a page (flat file until it grows)
      <name>/                      # page-FOLDER, only once the page gains local pieces
        <Name>.page.tsx
        components/                # used only by this page
      components/                  # domain-shared UI (2+ pages in this domain)
      api/
        useX.ts                    # query/mutation hooks (domain-owned)
        schemas.ts                 # Zod (flat until it grows)
        <domain>.mock.ts           # MSW handlers (+fixtures) → mocks/ folder when it grows
      hooks/                       # non-data domain hooks (on demand)
      types.ts                     # flat until it grows
  components/                      # APP-SHARED UI primitives (cross-domain)
  lib/                             # APP-SHARED, framework-agnostic infra
    api/
      schema.d.ts                  # openapi-typescript generated types (whole backend)
      client.ts                    # typed fetch wrapper over /api
      queryClient.ts               # QueryClient instance/config
    test/
      defaults.tsx                 # vitest setupFile (wired in vite.config.ts)
      server.ts                    # MSW setupServer composing domain *.mock.ts handlers
      render.tsx                   # custom RTL render wrapping providers
    utils/                         # generic, domain-agnostic helpers
```

## Conventions

1. **Domain-first, not permission-first.** Folders are organized by domain. Permission is a
   routing concern — never encode access (admin/public/authed) in the folder tree.
2. **Permissions live in the router.** Composable nested routes: a guard route (`RequireAuth`,
   `RequireAdmin`) wraps a layout route wraps the page. A page's access level and visual frame
   each change with a one-line route edit; the page file never moves.
3. **`features/` wrapper.** Everything under `features/` is a domain; everything else (`app/`,
   `components/`, `lib/`) is shell or shared infra.
4. **Pages: hybrid granularity.** A page is a single `Name.page.tsx`. It graduates to a folder
   (`name/Name.page.tsx` + a local `components/`) only once it accumulates page-local pieces.
   Keep the `.page.tsx` suffix inside page-folders — don't use `index.tsx`.
5. **Data layer split.** Global (`lib/api/`): generated OpenAPI types + typed fetch client +
   QueryClient. Domain-owned (`features/<d>/api/`): per-endpoint query/mutation hooks + Zod
   schemas. `useSubmitIntake` belongs to `intake`, not a global pile.
6. **Concern folders, on demand.** A domain has `components/` + `api/`; add `hooks/` /
   `utils.ts` / `types.ts` only as they grow (flat file first, folder at 2–3 files). There is
   no domain-level `lib/` — `lib/` means app infra only.
7. **No barrels.** Import the specific file (`@/features/pairings/api/usePairings`). This keeps
   Vite/HMR and tree-shaking fast and avoids circular-import bugs.
8. **Testing.** Tests colocate beside source (`Name.page.test.tsx`). Shared test infra lives in
   `lib/test/`. MSW handlers are domain-owned, named `<domain>.mock.ts` in `features/<d>/api/`
   (parallels `.test.ts`, and is excluded from the prod build); `lib/test/server.ts` composes
   them. Promote to a `features/<d>/mocks/` folder when fixtures grow.
9. **Central router.** One `app/router/router.tsx` owns the full guard/layout/route tree and
   imports page components from domains (thin wiring, not domain logic). It keeps the whole
   access map visible in one place.
10. **Graduation rule.** Start at the narrowest scope; promote outward only on the _second real
    consumer_: page-local → domain (`features/<d>/...`) → app-shared (`src/components`,
    `src/lib`). Avoid premature promotion.
11. **Styles colocate.** `Foo.module.css` sits next to `Foo.tsx`.
12. **Cross-domain data access.** A domain's `api/` folder is its public surface — the one place
    another domain may import from (never another domain's `components/` or page internals).
    Prefer, in order: (a) **backend composition** — have the endpoint embed the fields you need
    so no cross-call happens (avoids request waterfalls); (b) for genuine client-side cross-reads,
    import the **canonical hook** from `features/<owner>/api` and reuse its query keys (one shared
    cache entry); (c) keep dependencies **one-directional** — a cycle is the signal to extract a
    shared piece. When a domain is consumed by **3+ domains** (e.g. the user/profile entity),
    promote its _data layer_ to a shared `entities/<x>/` tier while its _pages_ stay in
    `features/<x>/`.

## Where things go (quick reference)

| You're adding…                       | Put it in…                                                               |
| ------------------------------------ | ------------------------------------------------------------------------ |
| A new page                           | `features/<domain>/<Name>.page.tsx` (+ mount in `app/router/router.tsx`) |
| A query/mutation hook                | `features/<domain>/api/useX.ts`                                          |
| A Zod schema for an endpoint         | `features/<domain>/api/schemas.ts`                                       |
| UI used by 2+ pages in one domain    | `features/<domain>/components/`                                          |
| UI used across domains               | `src/components/`                                                        |
| A request mock for tests             | `features/<domain>/api/<domain>.mock.ts`                                 |
| The typed fetch client / QueryClient | `src/lib/api/`                                                           |
| A new layout or route guard          | `src/app/layouts/` or `src/app/router/guards/`                           |

## Decision log

The reasoning behind the conventions, for anyone tempted to reorganize.

1. **Domain vs permission as the primary axis → domain.** Permission is a routing concern; one
   feature spans permission levels; permissions change (folders would churn); and a folder split
   enforces nothing — real gating is the router guard + backend. Rejected top-level
   `admin/ public/ authenticated/` dirs.
2. **Page granularity → hybrid (file until it grows).** Promotion is cheap because a page is
   imported in exactly one place (the router). Rejected always-folder-per-page.
3. **Domain wrapper → `features/`.** Rejected flat-under-`src/` (domains blend with infra).
4. **Data layer → domain-owned hooks**, thin global (`lib/api/` = generated types + client +
   QueryClient). Rejected a global `src/api/` pile.
5. **Domain insides → concern folders on demand.** Rejected a domain-level `lib/` (junk drawer;
   name clash with app-infra `lib/`).
6. **Encapsulation → no barrels.** Rejected per-domain `index.ts` (Vite/tree-shaking cost,
   circular-import risk). Enforce boundaries with lint instead, if needed.
7. **MSW handlers → domain-owned `<domain>.mock.ts`.** Rejected one global `handlers.ts`
   (monolith that re-couples domains).
8. **Router → central `router.tsx`.** Rejected domain-contributed route objects for now
   (fragments the access map); revisit only if the file becomes unwieldy.
9. **Cross-domain data → backend-composition first, else import the owner's `api/` hook.**
   Rejected an upfront `entities/` tier (premature) and per-domain duplication (cache
   fragmentation + double fetching). Promote to `entities/` only at 3+ consumers.
