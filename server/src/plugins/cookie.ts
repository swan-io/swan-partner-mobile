import cookie from "@fastify/cookie";
import plugin from "fastify-plugin";

export default plugin(async (app) => {
  void app.register(cookie);
});
