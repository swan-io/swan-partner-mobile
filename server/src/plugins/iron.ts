import * as Iron from "@hapi/iron";
import plugin from "fastify-plugin";
import { isMatching, P } from "ts-pattern";
import { env } from "../utils/env";

const SessionPattern = {
  access_token: P.string,
  expires_at: P.number,
  refresh_token: P.string,
};

const isSession = isMatching(SessionPattern);
export type Session = P.infer<typeof SessionPattern>;

type IronPlugin = {
  seal(session: Session): Promise<string>;
  unseal(token: string): Promise<Session>;
};

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    iron: IronPlugin;
  }
}

export default plugin(async (app) => {
  const plugin: IronPlugin = {
    seal: (session) => Iron.seal(session, env.SESSION_TOKEN_PASSWORD, Iron.defaults),

    unseal: (token) =>
      Iron.unseal(token, env.SESSION_TOKEN_PASSWORD, Iron.defaults)
        .catch((unsealed: unknown) => {
          if (!isSession(unsealed)) {
            throw new Error("Invalid session");
          }

          return unsealed;
        })
        .catch(() => {
          throw app.httpErrors.unauthorized();
        }),
  };

  app.decorate("iron", plugin);
});
