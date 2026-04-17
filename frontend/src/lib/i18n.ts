import en from "../locales/en.json";
import hi from "../locales/hi.json";
import ta from "../locales/ta.json";
import te from "../locales/te.json";
import kn from "../locales/kn.json";
import bn from "../locales/bn.json";
import as from "../locales/as.json";

export type SupportedLanguage = "en" | "hi" | "ta" | "te" | "kn" | "mr" | "bn" | "as";

type TranslationDict = Record<string, string>;

type TranslationParams = Record<string, string | number>;

const SHARED_8_LANG_OVERRIDES: Record<Exclude<SupportedLanguage, "en" | "hi">, TranslationDict> = {
  ta: {
    nav_home: "முகப்பு",
    nav_payouts: "பேஅவுட்கள்",
    nav_copilot: "கோபைலட்",
    nav_profile: "சுயவிவரம்",
    ask_coverage: "உங்கள் கவரேஜ் பற்றி ஏதும் கேளுங்கள்...",
    this_week: "இந்த வாரம்",
    quick_actions: "விரைவு செயல்கள்",
    payouts_title: "பேஅவுட்கள்",
    sign_out: "வெளியேறு",
    "chat.ai_thinking": "AI யோசிக்கிறது...",
    "chat.listening": "கேட்கிறது...",
    "chat.ai_typing": "AI தட்டச்சு செய்கிறது...",
    "chat.online_monitoring": "AI · ஆன்லைன் · உங்கள் மண்டலத்தை கண்காணிக்கிறது",
    "chat.quick_questions": "விரைவு கேள்விகள்"
  },
  te: {
    nav_home: "హోమ్",
    nav_payouts: "పేఅవుట్స్",
    nav_copilot: "కోపైలట్",
    nav_profile: "ప్రొఫైల్",
    ask_coverage: "మీ కవరేజ్ గురించి ఏదైనా అడగండి...",
    this_week: "ఈ వారం",
    quick_actions: "త్వరిత చర్యలు",
    payouts_title: "పేఅవుట్స్",
    sign_out: "సైన్ అవుట్",
    "chat.ai_thinking": "AI ఆలోచిస్తోంది...",
    "chat.listening": "వింటోంది...",
    "chat.ai_typing": "AI టైప్ చేస్తోంది...",
    "chat.online_monitoring": "AI · ఆన్‌లైన్ · మీ జోన్‌ను పర్యవేక్షిస్తోంది",
    "chat.quick_questions": "త్వరిత ప్రశ్నలు"
  },
  kn: {
    nav_home: "ಮುಖಪುಟ",
    nav_payouts: "ಪಾವತಿಗಳು",
    nav_copilot: "ಕೋಪೈಲಟ್",
    nav_profile: "ಪ್ರೊಫೈಲ್",
    ask_coverage: "ನಿಮ್ಮ ಕವರೆಜ್ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...",
    this_week: "ಈ ವಾರ",
    quick_actions: "ತ್ವರಿತ ಕ್ರಿಯೆಗಳು",
    payouts_title: "ಪಾವತಿಗಳು",
    sign_out: "ಸೈನ್ ಔಟ್",
    "chat.ai_thinking": "AI ಯೋಚಿಸುತ್ತಿದೆ...",
    "chat.listening": "ಕೆಳಗುತ್ತಿದೆ...",
    "chat.ai_typing": "AI ಟೈಪ್ ಮಾಡುತ್ತಿದೆ...",
    "chat.online_monitoring": "AI · ಆನ್‌ಲೈನ್ · ನಿಮ್ಮ ವಲಯವನ್ನು ನಿಗಾ ಮಾಡುತ್ತಿದೆ",
    "chat.quick_questions": "ವೇಗದ ಪ್ರಶ್ನೆಗಳು"
  },
  mr: {
    nav_home: "मुख्यपृष्ठ",
    nav_payouts: "पेमेन्ट्स",
    nav_copilot: "कोपायलट",
    nav_profile: "प्रोफाइल",
    ask_coverage: "तुमच्या कव्हरेजबद्दल काहीही विचारा...",
    this_week: "या आठवड्यात",
    quick_actions: "त्वरित कृती",
    payouts_title: "पेमेन्ट्स",
    sign_out: "साइन आउट",
    "chat.ai_thinking": "AI विचार करत आहे...",
    "chat.listening": "ऐकत आहे...",
    "chat.ai_typing": "AI टाइप करत आहे...",
    "chat.online_monitoring": "AI · ऑनलाइन · तुमच्या झोनचे निरीक्षण करत आहे",
    "chat.quick_questions": "त्वरित प्रश्न"
  },
  bn: {
    nav_home: "হোম",
    nav_payouts: "পেআউট",
    nav_copilot: "কোপাইলট",
    nav_profile: "প্রোফাইল",
    ask_coverage: "আপনার কভারেজ সম্পর্কে কিছু জিজ্ঞাসা করুন...",
    this_week: "এই সপ্তাহ",
    quick_actions: "দ্রুত অ্যাকশন",
    payouts_title: "পেআউট",
    sign_out: "সাইন আউট",
    "chat.ai_thinking": "AI ভাবছে...",
    "chat.listening": "শুনছে...",
    "chat.ai_typing": "AI টাইপ করছে...",
    "chat.online_monitoring": "AI · অনলাইন · আপনার জোন মনিটর করছে",
    "chat.quick_questions": "দ্রুত প্রশ্ন"
  },
  as: {
    nav_home: "হোম",
    nav_payouts: "পেমেন্ট",
    nav_copilot: "কোপাইলট",
    nav_profile: "প্ৰফাইল",
    ask_coverage: "আপোনাৰ কভাৰেজ বিষয়ে কিবা সোধক...",
    this_week: "এই সপ্তাহ",
    quick_actions: "দ্ৰুত কাৰ্যসমূহ",
    payouts_title: "পেমেন্ট",
    sign_out: "ছাইন আউট",
    "chat.ai_thinking": "AI চিন্তা কৰি আছে...",
    "chat.listening": "শুনি আছে...",
    "chat.ai_typing": "AI টাইপ কৰি আছে...",
    "chat.online_monitoring": "AI · অনলাইন · আপোনাৰ জ'ন পৰ্যবেক্ষণ কৰি আছে",
    "chat.quick_questions": "দ্ৰুত প্ৰশ্ন"
  },
};

const resources: Record<SupportedLanguage, TranslationDict> = {
  en: en as TranslationDict,
  hi: hi as TranslationDict,
  ta: { ...(en as TranslationDict), ...(ta as TranslationDict), ...SHARED_8_LANG_OVERRIDES.ta },
  te: { ...(en as TranslationDict), ...(te as TranslationDict), ...SHARED_8_LANG_OVERRIDES.te },
  kn: { ...(en as TranslationDict), ...(kn as TranslationDict), ...SHARED_8_LANG_OVERRIDES.kn },
  mr: { ...(en as TranslationDict), ...SHARED_8_LANG_OVERRIDES.mr },
  bn: { ...(en as TranslationDict), ...(bn as TranslationDict), ...SHARED_8_LANG_OVERRIDES.bn },
  as: { ...(en as TranslationDict), ...(as as TranslationDict), ...SHARED_8_LANG_OVERRIDES.as },
};

function normalizeLanguage(language?: string): SupportedLanguage {
  if (language === "hi" || language === "ta" || language === "te" || language === "kn" || language === "mr" || language === "bn" || language === "as") {
    return language;
  }
  return "en";
}

function resolveKey(dict: TranslationDict, key: string): string | undefined {
  if (dict[key]) return dict[key];

  const underscoreKey = key.replace(/\./g, "_");
  if (dict[underscoreKey]) return dict[underscoreKey];

  return undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;

  return Object.entries(params).reduce((acc, [paramKey, value]) => {
    return acc.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(value));
  }, template);
}

export function t(language: string, key: string, params?: TranslationParams): string {
  const lang = normalizeLanguage(language);
  const current = resolveKey(resources[lang], key);
  const fallback = resolveKey(resources.en, key);
  const value = current ?? fallback ?? key;
  return interpolate(value, params);
}
