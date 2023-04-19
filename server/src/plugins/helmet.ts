import helmet from "@fastify/helmet";
import plugin from "fastify-plugin";

export default plugin(async (app) => {
  void app.register(helmet, { crossOriginResourcePolicy: false });
});
