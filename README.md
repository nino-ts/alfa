# alfa

Framework backend **TypeScript 7** para **Bun**. Zero dependências de runtime fora das APIs nativas do Bun.

## Repositório

Este repo publica **apenas 2 pacotes** no npm:

| Pacote | Papel |
|---|---|
| [`alfa`](./packages/alfa) | Framework (bin `alfa` + módulos `alfa/*`) |
| [`create-alfa`](./packages/create-alfa) | Scaffolder (`bunx create-alfa`) |

## Layout

```
alfa/
├── packages/
│   ├── alfa/              # publica "alfa"        → bin alfa, src/{http,routing,database,...}
│   └── create-alfa/       # publica "create-alfa" → bin create-alfa
├── templates/
│   └── default/           # app base (HTMX/Alpine em pages/*.html)
├── examples/
│   ├── hypermedia/        # HTMX + Alpine
│   └── react-fullstack/   # pages/*.tsx + Bun.FileSystemRouter
├── docs/                  # guias de consumo + llms.txt
├── .github/workflows/     # ci.yml + publish.yml (OIDC)
└── package.json           # workspaces + import map #alfa/*
```

## Requisitos

- **Bun >= 1.4** (runtime + package manager). Node/npm/yarn/pnpm não suportados.
- **TypeScript 7.x** (`peerDependencies`), fontes `.ts` servidas diretamente (`noEmit`).

## Desenvolvimento local (sem publicar)

```bash
# 1) instalar do workspace
bun install

# 2) linkar o framework globalmente (modo de desenvolvimento)
cd packages/alfa && bun link
cd ../create-alfa && bun link

# 3) usar em um app
cd /caminho/do/meu/app
bun link alfa
bun install
bun run dev
```

Alternativa sem link global: `bun add link:/caminho/para/alfa/packages/alfa`.

## Scripts

```bash
bun test          # 61 testes
bun run typecheck # tsc --noEmit
bun run lint      # biome check
```

## Convenções

- Import interno do monorepo: `#alfa` e `#alfa/<modulo>` (subpath imports, sem sub-subpaths).
- API pública: `alfa` (barrel + `defineApp`) e `alfa/<modulo>`.
- `views/` não existe: o diretório de páginas é `pages/`.
- Zero `any`, zero suppressions (`biome-ignore`, `@ts-ignore`, `@ts-expect-error`).
- Tudo que o Bun já oferece (`Bun.serve`, `Bun.sql`, `Bun.redis`, `Bun.password`, `Bun.CSRF`, `Bun.CookieMap`, `Bun.FileSystemRouter`) é usado direto — o framework não reimplementa.

## Licença

MIT