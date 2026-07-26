export const YOU = "you";
export const AI = "ai";
export const MODEL = "model";
export const USER = "user";
export const DB_NAME = "ChatAppDB";
export const CHARACTER = "character";
export const DEFAULT_TEMPRATURE = 0.7;
export const DEFAULT_OUTPUT_TOKENS = 1000;
export const DEFAULT_CHAT_LENGTH = 0;
export const DEFAULT_AI_MODEL = "gemini-2.5-flash";
export const DEFAULT_COMPRESS_THRESHOLD = 0; // 0 means do not compress automatically
export const harmThresholds = [
    { label: "None", value: "BLOCK_NONE" },
    { label: "Low", value: "BLOCK_LOW_AND_ABOVE" },
    { label: "Medium", value: "BLOCK_MEDIUM_AND_ABOVE" },
    { label: "High", value: "BLOCK_ONLY_HIGH" },
  ];
export const DEFAULT_SAFETY_SETTINGS = {
    harassment: "BLOCK_NONE",
    hate_speech: "BLOCK_NONE",
    sexual: "BLOCK_NONE",
    dangerous: "BLOCK_NONE",
};
// Text-generation models. All of the previous 1.x/2.0 lineup has been shut down by
// Google as of mid-2026 — keep this list to models that are actually live, ordered
// with the recommended default first (models[0] is the fallback if nothing is stored).
export const models = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview",
];
// Image-output-capable models, offered separately in the image-generation model
// picker. Kept distinct from `models` because most text models above can't emit images.
export const imageModels = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-lite-image",
  "gemini-3.1-flash-image",
  "gemini-3-pro-image",
];
// Rough USD-per-1M-token rates (standard tier) used only for the in-app cost estimate
// shown next to the token counter — not billing-accurate. Simplifications: pro-tier
// models with >200k-token pricing tiers use their <=200k rate; image models blend
// text + image output into a single rate dominated by the image-token cost, since the
// SDK's usageMetadata doesn't split text vs. image tokens out separately.
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.30, output: 2.50 },
  "gemini-2.5-flash-lite": { input: 0.10, output: 0.40 },
  "gemini-2.5-pro": { input: 1.25, output: 10.00 },
  "gemini-3.5-flash-lite": { input: 0.30, output: 2.50 },
  "gemini-3.5-flash": { input: 1.50, output: 9.00 },
  "gemini-3.6-flash": { input: 1.50, output: 7.50 },
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.50 },
  "gemini-3.1-pro-preview": { input: 2.00, output: 12.00 },
  "gemini-2.5-flash-image": { input: 0.30, output: 30.00 },
  "gemini-3.1-flash-lite-image": { input: 0.25, output: 30.00 },
  "gemini-3.1-flash-image": { input: 0.50, output: 60.00 },
  "gemini-3-pro-image": { input: 2.00, output: 120.00 },
};
// Fallback rate for a custom/unrecognized model string (e.g. hand-entered or from an
// imported settings file) so the estimate stays in a sane ballpark instead of reading $0.
export const DEFAULT_MODEL_PRICING = MODEL_PRICING["gemini-2.5-flash-lite"];
// How many new messages accumulate in a chat before long-term memory extraction
// runs again (independent of the compression threshold, which defaults to off).
export const MEMORY_EXTRACTION_INTERVAL = 12;
// Oldest facts are trimmed once a character's memory list exceeds this size.
export const MAX_MEMORY_ENTRIES = 40;

// Preset 2-color avatar gradients offered when creating/editing a character.
export const CHARACTER_SWATCHES: [string, string][] = [
  ["#10B981", "#0EA5A0"], // Emerald / Teal (default)
  ["#6366F1", "#A855F7"], // Indigo / Purple
  ["#F43F5E", "#FB7185"], // Rose / Pink
  ["#0EA5E9", "#3B82F6"], // Sky / Blue
  ["#1E293B", "#475569"], // Slate / Gray
];

export const ROLE = "role";
export const MESSAGE = "message";
export const LIGHT = "light";
export const DARK = "dark";

// Local storage variables
export const LS_AI_MODEL = "ai_model";
export const LS_COMPRESS_THRESHOLD = "compress_threshold";
export const LS_IMAGE_MODEL = "image_model";
export const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";
export const LS_IMAGE_GEN_PROMPT = "image_gen_prompt";
export const DEFAULT_IMAGE_GEN_PROMPT = "Create a high quality, detailed image.";
export const LS_MAX_OUTPUT_TOKENS = "max_output_tokens";
export const LS_MAX_CHAT_LENGTH = "max_chat_length";
export const LS_TEMPRATURE = "temperature";
export const LS_SAFETY_SETTINGS = "safety_settings";
export const LS_INITIAL_CHAT_MESSAGE = "initial_chat_message";
export const LS_GOOGLE_API_KEY = "google_api_key";
export const LS_THEME = "theme";
export const LS_INITIAL_MESSAGES = "initial_messages";
export const LS_FONT_SIZE = "app_font_size";
export const API_KEY_STORAGE_KEY = "genAI_api_key";
export const LS_IMAGE_RESOLUTION = "image_resolution";

export const IMAGE_RESOLUTIONS = [
  "256x256",
  "512x512",
  "1024x1024"
];
export const DEFAULT_IMAGE_RESOLUTION = "512x512";
export const LS_USER_PROFILE = "whatsgemini_user_profile";
export const LS_USE_SD_WEBUI = "use_sd_webui";
export const LS_SD_WEBUI_API_URL = "sd_webui_api_url";
export const DEFAULT_SD_WEBUI_API_URL = "http://127.0.0.1:7860";
export const LS_SD_WEBUI_BATCH_SIZE = "sd_webui_batch_size";
export const DEFAULT_SD_WEBUI_BATCH_SIZE = 1;
export const LS_SD_WEBUI_REF_MODE = "sd_webui_ref_mode";
export const DEFAULT_SD_WEBUI_REF_MODE = "none";
export const LS_SD_WEBUI_DENOISING = "sd_webui_denoising";
export const DEFAULT_SD_WEBUI_DENOISING = 0.6;
export const LS_SD_WEBUI_CONTROLNET_MODEL = "sd_webui_controlnet_model";
export const DEFAULT_SD_WEBUI_CONTROLNET_MODEL = "ip-adapter_sd15";
export const LS_SD_WEBUI_MODELS = "sd_webui_models";
export const LS_SD_WEBUI_MODEL = "sd_webui_model";
export const DEFAULT_SD_WEBUI_MODEL = "";

// Auto-backup reminder: everything lives only in this browser's IndexedDB,
// so a periodic nudge is the only thing standing between a user and silent
// data loss (cleared cache, browser reinstall, etc).
export const LS_FIRST_USED_AT = "first_used_at";
export const LS_LAST_BACKUP_AT = "last_backup_at";
export const LS_BACKUP_REMINDER_SNOOZE_UNTIL = "backup_reminder_snooze_until";
export const BACKUP_REMINDER_INTERVAL_DAYS = 7;

// Bundled demo character offered on first run, so a brand-new user has
// something to click into immediately instead of a blank character list.
export const SAMPLE_CHARACTER = {
  name: "Aria",
  description: "A warm, witty, endlessly curious companion - happy to chat about anything.",
  prompt:
    "You are Aria: warm, witty, and genuinely curious about the person you're talking to. Ask real follow-up questions, share your own (fictional) opinions and small anecdotes, and keep replies conversational rather than long. You're supportive without being sycophantic, and you have a light, easy sense of humor.",
  relationship: "New Friend",
  accent: CHARACTER_SWATCHES[0],
};
