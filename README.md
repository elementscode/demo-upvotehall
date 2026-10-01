![Upvotehall, a link aggregator built with Elements: the front page with ranked link and text posts, vote counts, domains and comment counts.](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c/poster?v=c3b3c9f2be4c)

# Upvotehall

> A demo app built with [Elements](https://elements.dev).

Links and text posts ranked by votes and age, newest and top pages, threaded comments, karma and reply emails, all live.

**Demo:** [Upvotehall](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c)

## Agent specs

What one run of the prompt below took, from an empty Elements project to this
app.

- **Agent:** Claude Code, Opus 5.5 Medium
- **Time:** 16 min
- **Cost:** $4.99 at API rates, September 2026

## Get started

```bash
elements create upvotehall -scaffold=elementscode/demo-upvotehall
```

## How it's built

Upvotehall needed votes that move scores on every open page, a front page ranked by votes and age, live threaded comments, and an email when someone replies. Each of those is a part of Elements, so the agent spent its 16 minutes on the community itself.

### What Elements gave the app

- **Live posts and scores.** `posts` in `app/shared/services/posts.ts` is a LiveTable opened by rank for the front page, by time for `/newest` and by author for profiles, 25 at a time. Database triggers keep each post's score and comment count, and a notify trigger carries every change to the open lists.
- **Votes through a view.** `postVotes` and `commentVotes` are LiveTables opened for the signed-in reader, so a vote is an insert or delete through the view, with the voter set from the session.
- **Live threads.** `comments` in `app/shared/services/comments.ts` is a LiveTable opened per post. A new comment goes in through the view with its parent, appears in every open copy of the thread, and schedules `ReplyNotificationJob` in the same transaction.
- **Ranking on a schedule.** A `postRank` SQL function scores each post by votes and age. One line in `index.ts`, `app.cron("every 5m", ...)`, runs `RankPostsJob`, which re-ranks the last two weeks so the front page keeps moving.
- **Reply emails and karma.** `ReplyNotificationJob` in `app/jobs/reply-notification.ts` sends the `reply` email template to the author of the parent comment or post. A profile's karma counts the votes other people gave that user's posts and comments.
- **Data from SQL files.** Two migrations define the schema and its triggers, then seed eight users, thirty posts over the last four days, votes, and comment threads several levels deep.

### What the agent got from the tooling

The agent ran 31 builds in 16 minutes. By the build's own timer, the median build finished in 42 milliseconds, so it checked its work after each edit and kept going. Along the way the build caught a load-more handler converted to async, whose message named the fix: widen its return type to `void | Promise<void>` and await the call. The agent read the manual for each part as it reached it, 40 pages from `recipes/likes-toggle` and `livetable/windows` to `recipes/time-ago`, then wrote 35 tests. In a real browser it drove sign-in, votes and a reply across two browsers, and fixed the comment threads at phone width.

Start in `app/shared/services/posts.ts`.

## Seed data and demo accounts

The seed creates eight users, thirty link and text posts spread over the last
four days with votes on them, and 85 comments in threads up to six levels deep.
The front page ranks posts by votes and age, and a job recomputes the ranking
every five minutes. Every account's password is `upvotehall`, and the sign-in
page lists them.

| Username     | About                                   |
| ------------ | --------------------------------------- |
| kernelpanic  | schedulers and C                        |
| lambdalena   | functional programming                  |
| rustacean_ro | systems at a payments company           |
| segfault_sam | embedded firmware                       |
| monadmaya    | compilers and type systems              |
| yakshaver    | side projects                           |
| ptrpriya     | databases and query planners            |
| gcgarbo      | JVM tuning and GC pauses                |

Reply emails go to the person replied to. In development they are written to
`.elements/logs/job.log` instead of being sent.

## The prompt

```text
Build a link aggregator named upvotehall for a programming community.

- Sign up, log in.
- Submit a link with a title, or a text post.
- Front page ranked by votes and age, recomputed every few minutes; a newest
  page; a top of the week page.
- Upvote posts and comments.
- Threaded comments, collapsible, with replies to any depth.
- User pages with karma, submissions and comments.
- Reply notifications by email.

Seed eight users, thirty posts over the last few days with votes, and comment
threads several levels deep. Show the seeded logins on the sign-in page.

Votes and new comments update in real time.
```

## License

MIT. See [LICENSE](LICENSE).
