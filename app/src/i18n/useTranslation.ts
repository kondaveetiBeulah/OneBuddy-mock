import { useCallback } from "react";
import { translations, TranslationKey } from "./translations";
import { useSettings } from "@/context/SettingsContext";

export function useTranslation() {
  const { state } = useSettings();

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[state.language] ?? translations.en;
      return dict[key] ?? translations.en[key] ?? key;
    },
    [state.language]
  );

  return { t, language: state.language };
}
