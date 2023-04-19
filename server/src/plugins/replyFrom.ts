import replyFrom from "@fastify/reply-from";
import plugin from "fastify-plugin";

export default plugin(async (app) => {
  void app.register(replyFrom);
});
