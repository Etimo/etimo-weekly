import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../env.js";

const PUBLIC_PREFIXES = ["/slack/", "/docs", "/documentation"];

export async function apiKeyPlugin(fastify: FastifyInstance): Promise<void> {
	if (!env.API_KEY) {
		fastify.log.warn("API_KEY not set — all routes are unprotected");
		return;
	}

	fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
		if (PUBLIC_PREFIXES.some((p) => request.url.startsWith(p))) {
			return;
		}

		const key = request.headers["x-api-key"];
		if (key !== env.API_KEY) {
			return reply.status(401).send({ error: "Invalid or missing API key" });
		}
	});
}
