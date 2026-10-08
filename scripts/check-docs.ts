/**
 * Checks that every alfa/* subpath referenced in docs/ actually exists in
 * packages/alfa/package.json exports. Run: bun run verify:docs
 */
import { readdir, readFile } from "node:fs/promises";

interface PackageJson {
  exports: Record<string, string>;
}

const pkg = JSON.parse(
  await readFile(
    new URL("../packages/alfa/package.json", import.meta.url),
    "utf8",
  ),
) as PackageJson;

// normalize "./http" -> "alfa/http"; "." -> "alfa"
const exported = new Set(
  Object.keys(pkg.exports).map((key) =>
    key === "." ? "alfa" : `alfa/${key.replace(/^\.\//, "")}`,
  ),
);

const modules = new Set<string>();
for (const key of exported) {
  const sub = key.replace(/^alfa\/?/, "");
  if (sub) modules.add(sub);
}

const docsDir = new URL("../docs/", import.meta.url);
const files = (await readdir(docsDir)).filter(
  (f) => f.endsWith(".md") || f.endsWith(".txt"),
);

const referenced = new Map<string, Set<string>>();

// only specifiers that appear in import/export/require positions or code fences
const importPattern =
  /(?:from|import|require\()\s*["']alfa(?:\/([a-z][a-z0-9]*))?["']/g;
// prose mentions like `alfa/http` in backticks
const prosePattern = /`alfa\/([a-z][a-z0-9]*)`/g;

for (const file of files) {
  const content = await readFile(new URL(file, docsDir), "utf8");
  for (const pattern of [importPattern, prosePattern]) {
    for (const match of content.matchAll(pattern)) {
      const subpath = match[1];
      if (!subpath) continue;
      const set = referenced.get(subpath) ?? new Set<string>();
      set.add(file);
      referenced.set(subpath, set);
    }
  }
}

let failures = 0;

for (const [subpath, sources] of [...referenced].sort()) {
  const specifier = `alfa/${subpath}`;
  if (exported.has(specifier)) {
    console.log(`ok    ${specifier}  (${[...sources].join(", ")})`);
  } else {
    failures++;
    console.error(
      `FAIL  ${specifier} not exported — referenced in ${[...sources].join(", ")}`,
    );
  }
}

for (const subpath of [...modules].sort()) {
  if (!referenced.has(subpath)) {
    console.log(`note  alfa/${subpath} exported but not documented`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} referenced subpath(s) missing from exports`);
  process.exit(1);
}

console.log("\nall documented alfa/* subpaths exist in exports");
