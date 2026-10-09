import type { HttpContext } from "alfa/http";
import { parse, ValidationError } from "alfa/validation";
import { contactSchema } from "../lib/contact-schema";

export default async (ctx: HttpContext) => {
  const form = await ctx.req.formData();
  const data = Object.fromEntries(form);

  try {
    const contact = await parse(contactSchema, data);
    return `<p class="ok">Thanks, ${contact.name}! We'll reply to ${contact.email}.</p>`;
  } catch (error) {
    if (error instanceof ValidationError) {
      const items = error.issues
        .map((issue) => `<li>${issue.message}</li>`)
        .join("");
      return new Response(`<ul class="errors">${items}</ul>`, {
        status: 422,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    throw error;
  }
};
