import { test, assert, equal } from "@elements/app";
import { replyEmailFor } from "./reply-notification";
import { makeComment, makePost, makeUser } from "#app/shared/testing/fixtures";

test("reply notification", () => {
  let ada = makeUser("ada");
  let bob = makeUser("bob");
  let post = makePost(ada.id, ada.handle, "Why indexes");

  test("a top-level comment emails the post's author", () => {
    let c = makeComment(post.id, null, bob.id, bob.handle, "nice post");
    let mail = replyEmailFor(c.id);

    equal(mail?.to, ["ada@example.com"]);
    assert(mail?.subject.includes("bob replied") ?? false, `subject ${mail?.subject}`);
    assert(mail?.text.includes("nice post") ?? false, "body missing from text");
  });

  test("a reply emails the parent comment's author", () => {
    let parent = makeComment(post.id, null, bob.id, bob.handle, "first");
    let reply = makeComment(post.id, parent.id, ada.id, ada.handle, "thanks");

    equal(replyEmailFor(reply.id)?.to, ["bob@example.com"]);
  });

  test("replying to yourself sends nothing", () => {
    let c = makeComment(post.id, null, ada.id, ada.handle, "my own post");

    equal(replyEmailFor(c.id), null);
  });
});
