import { defineTable } from "alfa/database";
import { SQL } from "bun";

// Bun.SQL picks the driver from the URL: sqlite://, postgres://, mysql://.
export const db = new SQL(process.env.DATABASE_URL ?? "sqlite://app.db");

export interface Post {
  id: number;
  title: string;
  body: string;
}

export const posts = defineTable(db, {
  name: "posts",
  columns: { id: "number", title: "string", body: "string" },
});
