# Frontend stacks

`alfa` ships no template engine and no view package. The server is yours; pick a
frontend approach. Escaping is a render-layer concern — use
[`Bun.escapeHTML()`](https://bun.com/reference/bun/escapeHTML) when you build HTML
strings by hand.

## Options

| Stack | Best for | How |
|---|---|---|
| **HTMX + Alpine** | server-driven pages, forms, admin | `pages/*.ts` returning HTML strings |
| **React (Bun fullstack)** | client-rendered SPA | Bun HTML import bundles `*.tsx` |
| **Vue (Bun fullstack)** | client-rendered SPA | Bun HTML import bundles `*.ts` |
| **API-only** | separate frontend | `Response.json` routes |

There is no server-side component model, no RSC, no Inertia.

---

## HTMX + Alpine

```ts
// pages/index.ts
export default () => `<!doctype html>
<html>
  <head>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <button type="button" x-on:click="count++">count: <span x-text="count"></span></button>
      <button type="button" hx-get="/api/health" hx-target="#out">call API</button>
      <pre id="out"></pre>
    </main>
  </body>
</html>`;
```

```ts
// pages/api/health.ts
export default () => Response.json({ ok: true });
```

No bundler, no extra dependencies. Bun serves the HTML string directly.

**Escaping:** HTMX does not escape — it swaps server HTML. When you interpolate
user data into a string, call `Bun.escapeHTML(value)`. Alpine's `x-text` writes via
`textContent` (escapes); `x-html` does not.

---

## React (Bun fullstack)

Bun bundles `*.tsx` and serves the result through an HTML import:

```html
<!-- index.html -->
<!doctype html>
<div id="root"></div>
<script type="module" src="./src/app.tsx"></script>
```

```tsx
// src/app.tsx
import { useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [count, setCount] = useState(0);
  return <button type="button" onClick={() => setCount((c) => c + 1)}>count: {count}</button>;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
```

```ts
// index.ts — Bun serves the page; alfa serves the API
import { defineApp } from "alfa";
import html from "./index.html";

const api = defineApp({ dir: `${import.meta.dir}/pages` });

Bun.serve({ port: 3000, development: true, routes: { "/": html }, fetch: api.fetch });
```

See [`examples/react-fullstack`](https://github.com/nino-ts/alfa/tree/main/examples/react-fullstack).

---

## Vue (Bun fullstack)

Same idea. This example uses Vue's render function (no Single-File Component, so
no bundler plugin is needed):

```ts
// src/app.ts
import { createApp, h, ref } from "vue";

createApp({
  setup() {
    const count = ref(0);
    return () => h("main", [h("h1", "alfa + Vue"), h("button", { type: "button", onClick: () => (count.value += 1) }, `count: ${count.value}`)]);
  },
}).mount("#root");
```

See [`examples/vue`](https://github.com/nino-ts/alfa/tree/main/examples/vue).
Single-File Components (`.vue`) would need a Bun plugin; that is out of scope.

---

## API-only

```ts
// pages/api/users.ts
import type { HttpContext } from "alfa/http";

export default async (ctx: HttpContext) => {
  const rows = await db`SELECT id, name FROM users`;
  return Response.json(rows);
};
```

Consume it from any separate frontend.

---

## Escaping summary

| Layer | Escapes? |
|---|---|
| React / JSX | yes |
| Vue | yes (interpolation) |
| Alpine `x-text` | yes |
| Alpine `x-html` | no |
| HTMX | no (server builds the HTML) |
| Hand-built HTML string | use `Bun.escapeHTML()` |

`alfa` exposes no `escapeHtml` helper — `Bun.escapeHTML` already exists and is
optimized (480 MB/s–20 GB/s).
