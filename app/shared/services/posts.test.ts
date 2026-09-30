import { test, assert, equal, session, sql, AuthError, ValidationError } from "@elements/app";
import { domainOf, submitPost, validateSubmission } from "./posts";
import { makePost, makeUser } from "#app/shared/testing/fixtures";

function score(postId: string): number {
  return sql<{ score: number }>(`select score from posts where id = ${postId}`).firstOrThrow().score;
}

test("posts", () => {
  test("validateSubmission", () => {
    test("accepts a link", () => {
      let form = validateSubmission({ title: "  A title  ", url: "https://example.com/x", body: "" });
      equal(form.title, "A title");
    });

    test("accepts a text post", () => {
      let form = validateSubmission({ title: "Ask: anything", url: "", body: "some text" });
      equal(form.body, "some text");
    });

    test("rejects a post with neither link nor text", () => {
      let threw = false;

      try {
        validateSubmission({ title: "t", url: "", body: "  " });
      } catch (err) {
        threw = true;
        assert(err instanceof ValidationError, `got ${err}`);
      }

      assert(threw);
    });

    test("rejects a link that is not http", () => {
      let threw = false;

      try {
        validateSubmission({ title: "t", url: "ftp://example.com", body: "" });
      } catch (err) {
        threw = true;
        assert(err instanceof ValidationError, `got ${err}`);
      }

      assert(threw);
    });
  });

  test("domainOf", () => {
    equal(domainOf("https://www.example.com/a/b"), "example.com");
    equal(domainOf(null), "");
    equal(domainOf("not a url"), "");
  });

  test("submitPost", () => {
    test("needs a signed-in user", () => {
      let threw = false;

      try {
        submitPost({ title: "t", url: "https://example.com", body: "" });
      } catch (err) {
        threw = true;
        assert(err instanceof AuthError, `got ${err}`);
      }

      assert(threw);
    });

    test("stores the post with its author's vote and a rank", () => {
      let ada = makeUser("ada");
      session.login({ userId: ada.id, userName: ada.handle });

      let id = submitPost({ title: "Show: a thing", url: "https://example.com/thing", body: "" });
      let row = sql<{ userName: string; score: number; rank: number; url: string }>(`
        select userName, score, rank, url from posts where id = ${id}
      `).firstOrThrow();

      equal(row.userName, "ada");
      equal(row.score, 1);
      equal(row.url, "https://example.com/thing");
      assert(row.rank > 0, `rank ${row.rank}`);
    });
  });

  test("vote triggers keep the score", () => {
    let ada = makeUser("ada");
    let bob = makeUser("bob");
    let post = makePost(ada.id, ada.handle, "hello");

    sql(`insert into postVotes (postId, userId) values (${post.id}, ${bob.id})`);
    equal(score(post.id), 1);

    sql(`delete from postVotes where postId = ${post.id} and userId = ${bob.id}`);
    equal(score(post.id), 0);
  });
});
