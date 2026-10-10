import { defineApp } from "alfa";
import html from "./index.html";

// API routes come from alfa's `pages/`; the React page is bundled by Bun (HTML import).
const api = defineApp({ dir: `${import.meta.dir}/pages` });

Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: true,
  routes: { "/": html },
  fetch: api.fetch,
});
