import { useCallback } from "react";
import { translate, TranslationKey } from "./translate";
import { useI18nStore } from "./store";

export function useTranslation() {
  const language = useI18nStore((s) => s.language);
  const setLanguage = useI18nStore((s) => s.setLanguage);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language]
  );

  return { t, language, setLanguage };
}
