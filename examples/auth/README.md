# auth

Session-based login/logout, using `alfa/session` as a **middleware** and
`alfa/auth` for password hashing. Users live in a table created by the ORM.

```bash
docker compose up -d        # Postgres 18 on :5432
cp .env.example .env        # APP_SECRET + DATABASE_URL
bun install
bunx alfa migrate           # creates `users` and seeds the demo user
bun run dev
```

- `/` — home (shows signed-in state)
- `/login` — form (`ada@example.com` / `secret`), then `302` to `/dashboard`
- `/dashboard` — protected; `302` to `/login` when signed out
- `/logout` — POST, clears the session

The table is produced from the blueprint in `lib/db.ts`; the migration only calls
`users.createTable()`:

```ts
export const users = defineTable<User>(db, "users", (table) => {
  table.id();
  table.string("email").unique();
  table.string("passwordHash");
  table.timestamps();
});
```

The signing secret comes from `APP_SECRET`.

Demonstrates `defineApp({ middleware })`: the session middleware wraps every
matched route and rewrites the signed cookie on the response.
