import { sql } from "@elements/app";

/**
 * A handle no other test file uses. Test files run in parallel against one
 * database, and two open transactions inserting the same unique handle or
 * email block each other and can deadlock.
 */
export function uniqueHandle(base: string): string {
  return `${base}_${crypto.randomUUID().slice(0, 8)}`;
}

/** Rows for tests. The seed rows are present too, so each test makes and reads its own. */
export function makeUser(base: string): { id: string; handle: string; email: string } {
  let handle = uniqueHandle(base);

  return sql<{ id: string; handle: string; email: string }>(`
    insert into users (handle, email, passwordHash)
         values (${handle}, ${handle + "@example.com"}, 'not-a-hash')
      returning id, handle, email
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
