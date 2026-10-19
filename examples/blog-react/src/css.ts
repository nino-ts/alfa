/**
 * Compiles the Tailwind stylesheet (shadcn/ui theme + app styles) into
 * `public/styles.css`, which alfa serves as a static file.
 */
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import tailwind from "bun-plugin-tailwind";

export async function buildCss(): Promise<string> {
  const outdir = path.join(process.cwd(), "public");
  await mkdir(outdir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [path.join(process.cwd(), "src", "index.css")],
    outdir,
    plugins: [tailwind],
    minify: process.env.NODE_ENV === "production",
    target: "browser",
  });

  const output = result.outputs[0];
  if (!output) throw new Error("Tailwind build produced no output");

  const target = path.join(outdir, "styles.css");
  if (path.resolve(output.path) !== path.resolve(target)) {
    await Bun.write(target, Bun.file(output.path));
    await rm(output.path, { force: true });
  }
  return target;
}
