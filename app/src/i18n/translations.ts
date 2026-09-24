import { LanguageCode, LanguageOption } from "@/types";

export const LANGUAGES: LanguageOption[] = [
  { code: "en", nativeName: "English", englishName: null },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu" }
];

export type TranslationKey =
  | "settings_title"
  | "settings_autosave"
  | "settings_section_payments"
  | "settings_payments_title"
  | "settings_payments_desc"
  | "settings_section_appearance"
  | "settings_theme_title"
  | "settings_theme_desc"
  | "settings_theme_light"
  | "settings_theme_dark"
  | "settings_theme_system"
  | "settings_section_language"
  | "settings_section_location"
  | "settings_location_title"
  | "settings_location_desc"
  | "settings_section_privacy"
  | "settings_usage_title"
  | "settings_usage_desc"
  | "settings_version"
  | "settings_back"
  | "settings_close"
  | "settings_saved";

type Dictionary = Record<TranslationKey, string>;

export const translations: Record<LanguageCode, Dictionary> = {
  en: {
    settings_title: "App settings",
    settings_autosave: "Changes save automatically across all your OneBuddy services.",
    settings_section_payments: "Payments",
    settings_payments_title: "Payment methods & wallet",
    settings_payments_desc: "Wallet balance, saved cards & UPI handles",
    settings_section_appearance: "Appearance",
    settings_theme_title: "Theme",
    settings_theme_desc: "Choose between light and dark mode",
    settings_theme_light: "Light",
    settings_theme_dark: "Dark",
    settings_theme_system: "System",
    settings_section_language: "Language",
    settings_section_location: "Location",
    settings_location_title: "Location access",
    settings_location_desc: "Find nearby stores and accurate arrival times",
    settings_section_privacy: "Privacy",
    settings_usage_title: "Share usage data",
    settings_usage_desc: "Anonymous data that improves recommendations",
    settings_version: "Version",
    settings_back: "Back",
    settings_close: "Close",
    settings_saved: "Saved"
  },
  hi: {
    settings_title: "ऐप सेटिंग्स",
    settings_autosave: "बदलाव आपकी सभी OneBuddy सेवाओं में अपने आप सेव हो जाते हैं।",
    settings_section_payments: "भुगतान",
    settings_payments_title: "भुगतान के तरीके और वॉलेट",
    settings_payments_desc: "वॉलेट बैलेंस, सहेजे गए कार्ड और UPI आईडी",
    settings_section_appearance: "दिखावट",
    settings_theme_title: "थीम",
    settings_theme_desc: "लाइट और डार्क मोड में से चुनें",
    settings_theme_light: "लाइट",
    settings_theme_dark: "डार्क",
    settings_theme_system: "सिस्टम",
    settings_section_language: "भाषा",
    settings_section_location: "स्थान",
    settings_location_title: "लोकेशन एक्सेस",
    settings_location_desc: "आस-पास के स्टोर और सही पहुंचने का समय जानें",
    settings_section_privacy: "गोपनीयता",
    settings_usage_title: "उपयोग डेटा साझा करें",
    settings_usage_desc: "अनाम डेटा जो सुझावों को बेहतर बनाता है",
    settings_version: "वर्शन",
    settings_back: "वापस",
    settings_close: "बंद करें",
    settings_saved: "सेव हो गया"
  },
  te: {
    settings_title: "యాప్ సెట్టింగ్‌లు",
    settings_autosave: "మార్పులు మీ అన్ని OneBuddy సేవలలో స్వయంచాలకంగా సేవ్ అవుతాయి.",
    settings_section_payments: "చెల్లింపులు",
    settings_payments_title: "చెల్లింపు పద్ధతులు & వాలెట్",
    settings_payments_desc: "వాలెట్ బ్యాలెన్స్, సేవ్ చేసిన కార్డులు మరియు UPI",
    settings_section_appearance: "అప్పియరెన్స్",
    settings_theme_title: "థీమ్",
    settings_theme_desc: "లైట్ మరియు డార్క్ మోడ్ మధ్య ఎంచుకోండి",
    settings_theme_light: "లైట్",
    settings_theme_dark: "డార్క్",
    settings_theme_system: "సిస్టమ్",
    settings_section_language: "భాష",
    settings_section_location: "లొకేషన్",
    settings_location_title: "లొకేషన్ యాక్సెస్",
    settings_location_desc: "సమీప స్టోర్లు మరియు ఖచ్చితమైన రాక సమయాలు తెలుసుకోండి",
    settings_section_privacy: "ప్రైవసీ",
    settings_usage_title: "వినియోగ డేటాను షేర్ చేయండి",
    settings_usage_desc: "సూచనలను మెరుగుపరిచే అనామక డేటా",
    settings_version: "వెర్షన్",
    settings_back: "వెనుకకు",
    settings_close: "మూసివేయండి",
    settings_saved: "సేవ్ అయ్యింది"
  }
};

export function languageLabel(option: LanguageOption): string {
  return option.englishName ? `${option.nativeName} · ${option.englishName}` : option.nativeName;
}
