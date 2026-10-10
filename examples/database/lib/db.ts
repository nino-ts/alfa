import { defineTable } from "alfa/database";
import { SQL } from "bun";

// Bun.SQL picks the driver from the URL: postgres://, mysql://, sqlite://.
// Default matches examples/database/compose.yaml.
export const db = new SQL(
  process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/alfa",
);

export interface Post {
  id: number;
  title: string;
  body: string;
}

export const posts = defineTable(db, {
  name: "posts",
  columns: { id: "number", title: "string", body: "string" },
});
