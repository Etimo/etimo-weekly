import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Rate limiting for anonymous tips.
 *
 * Since all Slack requests come from Slack's servers (limited IP pool),
 * we rate limit by Slack user ID extracted from the event payload.
 * The user ID is only used for rate limiting and NOT persisted.
 */

/**
 * Extract the rate limit key from a Slack event request.
 * Uses Slack user ID for per-user rate limiting.
 */
function getSlackRateLimitKey(request: FastifyRequest): string {
	const body = request.body as {
		type?: string;
		event?: { user?: string };
	};

	// Allow URL verification challenges to pass without rate limiting
	if (body?.type === "url_verification") {
		return `verification-${Date.now()}`; // Unique key = no rate limiting
	}

	// Rate limit by Slack user ID
	const userId = body?.event?.user;
	if (userId) {
		return `slack-user:${userId}`;
	}

	// Fallback to IP for requests without user context
	return `ip:${request.ip}`;
}

/**
 * Create a rate limit preHandler for Slack tip submissions.
 *
 * Uses an in-memory store keyed by Slack user ID.
 * Limits users to 5 tips per hour to prevent spam.
 */
export function createSlackRateLimitHandler(_fastify: FastifyInstance) {
	// In-memory store for rate limiting (keyed by user)
	const store = new Map<string, { count: number; resetAt: number }>();
	const MAX_REQUESTS = 5;
	const WINDOW_MS = 60 * 60 * 1000; // 1 hour

	return async function rateLimitHandler(
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		const key = getSlackRateLimitKey(request);

		// Skip rate limiting for URL verification (unique key each time)
		if (key.startsWith("verification-")) {
			return;
		}

		const now = Date.now();
		let record = store.get(key);

		// Clean up expired record
		if (record && record.resetAt <= now) {
			store.delete(key);
			record = undefined;
		}

		if (!record) {
			// First request from this user
			store.set(key, { count: 1, resetAt: now + WINDOW_MS });
			return;
		}

		// Increment count
		record.count++;

		if (record.count > MAX_REQUESTS) {
			const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
			const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

			reply.header("Retry-After", retryAfterSeconds.toString());
			reply.status(429).send({
				statusCode: 429,
				error: "Too Many Requests",
				message: `Du har skickat för många tips. Vänta ${retryAfterMinutes} minuter innan du skickar fler.`,
			});
		}
	};
}
