import { Animated } from "react-native";
import { useLazyRef } from "./useLazyRef";

export const useAnimatedValue = (value: number): Animated.Value =>
  useLazyRef(() => new Animated.Value(value)).current;
