import { hashPassword } from "alfa/auth";
import { eq, type Migration } from "alfa/database";
import { users } from "../../lib/db";

const DEMO_EMAIL = "ada@example.com";
const DEMO_PASSWORD = "secret";

export default {
  async up() {
    // The table comes from the ORM blueprint — no hand-written SQL.
    await users.createTable();

    const existing = await users
      .select()
      .where(eq("email", DEMO_EMAIL))
      .first();
    if (!existing) {
      await users.insert({
        email: DEMO_EMAIL,
        passwordHash: await hashPassword(DEMO_PASSWORD),
      });
    }
  },
  async down() {
    await users.dropTable();
  },
} satisfies Migration;
