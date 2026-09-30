import { test, equal } from "@elements/app";
import { posts } from "#app/shared/services/posts";
import { RankPostsJob } from "#app/jobs/rank-posts";
import { makePost, makeUser } from "#app/shared/testing/fixtures";
import { sql } from "@elements/app";

test("front page", () => {
  test("lists posts by rank", () => {
    // The page lists every post, so start from an empty table; the
    // transaction rolls back and the seed rows come back after the test.
    sql(`delete from posts`);

    let ada = makeUser("ada");
    let old = makePost(ada.id, ada.handle, "old but loved", 30);
    let fresh = makePost(ada.id, ada.handle, "fresh", 1);
    let hot = makePost(ada.id, ada.handle, "hot", 2);
    sql(`update posts set score = 3 where id = ${fresh.id}`);
    sql(`update posts set score = 12 where id = ${hot.id}`);
    sql(`update posts set score = 20 where id = ${old.id}`);

    new RankPostsJob({}).run();

    let view = posts.view({}, { orderBy: "rank desc", limit: 30 });
    equal([...view].map((p) => p.title), ["hot", "fresh", "old but loved"]);
  });
});
