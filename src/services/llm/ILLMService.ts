import type { z } from "zod";
import type { LLMGenerateResult, LLMStep } from "../types.js";
import type { generateText } from "ai";

export type GenerateTextOptions = {
	system?: string;
	prompt: string;
};

export type GenerateWithToolsOptions = GenerateTextOptions & {
	tools: Parameters<typeof generateText>[0]["tools"];
	maxSteps?: number;
};

export type GenerateStructuredOptions<T> = GenerateTextOptions & {
	schema: z.ZodType<T>;
};

export interface ILLMService {
	generateText(options: GenerateTextOptions): Promise<{ text: string }>;

	generateWithTools(options: GenerateWithToolsOptions): Promise<{ text: string; steps: LLMStep[] }>;

	generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<{ output: T | undefined }>;
}
