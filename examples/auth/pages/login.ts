import { verifyPassword } from "alfa/auth";
import type { HttpContext } from "alfa/http";
import { redirect, text } from "alfa/http";
import { session } from "../lib/session";
import { findByEmail } from "../lib/users";

export default async (ctx: HttpContext) => {
  if (ctx.req.method.toUpperCase() === "GET") {
    return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>login</title></head>
  <body>
    <h1>Login</h1>
    <form method="post" action="/login">
      <p><input name="email" type="email" placeholder="ada@example.com" autofocus /></p>
      <p><input name="password" type="password" placeholder="password" /></p>
      <button type="submit">Sign in</button>
    </form>
    <p>Try <code>ada@example.com</code> / <code>secret</code>.</p>
  </body>
</html>`;
  }

  const form = await ctx.req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const user = findByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return text("Invalid credentials", { status: 401 });
  }

  session.set(ctx, "userId", user.id);
  return redirect("/dashboard");
};
