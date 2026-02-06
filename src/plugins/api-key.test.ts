import Fastify from "fastify";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../env.js", () => ({ env: { API_KEY: "test-secret-key" } }));

import { apiKeyPlugin } from "./api-key.js";

describe("API Key Plugin", () => {
	const app = Fastify();

	beforeAll(async () => {
		await app.register(apiKeyPlugin);
		app.get("/protected", async () => ({ ok: true }));
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	it("should reject requests without API key", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/protected",
		});

		expect(response.statusCode).toBe(401);
		expect(response.json()).toEqual({ error: "Invalid or missing API key" });
	});

	it("should reject requests with wrong API key", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: { "x-api-key": "wrong-key" },
		});

		expect(response.statusCode).toBe(401);
	});

	it("should allow requests with correct API key", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/protected",
			headers: { "x-api-key": "test-secret-key" },
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ ok: true });
	});
});
