# alfa

TypeScript 7 backend framework for **Bun**. Zero runtime dependencies.

## Repository

Publishes **2 packages** on npm (once the registry name is resolved):

| Package | Role |
|---|---|
| [`alfa`](./packages/alfa) | framework (bin `alfa` + `alfa/*` modules) |
| [`create-alfa`](./packages/create-alfa) | scaffolder (`bunx create-alfa`) |

> **npm publishing is disabled.** The unscoped name `alfa` is taken by a third
> party (`alfa@0.7.0`, maintainer `lsm`, unchanged since 2022) and no Trusted
> Publisher is configured. The publish workflow fails on purpose. Until this is
> resolved, use the clone with `bun link`.

## Layout

```
alfa/
├── packages/
│   ├── alfa/              # framework: bin alfa, src/{http,routing,database,validation,session,auth,console}
│   └── create-alfa/       # scaffolder
├── templates/
│   └── default/           # app base (pages/, HTMX + Alpine)
├── examples/
│   ├── hello-world/       # smallest app
│   ├── blog/              # dynamic routes + data
│   ├── api/               # REST JSON API
│   ├── auth/              # session middleware + passwords
│   ├── forms/             # HTMX + Standard Schema validation
│   ├── database/          # ORM over Bun.sql + migrations
│   ├── hypermedia/        # HTMX + Alpine
│   ├── react-fullstack/   # React + Bun HTML import
│   └── vue/               # Vue + Bun HTML import
├── docs/                  # consumer docs + llms.txt
├── .github/workflows/     # ci.yml (verify) + publish.yml (disabled)
└── package.json           # workspaces + #alfa import map
```

## Requirements

- **Bun >= 1.4** (runtime + package manager). Node.js, npm, yarn, pnpm are not supported.
- **TypeScript 7.x** (`peerDependencies`), `.ts` sources served directly (`noEmit`).

## Local development (before publishing)

```bash
bun install

cd packages/alfa && bun link
cd ../create-alfa && bun link

# in an app
bun link alfa
bun --watch index.ts
```

Without a global link: `bun add link:/path/to/alfa/packages/alfa`.

## Scripts

```bash
bun run verify   # verify:docs + tsc --noEmit + bun test + biome check + llms-full gate
bun test         # bun:test only
bun run typecheck
bun run lint
```

## Pillars

1. **Bun native** — every primitive is the Bun API.
2. **Simplicity** — small surface, no build step, zero runtime deps.
3. **Batteries included** — database (ORM), validation, auth, session, http, console.
4. **Developer experience** — TypeScript 7, `llms.txt`, clear errors.

## Conventions

- Routing is file-system based in `pages/`, delegated to `Bun.FileSystemRouter`.
- A route file `export default`s `(ctx) => Response | string`.
- Internal monorepo imports use `#alfa` / `#alfa/<module>`; the public API is `alfa` / `alfa/<module>`.
- No `container`, no `utils` module: use plain imports and Bun's native helpers.
- Zero `any`, zero suppressions.

## License

MIT
