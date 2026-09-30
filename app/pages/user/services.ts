import { sql } from "@elements/app";
import type { Profile, UserComment } from "./template";

/**
 * Karma counts the votes other people gave a user's posts and comments. The
 * author's own vote on their submission does not count.
 */
export function loadProfile(handle: string): Profile | undefined {
  return sql<Profile>(`
    select u.id,
           u.handle,
           u.about,
           u.createdAt,
           (select count(*)::int
              from postVotes v
              join posts p on p.id = v.postId
             where p.userId = u.id and v.userId <> u.id)
         + (select count(*)::int
              from commentVotes v
              join comments c on c.id = v.commentId
             where c.userId = u.id and v.userId <> u.id) as karma
      from users u
     where lower(u.handle) = lower(${handle})
  `).first();
}

export function loadComments(userId: string): UserComment[] {
  return sql<UserComment>(`
    select c.id, c.postId, c.body, c.score, c.createdAt, p.title as postTitle
      from comments c
      join posts p on p.id = c.postId
     where c.userId = ${userId}
     order by c.createdAt desc
     limit 50
  `).all();
}
