import { expect, test } from "bun:test";
import { SQL } from "bun";
import {
  createTableSQL,
  type Dialect,
  defineTable,
  dropTableSQL,
  eq,
} from "#alfa/database";

function posts(dialect: "sqlite" | "postgres" | "mysql") {
  const url =
    dialect === "sqlite"
      ? "sqlite://:memory:"
      : `postgres://u:p@localhost:5432/db`;
  const db =
    dialect === "mysql"
      ? new SQL("mysql://u:p@localhost:3306/db")
      : new SQL(url);
  return defineTable(db, "posts", (table) => {
    table.id();
    table.string("email").unique();
    table.string("name");
    table.text("body").nullable();
    table.boolean("published").default(false);
    table.timestamps();
  });
}

test("captures the blueprint as column definitions", () => {
  const table = posts("sqlite");
  expect(table.columns.map((c) => c.name)).toEqual([
    "id",
    "email",
    "name",
    "body",
    "published",
    "createdAt",
    "updatedAt",
  ]);
  expect(table.columns[0]).toMatchObject({
    type: "id",
    primary: true,
    autoIncrement: true,
  });
  expect(table.columns[1]).toMatchObject({ type: "string", unique: true });
  expect(table.columns[3]).toMatchObject({ type: "text", nullable: true });
  expect(table.columns[4]).toMatchObject({
    type: "boolean",
    defaultValue: false,
  });
});

test("createTableSQL for sqlite", () => {
  const table = posts("sqlite");
  expect(createTableSQL("sqlite", table.name, table.columns)).toBe(
    'CREATE TABLE IF NOT EXISTS "posts" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "email" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "body" TEXT, "published" INTEGER NOT NULL DEFAULT 0, "createdAt" TEXT, "updatedAt" TEXT)',
  );
});

test("createTableSQL for postgres", () => {
  const table = posts("postgres");
  expect(createTableSQL("postgres", table.name, table.columns)).toBe(
    'CREATE TABLE IF NOT EXISTS "posts" ("id" SERIAL PRIMARY KEY, "email" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "body" TEXT, "published" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ)',
  );
});

test("createTableSQL for mysql", () => {
  const table = posts("mysql");
  expect(createTableSQL("mysql", table.name, table.columns)).toBe(
    "CREATE TABLE IF NOT EXISTS `posts` (`id` INT AUTO_INCREMENT, `email` VARCHAR(255) NOT NULL UNIQUE, `name` VARCHAR(255) NOT NULL, `body` TEXT, `published` TINYINT(1) NOT NULL DEFAULT 0, `createdAt` TIMESTAMP, `updatedAt` TIMESTAMP, PRIMARY KEY (`id`))",
  );
});

test("uuid primary key is not autoincrementing", () => {
  const db = new SQL("sqlite://:memory:");
  const table = defineTable(db, "sessions", (t) => {
    t.uuid("token").primary();
    t.string("payload");
  });
  expect(createTableSQL("sqlite", table.name, table.columns)).toBe(
    'CREATE TABLE IF NOT EXISTS "sessions" ("token" TEXT PRIMARY KEY, "payload" TEXT NOT NULL)',
  );
});

test("dropTableSQL quotes per dialect", () => {
  const dialects: Dialect[] = ["sqlite", "postgres", "mysql"];
  expect(dialects.map((d) => dropTableSQL(d, "posts"))).toEqual([
    'DROP TABLE IF EXISTS "posts"',
    'DROP TABLE IF EXISTS "posts"',
    "DROP TABLE IF EXISTS `posts`",
  ]);
});

test("createTable() + insert + select against sqlite", async () => {
  const db = new SQL("sqlite://:memory:");
  const table = defineTable(db, "notes", (t) => {
    t.id();
    t.string("title");
    t.text("body").nullable();
    t.boolean("done").default(false);
    t.timestamps();
  });

  await table.createTable();
  await table.insert({ title: "hello", body: "world", done: true });

  const rows = await table.select().where(eq("title", "hello")).get();
  expect(rows.length).toBe(1);
  expect(rows[0]?.title).toBe("hello");
  // No cast layer: SQLite round-trips the boolean as 1.
  expect(Boolean(rows[0]?.done)).toBe(true);

  await table.dropTable();
  await db.close();
});
