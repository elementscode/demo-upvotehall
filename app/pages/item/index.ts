import { Request, Response, NotFoundError, sql } from "@elements/app";
import { posts, myPostVotes } from "#app/shared/services/posts";
import { comments, myCommentVotes } from "#app/shared/services/comments";
import html from "./template";

export default function route(req: Request, res: Response) {
  let id = req.params.id;
  let found = /^[0-9a-f-]{36}$/i.test(id) && !sql(`select 1 from posts where id = ${id}`).empty();

  if (!found) {
    throw new NotFoundError("post not found");
  }

  return new html({
    post: posts.view({ id }),
    comments: comments.view({ postId: id }),
    postVotes: myPostVotes(),
    commentVotes: myCommentVotes(id),
  });
}
