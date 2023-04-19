import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { colors } from "../constants/colors";
import { Text } from "./Text";

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    backgroundColor: colors.swan[700],
    borderRadius: 6,
    height: 48,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  small: {
    height: 40,
    paddingHorizontal: 20,
  },
  pressed: {
    backgroundColor: colors.swan[900],
  },
});

type Props = {
  onPress?: () => void;
  title: string;
  variant?: "large" | "small";
};

export const Button = ({ onPress, title, variant = "large" }: Props) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.base,
      variant === "small" && styles.small,
      pressed && styles.pressed,
    ]}
  >
    <Text color={colors.white} variant="semibold">
      {title}
    </Text>
  </Pressable>
);
