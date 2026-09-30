import { test, equal, session, sql } from "@elements/app";
import { posts, submitPost } from "#app/shared/services/posts";
import { makeUser } from "#app/shared/testing/fixtures";

test("submit page", () => {
  test("a text post shows up on the newest page", () => {
    let ada = makeUser("ada");
    session.login({ userId: ada.id, userName: ada.handle });

    let id = submitPost({ title: "Ask: favourite editor?", url: "", body: "go" });

    let view = posts.view({}, { orderBy: "createdAt desc", limit: 30 });
    equal(view.at(0)?.id, id);
    equal(view.at(0)?.url, null);
    equal(sql<{ n: number }>(`select count(*)::int as n from postVotes where postId = ${id}`).firstOrThrow().n, 1);
  });
});
