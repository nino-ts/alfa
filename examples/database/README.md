# database

The built-in ORM (`alfa/database`) over `Bun.sql`, plus migrations. No Prisma,
Drizzle or TypeORM.

```bash
bun install
cp .env.example .env     # DATABASE_URL=sqlite://app.db
bunx alfa migrate        # applies database/migrations/*.sql
bun run dev
```

| Method | Path | Result |
|---|---|---|
| GET | `/api/posts` | all posts |
| POST | `/api/posts` | create (`{ "title", "body" }`) |
| GET | `/api/posts/1` | one post |

The driver is chosen from `DATABASE_URL` (`sqlite://` default, also `postgres://`
and `mysql://`). `defineTable` returns a fluent builder: `select().where(eq(...)).first()`.

> `bunx alfa migrate` needs `DATABASE_URL`; copy `.env.example` to `.env` first
> (Bun loads `.env` automatically).
