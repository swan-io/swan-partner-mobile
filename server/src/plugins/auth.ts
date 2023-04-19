import { FastifyReply, FastifyRequest } from "fastify";
import plugin from "fastify-plugin";
import { randomUUID } from "node:crypto";
import querystring from "node:querystring";
import { P, isMatching } from "ts-pattern";
import { env } from "../utils/env";
import { isNullish } from "../utils/guards";
import { getHeader } from "../utils/headers";
import { minutes, seconds } from "../utils/time";
import { Session } from "./iron";

export type Tokens = {
  userAccessToken: string;
  nextSessionToken: string | undefined;
};

type AuthPlugin = {
  getTokensFromReq: (reqOrSession: FastifyRequest) => Promise<Tokens>;
  extractCallbackQuery: (req: FastifyRequest, reply: FastifyReply) => string | undefined;
  getSessionToken: (code: string) => Promise<string>;
  redirectToAuthUrl: (reply: FastifyReply) => Promise<void>;
};

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    auth: AuthPlugin;
  }
}

export default plugin(async (app) => {
  const redirectToAuthUrl = async (reply: FastifyReply) => {
    const state = randomUUID();

    const params = querystring.encode({
      response_type: "code",
      client_id: env.OAUTH_CLIENT_ID,
      redirect_uri: env.AUTH_REDIRECT_URI,
      state,
      scope: ["openid", "offline"].join(" "),
    });

    return reply
      .cookie("state", state, { httpOnly: true, path: "/", maxAge: minutes(15) })
      .redirect(`${env.OAUTH_SERVER_URL}/oauth2/auth?${params}`);
  };

  const getSessionFromAuthServer = async (
    params:
      | { grant_type: "authorization_code"; code: string }
      | { grant_type: "refresh_token"; refresh_token: string },
  ): Promise<Session> => {
    const { data } = await app.axios.postForm<{
      access_token: string;
      expires_in: number;
      refresh_token: string;
    }>(`${env.OAUTH_SERVER_URL}/oauth2/token`, {
      ...params,
      // A valid redirect_uri must be set
      redirect_uri: env.AUTH_REDIRECT_URI,
      client_id: env.OAUTH_CLIENT_ID,
      client_secret: env.OAUTH_CLIENT_SECRET,
    });

    return {
      expires_at: Date.now() + data.expires_in * 1000,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    };
  };

  const getSessionToken = async (code: string) =>
    getSessionFromAuthServer({ grant_type: "authorization_code", code }).then(app.iron.seal);

  const refreshSession = async (session: Session) =>
    getSessionFromAuthServer({ grant_type: "refresh_token", refresh_token: session.refresh_token });

  const isCallbackQuery = isMatching({
    code: P.string,
    state: P.string,
  });

  const extractCallbackQuery = (req: FastifyRequest, reply: FastifyReply): string | undefined => {
    const cookies = req.cookies;
    const query = req.query;
    const cookieState = cookies["state"];

    void reply.clearCookie("state");

    if (isCallbackQuery(query) && query.state === cookieState) {
      return query.code;
    }
  };

  const getTokensFromReq = async (req: FastifyRequest): Promise<Tokens> => {
    const sessionToken = getHeader(req, "session-token")?.replace("Bearer ", "");

    if (isNullish(sessionToken)) {
      throw app.httpErrors.unauthorized();
    }

    const session = await app.iron.unseal(sessionToken);
    const maybeNewSession =
      Date.now() + seconds(10) > session.expires_at ? await refreshSession(session) : session;

    return {
      userAccessToken: maybeNewSession.access_token,
      nextSessionToken:
        maybeNewSession.access_token !== session.access_token
          ? await app.iron.seal(maybeNewSession)
          : undefined,
    };
  };

  const plugin: AuthPlugin = {
    getTokensFromReq,
    extractCallbackQuery,
    getSessionToken,
    redirectToAuthUrl,
  };

  app.decorate("auth", plugin);
});
