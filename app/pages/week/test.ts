import { test, equal } from "@elements/app";
import { weekPosts } from "#app/shared/services/posts";
import { makePost, makeUser } from "#app/shared/testing/fixtures";
import { sql } from "@elements/app";
import { thisWeek } from "./template";

test("week page", () => {
  test("keeps the last seven days, best first", () => {
    let ada = makeUser("ada");
    let good = makePost(ada.id, ada.handle, "good", 24);
    let best = makePost(ada.id, ada.handle, "best", 100);
    let ancient = makePost(ada.id, ada.handle, "ancient", 24 * 10);
    sql(`update posts set score = 5 where id = ${good.id}`);
    sql(`update posts set score = 9 where id = ${best.id}`);
    sql(`update posts set score = 50 where id = ${ancient.id}`);

    let view = weekPosts.view({}, { orderBy: ["score desc", "createdAt desc"], limit: 30 });
    equal(thisWeek(view).map((p) => p.title), ["best", "good"]);
  });
});
