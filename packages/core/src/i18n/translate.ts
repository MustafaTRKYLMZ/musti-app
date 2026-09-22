import { en } from "./locales/en";
import { tr } from "./locales/tr";
import { nl } from "./locales/nl";

export const dictionaries = {
  en,
  tr,
  nl,
} as const;

export type LanguageCode = keyof typeof dictionaries;
export type TranslationKey = keyof typeof en;

export function translate(
  language: LanguageCode,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[language];
  const template = dict[key] ?? dictionaries.en[key] ?? key;
  if (!params) return template;

  return Object.entries(params).reduce(
    (result, [name, value]) =>
      result.replace(new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, "g"), String(value)),
    template
  );
}
