import { Storage } from "../modules/Storage";
import { setAuthenticated } from "../states/authenticated";
import { resetErrorBoundary } from "../states/resetErrorBoundary";
import { resetClient } from "../utils/urql";

export const logout = () =>
  Storage.clear()
    .finally(() => setAuthenticated(false))
    .finally(resetErrorBoundary)
    .finally(resetClient);
