import type { SlackChannel, SlackMessage, SlackSearchResult, SlackUser } from "../types.js";

// Custom emoji mapping: name -> URL (or alias like "alias:thumbsup")
export type CustomEmojiMap = Record<string, string>;

export interface ISlackService {
	listChannels(limit?: number): Promise<SlackChannel[]>;
	getChannelHistory(channelId: string, limit?: number, oldest?: string): Promise<SlackMessage[]>;
	getUserInfo(userId: string): Promise<SlackUser | null>;
	searchMessages(query: string, count?: number): Promise<SlackSearchResult[]>;
	getThreadReplies(channelId: string, ts: string): Promise<Array<{ user: string; text: string }>>;
	getCustomEmojis(): Promise<CustomEmojiMap>;
}
