import { Platform, TextStyle } from "react-native";
import { colors } from "./colors";

const weight400: TextStyle = {
  fontFamily: Platform.OS === "ios" ? "Inter-Regular" : "Inter",
  fontWeight: "400",
};

const weight500: TextStyle = {
  fontFamily: Platform.OS === "ios" ? "Inter-Medium" : "Inter",
  fontWeight: "500",
};

const weight600: TextStyle = {
  fontFamily: Platform.OS === "ios" ? "Inter-SemiBold" : "Inter",
  fontWeight: "600",
};

const lineHeights = {
  text: 1.65,
  title: 1.25,
};

const getFontSize = (fontSize: number) => ({
  fontSize,
  // Computed by Inter dynamic metrics tool
  letterSpacing: fontSize * -0.009,
});

const getLineHeight = (fontSize: number, type: keyof typeof lineHeights) => ({
  lineHeight: fontSize * lineHeights[type],
});

const getBaseStyle = (fontSize: number): TextStyle => ({
  ...getFontSize(fontSize),
  ...getLineHeight(fontSize, "text"),
  ...weight400,
  backgroundColor: colors.transparent,
  color: colors.gray[500],
  includeFontPadding: false,
  textAlignVertical: "center",
});

const h1: TextStyle = {
  ...getBaseStyle(32),
  ...getLineHeight(32, "title"),
  ...weight400,
  color: colors.gray[900],
};

const h2: TextStyle = {
  ...getBaseStyle(28),
  ...getLineHeight(28, "title"),
  ...weight400,
  color: colors.gray[900],
};

const h3: TextStyle = {
  ...getBaseStyle(20),
  ...getLineHeight(20, "title"),
  ...weight600,
  color: colors.gray[900],
};

const h4: TextStyle = {
  ...getBaseStyle(20),
  ...getLineHeight(20, "title"),
  ...weight400,
  color: colors.gray[900],
};

const h5: TextStyle = {
  ...getBaseStyle(15),
  ...getLineHeight(15, "title"),
  ...weight400,
  color: colors.gray[900],
};

const semibold: TextStyle = {
  ...getBaseStyle(16),
  ...getLineHeight(16, "text"),
  ...weight600,
};

const medium: TextStyle = {
  ...getBaseStyle(16),
  ...getLineHeight(16, "text"),
  ...weight500,
};

const regular: TextStyle = {
  ...getBaseStyle(16),
  ...getLineHeight(16, "text"),
  ...weight400,
};

export const typography = {
  weight400,
  weight500,
  weight600,

  h1,
  h2,
  h3,
  h4,
  h5,

  semibold,
  medium,
  regular,
};
