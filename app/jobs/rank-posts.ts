import { Job, sql } from "@elements/app";

export interface RankPostsJobFields {}

/**
 * Recomputes the front page order. Only the last two weeks are ranked; an
 * older post decays to nothing and stays where it last landed.
 */
export class RankPostsJob extends Job<RankPostsJobFields> {
  run() {
    sql(`
      update posts
         set rank = postRank(score, createdAt)
       where createdAt > now() - interval '14 days'
    `);
  }
}
