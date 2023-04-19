import health from "fastify-healthcheck";
import plugin from "fastify-plugin";

export default plugin(async (app) => {
  void app.register(health);
});
