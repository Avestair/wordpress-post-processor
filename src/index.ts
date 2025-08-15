import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { processPosts } from "./posts/post.processor";

const app = new Elysia()
  .use(
    cron({
      name: "post-processor-cron",
      pattern: "*/60 * * * * *", // This cron pattern runs every 60 seconds
      run() {
        console.log("⏰ Cron job triggered to process posts every 10 seconds.");
        processPosts();
      },
    })
  )
  .get("/", () => "KavanaFX Post Processor is running.")
  .listen(3000);

console.log(
  ` post processor is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(`The post processing job is scheduled to run every 60 seconds.`);
