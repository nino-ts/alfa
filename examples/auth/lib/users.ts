import { hashPassword } from "alfa/auth";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

// Demo store. In a real app this would be `${bun:sqlite}` / Bun.sql.
const users: User[] = [
  {
    id: "1",
    email: "ada@example.com",
    passwordHash: await hashPassword("secret"),
  },
];

export function findByEmail(email: string): User | undefined {
  return users.find((user) => user.email === email);
}

export function findById(id: string): User | undefined {
  return users.find((user) => user.id === id);
}
