-- demo rows: eight users, thirty posts over the last four days, votes, and
-- comment threads several levels deep. Every seeded password is "upvotehall".

create temp table seedUsers (handle text, about text) on commit drop;

insert into seedUsers (handle, about) values
  ('kernelpanic', 'Writes schedulers for fun. Mostly C, some regret.'),
  ('lambdalena', 'Functional programmer. Will explain monads if asked, and sometimes when not.'),
  ('rustacean_ro', 'Borrow checker apologist. Systems at a payments company.'),
  ('segfault_sam', 'Embedded firmware, oscilloscopes, and bad coffee.'),
  ('monadmaya', 'Compilers and type systems. Currently fighting a parser.'),
  ('yakshaver', 'I set out to fix a typo in 2019. Still going.'),
  ('ptrpriya', 'Databases, indexes, query planners. Ask me about vacuum.'),
  ('gcgarbo', 'JVM tuning, GC pauses, and other forms of waiting.');

insert into users (handle, email, passwordHash, about, createdAt)
     select handle,
            handle || '@example.com',
            crypt('upvotehall', genSalt('bf', 10)),
            about,
            now() - interval '60 days'
       from seedUsers;

create temp table seedPosts (
  key text,
  handle text,
  title text,
  url text,
  body text,
  hoursAgo numeric,
  pop integer,
  id uuid default gen_random_uuid()
) on commit drop;

insert into seedPosts (key, handle, title, url, body, hoursAgo, pop) values
  ('p1', 'ptrpriya', 'Why your Postgres index is not being used', 'https://planner-notes.dev/2026/unused-indexes', null, 3, 9),
  ('p2', 'lambdalena', 'Ask: How do you teach recursion to people who hate math?', null, 'I run a weekly study group and recursion is where half the room checks out. Tree drawings help a bit. What has worked for you?', 5, 8),
  ('p3', 'rustacean_ro', 'Show: A 400-line allocator that beats malloc for our workload', 'https://github.com/rustacean-ro/slabby', null, 7, 10),
  ('p4', 'kernelpanic', 'The scheduler bug that only happened on Tuesdays', 'https://kernelpanic.blog/tuesday-bug', null, 9, 9),
  ('p5', 'monadmaya', 'Writing a Pratt parser in an afternoon', 'https://monadmaya.net/pratt-parsing', null, 11, 7),
  ('p6', 'yakshaver', 'I rewrote my dotfiles manager for the fourth time', 'https://yak.garden/dotfiles-again', null, 13, 4),
  ('p7', 'segfault_sam', 'Debugging a brownout with a $12 logic analyzer', 'https://benchnotes.io/brownout', null, 15, 8),
  ('p8', 'gcgarbo', 'Generational ZGC in production: six months later', 'https://pausetime.dev/zgc-six-months', null, 18, 7),
  ('p9', 'ptrpriya', 'Ask: What is the most useful SQL you have ever written?', null, 'Mine is a recursive CTE that found every orphaned row across a forty-table schema. Saved a migration. Yours?', 21, 9),
  ('p10', 'lambdalena', 'Effects are just functions that ask for permission', 'https://lena.codes/effects-permission', null, 24, 6),
  ('p11', 'rustacean_ro', 'Unsafe Rust is fine, actually (with caveats)', 'https://rustacean.ro/unsafe-is-fine', null, 27, 8),
  ('p12', 'kernelpanic', 'Show: A toy OS that boots in 90ms on a Raspberry Pi', 'https://github.com/kernelpanic/pibox', null, 30, 7),
  ('p13', 'monadmaya', 'Error messages are a user interface', 'https://monadmaya.net/error-messages', null, 33, 9),
  ('p14', 'yakshaver', 'Ask: How do you decide when a side project is done?', null, 'I have eleven repos that are 80% finished. Is there a rule you use to stop, ship, or kill one?', 36, 6),
  ('p15', 'segfault_sam', 'Reading a datasheet like a detective novel', 'https://benchnotes.io/datasheets', null, 40, 5),
  ('p16', 'gcgarbo', 'Your p99 latency is a GC problem until proven otherwise', 'https://pausetime.dev/p99', null, 43, 6),
  ('p17', 'ptrpriya', 'B-trees, LSM trees, and the write amplification tax', 'https://planner-notes.dev/2026/write-amp', null, 47, 8),
  ('p18', 'lambdalena', 'Show: A property-based testing library in 300 lines of TypeScript', 'https://github.com/lambdalena/proptiny', null, 50, 7),
  ('p19', 'rustacean_ro', 'What we learned rewriting our ledger service', 'https://rustacean.ro/ledger-rewrite', null, 54, 6),
  ('p20', 'kernelpanic', 'Ask: Tabs or spaces in 2026, and does it still matter?', null, 'Formatters settled most of this for me, but our team still argues about it in Makefiles. Is anyone still fighting this?', 58, 5),
  ('p21', 'monadmaya', 'Incremental compilation without tears', 'https://monadmaya.net/incremental', null, 62, 7),
  ('p22', 'yakshaver', 'A love letter to plain text', 'https://yak.garden/plain-text', null, 66, 8),
  ('p23', 'segfault_sam', 'Interrupt latency on a Cortex-M4, measured', 'https://benchnotes.io/irq-latency', null, 70, 5),
  ('p24', 'gcgarbo', 'Escape analysis: the optimization you forget exists', 'https://pausetime.dev/escape-analysis', null, 74, 4),
  ('p25', 'ptrpriya', 'Vacuum is not garbage collection (but it rhymes)', 'https://planner-notes.dev/2026/vacuum', null, 78, 6),
  ('p26', 'lambdalena', 'Ask: Which language changed how you think the most?', null, 'For me it was Prolog in university. I have never looked at search the same way since.', 82, 9),
  ('p27', 'rustacean_ro', 'Zero-copy parsing with lifetimes', 'https://rustacean.ro/zero-copy', null, 86, 5),
  ('p28', 'kernelpanic', 'Show: htop for your CI pipeline', 'https://github.com/kernelpanic/citop', null, 90, 6),
  ('p29', 'monadmaya', 'Type inference, explained with a whiteboard and no Greek letters', 'https://monadmaya.net/inference', null, 94, 8),
  ('p30', 'yakshaver', 'The Makefile that outlived three build systems', 'https://yak.garden/makefile', null, 98, 7);

insert into posts (id, userId, userName, title, url, body, createdAt)
     select p.id, u.id, u.handle, p.title, p.url, p.body, now() - make_interval(hours => p.hoursAgo::integer)
       from seedPosts p
       join users u on u.handle = p.handle;

-- The author always votes for their own post, the way a submission does.
insert into postVotes (postId, userId, createdAt)
     select p.id, u.id, now() - make_interval(hours => p.hoursAgo::integer)
       from seedPosts p
       join users u on u.handle = p.handle
         or abs(hashtext(p.key || u.handle)) % 14 < p.pop;

create temp table seedComments (
  key text,
  parentKey text,
  postKey text,
  handle text,
  body text,
  minutesAfter integer,
  id uuid default gen_random_uuid()
) on commit drop;

insert into seedComments (key, parentKey, postKey, handle, body, minutesAfter) values
  ('c1', null, 'p1', 'gcgarbo', 'Nine times out of ten it is a type mismatch. The column is bigint and the parameter arrives as numeric, and the planner quietly gives up on the index.', 8),
  ('c2', 'c1', 'p1', 'ptrpriya', 'Yes, and the tenth time it is statistics that are two million rows out of date. Run analyze before you blame the planner.', 15),
  ('c3', 'c2', 'p1', 'yakshaver', 'Is there a way to get a warning when stats drift that far? Feels like something the database could tell you.', 24),
  ('c4', 'c3', 'p1', 'ptrpriya', 'pg_stat_user_tables has n_mod_since_analyze. Alert when it passes some fraction of reltuples. We page at 20%.', 31),
  ('c5', 'c4', 'p1', 'yakshaver', 'Stealing this. Thank you.', 40),
  ('c6', null, 'p1', 'monadmaya', 'The section on partial indexes was the part I did not know. Indexing only the rows where deleted_at is null cut ours to a tenth of the size.', 20),
  ('c7', 'c6', 'p1', 'rustacean_ro', 'Just remember the query has to repeat the predicate exactly, or the planner will not match it.', 28),
  ('c8', null, 'p2', 'kernelpanic', 'Start with something they already do recursively without noticing: opening folders inside folders until you find the file.', 12),
  ('c9', 'c8', 'p2', 'lambdalena', 'Oh, I like that. It has a base case built in, too: the folder with no folders in it.', 20),
  ('c10', 'c9', 'p2', 'segfault_sam', 'And the call stack is the path in the breadcrumb bar. You get to show the stack for free.', 33),
  ('c11', 'c10', 'p2', 'monadmaya', 'This is a whole lesson plan now. Someone write it up.', 45),
  ('c12', 'c11', 'p2', 'lambdalena', 'I will, and I will post it here next week.', 52),
  ('c13', null, 'p2', 'gcgarbo', 'Have them trace it by hand on paper with index cards, one card per call. Stacking and unstacking the cards makes it click.', 30),
  ('c14', 'c13', 'p2', 'yakshaver', 'Index cards worked for me twenty years ago and I still picture them when I debug.', 41),
  ('c15', null, 'p3', 'kernelpanic', 'What does the workload look like? Slab allocators shine when sizes cluster, and fall over when they do not.', 10),
  ('c16', 'c15', 'p3', 'rustacean_ro', 'Four size classes cover 97% of our allocations. The rest go straight to the system allocator.', 18),
  ('c17', 'c16', 'p3', 'kernelpanic', 'That is the right call. Did you measure fragmentation over a long run, or only throughput?', 26),
  ('c18', 'c17', 'p3', 'rustacean_ro', 'Both. Fragmentation stays under 4% after a week in staging. Graphs are in the README.', 35),
  ('c19', 'c18', 'p3', 'ptrpriya', 'The graphs are what sold me. Most allocator posts only show a microbenchmark.', 47),
  ('c20', 'c19', 'p3', 'gcgarbo', 'Agreed. A week-long run is worth more than any benchmark.', 60),
  ('c21', null, 'p3', 'segfault_sam', 'Would this work without an operating system underneath? We have a similar pattern on a microcontroller.', 22),
  ('c22', 'c21', 'p3', 'rustacean_ro', 'It is no_std compatible. You hand it a region of memory at startup and it never asks for more.', 30),
  ('c23', null, 'p4', 'yakshaver', 'I refuse to believe it was actually Tuesdays until I read to the end.', 7),
  ('c24', 'c23', 'p4', 'kernelpanic', 'It was Tuesdays because that is when the weekly batch job ran, and it was the only thing that pinned all eight cores.', 14),
  ('c25', 'c24', 'p4', 'gcgarbo', 'Every calendar bug is secretly a load bug.', 23),
  ('c26', 'c25', 'p4', 'segfault_sam', 'Or a timezone bug. Or both, if you are unlucky.', 31),
  ('c27', null, 'p4', 'ptrpriya', 'The priority inversion diagram halfway down is the clearest one I have seen.', 18),
  ('c28', null, 'p5', 'lambdalena', 'Pratt parsing is the thing I wish someone had shown me before I spent a month on a grammar generator.', 15),
  ('c29', 'c28', 'p5', 'monadmaya', 'Same. Binding power is such a small idea for how much it replaces.', 22),
  ('c30', 'c29', 'p5', 'kernelpanic', 'How do you handle error recovery? That is where my handwritten parsers always get ugly.', 34),
  ('c31', 'c30', 'p5', 'monadmaya', 'Synchronize on statement boundaries and keep going. The post has a section on it near the end.', 42),
  ('c32', null, 'p7', 'kernelpanic', 'Cheap logic analyzers are the best tool I own per dollar spent.', 20),
  ('c33', 'c32', 'p7', 'segfault_sam', 'Agreed, although this one needed a scope in the end. The brownout was analog, the analyzer only told me when.', 29),
  ('c34', 'c33', 'p7', 'rustacean_ro', 'Knowing when is most of the battle.', 37),
  ('c35', null, 'p8', 'rustacean_ro', 'How much heap headroom did you need to give it? That was the thing that scared us off.', 25),
  ('c36', 'c35', 'p8', 'gcgarbo', 'About 30% over the old live set. Memory is cheaper than the pauses were.', 33),
  ('c37', 'c36', 'p8', 'ptrpriya', 'That trade is the whole post in one line.', 44),
  ('c38', null, 'p9', 'monadmaya', 'A window function that computed session boundaries from raw click events. Replaced a nightly Spark job.', 11),
  ('c39', 'c38', 'p9', 'ptrpriya', 'lag() plus a running sum over a flag column? That pattern is criminally underused.', 19),
  ('c40', 'c39', 'p9', 'monadmaya', 'Exactly that. Twelve lines, and it runs in four seconds instead of forty minutes.', 27),
  ('c41', 'c40', 'p9', 'gcgarbo', 'I need to see these twelve lines.', 36),
  ('c42', 'c41', 'p9', 'monadmaya', 'I will put them in a gist tonight.', 44),
  ('c43', 'c42', 'p9', 'yakshaver', 'Following this thread for the gist.', 55),
  ('c44', null, 'p9', 'segfault_sam', 'generate_series joined against the events table to find the missing hours in a sensor feed. Simple, but it found a firmware bug.', 25),
  ('c45', 'c44', 'p9', 'kernelpanic', 'Finding gaps is my favorite use of generate_series too.', 38),
  ('c46', null, 'p11', 'gcgarbo', 'The caveats are doing a lot of work in that title.', 12),
  ('c47', 'c46', 'p11', 'rustacean_ro', 'They are the entire article, honestly. The title is the hook.', 20),
  ('c48', 'c47', 'p11', 'lambdalena', 'Fair. The section about writing the safety comment first changed how I review unsafe blocks.', 31),
  ('c49', null, 'p13', 'yakshaver', 'Elm set the bar here and most languages still have not caught up.', 9),
  ('c50', 'c49', 'p13', 'monadmaya', 'Elm is the example I use in the talk version. The trick is that they treat the message as a feature with an owner.', 17),
  ('c51', 'c50', 'p13', 'rustacean_ro', 'Rust took a lot from that, and it shows. The suggestions are right most of the time.', 26),
  ('c52', 'c51', 'p13', 'kernelpanic', 'Except for lifetimes. Those messages still read like riddles to me.', 35),
  ('c53', 'c52', 'p13', 'rustacean_ro', 'They have improved a lot in the last few releases, to be fair.', 46),
  ('c54', null, 'p14', 'ptrpriya', 'It is done when it does the one thing you built it for and you have used it for a week without opening the code.', 18),
  ('c55', 'c54', 'p14', 'yakshaver', 'A week without opening the code. I have never achieved that with anything.', 27),
  ('c56', 'c55', 'p14', 'lambdalena', 'That is the real lesson here.', 36),
  ('c57', null, 'p22', 'segfault_sam', 'Every system I trust keeps its config in plain text I can diff.', 30),
  ('c58', 'c57', 'p22', 'yakshaver', 'Diffable is the whole argument. Everything else follows from it.', 41),
  ('c59', null, 'p26', 'kernelpanic', 'C, because it made me understand what every other language was hiding from me.', 14),
  ('c60', 'c59', 'p26', 'gcgarbo', 'And then Java, because it made me understand why they hide it.', 22),
  ('c61', 'c60', 'p26', 'rustacean_ro', 'And then Rust, because it made me understand that you do not have to choose.', 31),
  ('c62', 'c61', 'p26', 'lambdalena', 'This thread is a whole career in three comments.', 40),
  ('c63', null, 'p26', 'monadmaya', 'Haskell. Types stopped being paperwork and started being the design.', 19),
  ('c64', 'c63', 'p26', 'ptrpriya', 'SQL did that for me. Describing what you want instead of how to get it.', 28),
  ('c65', null, 'p29', 'yakshaver', 'Finally an explanation of unification that does not start with a page of notation.', 16),
  ('c66', 'c65', 'p29', 'monadmaya', 'That was the whole goal. The notation is useful later, but it scares people off first.', 24),
  ('c67', null, 'p6', 'kernelpanic', 'The fourth rewrite is where you finally find out what the tool is for.', 18),
  ('c68', 'c67', 'p6', 'yakshaver', 'It is for symlinks. It was always for symlinks. The other 2,000 lines were me having fun.', 26),
  ('c69', 'c68', 'p6', 'segfault_sam', 'A shell script and a list of paths has served me for ten years. No regrets.', 37),
  ('c70', null, 'p10', 'monadmaya', 'This is the most approachable framing of algebraic effects I have read. The permission slip analogy works.', 21),
  ('c71', 'c70', 'p10', 'lambdalena', 'Thank you. It started as a whiteboard doodle for a coworker.', 30),
  ('c72', null, 'p10', 'rustacean_ro', 'How does this compare to passing capabilities as arguments? Feels like the same idea with better ergonomics.', 44),
  ('c73', 'c72', 'p10', 'lambdalena', 'Same idea. Effects let the compiler thread them through for you and check you handled each one.', 52),
  ('c74', null, 'p12', 'segfault_sam', 'What does the 90ms include? Firmware handoff to the kernel, or all the way to a shell?', 15),
  ('c75', 'c74', 'p12', 'kernelpanic', 'Kernel entry to a shell prompt. The GPU firmware takes another second before that and I cannot touch it.', 24),
  ('c76', 'c75', 'p12', 'yakshaver', 'Still faster than my laptop wakes from sleep.', 33),
  ('c77', null, 'p15', 'kernelpanic', 'The footnotes are where the errata hide. Always read the footnotes.', 20),
  ('c78', null, 'p16', 'ptrpriya', 'Or the database. It is always the GC or the database.', 12),
  ('c79', 'c78', 'p16', 'gcgarbo', 'I will accept the database as a second suspect.', 20),
  ('c80', null, 'p17', 'rustacean_ro', 'The table comparing read and write amplification side by side is going on my wall.', 26),
  ('c81', 'c80', 'p17', 'ptrpriya', 'I almost cut it for length. Glad I did not.', 34),
  ('c82', null, 'p19', 'gcgarbo', 'Double-entry invariants checked in the database instead of the service is the right call.', 30),
  ('c83', null, 'p21', 'lambdalena', 'The red-green tree explanation finally made salsa make sense to me.', 22),
  ('c84', null, 'p25', 'gcgarbo', 'As the resident GC person, I approve of this title.', 11),
  ('c85', 'c84', 'p25', 'ptrpriya', 'I was hoping you would show up.', 19);

insert into comments (id, postId, parentId, userId, userName, body, createdAt)
     select c.id,
            p.id,
            parent.id,
            u.id,
            u.handle,
            c.body,
            now() - make_interval(hours => p.hoursAgo::integer) + make_interval(mins => c.minutesAfter)
       from seedComments c
       join seedPosts p on p.key = c.postKey
       join users u on u.handle = c.handle
       left join seedComments parent on parent.key = c.parentKey;

insert into commentVotes (postId, commentId, userId)
     select p.id, c.id, u.id
       from seedComments c
       join seedPosts p on p.key = c.postKey
       join users u on u.handle <> c.handle
      where abs(hashtext(c.key || u.handle)) % 10 < 2 + abs(hashtext(c.key)) % 5;

update posts set rank = postRank(score, createdAt);
