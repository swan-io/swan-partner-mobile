import { RouteProp } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from "@react-navigation/native-stack";
import * as React from "react";
import { NavigationContainer } from "./components/NavigationContainer";
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

export const Navigator = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="CardList" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CardList" component={CardListScreen} />
      <Stack.Screen name="CardDetails" component={CardDetailsScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
