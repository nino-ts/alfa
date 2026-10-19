/**
 * Database layer — the alfa ORM over Bun.SQL.
 *
 * The table is described with an Eloquent-style blueprint; the migration
 * turns it into real DDL, so no SQL is written by hand.
 */
import { defineTable } from "alfa/database";
import { SQL } from "bun";

export const db = new SQL(process.env.DATABASE_URL ?? "sqlite://blog.db");

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const posts = defineTable<Post>(db, "posts", (table) => {
  table.id();
  table.string("title");
  table.string("slug").unique();
  table.text("excerpt").nullable();
  table.text("content");
  table.boolean("published").default(false);
  table.timestamps();
});
