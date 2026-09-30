-- add schema

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  handle text not null unique,
  email text not null unique,
  passwordHash text not null,
  about text not null default ''
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table posts (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  userId uuid not null references users(id) on delete cascade,
  userName text not null,
  title text not null,
  url text,
  body text,
  score integer not null default 0,
  commentCount integer not null default 0,
  rank double precision not null default 0
);

create index postsRankIdx on posts (rank desc, id desc);
create index postsCreatedAtIdx on posts (createdAt desc, id desc);
create index postsScoreIdx on posts (score desc, id desc);
create index postsUserIdIdx on posts (userId);

create trigger postsTouchUpdatedAt
  before update on posts
  for each row execute function touchUpdatedAt();

create table postVotes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  postId uuid not null references posts(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  unique (postId, userId)
);

create index postVotesUserIdIdx on postVotes (userId);

create trigger postVotesTouchUpdatedAt
  before update on postVotes
  for each row execute function touchUpdatedAt();

create table comments (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  postId uuid not null references posts(id) on delete cascade,
  parentId uuid references comments(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  userName text not null,
  body text not null,
  score integer not null default 0
);

create index commentsPostIdIdx on comments (postId);
create index commentsUserIdIdx on comments (userId);

create trigger commentsTouchUpdatedAt
  before update on comments
  for each row execute function touchUpdatedAt();

create table commentVotes (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  postId uuid not null references posts(id) on delete cascade,
  commentId uuid not null references comments(id) on delete cascade,
  userId uuid not null references users(id) on delete cascade,
  unique (commentId, userId)
);

create index commentVotesPostUserIdx on commentVotes (postId, userId);

create trigger commentVotesTouchUpdatedAt
  before update on commentVotes
  for each row execute function touchUpdatedAt();

-- Gravity ranking: votes decay with age, so a new post can pass an older one
-- with more points. The rank job recomputes it every few minutes.
create or replace function postRank(score integer, createdAt timestamptz)
returns double precision
language sql
stable
as $$
  select score / power(extract(epoch from (now() - createdAt)) / 3600 + 2, 1.8);
$$;

create or replace function postsSetRank()
returns trigger
language plpgsql
as $$
begin
  new.rank = postRank(new.score, new.createdAt);
  return new;
end;
$$;

create trigger postsSetRankTrigger
  before insert on posts
  for each row execute function postsSetRank();

create or replace function postVotesCount()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update posts set score = score + 1 where id = new.postId;
  else
    update posts set score = score - 1 where id = old.postId;
  end if;

  return null;
end;
$$;

create trigger postVotesCountTrigger
  after insert or delete on postVotes
  for each row execute function postVotesCount();

create or replace function commentVotesCount()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update comments set score = score + 1 where id = new.commentId;
  else
    update comments set score = score - 1 where id = old.commentId;
  end if;

  return null;
end;
$$;

create trigger commentVotesCountTrigger
  after insert or delete on commentVotes
  for each row execute function commentVotesCount();

create or replace function commentsCount()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update posts set commentCount = commentCount + 1 where id = new.postId;
  else
    update posts set commentCount = commentCount - 1 where id = old.postId;
  end if;

  return null;
end;
$$;

create trigger commentsCountTrigger
  after insert or delete on comments
  for each row execute function commentsCount();

create or replace function jsDate(t timestamptz)
returns json
language sql
immutable
as $$
  select json_build_object('$type', 'Date', '$value', (extract(epoch from t) * 1000)::bigint);
$$;

-- Score, comment count and rank are written by triggers and the rank job, not
-- through a view, so the row itself broadcasts to every page watching it.
create or replace function postsNotify()
returns trigger
language plpgsql
as $$
declare
  r record;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'createdAt', jsDate(r.createdAt),
      'updatedAt', jsDate(r.updatedAt),
      'userId', r.userId,
      'userName', r.userName,
      'title', r.title,
      'url', r.url,
      'body', r.body,
      'score', r.score,
      'commentCount', r.commentCount,
      'rank', r.rank
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('posts'), payload);
  perform pg_notify(channel_name('posts:id=' || r.id), payload);
  perform pg_notify(channel_name('posts:userId=' || r.userId), payload);

  return r;
end;
$$;

create trigger postsNotifyTrigger
  after insert or update or delete on posts
  for each row execute function postsNotify();

create or replace function commentsNotify()
returns trigger
language plpgsql
as $$
declare
  r record;
  payload text;
begin
  r := coalesce(new, old);

  payload := json_build_object(
    'op', lower(tg_op),
    'data', json_build_object(
      'id', r.id,
      'createdAt', jsDate(r.createdAt),
      'updatedAt', jsDate(r.updatedAt),
      'postId', r.postId,
      'parentId', r.parentId,
      'userId', r.userId,
      'userName', r.userName,
      'body', r.body,
      'score', r.score
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', lower(tg_op), 'id', r.id)::text;
  end if;

  perform pg_notify(channel_name('comments:postId=' || r.postId), payload);

  return r;
end;
$$;

create trigger commentsNotifyTrigger
  after insert or update or delete on comments
  for each row execute function commentsNotify();
