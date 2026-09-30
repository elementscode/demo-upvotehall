import { Request, Response } from "@elements/app";
import { weekPosts, myPostVotes } from "#app/shared/services/posts";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({
    posts: weekPosts.view({}, { orderBy: ["score desc", "createdAt desc"], limit: 25 }),
    votes: myPostVotes(),
  });
}
