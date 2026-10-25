import { app } from "./app";
import { env } from "./utils/env";

if (process.env.VERCEL !== "1") {
  app.listen(env.port, () => {
    console.log(`Keltafa AI backend listening on port ${env.port}`);
  });
}

export default app;
