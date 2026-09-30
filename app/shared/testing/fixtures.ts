import { sql } from "@elements/app";

/** Rows for tests. The test database has no seed, so each test makes its own. */
export function makeUser(handle: string): { id: string; handle: string } {
  return sql<{ id: string; handle: string }>(`
    insert into users (handle, email, passwordHash)
         values (${handle}, ${handle + "@example.com"}, 'not-a-hash')
      returning id, handle
  `).firstOrThrow();
}

export function makePost(userId: string, handle: string, title: string, hoursAgo: number = 0): { id: string } {
  return sql<{ id: string }>(`
    insert into posts (userId, userName, title, url, createdAt)
         values (${userId}, ${handle}, ${title}, 'https://example.com/a', now() - make_interval(hours => ${hoursAgo}))
      returning id
  `).firstOrThrow();
}

export function makeComment(postId: string, parentId: string | null, userId: string, handle: string, body: string): { id: string } {
  return sql<{ id: string }>(`
    insert into comments (postId, parentId, userId, userName, body)
         values (${postId}, ${parentId}, ${userId}, ${handle}, ${body})
      returning id
  `).firstOrThrow();
}
