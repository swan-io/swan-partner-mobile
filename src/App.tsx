import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { match } from "ts-pattern";
import { Navigator } from "./Navigator";
import { AlertStack } from "./components/AlertStack";
import { ErrorView } from "./components/ErrorView";
import { Storage } from "./modules/Storage";
import { AuthenticationScreen } from "./screens/AuthenticationScreen";
import { setAuthentication, useAuthentication } from "./states/authentication";
import { setResetErrorBoundary } from "./states/resetErrorBoundary";
import { ClientProvider } from "./utils/urql";

export const App = () => {
  const authenticated = useAuthentication();
  const errorBoundaryRef = React.useRef<ErrorBoundary>(null);

  React.useEffect(() => {
    setResetErrorBoundary(errorBoundaryRef.current?.resetErrorBoundary);
  });

  React.useEffect(() => {
    Storage.getItemOrFail("sessionToken")
      .then(() => setAuthentication("user"))
      .catch(() => setAuthentication("none"));
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary
        ref={errorBoundaryRef}
        fallbackRender={({ error }: { error?: Error }) => <ErrorView error={error} />}
      >
        <ClientProvider>
          {match(authenticated)
            .with("loading", () => null)
            .with("none", () => <AuthenticationScreen />)
            .with("user", () => <Navigator />)
            .exhaustive()}
        </ClientProvider>
      </ErrorBoundary>

      <AlertStack />
    </SafeAreaProvider>
  );
};
