import type {
  StandardSchemaIssue,
  StandardSchemaResult,
  StandardSchemaV1,
} from "alfa/validation";

export interface Contact {
  name: string;
  email: string;
  message: string;
}

/**
 * A hand-written Standard Schema — no validation library required.
 * Any library (Zod, Valibot, ArkType, VineJS) can be swapped in unchanged.
 */
export const contactSchema: StandardSchemaV1<Contact> = {
  "~standard": {
    version: 1,
    vendor: "alfa-example",
    validate(value: unknown): StandardSchemaResult<Contact> {
      const data = (value ?? {}) as Record<string, unknown>;
      const issues: StandardSchemaIssue[] = [];

      const name = typeof data.name === "string" ? data.name.trim() : "";
      const email = typeof data.email === "string" ? data.email.trim() : "";
      const message =
        typeof data.message === "string" ? data.message.trim() : "";

      if (name.length < 2) {
        issues.push({
          message: "Name must be at least 2 characters",
          path: ["name"],
        });
      }
      if (!email.includes("@")) {
        issues.push({ message: "Email is invalid", path: ["email"] });
      }
      if (message.length < 10) {
        issues.push({
          message: "Message must be at least 10 characters",
          path: ["message"],
        });
      }

      if (issues.length > 0) return { issues };
      return { value: { name, email, message } };
    },
  },
};
