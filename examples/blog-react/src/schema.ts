/**
 * Input schema for posts — a plain Standard Schema (no validation library).
 * Swap in Zod / Valibot / ArkType / VineJS without touching the handlers.
 */
import type {
  StandardSchemaIssue,
  StandardSchemaResult,
  StandardSchemaV1,
} from "alfa/validation";

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
}

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const postSchema: StandardSchemaV1<PostInput> = {
  "~standard": {
    version: 1,
    vendor: "alfa-example",
    validate(value: unknown): StandardSchemaResult<PostInput> {
      const data = (value ?? {}) as Record<string, unknown>;
      const issues: StandardSchemaIssue[] = [];

      const title = typeof data.title === "string" ? data.title.trim() : "";
      const slug = typeof data.slug === "string" ? data.slug.trim() : "";
      const content =
        typeof data.content === "string" ? data.content.trim() : "";
      const excerpt =
        typeof data.excerpt === "string" ? data.excerpt.trim() : "";

      if (title.length < 3) {
        issues.push({
          message: "Title must be at least 3 characters",
          path: ["title"],
        });
      }
      if (!SLUG_PATTERN.test(slug)) {
        issues.push({
          message: "Slug must be lowercase words separated by dashes",
          path: ["slug"],
        });
      }
      if (content.length < 20) {
        issues.push({
          message: "Content must be at least 20 characters",
          path: ["content"],
        });
      }

      if (issues.length > 0) return { issues };
      return {
        value: {
          title,
          slug,
          content,
          excerpt: excerpt === "" ? null : excerpt,
          published: data.published === true,
        },
      };
    },
  },
};
