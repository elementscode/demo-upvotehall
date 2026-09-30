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
