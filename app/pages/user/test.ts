import { test, equal, sql } from "@elements/app";
import { loadComments, loadProfile } from "./services";
import { makeComment, makePost, makeUser } from "#app/shared/testing/fixtures";

test("user page", () => {
  let ada = makeUser("ada");
  let bob = makeUser("bob");
  let cy = makeUser("cy");
  let post = makePost(ada.id, ada.handle, "hello");
  let comment = makeComment(post.id, null, ada.id, ada.handle, "a comment");

  sql(`insert into postVotes (postId, userId) values (${post.id}, ${ada.id}), (${post.id}, ${bob.id}), (${post.id}, ${cy.id})`);
  sql(`insert into commentVotes (postId, commentId, userId) values (${post.id}, ${comment.id}, ${bob.id})`);

  test("karma counts other people's votes only", () => {
    equal(loadProfile("ada")?.karma, 3);
    equal(loadProfile("bob")?.karma, 0);
  });

  test("handles match in any case", () => {
    equal(loadProfile("ADA")?.id, ada.id);
    equal(loadProfile("nobody"), undefined);
  });

  test("lists the user's comments with the post title", () => {
    let rows = loadComments(ada.id);

    equal(rows.length, 1);
    equal(rows[0].postTitle, "hello");
  });
});
