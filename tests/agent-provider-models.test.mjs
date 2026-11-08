import assert from "node:assert/strict";
import test from "node:test";
import { cloudflareRates, selectCloudflareToolModels } from "../src/lib/agent/provider-models-utils.ts";

const price = (input, output, cached) => ({
	property_id: "price",
	value: [
		...(cached === undefined ? [] : [{ unit: "per M cached input tokens", price: cached, currency: "USD" }]),
		{ unit: "per M input tokens", price: input, currency: "USD" },
		{ unit: "per M output tokens", price: output, currency: "USD" },
	],
});
const tools = { property_id: "function_calling", value: "true" };
const retiring = { property_id: "planned_deprecation_date", value: "2026-11-20" };

test("keeps current tool-calling models, cheapest first with unpriced ones last", () => {
	const models = selectCloudflareToolModels([
		{ name: "@cf/a/expensive", properties: [tools, price(1, 2)] },
		{ name: "@cf/a/unpriced", properties: [tools] },
		{ name: "@cf/a/cheap", properties: [tools, price(0.1, 0.2)] },
	]);
	assert.deepEqual(models.map((model) => model.id), ["@cf/a/cheap", "@cf/a/expensive", "@cf/a/unpriced"]);
	assert.deepEqual(models[0].rates, { input: 0.1, output: 0.2 });
	assert.equal(models[2].rates, undefined);
});

test("ranks by what the assistant spends, where input outweighs output", () => {
	const models = selectCloudflareToolModels([
		{ name: "@cf/a/low-sum-pricier-input", properties: [tools, price(0.1, 0.3)] },
		{ name: "@cf/a/high-sum-cheaper-input", properties: [tools, price(0.0605, 0.4)] },
	]);
	assert.deepEqual(models.map((model) => model.id), ["@cf/a/high-sum-cheaper-input", "@cf/a/low-sum-pricier-input"]);
});

test("drops models without tool calling, retiring models and known unreliable ones", () => {
	const models = selectCloudflareToolModels([
		{ name: "@cf/a/no-tools", properties: [price(1, 1)] },
		{ name: "@cf/a/retiring", properties: [tools, retiring, price(1, 1)] },
		{ name: "@cf/ibm-granite/granite-4.0-h-micro", properties: [tools] },
		{ name: "workers-ai/not-cloudflare-hosted", properties: [tools] },
	]);
	assert.deepEqual(models, []);
});

test("reads prices from arrays or JSON strings and ignores cached input", () => {
	assert.deepEqual(cloudflareRates([price(0.3, 1.2, 0.006)]), { input: 0.3, output: 1.2 });
	assert.deepEqual(cloudflareRates([{ ...price(0.5, 1), value: JSON.stringify(price(0.5, 1).value) }]), { input: 0.5, output: 1 });
	assert.equal(cloudflareRates([{ property_id: "price", value: "not json" }]), undefined);
});
