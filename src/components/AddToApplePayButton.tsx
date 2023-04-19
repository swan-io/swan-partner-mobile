import * as React from "react";
import {
  AccessibilityProps,
  requireNativeComponent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

const styles = StyleSheet.create({
  base: {
    height: 48,
    width: 190,
  },
});

const RNApplePayButton = requireNativeComponent<{
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}>("RNApplePayButton");

type Props = AccessibilityProps & {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const AddToApplePayButton = ({ onPress, style, ...props }: Props) => (
  <RNApplePayButton onPress={onPress} style={[styles.base, style]} {...props} />
);
