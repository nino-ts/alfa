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
  body: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const posts = defineTable<Post>(db, "posts", (table) => {
  table.id();
  table.string("title");
  table.text("body").nullable();
  table.timestamps();
});
