import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";

const nonProtectedPrefixes = ["/slack/", "/docs"];

export const apiKeyPlugin = fp(async (fastify: FastifyInstance): Promise<void> => {
	if (!env.API_KEY) {
		fastify.log.warn("API_KEY not set — all routes are unprotected");
		return;
	}

	fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
		if (nonProtectedPrefixes.filter((prefix) => request.url.startsWith(prefix)).length > 0) {
			return;
		}

		const key = request.headers["x-api-key"];
		if (key !== env.API_KEY) {
			return reply.status(401).send({ error: "Invalid or missing API key" });
		}
	});
});
