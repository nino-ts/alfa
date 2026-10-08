#!/usr/bin/env bun
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * create-alfa — scaffold a new alfa application.
 *
 * Usage:
 *   bunx create-alfa myapp
 *   bunx create-alfa myapp --template hypermedia|react
 */
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
const positional = argv.filter((a) => !a.startsWith("--"));

const projectName = positional[0] ?? "my-alfa-app";
const template = flags.has("--template")
  ? (positional[1] ?? "hypermedia")
  : "hypermedia";
const root = path.resolve(projectName);

async function write(relative: string, contents: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

const packageJson = {
  name: projectName,
  private: true,
  type: "module",
  scripts: {
    dev: "alfa dev",
    serve: "alfa serve",
    migrate: "alfa migrate",
    typecheck: "tsc --noEmit",
    test: "bun test",
  },
  dependencies: {
    alfa: "latest",
  },
  devDependencies: {
    "@types/bun": "^1.4.2",
    typescript: "^7.0.0",
  },
};

const entryTs = `import { defineApp } from "alfa";
import { registerRoutes } from "./routes";

const app = defineApp({
  routes: (router) => registerRoutes(router),
});

app.listen(Number(process.env.PORT ?? 3000));
`;

const routesTs = `import { http } from "alfa";
import type { Router } from "alfa/routing";

export function registerRoutes(router: Router): void {
  router
    .get("/api/health", () => http.json({ ok: true }))
    .name("health");
}
`;

const tsconfig = {
  compilerOptions: {
    lib: ["ESNext"],
    target: "ESNext",
    module: "Preserve",
    moduleResolution: "bundler",
    moduleDetection: "force",
    allowImportingTsExtensions: false,
    verbatimModuleSyntax: true,
    noEmit: true,
    strict: true,
    noUncheckedIndexedAccess: true,
    skipLibCheck: true,
    types: ["bun"],
  },
  include: ["**/*.ts"],
};

await write("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
await write("tsconfig.json", `${JSON.stringify(tsconfig, null, 2)}\n`);
await write("index.ts", entryTs);
await write("routes.ts", routesTs);
await write(
  ".env.example",
  "PORT=3000\nDATABASE_URL=sqlite://app.db\nAPP_SECRET=change-me\n",
);
await write(".gitignore", "node_modules\ndist\n.env\n*.db\n");

if (template === "react") {
  await write(
    "pages/index.tsx",
    `export default function Home() {\n  return <main><h1>alfa + React</h1></main>;\n}\n`,
  );
} else {
  await write(
    "pages/index.html",
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>alfa</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <h1>alfa</h1>
      <button type="button" x-on:click="count++">count: <span x-text="count"></span></button>
    </main>
  </body>
</html>
`,
  );
}

await write(
  "README.md",
  `# ${projectName}

Created with \`create-alfa\` (template: ${template}).

\`\`\`bash
bun install
bun run dev
\`\`\`
`,
);

console.log(`Created alfa app "${projectName}" at ${root}`);
console.log(`Next: cd ${projectName} && bun install && bun run dev`);
