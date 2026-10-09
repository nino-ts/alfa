import { defineApp } from "alfa";
import { session } from "./lib/session";

// The session middleware writes/reads the signed cookie for every route.
defineApp({ middleware: [session.middleware] }).listen(
  Number(process.env.PORT ?? 3000),
);
