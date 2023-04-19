import sensible from "@fastify/sensible";
import plugin from "fastify-plugin";

export default plugin(async (app) => {
  void app.register(sensible);
});
