import { DefaultTheme, NavigationContainer, RouteProp } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import * as React from "react";
import { Platform } from "react-native";
import { NavigationBar, StatusBar } from "react-native-bars";
import BootSplash from "react-native-bootsplash";
import { colors } from "./constants/colors";
import { CardDetailsScreen } from "./screens/CardDetailsScreen";
import { CardListScreen } from "./screens/CardListScreen";

type NavigatorParamList = {
  CardList: undefined;
  CardDetails: {
    cardId: string;
    designUrl: string;
    digitalCardId: string;
    holderName: string;
    lastFourDigits: string;
    textColor: string;
  };
};

export type NavigatorRouteProps<K extends keyof NavigatorParamList> = {
  route: RouteProp<NavigatorParamList, K>;
  navigation: NativeStackNavigationProp<NavigatorParamList, K>;
};

const Stack = createNativeStackNavigator<NavigatorParamList>();

const containerTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.gray[50],
  },
};

export const Navigator = () => {
  const handleOnReady = React.useCallback(() => {
    const setSystemBarStyles = () => {
      NavigationBar.pushStackEntry({ barStyle: "dark-content" });
      StatusBar.pushStackEntry({ barStyle: "dark-content" });
    };

    void BootSplash.hide({ fade: true }).then(() => {
      // A weird issue occurs on Android 12+ on app restart
      Platform.OS !== "android" || Platform.Version < 12
        ? setSystemBarStyles()
        : setTimeout(setSystemBarStyles, 500);
    });
  }, []);

  return (
    <NavigationContainer theme={containerTheme} onReady={handleOnReady}>
      <Stack.Navigator
        initialRouteName="CardList"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="CardList" component={CardListScreen} />
        <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
