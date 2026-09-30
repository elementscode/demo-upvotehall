import { Request, Response, NotFoundError } from "@elements/app";
import { posts, myPostVotes } from "#app/shared/services/posts";
import { loadComments, loadProfile } from "./services";
import html from "./template";

export default function route(req: Request, res: Response) {
  let profile = loadProfile(req.params.handle);

  if (!profile) {
    throw new NotFoundError("no such user");
  }

  return new html({
    profile,
    posts: posts.view({ userId: profile.id }, { orderBy: "createdAt desc", limit: 30 }),
    votes: myPostVotes(),
    comments: loadComments(profile.id),
    tab: req.query.tab === "comments" ? "comments" : "posts",
  });
}
