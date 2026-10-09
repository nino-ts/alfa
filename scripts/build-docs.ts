/**
 * Regenerates docs/llms-full.txt from every docs/*.md page, in the order
 * declared in PAGES. Run: bun run docs:build
 */
import { readFile, writeFile } from "node:fs/promises";

const PAGES = [
  "index.md",
  "getting-started.md",
  "http.md",
  "routing.md",
  "database.md",
  "validation.md",
  "auth.md",
  "session.md",
  "frontend-stacks.md",
  "cli.md",
  "deployment.md",
] as const;

const docsDir = new URL("../docs/", import.meta.url);

const header = [
  "# alfa — documentação completa",
  "",
  "> Corpus único de todas as páginas do framework alfa (TypeScript 7 para Bun).",
  "> Índice navegável: llms.txt",
  "",
].join("\n");

const sections: string[] = [];
for (const page of PAGES) {
  const body = (await readFile(new URL(page, docsDir), "utf8")).trimEnd();
  sections.push(`---\n\n${body}\n`);
}

const output = `${header}\n${sections.join("\n")}`;
await writeFile(new URL("llms-full.txt", docsDir), output, "utf8");

console.log(
  `llms-full.txt written (${PAGES.length} pages, ${output.split("\n").length} lines)`,
);
