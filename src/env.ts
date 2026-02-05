import { z } from "zod";

const envSchema = z.object({
	// API Keys
	OPENAI_API_KEY: z.string().min(1).optional(),
	SLACK_BOT_TOKEN: z.string().min(1).optional(),
	SLACK_SIGNING_SECRET: z.string().min(1).optional(),

	// Service Configuration
	SERVICES_SLACK: z.enum(["slack", "fake"]).default("slack"),
	SERVICES_LLM: z.enum(["openai", "fake"]).default("openai"),
	SERVICES_TTS: z.enum(["openai", "fake"]).default("openai"),

	// Optional model overrides
	OPENAI_MODEL: z.string().default("gpt-4o"),
	TTS_MODEL: z.string().default("tts-1"),

	// Server
	PORT: z.coerce.number().default(3000),
	NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error("❌ Invalid environment variables:");
		for (const issue of result.error.issues) {
			console.error(`   ${issue.path.join(".")}: ${issue.message}`);
		}
		process.exit(1);
	}

	return result.data;
}

export const env = validateEnv();
