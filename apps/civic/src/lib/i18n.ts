/**
 * Multilingual content architecture.
 *
 * Translatable text is stored as a JSONB object keyed by locale rather than
 * as bare English strings. One conceptual entity (e.g. the "TIN" page) holds
 * all of its translations; adding a language means adding a key, not
 * duplicating rows or rewriting the schema.
 */

export const SUPPORTED_LOCALES = ["en", "am"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Locales the architecture is prepared for but that ship without UI chrome yet. */
export const FUTURE_LOCALES = ["om", "ti", "so"] as const;

export type LocalizedText = Partial<Record<Locale | (typeof FUTURE_LOCALES)[number], string>>;

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Resolve a localized text object to a display string with locale fallback.
 * Falls back to English, then to the first available translation.
 */
export function lt(text: LocalizedText | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  if (!text) return "";
  const direct = text[locale];
  if (direct && direct.trim().length > 0) return direct;
  const english = text.en;
  if (english && english.trim().length > 0) return english;
  for (const value of Object.values(text)) {
    if (value && value.trim().length > 0) return value;
  }
  return "";
}

/** Convenience constructor for English-only content (seed data, tests). */
export function en(value: string): LocalizedText {
  return { en: value };
}

/** Convenience constructor for bilingual English/Amharic content. */
export function enAm(english: string, amharic?: string): LocalizedText {
  return amharic ? { en: english, am: amharic } : { en: english };
}

export function localeLabel(locale: string): string {
  switch (locale) {
    case "en":
      return "English";
    case "am":
      return "አማርኛ (Amharic)";
    case "om":
      return "Afaan Oromoo";
    case "ti":
      return "ትግርኛ (Tigrinya)";
    case "so":
      return "Soomaali (Somali)";
    default:
      return locale;
  }
}
