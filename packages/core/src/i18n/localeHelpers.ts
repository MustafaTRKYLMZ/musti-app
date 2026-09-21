import type { LanguageCode } from "./translate";

/** BCP 47 tag for date/time formatting in RN and dayjs. */
export function toAppLocale(language: LanguageCode): string {
  switch (language) {
    case "tr":
      return "tr";
    case "nl":
      return "nl";
    default:
      return "en";
  }
}

export function toBcp47(language: LanguageCode): string {
  switch (language) {
    case "tr":
      return "tr-TR";
    case "nl":
      return "nl-NL";
    default:
      return "en-US";
  }
}
