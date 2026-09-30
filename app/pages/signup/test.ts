import { test, equal, session, sql } from "@elements/app";
import { signup } from "#app/shared/services/auth";

test("signup page", () => {
  test("stores the email lowercased for reply notifications", () => {
    signup("grace", "  Grace@Example.COM ", "longenough");

    let row = sql<{ email: string }>(`select email from users where handle = 'grace'`).firstOrThrow();
    equal(row.email, "grace@example.com");
    equal(session.get("userName"), "grace");
  });
});
