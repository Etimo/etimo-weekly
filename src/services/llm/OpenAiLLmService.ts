import { openai } from "@ai-sdk/openai";
import { Output, generateText, stepCountIs } from "ai";
import type { LLMStep } from "../types.js";
import type {
	GenerateStructuredOptions,
	GenerateTextOptions,
	GenerateWithToolsOptions,
	ILLMService,
} from "./ILLMService.js";

export class OpenAiLLMService implements ILLMService {
	private model;

	constructor(modelId = "gpt-4o") {
		this.model = openai(modelId);
	}

	async generateText(options: GenerateTextOptions): Promise<{ text: string }> {
		const result = await generateText({
			model: this.model,
			system: options.system,
			prompt: options.prompt,
		});
		return { text: result.text };
	}

	async generateWithTools(
		options: GenerateWithToolsOptions,
	): Promise<{ text: string; steps: LLMStep[] }> {
		const result = await generateText({
			model: this.model,
			system: options.system,
			prompt: options.prompt,
			tools: options.tools,
			stopWhen: stepCountIs(options.maxSteps ?? 10),
		});

		return {
			text: result.text,
			steps: result.steps.map((step) => ({
				toolCalls: step.toolCalls?.map((tc) => ({
					toolCallId: tc.toolCallId,
					toolName: tc.toolName,
					args: (tc as unknown as { input: unknown }).input,
				})),
				toolResults: step.toolResults?.map((tr) => ({
					toolName: tr.toolName,
					toolCallId: tr.toolCallId,
					output: (tr as unknown as { output: unknown }).output,
				})),
			})),
		};
	}

	async generateStructured<T>(
		options: GenerateStructuredOptions<T>,
	): Promise<{ output: T | undefined }> {
		const result = await generateText({
			model: this.model,
			system: options.system,
			prompt: options.prompt,
			output: Output.object({ schema: options.schema }),
		});

		return { output: result.output as T | undefined };
	}
}
