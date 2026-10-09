# Routing

`alfa` uses **file-system routing**, delegated to Bun's native
[`Bun.FileSystemRouter`](https://bun.com/docs/runtime/file-system-router)
(Next.js `pages/` conventions). There is no custom matcher and no named-route registry.

## The `pages/` directory

```
pages/
├── index.ts                 # /
├── about.ts                 # /about
├── blog/
│   ├── index.ts             # /blog
│   └── [slug].ts            # /blog/:slug
├── docs/[[...slug]].ts      # /docs, /docs/a, /docs/a/b
└── api/
    ├── health.ts            # /api/health
    └── users/[id].ts        # /api/users/:id
```

| File | URL |
|---|---|
| `pages/index.ts` | `/` |
| `pages/about.ts` | `/about` |
| `pages/blog/index.ts` | `/blog` |
| `pages/blog/[slug].ts` | `/blog/:slug` |
| `pages/shop/[...slug].ts` | `/shop/a`, `/shop/a/b` |
| `pages/docs/[[...slug]].ts` | `/docs`, `/docs/a`, `/docs/a/b` |

Params are read from the file name and exposed as `ctx.params` (a
`Record<string, string>`). The optional catch-all joins the path into one param
(`/docs/a/b` → `params.slug === "a/b"`).

## A page

```ts
// pages/index.ts
export default () => "<h1>home</h1>";
```

Returning a `string` sends `text/html`. Returning a `Response` is passed through
untouched:

```ts
// pages/api/users/[id].ts
import type { HttpContext } from "alfa/http";

export default (ctx: HttpContext) => Response.json({ id: ctx.params.id });
```

## Context

```ts
interface HttpContext {
  readonly req: Request;
  params: Record<string, string>;   // path params
  query: Record<string, string>;    // ?a=1
  cookies: Bun.CookieMap;
  [key: string]: unknown;           // middleware bag
}
```

## The app

```ts
import { defineApp } from "alfa";

defineApp().listen(3000);
```

`defineApp({ dir })` scans `dir` (default `./pages`). `defineApp({ publicDir })`
also serves a static directory at `/public/*` via Bun's directory routes.

The underlying module is `alfa/routing`, which exports `createAppRouter(options)`
and `loadRouteHandler(filePath)` — a thin layer over `Bun.FileSystemRouter`. Most
apps use `defineApp` and never import it directly.

```ts
const app = defineApp({ dir: "pages", publicDir: "public" });

app.router.routes;   // Record<pattern, filePath>, from Bun
app.reload();        // re-scan pages/ (useful under bun --hot)
await app.fetch(new Request("http://localhost/blog/x"));
```

## Errors

A handler that throws is handled by `Bun.serve({ error })` — `alfa` registers a
default `500` responder and never wraps handlers in `try/catch`.

## Development

```bash
bun --watch index.ts     # hard restart; re-scans pages/
```

`bun --hot index.ts` soft-reloads; call `app.reload()` to pick up new files in
`pages/`.

## Not included

`layout`, `error`, `not-found`, `loading`, route groups `(x)`, private folders
`_x`, parallel slots `@slot` and intercepting routes are **App Router** features.
Bun's router does not implement them and `alfa` does not reimplement them. A
route file is self-contained.
