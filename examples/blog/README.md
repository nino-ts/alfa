# blog

Dynamic route from the file name (`pages/blog/[slug].ts` → `/blog/:slug`),
a JSON API route (`pages/api/posts.ts`), and an in-memory data module.

```bash
bun install
bun run dev
```

- `/` — list of posts
- `/blog/hello-alfa` — a post
- `/blog/nope` — 404
- `/api/posts` — JSON
