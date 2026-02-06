import type { SlackChannel, SlackMessage, SlackSearchResult, SlackUser } from "../types.js";
import type { CustomEmojiMap, ISlackService } from "./ISlackService.js";

const MOCK_CHANNELS: SlackChannel[] = [
	{ id: "C001", name: "general", topic: "Company-wide announcements", memberCount: 50 },
	{ id: "C002", name: "random", topic: "Non-work chatter", memberCount: 45 },
	{ id: "C003", name: "dev", topic: "Development discussions", memberCount: 20 },
	{ id: "C004", name: "kudos", topic: "Celebrate wins!", memberCount: 40 },
];

const MOCK_USERS: Record<string, SlackUser> = {
	U001: { id: "U001", name: "Anna Andersson", displayName: "Anna" },
	U002: { id: "U002", name: "Erik Eriksson", displayName: "Erik" },
	U003: { id: "U003", name: "Sofia Svensson", displayName: "Sofia" },
	U004: { id: "U004", name: "Marcus Magnusson", displayName: "Marcus" },
	U005: { id: "U005", name: "Lisa Lindgren", displayName: "Lisa" },
	U006: { id: "U006", name: "Johan Johansson", displayName: "Johan" },
};

const MOCK_MESSAGES: Record<string, SlackMessage[]> = {
	C001: [
		{
			channelId: "C001",
			ts: "1707130200.000100",
			user: "U001",
			text: "We just landed the big client deal! 🎉",
			timestamp: "1707130200.000100",
			reactions: [
				{ emoji: "tada", count: 15, users: ["U002", "U003", "U004"] },
				{ emoji: "rocket", count: 8, users: ["U005", "U006"] },
			],
			threadReplies: 3,
		},
		{
			channelId: "C001",
			ts: "1707050000.000200",
			user: "U004",
			text: "Welcome to the team <@U006>! Excited to have you on board.",
			timestamp: "1707050000.000200",
			reactions: [{ emoji: "wave", count: 12, users: ["U001", "U002", "U003"] }],
			threadReplies: 0,
		},
	],
	C002: [
		{
			channelId: "C002",
			ts: "1706961720.000100",
			user: "U002",
			text: "Someone left a mysterious rubber duck on my desk. I'm not complaining, just... confused. 🦆",
			timestamp: "1706961720.000100",
			reactions: [
				{ emoji: "duck", count: 12, users: ["U001", "U003"] },
				{ emoji: "eyes", count: 8, users: ["U004", "U005"] },
			],
			threadReplies: 5,
		},
		{
			channelId: "C002",
			ts: "1706878500.000200",
			user: "U005",
			text: "Did anyone else see <@U006> practicing his presentation to the office plants? Very wholesome. 🌱",
			timestamp: "1706878500.000200",
			reactions: [
				{ emoji: "joy", count: 25, users: ["U001", "U002", "U003", "U004"] },
				{ emoji: "seedling", count: 7, users: ["U002"] },
			],
			threadReplies: 2,
		},
	],
	C003: [
		{
			channelId: "C003",
			ts: "1707238900.000100",
			user: "U003",
			text: "Finally fixed that bug that's been haunting us for 3 weeks. Turns out it was a single semicolon. 🙈",
			timestamp: "1707238900.000100",
			reactions: [
				{ emoji: "raised_hands", count: 20, users: ["U001", "U002", "U004", "U005"] },
				{ emoji: "sweat_smile", count: 5, users: ["U006"] },
			],
			threadReplies: 4,
		},
	],
	C004: [
		{
			channelId: "C004",
			ts: "1707066000.000100",
			user: "U004",
			text: "Big shoutout to <@U005> for staying late to help with the demo prep. You're a legend! 🙏",
			timestamp: "1707066000.000100",
			reactions: [{ emoji: "heart", count: 18, users: ["U001", "U002", "U003", "U006"] }],
			threadReplies: 1,
		},
	],
};

const MOCK_THREAD_REPLIES: Record<string, Array<{ user: string; text: string }>> = {
	"1707130200.000100": [
		{ user: "U002", text: "Amazing news! 🎉" },
		{ user: "U003", text: "Congratulations team!" },
		{ user: "U005", text: "This is huge!" },
	],
	"1706961720.000100": [
		{ user: "U001", text: "I have no idea what you're talking about... 👀" },
		{ user: "U003", text: "The duck has chosen you." },
		{ user: "U004", text: "Embrace the duck." },
		{ user: "U005", text: "One of us. One of us." },
		{ user: "U006", text: "I want a duck too!" },
	],
	"1706878500.000200": [
		{ user: "U006", text: "They're very good listeners!" },
		{ user: "U001", text: "This is adorable 😂" },
	],
	"1707238900.000100": [
		{ user: "U001", text: "The classic semicolon!" },
		{ user: "U004", text: "We've all been there..." },
		{ user: "U005", text: "Time to celebrate! 🎉" },
		{ user: "U002", text: "Now we can finally ship!" },
	],
	"1707066000.000100": [{ user: "U005", text: "Happy to help! Teamwork makes the dream work 💪" }],
};

export class MockSlackService implements ISlackService {
	async listChannels(_limit?: number): Promise<SlackChannel[]> {
		console.log("    [Mock Slack] Returning mock channels");
		return MOCK_CHANNELS;
	}

	async getChannelHistory(
		channelId: string,
		_limit?: number,
		_oldest?: string,
	): Promise<SlackMessage[]> {
		console.log(`    [Mock Slack] Returning mock messages for ${channelId}`);
		return MOCK_MESSAGES[channelId] ?? [];
	}

	async getUserInfo(userId: string): Promise<SlackUser | null> {
		console.log(`    [Mock Slack] Returning mock user for ${userId}`);
		return MOCK_USERS[userId] ?? null;
	}

	async searchMessages(_query: string, _count?: number): Promise<SlackSearchResult[]> {
		console.log("    [Mock Slack] Search not implemented in mock, returning empty");
		return [];
	}

	async getThreadReplies(
		_channelId: string,
		ts: string,
	): Promise<Array<{ user: string; text: string }>> {
		console.log(`    [Mock Slack] Returning mock thread replies for ${ts}`);
		return MOCK_THREAD_REPLIES[ts] ?? [];
	}

	async uploadFile(options: {
		channelId: string;
		filePath: string;
		filename: string;
		title?: string;
		initialComment?: string;
	}): Promise<{ ok: boolean }> {
		console.log(`    [Mock Slack] Would upload ${options.filename} to ${options.channelId}`);
		return { ok: true };
	}

	async getCustomEmojis(): Promise<CustomEmojiMap> {
		console.log("    [Mock Slack] Returning mock custom emojis");
		return {
			parrot: "https://emoji.slack-edge.com/T123/parrot/abc123.gif",
			etimo: "https://emoji.slack-edge.com/T123/etimo/def456.png",
			shipit: "alias:rocket",
		};
	}
}
