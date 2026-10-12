import { defineTable } from "alfa/database";
import { SQL } from "bun";

// Bun.SQL picks the driver from the URL: postgres://, mysql://, sqlite://.
// Default matches examples/auth/compose.yaml.
export const db = new SQL(
  process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/alfa",
);

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  createdAt?: string;
  updatedAt?: string;
}

export const users = defineTable<User>(db, "users", (table) => {
  table.id();
  table.string("email").unique();
  table.string("passwordHash");
  table.timestamps();
});
