import { test, equal } from "@elements/app";
import { posts } from "#app/shared/services/posts";
import { makePost, makeUser } from "#app/shared/testing/fixtures";

test("newest page", () => {
  test("lists posts newest first, one page at a time", () => {
    let ada = makeUser("ada");

    for (let i = 0; i < 3; i++) {
      makePost(ada.id, ada.handle, `post ${i}`, i);
    }

    let view = posts.view({}, { orderBy: "createdAt desc", limit: 2 });
    equal([...view].map((p) => p.title), ["post 0", "post 1"]);
    equal(view.hasMore, true);
  });
});
