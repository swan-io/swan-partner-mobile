import { createIntl, createIntlCache } from "@formatjs/intl";
import { findBestLanguageTag } from "react-native-localize";
import translationDE from "../locales/de.json";
import translationEN from "../locales/en.json";
import translationES from "../locales/es.json";
import translationFR from "../locales/fr.json";
import translationIT from "../locales/it.json";
import translationNL from "../locales/nl.json";
import translationPT from "../locales/pt.json";

const LANGUAGE_FALLBACK = "en";

const translations = {
  de: () => translationDE,
  en: () => translationEN,
  es: () => translationES,
  fr: () => translationFR,
  it: () => translationIT,
  nl: () => translationNL,
  pt: () => translationPT,
};

export type SupportedLanguage = keyof typeof translations;
export type TranslationKey = keyof typeof translationEN;

const translationsKeys = Object.keys(translations) as SupportedLanguage[];

export const language: SupportedLanguage =
  findBestLanguageTag(translationsKeys)?.languageTag ?? LANGUAGE_FALLBACK;

const intl = createIntl(
  {
    defaultLocale: LANGUAGE_FALLBACK,
    fallbackOnEmptyString: false,
    locale: language,
    messages: translations[language](),
  },
  createIntlCache(),
);

export const t = (key: TranslationKey, params?: Record<string, string | number>) =>
  intl.formatMessage({ id: key, defaultMessage: translationEN[key] }, params).toString();
