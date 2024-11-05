import {
  NavigationContainer as BaseNavigationContainer,
  DefaultTheme,
} from "@react-navigation/native";
import * as React from "react";
import { Platform } from "react-native";
import { NavigationBar, StatusBar } from "react-native-bars";
import BootSplash from "react-native-bootsplash";
import { colors } from "../constants/colors";

const containerTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.gray[50],
  },
};

type Props = {
  children?: React.ReactNode;
};

export const NavigationContainer = ({ children }: Props) => {
  const handleOnReady = React.useCallback(() => {
    const setSystemBarStyles = () => {
      NavigationBar.pushStackEntry({ barStyle: "dark-content" });
      StatusBar.pushStackEntry({ barStyle: "dark-content" });
    };

    void BootSplash.hide({ fade: true }).then(() => {
      // A weird issue occurs on Android 12+ on app restart
      if (Platform.OS !== "android" || Platform.Version < 12) {
        setSystemBarStyles();
      } else {
        setTimeout(setSystemBarStyles, 500);
      }
    });
  }, []);

  return (
    <BaseNavigationContainer theme={containerTheme} onReady={handleOnReady}>
      {children}
    </BaseNavigationContainer>
  );
};
