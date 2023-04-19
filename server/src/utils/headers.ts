import { FastifyRequest } from "fastify";

type AllowedHeader = "session-token";

export const getHeader = (req: FastifyRequest, name: AllowedHeader) => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};
