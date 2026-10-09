# create-alfa

Scaffold a new [alfa](https://github.com/nino-ts/alfa) application.

> ⏳ **Not published to npm yet.** Use the clone with `bun link`:
>
> ```bash
> git clone https://github.com/nino-ts/alfa && cd alfa && bun install
> cd packages/alfa && bun link
> cd ../create-alfa && bun link
> # then: bunx create-alfa myapp
> ```

```bash
bunx create-alfa myapp
bunx create-alfa myapp --template react
bunx create-alfa myapp --template vue
```

## Templates

- `hypermedia` (default) — HTMX + Alpine; routes in `pages/*.ts`.
- `react` — `index.html` + `src/app.tsx`, bundled by Bun; API in `pages/`.
- `vue` — `index.html` + `src/app.ts` (render function), bundled by Bun; API in `pages/`.

## License

MIT
