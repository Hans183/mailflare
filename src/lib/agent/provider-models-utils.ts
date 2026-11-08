import type { AgentModelOption, AgentModelRates } from "./provider-types";

type CloudflareCatalogModel = { name?: unknown; properties?: unknown };
type CloudflareProperty = { property_id?: unknown; value?: unknown };

// Advertised as function calling, but returned tool arguments as a JSON string inside a JSON string.
const UNRELIABLE_TOOL_MODELS = new Set(["@cf/ibm-granite/granite-4.0-h-micro"]);

export function perMillion(value: unknown, perToken: boolean): number | null {
	const price = typeof value === "string" ? Number(value) : value;
	if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
	return Number((perToken ? price * 1_000_000 : price).toPrecision(10));
}

function catalogProperty(properties: unknown, id: string): unknown {
	if (!Array.isArray(properties)) return undefined;
	return (properties as CloudflareProperty[]).find((item) => item?.property_id === id)?.value;
}

function parsePriceList(value: unknown): { unit?: unknown; price?: unknown; currency?: unknown }[] {
	if (Array.isArray(value)) return value;
	if (typeof value !== "string") return [];
	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch { return []; }
}

// Workers AI lists prices as [{ unit: "per M input tokens", price, currency: "USD" }, ...] under properties.
export function cloudflareRates(properties: unknown): AgentModelRates | undefined {
	const prices = parsePriceList(catalogProperty(properties, "price"));
	const find = (kind: "input" | "output") => prices.find((item) => {
		const unit = String(item?.unit).toLowerCase();
		return item?.currency === "USD" && /per m/.test(unit) && unit.includes(kind) && !unit.includes("cached");
	});
	const input = perMillion(find("input")?.price, false);
	const output = perMillion(find("output")?.price, false);
	return input === null || output === null ? undefined : { input, output };
}

// The assistant resends its context on every step, so it reads far more tokens than it writes.
const INPUT_TOKENS_PER_OUTPUT_TOKEN = 20;

function estimatedCost(model: AgentModelOption) {
	return model.rates ? (model.rates.input ?? 0) * INPUT_TOKENS_PER_OUTPUT_TOKEN + (model.rates.output ?? 0) : Number.POSITIVE_INFINITY;
}

/** Current Cloudflare models the assistant can use: tool calling, no planned retirement, cheapest to run first. */
export function selectCloudflareToolModels(catalog: readonly CloudflareCatalogModel[]): AgentModelOption[] {
	return catalog
		.flatMap((item) => {
			if (typeof item.name !== "string" || !item.name.startsWith("@cf/") || UNRELIABLE_TOOL_MODELS.has(item.name)) return [];
			if (String(catalogProperty(item.properties, "function_calling")) !== "true") return [];
			if (catalogProperty(item.properties, "planned_deprecation_date")) return [];
			return [{ id: item.name, name: item.name, rates: cloudflareRates(item.properties) }];
		})
		.sort((a, b) => estimatedCost(a) - estimatedCost(b) || a.id.localeCompare(b.id));
}
