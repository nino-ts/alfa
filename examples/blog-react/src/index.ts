/**
 * alfa blog — file-system routing + React SSR + shadcn/ui + Tailwind.
 *
 * Routes live in `pages/`:
 *   pages/index.tsx          -> /
 *   pages/posts/[slug].tsx  -> /posts/:slug
 *   pages/api/posts.ts      -> /api/posts
 *   pages/api/posts/[id].ts -> /api/posts/:id
 */
import { defineApp } from "alfa";
import { buildCss } from "./css";

await buildCss();

const app = defineApp({ dir: "pages", publicDir: "public" });
const server = app.listen(Number(process.env.PORT ?? 3000));

console.log(`🚀 alfa blog running at ${server.url}`);
