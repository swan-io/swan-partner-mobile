import * as React from "react";
import { Text as BaseText, StyleSheet, TextProps } from "react-native";
import { typography } from "../constants/typography";
import { isNotNullish } from "../utils/nullish";

const alignments = StyleSheet.create({
  center: { textAlign: "center" },
  left: { textAlign: "left" },
  right: { textAlign: "right" },
});

const variants = StyleSheet.create({
  semibold: typography.semibold,
  medium: typography.medium,
  regular: typography.regular,
});

type TextAlign = keyof typeof alignments;
type TextVariant = keyof typeof variants;

type Props = TextProps & {
  align?: TextAlign;
  children: React.ReactNode;
  color?: string;
  variant?: TextVariant;
};

export const Text = React.forwardRef<BaseText, Props>(
  ({ align = "left", children, color, style, variant = "regular", ...props }, forwardedRef) => (
    <BaseText
      ref={forwardedRef}
      style={[variants[variant], style, alignments[align], isNotNullish(color) && { color }]}
      {...props}
    >
      {children}
    </BaseText>
  ),
);
