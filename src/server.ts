import "dotenv/config";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env.js";
import { newspaperRoutes } from "./routes/newspaper.js";
import { slackRoutes } from "./routes/slack.js";
import { tipsRoutes } from "./routes/tips.js";

// Extend Fastify request type to include rawBody for Slack signature verification
declare module "fastify" {
	interface FastifyRequest {
		rawBody?: string;
	}
}

const app = Fastify({
	logger: env.NODE_ENV === "development",
});

// Set up Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Swagger documentation
await app.register(fastifySwagger, {
	openapi: {
		info: {
			title: "Etimo Weekly API",
			description: "API for the Etimo Weekly newspaper generator",
			version: "1.0.0",
		},
		tags: [
			{ name: "Newspaper", description: "Newspaper endpoints" },
			{ name: "Slack", description: "Slack integration endpoints" },
			{ name: "Tips", description: "Anonymous tip endpoints (dev only)" },
		],
	},
});

await app.register(fastifySwaggerUi, {
	routePrefix: "/docs",
});

// Store raw body for Slack signature verification
app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
	try {
		const json = JSON.parse(body as string);
		done(null, json);
	} catch (err) {
		done(err as Error, undefined);
	}
});

app.addHook("preHandler", (request, _reply, done) => {
	// Store raw body for signature verification
	if (request.headers["content-type"]?.includes("application/json")) {
		request.rawBody = JSON.stringify(request.body);
	}
	done();
});

// Register routes
app.register(newspaperRoutes);
app.register(slackRoutes);
app.register(tipsRoutes);

async function start() {
	try {
		await app.listen({ port: env.PORT, host: "0.0.0.0" });
		console.log(`📰 Etimo Weekly is running at http://localhost:${env.PORT}`);
		console.log(`   📚 API docs at http://localhost:${env.PORT}/docs`);
		console.log(`   POST /slack/events - Slack Events API webhook`);
		if (env.NODE_ENV !== "production") {
			console.log(`   POST /test/tip     - Test tip submission`);
			console.log(`   GET  /test/tips    - View pending tips`);
		}
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

start();
