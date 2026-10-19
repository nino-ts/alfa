#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * create-alfa — scaffold a new alfa application.
 *
 *   bunx create-alfa myapp
 *   bunx create-alfa myapp --template react
 *   bunx create-alfa myapp --template vue
 *   bunx create-alfa myapp --alfa link:../../alfa/packages/alfa
 *
 * Before the package is on npm, run it from a clone:
 *   bun packages/create-alfa/index.ts myapp
 * or link it globally:
 *   cd packages/create-alfa && bun link && bunx create-alfa myapp
 */
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const projectName = positional[0] ?? "my-alfa-app";

const templateIndex = argv.indexOf("--template");
const template =
  templateIndex >= 0 ? (argv[templateIndex + 1] ?? "hypermedia") : "hypermedia";

const root = path.resolve(projectName);

async function write(relative: string, contents: string): Promise<void> {
  const target = path.join(root, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf8");
}

/**
 * Where does `alfa` come from?
 *
 * The npm name is not published yet, so a scaffold created from a clone points
 * at the local framework instead of the registry. `--alfa <spec>` overrides it.
 */
function resolveAlfaSpec(): { spec: string; local: boolean } {
  const overrideIndex = argv.indexOf("--alfa");
  if (overrideIndex >= 0) {
    const spec = argv[overrideIndex + 1];
    if (spec)
      return {
        spec,
        local: spec.startsWith("file:") || spec.startsWith("link:"),
      };
  }

  // packages/create-alfa -> monorepo root -> packages/alfa
  const here = path.dirname(fileURLToPath(import.meta.url));
  const framework = path.resolve(here, "..", "..", "packages", "alfa");
  if (existsSync(path.join(framework, "package.json"))) {
    // `file:` is a directory dependency; `path.relative` returns an absolute
    // path when the project lives on another drive.
    const relative = path.relative(root, framework);
    const target = path.isAbsolute(relative)
      ? framework
      : relative.split(path.sep).join("/");
    return { spec: `file:${target}`, local: true };
  }

  return { spec: "latest", local: false };
}

const alfa = resolveAlfaSpec();

const dependencies: Record<string, string> = { alfa: alfa.spec };
const devDependencies: Record<string, string> = {
  "@types/bun": "^1.4.2",
  typescript: "^7.0.0",
};

const entryWithHtml = `import { defineApp } from "alfa";
import html from "./index.html";

const api = defineApp({ dir: \`\${import.meta.dir}/pages\` });

Bun.serve({ port: Number(process.env.PORT ?? 3000), development: true, routes: { "/": html }, fetch: api.fetch });
`;

const entryPlain = `import { defineApp } from "alfa";

defineApp({ development: true }).listen(Number(process.env.PORT ?? 3000));
`;

const htmlShell = (script: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/${script}"></script>
  </body>
</html>
`;

await write(
  ".env.example",
  "PORT=3000\nAPP_SECRET=change-me\nDATABASE_URL=sqlite://app.db\n",
);
await write(".gitignore", "node_modules\ndist\n.env\n*.db\n");
await write(
  "pages/api/health.ts",
  "export default () => Response.json({ ok: true });\n",
);

if (template === "react") {
  dependencies.react = "^19.0.0";
  dependencies["react-dom"] = "^19.0.0";
  devDependencies["@types/react"] = "^19.0.0";
  devDependencies["@types/react-dom"] = "^19.0.0";
  await write("index.ts", entryWithHtml);
  await write("index.html", htmlShell("app.tsx"));
  await write(
    "src/app.tsx",
    `import { useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [count, setCount] = useState(0);
  return <button type="button" onClick={() => setCount((c) => c + 1)}>count: {count}</button>;
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
`,
  );
} else if (template === "vue") {
  dependencies.vue = "^3.5.0";
  await write("index.ts", entryWithHtml);
  await write("index.html", htmlShell("app.ts"));
  await write(
    "src/app.ts",
    `import { createApp, h, ref } from "vue";

createApp({
  setup() {
    const count = ref(0);
    return () => h("button", { type: "button", onClick: () => (count.value += 1) }, \`count: \${count.value}\`);
  },
}).mount("#root");
`,
  );
} else {
  await write("index.ts", entryPlain);
  await write(
    "pages/index.ts",
    `export default () => \`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${projectName}</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <h1>${projectName}</h1>
      <button type="button" x-on:click="count++">count: <span x-text="count"></span></button>
    </main>
  </body>
</html>\`;
`,
  );
}

await write(
  "package.json",
  `${JSON.stringify(
    {
      name: projectName,
      private: true,
      type: "module",
      scripts: {
        dev: "bun --watch index.ts",
        start: "bun index.ts",
        migrate: "bunx alfa migrate",
        typecheck: "tsc --noEmit",
        test: "bun test",
      },
      dependencies,
      devDependencies,
    },
    null,
    2,
  )}\n`,
);

await write(
  "tsconfig.json",
  `${JSON.stringify(
    {
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
      include: ["**/*.ts", "**/*.tsx"],
    },
    null,
    2,
  )}\n`,
);

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
if (alfa.local) {
  console.log(`Using the local alfa: ${alfa.spec}`);
}
