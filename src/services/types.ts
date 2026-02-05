// Slack types
export type SlackChannel = {
	id: string;
	name: string;
	topic?: string;
	memberCount?: number;
};

export type SlackMessage = {
	channelId?: string;
	ts?: string;
	user: string;
	text: string;
	timestamp?: string;
	reactions?: Array<{ emoji?: string; count?: number; users?: string[] }>;
	threadReplies?: number;
	replies?: Array<{ user: string; text: string }>;
};

export type SlackUser = {
	id: string;
	name: string;
	displayName?: string;
};

export type SlackSearchResult = {
	channel?: string;
	user?: string;
	text?: string;
	timestamp?: string;
};

// LLM types
export type LLMToolResult = {
	toolName: string;
	toolCallId: string;
	output: unknown;
};

export type LLMStep = {
	toolCalls?: Array<{ toolCallId: string; toolName: string; args: unknown }>;
	toolResults?: LLMToolResult[];
};

export type LLMGenerateResult<T = unknown> = {
	text: string;
	steps: LLMStep[];
	output?: T;
};
