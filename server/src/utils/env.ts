import dotenv from "dotenv";
import path from "pathe";
import { number, oneOf, string, validate, Validator } from "valienv";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const url: Validator<string> = (value = "") => {
  try {
    new URL(value);
    return value;
  } catch {} // eslint-disable-line no-empty
};

export const env = validate({
  env: process.env,
  validators: {
    NODE_ENV: oneOf("development", "test", "production"),
    PORT: number,

    LOG_LEVEL: oneOf("fatal", "error", "warn", "info", "debug", "trace", "silent"),

    OAUTH_CLIENT_ID: string,
    OAUTH_CLIENT_SECRET: string,
    OAUTH_SERVER_URL: url,

    AUTH_REDIRECT_URI: url,
    PARTNER_API_URL: url,

    DEEPLINK_CALLBACK_URL: url,
    SESSION_TOKEN_PASSWORD: string,
  },
});
