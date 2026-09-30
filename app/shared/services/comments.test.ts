import { test, assert, equal, session, sql } from "@elements/app";
import { Comment, childrenOf, comments, descendantCount, postComment } from "./comments";
import { makeComment, makePost, makeUser } from "#app/shared/testing/fixtures";

function row(id: string, parentId: string | null, minutes: number): Comment {
  return {
    id,
    parentId,
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, minutes)),
    postId: "p",
    userId: "u",
    userName: "u",
    body: id,
    score: 0,
  };
}

test("comments", () => {
  test("threading", () => {
    let rows = [row("b", null, 2), row("a", null, 1), row("a1", "a", 3), row("a1x", "a1", 4), row("a2", "a", 5)];

    equal(childrenOf(rows, null).map((c) => c.id), ["a", "b"]);
    equal(childrenOf(rows, "a").map((c) => c.id), ["a1", "a2"]);
    equal(descendantCount(rows, "a"), 3);
    equal(descendantCount(rows, "b"), 0);
  });

  test("triggers count comments and comment votes", () => {
    let ada = makeUser("ada");
    let bob = makeUser("bob");
    let post = makePost(ada.id, ada.handle, "hello");
    let top = makeComment(post.id, null, bob.id, bob.handle, "first");
    makeComment(post.id, top.id, ada.id, ada.handle, "reply");

    let count = sql<{ commentCount: number }>(`select commentCount from posts where id = ${post.id}`).firstOrThrow();
    equal(count.commentCount, 2);

    sql(`insert into commentVotes (postId, commentId, userId) values (${post.id}, ${top.id}, ${ada.id})`);
    let voted = sql<{ score: number }>(`select score from comments where id = ${top.id}`).firstOrThrow();
    equal(voted.score, 1);
  });

  test("a reply through the view is stored and schedules its notification", () => {
    let ada = makeUser("ada");
    let bob = makeUser("bob");
    let post = makePost(ada.id, ada.handle, "hello");
    let top = makeComment(post.id, null, ada.id, ada.handle, "first");

    session.login({ userId: bob.id, userName: bob.handle });
    postComment(comments.view({ postId: post.id }), top.id, "a reply");

    let stored = sql<{ id: string; userName: string; parentId: string }>(`
      select id, userName, parentId from comments where body = 'a reply'
    `).first();

    assert(!!stored, "reply not stored");
    equal(stored?.userName, "bob");
    equal(stored?.parentId, top.id);

    let job = sql(`
      select 1 from elements.jobs
       where path like '%ReplyNotificationJob'
         and fields->>'commentId' = ${stored?.id ?? ""}
    `);
    assert(!job.empty(), "no notification job");
  });
});
