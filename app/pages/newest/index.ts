import { Request, Response } from "@elements/app";
import { posts, myPostVotes } from "#app/shared/services/posts";
import html from "./template";

export default function route(req: Request, res: Response) {
  return new html({
    posts: posts.view({}, { orderBy: "createdAt desc", limit: 25 }),
    votes: myPostVotes(),
  });
}
