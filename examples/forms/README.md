# forms

HTMX form posting to a route handler, validated with the Standard Schema
adapter (`alfa/validation`) — no validation library needed.

```bash
bun install
bun run dev
```

- `GET /` — the form
- `POST /contact` — `200` with a success fragment, or `422` with the error list

The schema is a plain object implementing `~standard.validate`; swap in Zod,
Valibot, ArkType or VineJS without touching the handler.
