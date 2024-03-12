import { Storage } from "../modules/Storage";
import { setAuthentication } from "../states/authentication";
import { resetErrorBoundary } from "../states/resetErrorBoundary";
import { resetClient } from "../utils/urql";

export const logout = () =>
  Storage.clear()
    .finally(() => setAuthentication("none"))
    .finally(resetErrorBoundary)
    .finally(resetClient);
