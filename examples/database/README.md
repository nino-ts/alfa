# database

The built-in ORM (`alfa/database`) over `Bun.sql`, plus migrations and a real
Postgres. No Prisma, Drizzle or TypeORM.

## Run

```bash
docker compose up -d        # Postgres 18 on :5432
cp .env.example .env        # DATABASE_URL=postgres://postgres:postgres@localhost:5432/alfa
bun install
bunx alfa migrate           # applies database/migrations/*.sql
bun run dev
```

Stop the database with `docker compose down` (`-v` to also drop the volume).

## Routes

| Method | Path | Result |
|---|---|---|
| GET | `/api/posts` | all posts |
| POST | `/api/posts` | create (`{ "title", "body" }`) |
| GET | `/api/posts/1` | one post |

```bash
curl -s localhost:3000/api/posts -X POST -H 'content-type: application/json' \
  -d '{"title":"hello","body":"from bun.sql"}'
curl -s localhost:3000/api/posts
```

## Driver

`Bun.SQL` picks the driver from `DATABASE_URL`:

- `postgres://…` (this example)
- `mysql://…` / `mysql2://…` — use `?` placeholders and a MySQL migration
- `sqlite://app.db` — swap in a SQLite migration (`id INTEGER PRIMARY KEY AUTOINCREMENT`)

`defineTable` returns a fluent builder: `posts.select().where(eq("id", 1)).first()`.
