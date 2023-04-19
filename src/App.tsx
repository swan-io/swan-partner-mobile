import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { match, P } from "ts-pattern";
import { AlertStack } from "./components/AlertStack";
import { ErrorView } from "./components/ErrorView";
import { Storage } from "./modules/Storage";
import { Navigator } from "./Navigator";
import { AuthenticationScreen } from "./screens/AuthenticationScreen";
import { setAuthenticated, useAuthenticated } from "./states/authenticated";
import { setResetErrorBoundary } from "./states/resetErrorBoundary";
import { ClientProvider } from "./utils/urql";

export const App = () => {
  const authenticated = useAuthenticated();
  const errorBoundaryRef = React.useRef<ErrorBoundary>(null);

  React.useEffect(() => {
    setResetErrorBoundary(errorBoundaryRef.current?.resetErrorBoundary);
  });

  React.useEffect(() => {
    Storage.getItemOrFail("sessionToken")
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary
        ref={errorBoundaryRef}
        fallbackRender={({ error }: { error?: Error }) => <ErrorView error={error} />}
      >
        <ClientProvider>
          {match(authenticated)
            .with(P.nullish, () => null)
            .with(false, () => <AuthenticationScreen />)
            .with(true, () => <Navigator />)
            .exhaustive()}
        </ClientProvider>
      </ErrorBoundary>

      <AlertStack />
    </SafeAreaProvider>
  );
};
