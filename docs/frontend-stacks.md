# Frontend stacks

`alfa` não impõe engine de template nem framework de frontend. O framework entrega o servidor e deixa a escolha de stack para você — a mesma abordagem do AdonisJS.

## Resumo

| Stack | Quando usar | Como |
|---|---|---|
| **HTMX + Alpine** (padrão) | SSR leve, formulários, admin | `pages/*.html` + `<script>` CDN |
| **React (Bun fullstack)** | SPA/streaming, React ecosystem | `pages/*.tsx` + `Bun.FileSystemRouter` |
| **API-only** | Backend consumindo SPA separada | `Response.json` + `fetch` no cliente |

Não existe pacote de views no core. TSX é escolha do usuário; `alfa` não tem `@alfa/view`.

---

## HTMX + Alpine (padrão)

```html
<!-- pages/index.html -->
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>app</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <h1>app</h1>
      <button type="button" x-on:click="count++">
        count: <span x-text="count"></span>
      </button>
      <section hx-get="/api/stats" hx-trigger="load" hx-target="#stats"></section>
      <div id="stats"></div>
    </main>
  </body>
</html>
```

Handler no servidor:

```ts
router.get("/api/stats", () => http.json({ users: 12 }));
```

Sem bundler, sem build step. O Bun serve o HTML estático.

---

## React com Bun fullstack

O Bun faz bundle de `.tsx` nativamente e resolve `pages/` via `Bun.FileSystemRouter`.

```tsx
// pages/index.tsx
export default function Home() {
  return <main><h1>alfa + React</h1></main>;
}
```

```ts
// index.tsx
import { FileSystemRouter } from "bun";
import home from "./pages/index.html"; // Bun empacota TSX em dev

const pages = new FileSystemRouter({
  dir: `${import.meta.dir}/pages`,
  style: "nextjs",
});

Bun.serve({
  routes: {
    "/api/health": new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    }),
  },
  fetch(req) {
    const match = pages.match(new URL(req.url));
    return match ? new Response(Bun.file(match.filePath)) : new Response("404", { status: 404 });
  },
});
```

Em produção, `bun build --target=bun` gera o manifest estático e o `Bun.serve` serve os assets sem bundling em runtime.

Exemplo completo: [`examples/react-fullstack`](https://github.com/nino-ts/alfa/tree/main/examples/react-fullstack).

---

## API-only

```ts
router.get("/api/users", async () => {
  const users = usersTable.select();
  return http.json(await users.get());
});
```

Consumido por uma SPA separada via `fetch`. Sem acoplamento do frontend ao servidor.

---

## Inertia / outras stacks

`alfa` não empacota Inertia nem adapters de deploy. Trate como integração externa: registre o middleware do Inertia manualmente em `compose()`.

## Resumo de regras

- O diretório de páginas é **`pages/`**.
- Não existe `views/` nem `app/` no core.
- `alfa` não possui engine de template; use HTML estático, TSX ou o que o Bun suportar nativamente.