# alfa examples

Each example is standalone and demonstrates a **different** capability. Based on
archetypes from the [Next.js examples](https://github.com/vercel/next.js/tree/canary/examples)
(`hello-world`, `blog`, `api-routes-rest`, `auth`, `next-forms`, `with-docker`),
adapted to alfa's file-system routing and Bun-native primitives.

| Example | Focus | Routes |
|---|---|---|
| [`hello-world`](./hello-world) | smallest possible app | `pages/index.ts` |
| [`blog`](./blog) | dynamic routes + data | `pages/blog/[slug].ts`, `pages/api/posts.ts` |
| [`blog-react`](./blog-react) | **React SSR + shadcn/ui + Tailwind** | `pages/*.tsx`, ORM + Standard Schema |
| [`api`](./api) | REST JSON API | `pages/api/items/index.ts`, `pages/api/items/[id].ts` |
| [`auth`](./auth) | session middleware + passwords | `/login`, `/logout`, `/dashboard` |
| [`forms`](./forms) | HTMX form + Standard Schema validation | `pages/contact.ts` |
| [`database`](./database) | ORM over `Bun.sql` + migrations (Postgres via `docker compose`) | `pages/api/posts/*` |
| [`hypermedia`](./hypermedia) | HTMX + Alpine | `pages/index.ts` |
| [`react-fullstack`](./react-fullstack) | React SPA bundled by Bun | `index.html` + `src/app.tsx` |
| [`vue`](./vue) | Vue SPA bundled by Bun | `index.html` + `src/app.ts` |

## Running an example

```bash
cd examples/<name>
bun link alfa        # or rely on the workspace link
bun install
bun run dev
```

Each example is a private workspace; only `alfa` (and the UI framework, for the
SPA examples) is required.

## Stack de frontend

| Example | Stack |
|---|---|
| `blog-react` | React 19 SSR + shadcn/ui + Tailwind v4 — rotas do alfa servindo HTML |
| `react-fullstack` | React SPA empacotado pelo Bun (HTML import) + API do alfa |
| `vue` | Vue empacotado pelo Bun (HTML import) + API do alfa |
| `hypermedia`, `forms` | HTMX + Alpine, sem bundle |
| `api`, `auth`, `database`, `blog`, `hello-world` | só servidor (HTML string ou JSON) |
