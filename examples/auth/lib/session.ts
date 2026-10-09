import { cookieSession } from "alfa/session";

export const session = cookieSession({
  secret: process.env.APP_SECRET ?? "dev-secret",
});
