import { eq, type Migration } from "alfa/database";
import { posts } from "../../src/db";

const SEED: Array<{
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
}> = [
  {
    title: "alfa is a Bun-native framework",
    slug: "alfa-is-bun-native",
    excerpt: "Zero runtime dependencies, TypeScript 7, file-system routing.",
    content:
      "alfa ships TypeScript sources. There is no build step for your app and no runtime dependency outside the Bun standard library. Routing is delegated to Bun.FileSystemRouter, so a file in pages/ is a route.",
    published: true,
  },
  {
    title: "The ORM writes the DDL for you",
    slug: "the-orm-writes-the-ddl",
    excerpt: "Describe the table once, get the CREATE TABLE.",
    content:
      "defineTable(db, 'posts', (table) => { table.id(); table.string('title').unique(); }) produces the schema for the running dialect. The migration only calls createTable().",
    published: true,
  },
  {
    title: "Validation without a validation library",
    slug: "validation-without-a-library",
    excerpt: "Standard Schema is the only contract alfa needs.",
    content:
      "alfa validates against the Standard Schema interface, so Zod, Valibot, ArkType and VineJS all work unchanged. This example ships a hand-written schema to show that no dependency is required.",
    published: true,
  },
];

export default {
  async up() {
    // The table comes from the ORM blueprint — no hand-written SQL.
    await posts.createTable();

    for (const seed of SEED) {
      const existing = await posts
        .select()
        .where(eq("slug", seed.slug))
        .first();
      if (!existing) await posts.insert(seed);
    }
  },
  async down() {
    await posts.dropTable();
  },
} satisfies Migration;
