import { hashPassword } from "alfa/auth";
import { eq } from "alfa/database";
import { type User, users } from "./db";

export type { User };

export async function createUser(
  email: string,
  password: string,
): Promise<User> {
  const [user] = await users.insert({
    email,
    passwordHash: await hashPassword(password),
  });
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function findByEmail(email: string): Promise<User | undefined> {
  return users.select().where(eq("email", email)).first();
}

export async function findById(id: number): Promise<User | undefined> {
  return users.select().where(eq("id", id)).first();
}
