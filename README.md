![Upvotehall, a link aggregator built with Elements: the front page with ranked link and text posts, vote counts, domains and comment counts.](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c/poster?v=c3b3c9f2be4c)

# Upvotehall

> A demo app built with [Elements](https://elements.dev).

Links and text posts ranked by votes and age, newest and top pages, threaded comments, karma and reply emails, all live.

**Demo:** [Upvotehall](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c)

## Agent specs

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

- **Live posts and scores.** Posts are a LiveTable opened by rank for the front page, by time for newest and by author for profiles, 25 at a time. Database triggers keep each post's score and comment count, and a notify trigger carries every change to the open lists.

- **Votes through a view.** Votes are LiveTables opened for the signed-in reader, so a vote is an insert or delete through the view, with the voter set from the session.

- **Live threads.** Comments are a LiveTable opened per post. A new comment appears in every open copy of the thread and schedules its reply email in the same transaction.

- **Ranking on a schedule.** A SQL function scores each post by votes and age, and one cron line runs a job every five minutes that re-ranks the last two weeks, so the front page keeps moving.

- **Reply emails and karma.** A background job emails the author of the parent comment or post. A profile's karma counts the votes other people gave that user's posts and comments.

- **Data from SQL files.** Two migrations define the schema and its triggers, then seed eight users, thirty posts over the last four days, votes, and comment threads several levels deep.

### What the project server gave the agent

The project server runs alongside the agent and answers as soon as a file is saved: it type-checks the templates, TypeScript and SQL, applies migrations and reruns the tests, so every question came back right away and the agent kept building.

### What shipped

The app type-checks with zero errors and all 35 tests pass. Every page works on desktop and phone, and live updates arrive across tabs, such as votes, scores and new replies.

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

**Demo:** [Upvotehall](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c)

## License

MIT. See [LICENSE](LICENSE).
