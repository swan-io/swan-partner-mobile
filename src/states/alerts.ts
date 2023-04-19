import { atom, useAtom } from "react-atomic-state";
import { t } from "../utils/i18n";

let counter = 0;

type Alert = {
  text: string;
  uid: string;
  timeout: NodeJS.Timeout;
};

const state = atom<Alert[]>([]);

export const useAlerts = () => useAtom(state);

export const closeAlert = (uid: string) => {
  state.set((prevState): Alert[] =>
    prevState.filter((alert) => {
      if (alert.uid === uid) {
        clearTimeout(alert.timeout);
      }

      return alert.uid !== uid;
    }),
  );
};

export const showAlert = (text: string) => {
  state.set((prevState): Alert[] => {
    const id = ++counter;
    const uid = `alert-${id}`;

    const timeout = setTimeout(() => {
      closeAlert(uid);
    }, 5000);

    return [...prevState, { text, uid, timeout }];
  });
};

export const handleErrorWithAlert = (error: Error, text = t("error.generic")) => {
  showAlert(text);

  if (__DEV__) {
    console.error(error);
  }
};
