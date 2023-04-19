import * as React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

const directionStyles = StyleSheet.create({
  columnReverse: { flexDirection: "column-reverse" },
  row: { flexDirection: "row" },
  rowReverse: { flexDirection: "row-reverse" },
});

const alignItemsStyles = StyleSheet.create({
  baseline: { alignItems: "baseline" },
  center: { alignItems: "center" },
  end: { alignItems: "flex-end" },
  start: { alignItems: "flex-start" },
});

const justifyContentStyles = StyleSheet.create({
  center: { justifyContent: "center" },
  end: { justifyContent: "flex-end" },
  start: { justifyContent: "flex-start" },
  spaceBetween: { justifyContent: "space-between" },
  spaceAround: { justifyContent: "space-around" },
  spaceEvenly: { justifyContent: "space-evenly" },
});

type BoxDirection = keyof typeof directionStyles | "column";
type BoxAlignItems = keyof typeof alignItemsStyles | "stretch";
type BoxJustifyContent = keyof typeof justifyContentStyles | "normal";

type Props = ViewProps & {
  alignItems?: BoxAlignItems;
  children?: React.ReactNode;
  direction?: BoxDirection;
  justifyContent?: BoxJustifyContent;
  style?: StyleProp<ViewStyle>;
};

export const Box = React.forwardRef<View, Props>(
  (
    // Default <View /> styles https://github.com/necolas/react-native-web/blob/0.18.7/packages/react-native-web/src/exports/View/index.js#L149
    { alignItems = "stretch", direction = "column", justifyContent = "normal", style, ...props },
    forwardedRef,
  ) => (
    <View
      ref={forwardedRef}
      {...props}
      style={[
        style,
        alignItems !== "stretch" && alignItemsStyles[alignItems],
        direction !== "column" && directionStyles[direction],
        justifyContent !== "normal" && justifyContentStyles[justifyContent],
      ]}
    />
  ),
);
