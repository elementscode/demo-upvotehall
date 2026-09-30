import {
  LiveTable,
  LiveView,
  ForbiddenError,
  ValidationError,
  redirect,
  session,
  sql,
  tx,
} from "@elements/app";

export interface Post {
  id: string;
  createdAt: Date;
  userId: string;
  userName: string;
  title: string;
  url: string | null;
  body: string | null;
  score: number;
  commentCount: number;
  rank: number;
}

export interface PostVote {
  id: string;
  postId: string;
  userId: string;
}

export interface SubmitForm {
  title: string;
  url: string;
  body: string;
}

/**
 * Posts are written by `submitPost` and their counters by triggers, never
 * through a view, so the channel is pinned for the notify trigger in the
 * schema migration and the view mutators are closed.
 */
export let posts: LiveTable<Post> = new LiveTable<Post>({
  channel: (partition) => (partition ? `posts:${partition}` : "posts"),
  insert: () => {
    throw new ForbiddenError();
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: () => {
    throw new ForbiddenError();
  },
});

/**
 * The week's best posts. Same table and channel as `posts`; the select keeps
 * the snapshot to seven days and the template's filter is the rule.
 */
export let weekPosts: LiveTable<Post> = new LiveTable<Post>({
  table: "posts",
  channel: (partition) => (partition ? `posts:${partition}` : "posts"),
  select: (partition, w) => sql<Post>(`
    select p.*
      from posts p
     where p.createdAt > now() - interval '7 days'
       and ${w.keyset("p")}
     order by ${w.order("p")} ${w.page()}
  `),
  insert: () => {
    throw new ForbiddenError();
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: () => {
    throw new ForbiddenError();
  },
});

export let postVotes: LiveTable<PostVote> = new LiveTable<PostVote>({
  insert: (item) => {
    session.isLoggedInOrThrow();

    return postVotes.insert({ ...item, userId: session.getOrThrow("userId") });
  },
  update: () => {
    throw new ForbiddenError();
  },
  delete: (item) => {
    session.isLoggedInOrThrow();

    if (item.userId !== session.getOrThrow("userId")) {
      throw new ForbiddenError();
    }

    return postVotes.delete(item);
  },
});

/** The signed-in reader's post votes, or null for a visitor. */
export function myPostVotes(): LiveView<PostVote> | null {
  if (!session.isLoggedIn()) {
    return null;
  }

  return postVotes.view({ userId: session.getOrThrow("userId") });
}

export function togglePostVote(votes: LiveView<PostVote> | null, postId: string) {
  if (!votes) {
    redirect("/signin");
    return;
  }

  let mine = votes.find((v) => v.postId === postId);

  if (mine) {
    votes.delete(mine);
  } else {
    votes.insert({ postId, userId: session.getOrThrow("userId") });
  }
}

export function hasVoted(votes: LiveView<PostVote> | null, postId: string): boolean {
  return !!votes?.find((v) => v.postId === postId);
}

export function domainOf(url: string | null): string {
  if (!url) {
    return "";
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function ago(date: Date): string {
  let minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60_000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  let hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  let days = Math.floor(hours / 24);

  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function validateSubmission(form: SubmitForm): SubmitForm {
  let title = form.title.trim();
  let url = form.url.trim();
  let body = form.body.trim();

  if (!title) {
    throw new ValidationError({ title: ["give your post a title"] });
  }

  if (title.length > 120) {
    throw new ValidationError({ title: ["titles are at most 120 characters"] });
  }

  if (!url && !body) {
    throw new ValidationError({ url: ["add a link or some text"] });
  }

  if (url && !/^https?:\/\/[^\s/]+\.[^\s]+$/.test(url)) {
    throw new ValidationError({ url: ["links start with http:// or https://"] });
  }

  return { title, url, body };
}

/** @rpc */
export function submitPost(form: SubmitForm): string {
  session.isLoggedInOrThrow();

  let { title, url, body } = validateSubmission(form);
  let userId = session.getOrThrow("userId");

  return tx(() => {
    let post = sql<{ id: string }>(`
      insert into posts (userId, userName, title, url, body)
           values (${userId}, ${session.getOrThrow("userName")}, ${title}, ${url || null}, ${body || null})
        returning id
    `).firstOrThrow();

    sql(`insert into postVotes (postId, userId) values (${post.id}, ${userId})`);

    // Rank it now, with its first vote, rather than waiting for the next job.
    sql(`update posts set rank = postRank(score, createdAt) where id = ${post.id}`);

    return post.id;
  });
}
