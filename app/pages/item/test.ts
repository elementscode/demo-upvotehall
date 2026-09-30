import { test, assert, equal, session, sql, AuthError, ForbiddenError } from "@elements/app";
import { postVotes } from "#app/shared/services/posts";
import { commentVotes } from "#app/shared/services/comments";
import { makeComment, makePost, makeUser } from "#app/shared/testing/fixtures";

function score(table: "posts" | "comments", id: string): number {
  return sql<{ score: number }>(`select score from ${sql.raw(table)} where id = ${id}`).firstOrThrow().score;
}

test("item page", () => {
  let ada = makeUser("ada");
  let bob = makeUser("bob");
  let post = makePost(ada.id, ada.handle, "hello");
  let comment = makeComment(post.id, null, ada.id, ada.handle, "first");

  test("upvoting a post and taking it back", () => {
    session.login({ userId: bob.id, userName: bob.handle });
    let votes = postVotes.view({ userId: bob.id });

    votes.insert({ postId: post.id, userId: bob.id });
    equal(score("posts", post.id), 1);

    let reopened = postVotes.view({ userId: bob.id });
    let mine = reopened.find((v) => v.postId === post.id);
    assert(!!mine, "vote missing from the view");
    reopened.delete(mine!);
    equal(score("posts", post.id), 0);
  });

  test("a visitor cannot vote", async () => {
    let threw = false;

    try {
      await postVotes.view({ userId: bob.id }).insertAsync({ postId: post.id, userId: bob.id });
    } catch (err) {
      threw = true;
      assert(err instanceof AuthError, `got ${err}`);
    }

    assert(threw);
  });

  test("upvoting a comment", () => {
    session.login({ userId: bob.id, userName: bob.handle });
    commentVotes.view({ postId: post.id, userId: bob.id }).insert({ commentId: comment.id, userId: bob.id });

    equal(score("comments", comment.id), 1);
  });

  test("nobody votes for their own comment", async () => {
    session.login({ userId: ada.id, userName: ada.handle });
    let threw = false;

    try {
      await commentVotes.view({ postId: post.id, userId: ada.id }).insertAsync({ commentId: comment.id, userId: ada.id });
    } catch (err) {
      threw = true;
      assert(err instanceof ForbiddenError, `got ${err}`);
    }

    assert(threw);
  });
});
