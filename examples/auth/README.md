# auth

Session-based login/logout, using `alfa/session` as a **middleware** and
`alfa/auth` for password hashing.

```bash
bun install
cp .env.example .env     # APP_SECRET=dev-secret
bun run dev
```

- `/` — home (shows signed-in state)
- `/login` — form (`ada@example.com` / `secret`), then `302` to `/dashboard`
- `/dashboard` — protected; `302` to `/login` when signed out
- `/logout` — POST, clears the session

The signing secret comes from `APP_SECRET` (defaults to `dev-secret`).

Demonstrates `defineApp({ middleware })`: the session middleware wraps every
matched route and rewrites the signed cookie on the response.
