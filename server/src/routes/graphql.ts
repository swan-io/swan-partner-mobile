import { FastifyInstance } from "fastify";
import { env } from "../utils/env";
import { isNotNullish } from "../utils/guards";

export default async (app: FastifyInstance) => {
  app.all("/graphql", async (req, reply) => {
    const tokens = await app.auth.getTokensFromReq(req);

    return reply.from(env.PARTNER_API_URL, {
      rewriteRequestHeaders: (_req, headers) => {
        delete headers["session-token"];
        headers["authorization"] = `Bearer ${tokens.userAccessToken}`;
        return headers;
      },
      rewriteHeaders: (headers) => {
        delete headers["authorization"];

        if (isNotNullish(tokens.nextSessionToken)) {
          headers["next-session-token"] = tokens.nextSessionToken;
        }

        return headers;
      },
    });
  });
};
