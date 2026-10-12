import type { Migration } from "alfa/database";
import { posts } from "../../lib/db";

export default {
  async up() {
    // The table comes from the ORM blueprint — no hand-written SQL.
    await posts.createTable();
  },
  async down() {
    await posts.dropTable();
  },
} satisfies Migration;
