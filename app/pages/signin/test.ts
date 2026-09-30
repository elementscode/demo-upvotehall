import { test, assert, equal } from "@elements/app";
import { SEED_HANDLES, SEED_PASSWORD, MIN_PASSWORD } from "#app/shared/services/auth";

test("signin page", () => {
  test("lists the eight seeded accounts", () => {
    equal(new Set(SEED_HANDLES).size, 8);
  });

  test("the seeded password would pass signup's rule", () => {
    assert(SEED_PASSWORD.length >= MIN_PASSWORD);
  });
});
