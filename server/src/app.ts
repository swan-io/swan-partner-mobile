import autoload from "@fastify/autoload";
import closeWithGrace from "close-with-grace";
import fastify from "fastify";
import path from "pathe";
import { env } from "./utils/env";

const app = fastify({
  logger: {
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === "development" && {
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    }),
  },
});

void app.register(autoload, {
  dir: path.join(__dirname, "plugins"),
  dirNameRoutePrefix: false,
});

void app.register(autoload, {
  dir: path.join(__dirname, "routes"),
  dirNameRoutePrefix: false,
});

// Delay is the number of ms for the graceful close to finish
const closeListeners = closeWithGrace({ delay: 500 }, ({ err }) => {
  if (err) {
    app.log.error(err);
  }
  return app.close();
});

app.addHook("onClose", async () => {
  closeListeners.uninstall();
});

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
