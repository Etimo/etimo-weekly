import "dotenv/config";
import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env.js";
import { mockEdition } from "./mocks/mock-articles.js";
import { NewspaperEditionSchema } from "./schemas/article.js";
import { renderNewspaper } from "./templates/render.js";

const app = Fastify({
	logger: env.NODE_ENV === "development",
});

// Set up Zod validation
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.get("/", async (_request, reply) => {
	const validated = NewspaperEditionSchema.parse(mockEdition);
	const html = renderNewspaper(validated);
	return reply.type("text/html").send(html);
});

app.get("/api/edition", async () => {
	const validated = NewspaperEditionSchema.parse(mockEdition);
	return validated;
});

async function start() {
	try {
		await app.listen({ port: env.PORT, host: "0.0.0.0" });
		console.log(`📰 Etimo Weekly is running at http://localhost:${env.PORT}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

start();
