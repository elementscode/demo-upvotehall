import { Email, Job, sql } from "@elements/app";
import ReplyEmail from "#app/emails/reply";

export interface ReplyNotificationJobFields {
  commentId: string;
}

interface Reply {
  id: string;
  postId: string;
  postTitle: string;
  body: string;
  userName: string;
  parentBody: string | null;
  toUserId: string;
  toEmail: string;
  toHandle: string;
  fromUserId: string;
}

/**
 * The email for a new comment, addressed to the author of whatever it replies
 * to: the parent comment's author, or the post's author for a top-level
 * comment. Null when there is nobody to tell, which includes replying to
 * yourself.
 */
export function replyEmailFor(commentId: string): Email | null {
  let reply = sql<Reply>(`
    select c.id,
           c.postId,
           p.title as postTitle,
           c.body,
           c.userName,
           parent.body as parentBody,
           u.id as toUserId,
           u.email as toEmail,
           u.handle as toHandle,
           c.userId as fromUserId
      from comments c
      join posts p on p.id = c.postId
      left join comments parent on parent.id = c.parentId
      join users u on u.id = coalesce(parent.userId, p.userId)
     where c.id = ${commentId}
  `).first();

  if (!reply || reply.toUserId === reply.fromUserId) {
    return null;
  }

  return new Email({
    to: reply.toEmail,
    subject: `${reply.userName} replied to you on "${reply.postTitle}"`,
    body: new ReplyEmail({
      toHandle: reply.toHandle,
      fromHandle: reply.userName,
      postTitle: reply.postTitle,
      parentBody: reply.parentBody,
      body: reply.body,
      link: `/item/${reply.postId}#c-${reply.id}`,
    }),
  });
}

export class ReplyNotificationJob extends Job<ReplyNotificationJobFields> {
  static maxAttempts = 5;

  run() {
    replyEmailFor(this.fields.commentId)?.send();
  }
}
