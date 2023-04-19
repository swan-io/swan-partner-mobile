import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { isNotNullish, isNullish } from "../utils/nullish";
import { SpacingValue, spacingValues } from "./Space";

const rawHeightStyles: Record<number, ViewStyle> = {};
const rawWidthStyles: Record<number, ViewStyle> = {};

spacingValues.forEach((value) => {
  rawHeightStyles[value] = {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: value,
  };
  rawWidthStyles[value] = {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: value,
  };
});

const heightStyles = StyleSheet.create(rawHeightStyles);
const widthStyles = StyleSheet.create(rawWidthStyles);

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  minHeight?: SpacingValue;
  minWidth?: SpacingValue;
};

export const Fill = ({ minHeight, minWidth }: Props) => (
  <View
    accessibilityRole="none"
    focusable={false}
    pointerEvents="none"
    style={[
      isNotNullish(minHeight) && heightStyles[minHeight],
      isNotNullish(minWidth) && widthStyles[minWidth],
      isNullish(minHeight) && isNullish(minWidth) && styles.fill,
    ]}
  />
);
