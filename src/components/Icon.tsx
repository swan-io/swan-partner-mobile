import * as React from "react";
import { AccessibilityProps, StyleProp, ViewProps, ViewStyle } from "react-native";
import { Path, Svg } from "react-native-svg";
import { colors } from "../constants/colors";

const paths = {
  // Microsoft Fluent
  "chevron-right":
    "M8.3 4.3a1 1 0 000 1.4l6.29 6.3-6.3 6.3a1 1 0 101.42 1.4l7-7a1 1 0 000-1.4l-7-7a1 1 0 00-1.42 0z",
  "dismiss-circle":
    "M12 2a10 10 0 110 20 10 10 0 010-20zm0 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm3.45 4.9l.08.07c.27.27.3.68.07.98l-.07.08L13.06 12l2.47 2.47c.27.27.3.68.07.98l-.07.08a.75.75 0 01-.98.07l-.08-.07L12 13.06l-2.47 2.47a.75.75 0 01-.98.07l-.08-.07a.75.75 0 01-.07-.98l.07-.08L10.94 12 8.47 9.53a.75.75 0 01-.07-.98l.07-.08a.75.75 0 01.98-.07l.08.07L12 10.94l2.47-2.47a.75.75 0 01.98-.07z",
  "sign-out":
    "M12 4.55v6.65h7.44l-1.72-1.72a.75.75 0 01-.07-.98l.07-.08a.75.75 0 01.98-.07l.08.07 3 3c.26.26.29.68.07.97l-.07.09-3 3a.75.75 0 01-1.13-.98l.07-.08 1.71-1.72H12v6.75c0 .46-.42.82-.88.74l-8.5-1.5a.75.75 0 01-.62-.74v-12c0-.37.27-.68.63-.74l8.5-1.4c.46-.07.87.28.87.74zm2.51 9.15v4.25c0 .38-.27.7-.64.74H13v-5h1.51zm-4-8.26l-7 1.14v10.74l7 1.23V5.44zm-2 6.26a1 1 0 110 2 1 1 0 010-2zm5.24-6.5c.38 0 .69.28.74.65v.1l.01 4.25H13v-5h.75z",
};

type Props = AccessibilityProps & {
  color?: string;
  name: keyof typeof paths;
  pointerEvents?: ViewProps["pointerEvents"];
  size: number;
  style?: StyleProp<ViewStyle>;
};

export const Icon = React.memo<Props>(
  ({ name, color = colors.black, size, pointerEvents = "none", style, ...props }) => (
    <Svg
      pointerEvents={pointerEvents}
      viewBox="0 0 24 24"
      style={[{ height: size, width: size }, style]}
      {...props}
    >
      <Path d={paths[name]} fill={color} />
    </Svg>
  ),
);
