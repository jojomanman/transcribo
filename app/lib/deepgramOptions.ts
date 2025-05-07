export type BaseModel = "nova-2" | "nova-3" | "enhanced" | "base";

export interface LanguageOption {
  label: string;
  value: string;
}

export interface SpecializationOption {
  label: string;
  value: string; // "general" or the specific specialization like "meeting"
}

export interface ModelConfig {
  languages: LanguageOption[];
  specializations: SpecializationOption[];
}

export const DEEPGRAM_MODELS_CONFIG: Record<BaseModel, ModelConfig> = {
  "nova-2": {
    languages: [
      { label: "Multilingual (ES+EN)", value: "multi" },
      { label: "Bulgarian (bg)", value: "bg" },
      { label: "Catalan (ca)", value: "ca" },
      { label: "Chinese (Mandarin, Simplified) (zh-CN)", value: "zh-CN" },
      { label: "Chinese (Mandarin, Traditional) (zh-TW)", value: "zh-TW" },
      { label: "Chinese (Cantonese, Traditional) (zh-HK)", value: "zh-HK" },
      { label: "Czech (cs)", value: "cs" },
      { label: "Danish (da)", value: "da" },
      { label: "Dutch (nl)", value: "nl" },
      { label: "English (en)", value: "en" },
      { label: "English (US) (en-US)", value: "en-US" },
      { label: "English (AU) (en-AU)", value: "en-AU" },
      { label: "English (GB) (en-GB)", value: "en-GB" },
      { label: "English (NZ) (en-NZ)", value: "en-NZ" },
      { label: "English (IN) (en-IN)", value: "en-IN" },
      { label: "Estonian (et)", value: "et" },
      { label: "Finnish (fi)", value: "fi" },
      { label: "Flemish (nl-BE)", value: "nl-BE" },
      { label: "French (fr)", value: "fr" },
      { label: "French (CA) (fr-CA)", value: "fr-CA" },
      { label: "German (de)", value: "de" },
      { label: "German (CH) (de-CH)", value: "de-CH" },
      { label: "Greek (el)", value: "el" },
      { label: "Hindi (hi)", value: "hi" },
      { label: "Hungarian (hu)", value: "hu" },
      { label: "Indonesian (id)", value: "id" },
      { label: "Italian (it)", value: "it" },
      { label: "Japanese (ja)", value: "ja" },
      { label: "Korean (ko)", value: "ko" },
      { label: "Latvian (lv)", value: "lv" },
      { label: "Lithuanian (lt)", value: "lt" },
      { label: "Malay (ms)", value: "ms" },
      { label: "Norwegian (no)", value: "no" },
      { label: "Polish (pl)", value: "pl" },
      { label: "Portuguese (pt)", value: "pt" },
      { label: "Portuguese (BR) (pt-BR)", value: "pt-BR" },
      { label: "Portuguese (PT) (pt-PT)", value: "pt-PT" },
      { label: "Romanian (ro)", value: "ro" },
      { label: "Russian (ru)", value: "ru" },
      { label: "Slovak (sk)", value: "sk" },
      { label: "Spanish (es)", value: "es" },
      { label: "Spanish (LatAm) (es-419)", value: "es-419" },
      { label: "Swedish (sv)", value: "sv" },
      { label: "Thai (th)", value: "th" },
      { label: "Turkish (tr)", value: "tr" },
      { label: "Ukrainian (uk)", value: "uk" },
      { label: "Vietnamese (vi)", value: "vi" },
    ],
    specializations: [
      { label: "General", value: "general" },
      { label: "Meeting", value: "meeting" },
      { label: "Phonecall", value: "phonecall" },
      { label: "Finance", value: "finance" },
      { label: "Conversational AI", value: "conversationalai" },
      { label: "Voicemail", value: "voicemail" },
      { label: "Video", value: "video" },
      { label: "Medical", value: "medical" },
      { label: "Drivethru", value: "drivethru" },
      { label: "Automotive", value: "automotive" },
      { label: "Air Traffic Control (ATC)", value: "atc" },
    ],
  },
  "nova-3": {
    languages: [
      { label: "Multilingual (EN, ES, FR, DE, HI, RU, PT, JA, IT, NL)", value: "multi" },
      { label: "English (en)", value: "en" },
      { label: "English (US) (en-US)", value: "en-US" },
      { label: "Spanish (es)", value: "es" },
      { label: "French (fr)", value: "fr" },
      { label: "German (de)", value: "de" },
      { label: "Hindi (hi)", value: "hi" },
      { label: "Russian (ru)", value: "ru" },
      { label: "Portuguese (pt)", value: "pt" },
      { label: "Japanese (ja)", value: "ja" },
      { label: "Italian (it)", value: "it" },
      { label: "Dutch (nl)", value: "nl" },
    ],
    specializations: [
      { label: "General", value: "general" },
      { label: "Medical", value: "medical" },
    ],
  },
  "enhanced": {
    languages: [
      { label: "English (en)", value: "en" },
      { label: "Danish (da)", value: "da" },
      { label: "Dutch (nl)", value: "nl" },
      { label: "Flemish (nl)", value: "nl" }, // Assuming Flemish uses 'nl' as per docs
      { label: "French (fr)", value: "fr" },
      { label: "German (de)", value: "de" },
      { label: "Hindi (hi)", value: "hi" },
      { label: "Italian (it)", value: "it" },
      { label: "Japanese (ja)", value: "ja" },
      { label: "Korean (ko)", value: "ko" },
      { label: "Norwegian (no)", value: "no" },
      { label: "Polish (pl)", value: "pl" },
      { label: "Portuguese (pt)", value: "pt" },
      { label: "Portuguese (BR) (pt-BR)", value: "pt-BR" },
      { label: "Portuguese (PT) (pt-PT)", value: "pt-PT" },
      { label: "Spanish (es)", value: "es" },
      { label: "Spanish (LatAm) (es-419)", value: "es-419" }, // es-LATAM is also listed
      { label: "Swedish (sv)", value: "sv" },
      { label: "Tamasheq (taq)", value: "taq" },
      { label: "Tamil (ta)", value: "ta" },
    ],
    specializations: [
      { label: "General", value: "general" },
      { label: "Meeting", value: "meeting" },
      { label: "Phonecall", value: "phonecall" },
      { label: "Finance", value: "finance" },
      // enhanced-<CUSTOM> is mentioned as "All available" - this implies custom models, not predefined specializations.
      // For now, sticking to listed predefined ones.
    ],
  },
  "base": {
    languages: [
      { label: "Chinese (zh)", value: "zh" }, // zh-CN, zh-TW also listed
      { label: "Chinese (CN) (zh-CN)", value: "zh-CN" },
      { label: "Chinese (TW) (zh-TW)", value: "zh-TW" },
      { label: "Danish (da)", value: "da" },
      { label: "Dutch (nl)", value: "nl" },
      { label: "English (en)", value: "en" },
      { label: "English (US) (en-US)", value: "en-US" },
      { label: "Flemish (nl)", value: "nl" }, // Assuming Flemish uses 'nl'
      { label: "French (fr)", value: "fr" },
      { label: "French (CA) (fr-CA)", value: "fr-CA" },
      { label: "German (de)", value: "de" },
      { label: "Hindi (hi)", value: "hi" }, // hi-Latn also listed
      { label: "Hindi (Latin) (hi-Latn)", value: "hi-Latn" },
      { label: "Indonesian (id)", value: "id" },
      { label: "Italian (it)", value: "it" },
      { label: "Japanese (ja)", value: "ja" },
      { label: "Korean (ko)", value: "ko" },
      { label: "Norwegian (no)", value: "no" },
      { label: "Polish (pl)", value: "pl" },
      { label: "Portuguese (pt)", value: "pt" },
      { label: "Portuguese (BR) (pt-BR)", value: "pt-BR" },
      { label: "Portuguese (PT) (pt-PT)", value: "pt-PT" },
      { label: "Russian (ru)", value: "ru" },
      { label: "Spanish (es)", value: "es" },
      { label: "Spanish (LatAm) (es-419)", value: "es-419" }, // es-LATAM also listed
      { label: "Swedish (sv)", value: "sv" },
      { label: "Tamasheq (taq)", value: "taq" },
      { label: "Turkish (tr)", value: "tr" },
      { label: "Ukrainian (uk)", value: "uk" },
    ],
    specializations: [
      { label: "General", value: "general" },
      { label: "Meeting", value: "meeting" },
      { label: "Phonecall", value: "phonecall" },
      { label: "Finance", value: "finance" },
      { label: "Conversational AI", value: "conversationalai" },
      { label: "Voicemail", value: "voicemail" },
      { label: "Video", value: "video" },
    ],
  },
};

export const DEFAULT_MODEL: BaseModel = "nova-2";
export const DEFAULT_LANGUAGE: string = "en";
export const DEFAULT_SPECIALIZATION: string = "general";

export interface DeepgramSettings {
  model: BaseModel;
  language: string;
  specialization: string;
  diarize: boolean;
  dictation: boolean;
  filler_words: boolean;
  interim_results: boolean;
  multichannel: boolean;
  numerals: boolean;
  profanity_filter: boolean;
  punctuate: boolean;
  smart_format: boolean;
  vad_events: boolean;
  highlightConfidence: boolean;
}

export const initialDeepgramSettings: DeepgramSettings = {
  model: DEFAULT_MODEL,
  language: DEFAULT_LANGUAGE,
  specialization: DEFAULT_SPECIALIZATION,
  diarize: false,
  dictation: false,
  filler_words: true,
  interim_results: true,
  multichannel: false,
  numerals: true,
  profanity_filter: true,
  punctuate: true,
  smart_format: true,
  vad_events: false,
  highlightConfidence: true,
};

export const BOOLEAN_OPTIONS_LABELS: Record<keyof Omit<DeepgramSettings, 'model' | 'language' | 'specialization' | 'highlightConfidence'>, string> = {
  diarize: "Diarize (Speaker Separation)",
  dictation: "Dictation Mode",
  filler_words: "Include Filler Words (uh, um)",
  interim_results: "Show Interim Results",
  multichannel: "Multichannel Audio",
  numerals: "Convert Numbers to Digits",
  profanity_filter: "Filter Profanity",
  punctuate: "Enable Punctuation",
  smart_format: "Enable Smart Formatting",
  vad_events: "Enable VAD Events (Voice Activity Detection)",
};