# api

A REST-style JSON API. One route file handles several methods; params come from
the path, query from the URL.

```bash
bun install
bun run dev
```

| Method | Path | Result |
|---|---|---|
| GET | `/api/items?limit=10` | list |
| POST | `/api/items` | create (`{ "name": "..." }`) |
| GET | `/api/items/:id` | one item |
| PATCH | `/api/items/:id` | update |
| DELETE | `/api/items/:id` | `204` |
| GET | `/api/items/999` | `404` |

```bash
curl -s localhost:3000/api/items -d '{"name":"write docs"}' -H 'content-type: application/json'
curl -s localhost:3000/api/items/1
```

No frontend — consume it from anything.
