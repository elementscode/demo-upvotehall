import {
  LiveTable,
  LiveView,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  redirect,
  session,
  sql,
  tx,
} from "@elements/app";
import { ReplyNotificationJob } from "#app/jobs/reply-notification";

export interface Comment {
  id: string;
  createdAt: Date;
  postId: string;
  parentId: string | null;
  userId: string;
  userName: string;
  body: string;
  score: number;
}

export interface CommentVote {
  id: string;
  postId: string;
  commentId: string;
  userId: string;
}

export const MAX_COMMENT = 5000;

/**
 * Score changes are written by a trigger on commentVotes, and the notify
 * trigger in the schema migration broadcasts them. New comments go through
 * the view, which broadcasts them itself.
 */
export let comments: LiveTable<Comment> = new LiveTable<Comment>({
  insert: (item) => {
    session.isLoggedInOrThrow();

    let body = (item.body ?? "").trim();

    if (!body) {
      throw new ValidationError("write something first");
    }

    if (body.length > MAX_COMMENT) {
      throw new ValidationError(`comments are at most ${MAX_COMMENT} characters`);
    }

    if (sql(`select 1 from posts where id = ${item.postId}`).empty()) {
      throw new NotFoundError("post not found");
    }

    if (item.parentId && sql(`select 1 from comments where id = ${item.parentId} and postId = ${item.postId}`).empty()) {
      throw new NotFoundError("that comment is gone");
    }

    return tx(() => {
      let row = comments.insert({
        id: item.id,
        postId: item.postId,
        parentId: item.parentId ?? null,
        userId: session.getOrThrow("userId"),
        userName: session.getOrThrow("userName"),
        body,
      });

      new ReplyNotificationJob({ commentId: row.id }).schedule();

      return row;
    });
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: () => {
    throw new ForbiddenError();
  },
});

export let commentVotes: LiveTable<CommentVote> = new LiveTable<CommentVote>({
  insert: (item) => {
    session.isLoggedInOrThrow();

    let userId = session.getOrThrow("userId");
    let own = !sql(`select 1 from comments where id = ${item.commentId} and userId = ${userId}`).empty();

    if (own) {
      throw new ForbiddenError("you cannot vote for your own comment");
    }

    return commentVotes.insert({ ...item, userId });
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: (item) => {
    session.isLoggedInOrThrow();

    if (item.userId !== session.getOrThrow("userId")) {
      throw new ForbiddenError();
    }

    return commentVotes.delete(item);
  },
});

/** The signed-in reader's votes on one post's comments, or null for a visitor. */
export function myCommentVotes(postId: string): LiveView<CommentVote> | null {
  if (!session.isLoggedIn()) {
    return null;
  }

  return commentVotes.view({ postId, userId: session.getOrThrow("userId") });
}

export function toggleCommentVote(votes: LiveView<CommentVote> | null, commentId: string) {
  if (!votes) {
    redirect("/signin");
    return;
  }

  let mine = votes.find((v) => v.commentId === commentId);

  if (mine) {
    votes.delete(mine);
  } else {
    votes.insert({ commentId, userId: session.getOrThrow("userId") });
  }
}

export function hasVotedComment(votes: LiveView<CommentVote> | null, commentId: string): boolean {
  return !!votes?.find((v) => v.commentId === commentId);
}

export function postComment(
  view: LiveView<Comment>,
  parentId: string | null,
  body: string,
  onSent?: () => void,
) {
  view.insert(
    {
      parentId,
      userId: session.getOrThrow("userId"),
      userName: session.getOrThrow("userName"),
      body,
      score: 0,
      createdAt: new Date(),
    },
    onSent,
  );
}

/** Replies to a comment, or the top-level comments when parentId is null, oldest first. */
export function childrenOf(all: Iterable<Comment>, parentId: string | null): Comment[] {
  return [...all]
    .filter((c) => (c.parentId ?? null) === parentId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function descendantCount(all: Iterable<Comment>, id: string): number {
  let rows = [...all];
  let count = 0;
  let frontier = [id];

  while (frontier.length > 0) {
    let next = rows.filter((c) => c.parentId !== null && frontier.includes(c.parentId));
    count += next.length;
    frontier = next.map((c) => c.id);
  }

  return count;
}
