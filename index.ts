import { App } from "@elements/app";
import config from "#config";
import home from "#app/pages/home";
import newest from "#app/pages/newest";
import week from "#app/pages/week";
import item from "#app/pages/item";
import submit from "#app/pages/submit";
import user from "#app/pages/user";
import signin from "#app/pages/signin";
import signup from "#app/pages/signup";
import notFound from "#app/pages/errors/not-found";
import unhandled from "#app/pages/errors/unhandled";
import { RankPostsJob } from "#app/jobs/rank-posts";

const app = new App();

app.route("/", home);
app.route("/newest", newest);
app.route("/week", week);
app.route("/item/:id", item);
app.route("/submit", submit);
app.route("/user/:handle", user);
app.route("/signin", signin);
app.route("/signup", signup);

app.cron("every 5m", "rank posts", () => new RankPostsJob().schedule());

app.error((req, res, err) => {
  switch (err.statusCode) {
    case 404:
      return notFound(req, res, err);

    default:
      return unhandled(req, res, err);
  }
});

app.start(config);
