# alfa blog — React + shadcn/ui + Tailwind, routed by alfa

A blog built with [alfa](https://github.com/nino-ts/alfa): file-system routing,
React server-side rendering, shadcn/ui components and Tailwind CSS v4.

## Run

```bash
bun install
cp .env.example .env        # DATABASE_URL=sqlite://blog.db
bunx alfa migrate            # creates the `posts` table (from the ORM blueprint) + seeds 3 posts
bun run dev                  # http://localhost:3000
```

| Rota | O que faz |
|---|---|
| `/` | lista dos posts + formulário de criação |
| `/posts/:slug` | post completo (404 quando não existe) |
| `POST /api/posts` | cria post (JSON ou form; `303` para form, `201` para JSON) |
| `GET /api/posts` | posts publicados |
| `GET /api/posts/:id` | um post |
| `DELETE /api/posts/:id` | remove |

## Como está montado

```
pages/                        # rotas do alfa
├── index.tsx                 # "/"  (SSR React)
├── posts/[slug].tsx          # "/posts/:slug"
└── api/
    ├── posts.ts              # "/api/posts"
    └── posts/[id].ts         # "/api/posts/:id"
src/
├── index.ts                  # entry: compila o CSS e sobe o defineApp
├── css.ts                    # Tailwind -> public/styles.css
├── render.tsx                # Document + renderPage (react-dom/server)
├── db.ts                     # ORM: defineTable(db, "posts", blueprint)
├── schema.ts                 # Standard Schema (sem lib de validação)
└── components/ui/            # shadcn/ui
```

- **Rotas**: `defineApp({ dir: "pages", publicDir: "public" })` — o alfa resolve o
  arquivo e chama o `default export`.
- **SSR**: o handler devolve `Response` com o HTML renderizado pelo React.
- **Tailwind**: `bun-plugin-tailwind` compila `src/index.css` (que importa o tema
  do shadcn) para `public/styles.css`, servido como arquivo estático.
- **ORM**: a tabela vem do blueprint em `src/db.ts`; a migration só chama
  `posts.createTable()`.
- **Validação**: schema Standard Schema escrito à mão — trocar por Zod, Valibot,
  ArkType ou VineJS não muda os handlers.

## Scripts

```bash
bun run dev        # desenvolvimento
bun run build      # compila o CSS
bun run start      # produção
bun run migrate    # aplica as migrations
bun run typecheck  # bun check
```
