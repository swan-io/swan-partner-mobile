import * as React from "react";
import {
  AccessibilityProps,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SupportedLanguage, language } from "../utils/i18n";

/* eslint-disable @typescript-eslint/no-unsafe-return */
const images: Record<SupportedLanguage, () => ImageSourcePropType> = {
  // bg: () => require("../assets/google-pay-button/bg.png"),
  // ca: () => require("../assets/google-pay-button/ca.png"),
  // cs: () => require("../assets/google-pay-button/cs.png"),
  // da: () => require("../assets/google-pay-button/da.png"),
  de: () => require("../assets/google-pay-button/de.png"),
  // el: () => require("../assets/google-pay-button/el.png"),
  en: () => require("../assets/google-pay-button/en.png"),
  es: () => require("../assets/google-pay-button/es.png"),
  // et: () => require("../assets/google-pay-button/et.png"),
  // fi: () => require("../assets/google-pay-button/fi.png"),
  fr: () => require("../assets/google-pay-button/fr.png"),
  // hr: () => require("../assets/google-pay-button/hr.png"),
  // hu: () => require("../assets/google-pay-button/hu.png"),
  // in: () => require("../assets/google-pay-button/in.png"),
  it: () => require("../assets/google-pay-button/it.png"),
  // ja: () => require("../assets/google-pay-button/ja.png"),
  // ko: () => require("../assets/google-pay-button/ko.png"),
  // lt: () => require("../assets/google-pay-button/lt.png"),
  // lv: () => require("../assets/google-pay-button/lv.png"),
  // ms: () => require("../assets/google-pay-button/ms.png"),
  nl: () => require("../assets/google-pay-button/nl.png"),
  // no: () => require("../assets/google-pay-button/no.png"),
  // pl: () => require("../assets/google-pay-button/pl.png"),
  pt: () => require("../assets/google-pay-button/pt.png"),
  // ro: () => require("../assets/google-pay-button/ro.png"),
  // ru: () => require("../assets/google-pay-button/ru.png"),
  // sk: () => require("../assets/google-pay-button/sk.png"),
  // sl: () => require("../assets/google-pay-button/sl.png"),
  // sr: () => require("../assets/google-pay-button/sr.png"),
  // sv: () => require("../assets/google-pay-button/sv.png"),
  // th: () => require("../assets/google-pay-button/th.png"),
  // tr: () => require("../assets/google-pay-button/tr.png"),
  // uk: () => require("../assets/google-pay-button/uk.png"),
  // zh: () => require("../assets/google-pay-button/zh.png"),
};
/* eslint-enable @typescript-eslint/no-unsafe-return */

const image = images[language]();

const styles = StyleSheet.create({
  base: {
    height: 48,
    width: 190,
  },
});

type Props = AccessibilityProps & {
  onPress: () => void;
  style?: StyleProp<ImageStyle>;
};

export const AddToGooglePayButton = ({ onPress, style, ...props }: Props) => (
  <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
    <Image
      resizeMode="contain"
      source={image}
      fadeDuration={0}
      style={[styles.base, style]}
      {...props}
    />
  </TouchableOpacity>
);
