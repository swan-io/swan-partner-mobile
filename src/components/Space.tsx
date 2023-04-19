import * as React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { isNotNullish } from "../utils/nullish";

export const spacingValues = [4, 8, 12, 16, 20, 24, 32, 40, 48, 72, 96] as const;
export type SpacingValue = (typeof spacingValues)[number];

const rawHeightStyles: { [key: number]: ViewStyle } = {};
const rawWidthStyles: { [key: number]: ViewStyle } = {};

spacingValues.forEach((value) => {
  rawHeightStyles[value] = {
    flexShrink: 0,
    height: value,
  };
  rawWidthStyles[value] = {
    flexShrink: 0,
    width: value,
  };
});

const heightStyles = StyleSheet.create(rawHeightStyles);
const widthStyles = StyleSheet.create(rawWidthStyles);

type Props = {
  height?: SpacingValue;
  width?: SpacingValue;
};

export const Space = ({ height, width }: Props) => (
  <View
    accessibilityRole="none"
    focusable={false}
    pointerEvents="none"
    style={[
      isNotNullish(height) && heightStyles[height],
      isNotNullish(width) && widthStyles[width],
    ]}
  />
);
