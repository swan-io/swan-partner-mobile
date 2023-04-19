import * as React from "react";
import { StyleSheet, Text, TextProps } from "react-native";
import { Except } from "type-fest";
import { typography } from "../constants/typography";
import { isNotNullish } from "../utils/nullish";

const alignments = StyleSheet.create({
  center: { textAlign: "center" },
  left: { textAlign: "left" },
  right: { textAlign: "right" },
});

const variants = StyleSheet.create({
  h1: typography.h1,
  h2: typography.h2,
  h3: typography.h3,
  h4: typography.h4,
  h5: typography.h5,
});

type HeadingAlign = keyof typeof alignments;
type HeadingVariant = keyof typeof variants;

type Props = Except<TextProps, "accessibilityRole"> & {
  align?: HeadingAlign;
  children: React.ReactNode;
  color?: string;
  variant?: HeadingVariant;
};

export const Heading = React.forwardRef<Text, Props>(
  ({ align = "left", children, color, style, variant = "h1", ...props }, forwardedRef) => (
    <Text
      accessibilityRole="header"
      ref={forwardedRef}
      style={[variants[variant], style, alignments[align], isNotNullish(color) && { color }]}
      {...props}
    >
      {children}
    </Text>
  ),
);
