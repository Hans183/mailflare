import type { AgentModelOption, AgentModelRates, AgentProviderPreset } from "./provider-types";
import { getAgentProviderConfig, resolveAgentBaseUrl } from "./provider";
import { perMillion, selectCloudflareToolModels } from "./provider-models-utils";

// Shown only when the live catalog cannot be read. Prices as published on 2026-11-08.
export const CLOUDFLARE_TOOL_MODELS: AgentModelOption[] = [
	{ id: "@cf/zai-org/glm-4.7-flash", name: "GLM 4.7 Flash", rates: { input: 0.0605, output: 0.4 } },
	{ id: "@cf/openai/gpt-oss-20b", name: "GPT-OSS 20B", rates: { input: 0.2, output: 0.3 } },
	{ id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B", rates: { input: 0.293, output: 2.253 } },
];

// OpenRouter publishes pricing.prompt / pricing.completion as USD per token (strings). Other providers omit pricing.
function openRouterRates(pricing: unknown): AgentModelRates | undefined {
	if (!pricing || typeof pricing !== "object") return undefined;
	const input = perMillion((pricing as { prompt?: unknown }).prompt, true);
	const output = perMillion((pricing as { completion?: unknown }).completion, true);
	return input === null || output === null ? undefined : { input, output };
}

export async function listCloudflareAgentModels(env: CloudflareEnv): Promise<{ models: AgentModelOption[]; source: "catalog" | "suggested" }> {
	if (!env.AI) return { models: CLOUDFLARE_TOOL_MODELS, source: "suggested" };
	try {
		// The binding needs no account ID or token, so every installation gets the live list.
		const models = selectCloudflareToolModels(await env.AI.models({ task: "Text Generation", per_page: 100 }));
		return models.length ? { models, source: "catalog" } : { models: CLOUDFLARE_TOOL_MODELS, source: "suggested" };
	} catch (error) {
		console.error("Could not read the Workers AI catalog", error);
		return { models: CLOUDFLARE_TOOL_MODELS, source: "suggested" };
	}
}

export async function listCompatibleAgentModels(env: CloudflareEnv, input: { preset: AgentProviderPreset; baseUrl: string; apiKey?: string }) {
	const baseUrl = resolveAgentBaseUrl(input.preset, input.baseUrl);
	const saved = await getAgentProviderConfig(env);
	const key = input.apiKey?.trim() || (saved.provider === "compatible" && saved.preset === input.preset && saved.baseUrl === baseUrl ? saved.apiKey : "");
	if (!key) throw new Error("Enter an API key to load models");
	const response = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }, signal: AbortSignal.timeout(10_000), redirect: "manual" });
	if (!response.ok) throw new Error(`Model list request failed (${response.status})`);
	const json = await response.json() as { data?: { id?: unknown; name?: unknown; pricing?: unknown }[] };
	const models = (json.data ?? []).filter((item) => typeof item.id === "string" && item.id.length <= 200).map((item) => ({ id: item.id as string, name: typeof item.name === "string" ? item.name : item.id as string, rates: input.preset === "openrouter" ? openRouterRates(item.pricing) : undefined })).slice(0, 2_000).sort((a, b) => a.name.localeCompare(b.name));
	if (!models.length) throw new Error("Provider returned no models");
	return { models, source: "catalog" as const };
}
