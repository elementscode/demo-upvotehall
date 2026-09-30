import { test, assert, equal, session, AuthError } from "@elements/app";
import { signin, signup } from "./auth";

async function rejects(fn: () => void | Promise<void>): Promise<boolean> {
  try {
    await fn();
  } catch (err) {
    assert(err instanceof AuthError, `got ${err}`);
    return true;
  }

  return false;
}

test("auth", () => {
  test("signup signs the new user in", () => {
    signup("new_user", "New@Example.com", "longenough");
    equal(session.get("userName"), "new_user");
  });

  test("signin", async () => {
    signup("ada", "ada@example.com", "longenough");
    session.logout();

    test("accepts the right password, any case of the username", () => {
      signin("ADA", "longenough");
      equal(session.get("userName"), "ada");
    });

    test("rejects the wrong password", async () => {
      assert(await rejects(() => signin("ada", "wrong password")));
    });
  });

  test("signup rejects a taken username", async () => {
    signup("ada", "ada@example.com", "longenough");
    assert(await rejects(() => signup("Ada", "other@example.com", "longenough")));
  });

  test("signup rejects a short password", async () => {
    assert(await rejects(() => signup("ada", "ada@example.com", "short")));
  });
});
