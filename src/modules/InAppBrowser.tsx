import {
  EmitterSubscription,
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
  processColor,
} from "react-native";
import { StatusBar } from "react-native-bars";
import parseUrl from "url-parse";
import { isNotNullish } from "../utils/nullish";

const CLOSE_EVENT = "inAppBrowserDidClose";

const { RNInAppBrowser } = NativeModules;
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const emitter = new NativeEventEmitter(RNInAppBrowser);

type Options = {
  dismissButtonStyle?: "cancel" | "close" | "done";
  barTintColor?: string;
  controlTintColor?: string;
  onCallback?: (searchParams: Record<string, string | undefined>) => void;
};

const processNativeOptions = (options: Options) => ({
  dismissButtonStyle: options.dismissButtonStyle,
  barTintColor: processColor(options.barTintColor),
  controlTintColor: processColor(options.controlTintColor),
});

const NativeModule = RNInAppBrowser as {
  open: (url: string, options: ReturnType<typeof processNativeOptions>) => Promise<null>;
  close: () => void;
};

export const InAppBrowser = {
  open: (url: string, { onCallback, ...options }: Options = {}) => {
    let listener: EmitterSubscription | undefined;

    return NativeModule.open(url, processNativeOptions(options)).then(() => {
      const entry = StatusBar.pushStackEntry({
        animated: true,
        barStyle:
          Platform.OS === "ios" &&
          (typeof Platform.Version === "string"
            ? Number.parseInt(Platform.Version, 10)
            : Platform.Version) >= 13
            ? "light-content"
            : "dark-content",
      });

      if (isNotNullish(onCallback)) {
        listener = Linking.addListener("url", ({ url }: { url: string }) => {
          InAppBrowser.close();
          onCallback(parseUrl(url, true).query);
        });
      }

      emitter.addListener(CLOSE_EVENT, () => {
        StatusBar.popStackEntry(entry);
        listener?.remove();
        emitter.removeAllListeners(CLOSE_EVENT);
      });
    });
  },
  close: () => {
    NativeModule.close();
  },
};
