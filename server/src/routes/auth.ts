import { FastifyInstance } from "fastify";
import querystring from "node:querystring";
import { env } from "../utils/env";
import { isNullish } from "../utils/guards";

export const prefixOverride = "/auth";

export default async (app: FastifyInstance) => {
  app.get("/", async (_req, reply) => {
    return app.auth.redirectToAuthUrl(reply);
  });

  app.get("/callback", async (req, reply) => {
    const code = app.auth.extractCallbackQuery(req, reply);

    if (isNullish(code)) {
      return reply.redirect(env.DEEPLINK_CALLBACK_URL);
    }

    const sessionToken = await app.auth.getSessionToken(code);
    const params = querystring.encode({ sessionToken });
    return reply.redirect(`${env.DEEPLINK_CALLBACK_URL}?${params}`);
  });
};
