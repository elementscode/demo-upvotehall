![A link aggregator with threaded comments, built by Claude Code on Elements: the front page with ranked link and text posts, vote counts, domains and comment counts.](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c/poster?v=c3b3c9f2be4c)

# A link aggregator with threaded comments, built by Claude Code on Elements

> Upvotehall is a full-stack app built with Claude Code on Elements.

Links and text posts ranked by votes and age, newest and top pages, threaded comments, karma and reply emails, all live.

[Run this app on your machine](https://elements.dev/demos/01a0f3e4-7332-73bb-a1e9-c142c229657c). Use this demo as inspiration, or as the starting point for your own app. Your agent creates a new app with this one as the scaffold, and you prompt it to add whatever features you want.

## How it's built

Upvotehall needed votes that move scores on every open page, a front page ranked by votes and age, live threaded comments, and an email when someone replies. Each of those is a part of Elements, so the agent spent its 16 minutes on the community itself.

- **Live posts and scores.** Posts are a LiveTable opened by rank for the front page, by time for newest and by author for profiles, 25 at a time. Database triggers keep each post's score and comment count, and a notify trigger carries every change to the open lists.

- **Votes through a view.** Votes are LiveTables opened for the signed-in reader, so a vote is an insert or delete through the view, with the voter set from the session.

- **Live threads.** Comments are a LiveTable opened per post. A new comment appears in every open copy of the thread and schedules its reply email in the same transaction.

- **Ranking on a schedule.** A SQL function scores each post by votes and age, and one cron line runs a job every five minutes that re-ranks the last two weeks, so the front page keeps moving.

- **Reply emails and karma.** A background job emails the author of the parent comment or post. A profile's karma counts the votes other people gave that user's posts and comments.

- **Data from SQL files.** Two migrations define the schema and its triggers, then seed eight users, thirty posts over the last four days, votes, and comment threads several levels deep.

## Why Elements

Elements is an integrated full-stack app framework and a project server. The project server checks the agent's work as it builds: it type-checks the server and browser code, analyzes the program, applies migrations and runs the tests, then reports the results to the agent. A security mistake, such as calling a server-only function from the browser, is a compile error. The agent reads the report and fixes its own mistakes before it tells you a feature is done. The same checks run on every feature you ask for next.
