import { test, assert, sql } from "@elements/app";
import { RankPostsJob } from "./rank-posts";
import { makePost, makeUser } from "#app/shared/testing/fixtures";

function rank(id: string): number {
  return sql<{ rank: number }>(`select rank from posts where id = ${id}`).firstOrThrow().rank;
}

test("rank posts", () => {
  test("with equal votes, the newer post ranks higher", () => {
    let ada = makeUser("ada");
    let fresh = makePost(ada.id, ada.handle, "fresh", 1);
    let stale = makePost(ada.id, ada.handle, "stale", 48);
    sql(`update posts set score = 5 where id in (${fresh.id}, ${stale.id})`);

    new RankPostsJob({}).run();

    assert(rank(fresh.id) > rank(stale.id), `fresh ${rank(fresh.id)} stale ${rank(stale.id)}`);
  });

  test("more votes can beat a small head start", () => {
    let ada = makeUser("ada");
    let popular = makePost(ada.id, ada.handle, "popular", 6);
    let quiet = makePost(ada.id, ada.handle, "quiet", 3);
    sql(`update posts set score = 40 where id = ${popular.id}`);
    sql(`update posts set score = 2 where id = ${quiet.id}`);

    new RankPostsJob({}).run();

    assert(rank(popular.id) > rank(quiet.id));
  });
});
