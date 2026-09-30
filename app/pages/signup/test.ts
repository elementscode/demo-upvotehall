import { test, equal, session, sql } from "@elements/app";
import { signup } from "#app/shared/services/auth";
import { uniqueHandle } from "#app/shared/testing/fixtures";

test("signup page", () => {
  test("stores the email lowercased for reply notifications", () => {
    let grace = uniqueHandle("grace");
    signup(grace, `  Grace_${grace}@Example.COM `, "longenough");

    let row = sql<{ email: string }>(`select email from users where handle = ${grace}`).firstOrThrow();
    equal(row.email, `grace_${grace}@example.com`);
    equal(session.get("userName"), grace);
  });
});
