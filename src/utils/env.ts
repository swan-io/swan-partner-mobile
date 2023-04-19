import { API_HOST, DEEPLINK_CALLBACK_URL } from "@env";

export const env = {
  API_HOST,
  DEEPLINK_CALLBACK_URL,
};

if (__DEV__) {
  console.log("Running application with environment:");
  console.log(env);
}
