import { z } from "zod";

export const SlackMessageSchema = z.object({
	channel: z.string(),
	author: z.string(),
	content: z.string(),
	reactions: z.array(z.object({ emoji: z.string(), count: z.number() })).optional(),
	timestamp: z.string().datetime(),
});

export type SlackMessage = z.infer<typeof SlackMessageSchema>;

export const RawDataInputSchema = z.object({
	slackMessages: z.array(SlackMessageSchema),
	period: z.object({
		start: z.string().datetime(),
		end: z.string().datetime(),
	}),
});

export type RawDataInput = z.infer<typeof RawDataInputSchema>;
