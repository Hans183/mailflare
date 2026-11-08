import type { AgentProviderPreset } from "./provider-types";

export const AGENT_SETTINGS_ID = "default";
export const DEFAULT_CLOUDFLARE_MODEL = "@cf/zai-org/glm-4.7-flash";
export const CLOUDFLARE_PRICING_URL = "https://developers.cloudflare.com/workers-ai/platform/pricing/";
export const PROVIDER_BASE_URLS: Record<Exclude<AgentProviderPreset, "custom">, string> = {
	openai: "https://api.openai.com/v1",
	openrouter: "https://openrouter.ai/api/v1",
	groq: "https://api.groq.com/openai/v1",
};
