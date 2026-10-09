import type { HttpContext } from "alfa/http";
import { redirect } from "alfa/http";
import { session } from "../lib/session";

export default async (ctx: HttpContext) => {
  await session.destroy(ctx);
  return redirect("/");
};
