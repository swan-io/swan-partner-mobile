import axios, { AxiosInstance } from "axios";
import plugin from "fastify-plugin";
import { isNullish } from "../utils/guards";

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    axios: AxiosInstance;
  }
}

export default plugin(async (app) => {
  const instance = axios.create();

  instance.interceptors.response.use(
    (response) => response,
    (error: Error) => {
      if (!axios.isAxiosError(error) || isNullish(error.response)) {
        throw app.httpErrors.internalServerError(error.message);
      }

      throw app.httpErrors.createError(error.response.status, error, {
        axios: error.toJSON(),
        message: error.message,
      });
    },
  );

  app.decorate("axios", instance);
});
