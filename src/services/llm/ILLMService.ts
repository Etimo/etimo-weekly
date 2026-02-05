import type { z } from "zod";
import type { LLMGenerateResult, LLMStep } from "../types.js";

export type GenerateTextOptions = {
	system?: string;
	prompt: string;
};

export type GenerateWithToolsOptions = GenerateTextOptions & {
	tools: Record<string, unknown>;
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
