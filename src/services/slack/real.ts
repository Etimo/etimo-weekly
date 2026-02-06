import { WebClient } from "@slack/web-api";
import type { SlackChannel, SlackMessage, SlackSearchResult, SlackUser } from "../types.js";
import type { ISlackService } from "./ISlackService.js";

export class RealSlackService implements ISlackService {
	private client: WebClient;

	constructor(token: string) {
		this.client = new WebClient(token);
	}

	async listChannels(limit = 100): Promise<SlackChannel[]> {
		try {
			const result = await this.client.users.conversations({
				types: "public_channel",
				limit,
			});
			console.log(`    [Slack] Bot is member of ${result.channels?.length ?? 0} channels`);
			return (
				result.channels?.map((c) => ({
					id: c.id ?? "",
					name: c.name ?? "",
					topic: c.topic?.value,
					memberCount: (c as { num_members?: number }).num_members,
				})) ?? []
			);
		} catch (error) {
			console.error("    [Slack] Error listing channels:", error);
			return [];
		}
	}

	async listDirectMessageChannels(limit = 100): Promise<SlackChannel[]> {
		try {
			const result = await this.client.users.conversations({
				types: "im",
				limit,
			});
			return (
				result.channels?.map((c) => ({
					id: c.id ?? "",
					name: "Direct Message",
					topic: "Private conversation",
					isIM: true,
				})) ?? []
			);
		} catch (error) {
			console.error("    [Slack] Error listing DMs:", error);
			return [];
		}
	}

	async getChannelHistory(channelId: string, limit = 50, oldest?: string): Promise<SlackMessage[]> {
		try {
			console.log(`    [Slack] Fetching history for channel ${channelId}...`);
			const result = await this.client.conversations.history({
				channel: channelId,
				limit,
				oldest,
			});
			console.log(`    [Slack] Got ${result.messages?.length ?? 0} messages from ${channelId}`);
			return (
				result.messages?.map((m) => ({
					channelId,
					ts: m.ts,
					user: m.user ?? "",
					text: m.text ?? "",
					timestamp: m.ts,
					reactions: m.reactions?.map((r) => ({
						emoji: r.name,
						count: r.count,
						users: r.users,
					})),
					threadReplies: m.reply_count,
				})) ?? []
			);
		} catch (error: unknown) {
			const err = error as { data?: { error?: string } };
			console.error(`    [Slack] Error fetching ${channelId}:`, err.data?.error ?? error);
			return [];
		}
	}

	async getUserInfo(userId: string): Promise<SlackUser | null> {
		try {
			const result = await this.client.users.info({ user: userId });
			return {
				id: result.user?.id ?? userId,
				name: result.user?.real_name ?? result.user?.name ?? userId,
				displayName: result.user?.profile?.display_name,
			};
		} catch (error: unknown) {
			const err = error as { data?: { error?: string } };
			console.error(`    [Slack] Error fetching user ${userId}:`, err.data?.error ?? error);
			return null;
		}
	}

	async searchMessages(query: string, count = 20): Promise<SlackSearchResult[]> {
		try {
			const result = await this.client.search.messages({
				query,
				count,
				sort: "timestamp",
				sort_dir: "desc",
			});
			console.log(`    [Slack] Search found ${result.messages?.matches?.length ?? 0} messages`);
			return (
				result.messages?.matches?.map((m) => ({
					channel: m.channel?.name,
					user: m.user,
					text: m.text,
					timestamp: m.ts,
				})) ?? []
			);
		} catch (error: unknown) {
			const err = error as { data?: { error?: string } };
			console.error("    [Slack] Error searching:", err.data?.error ?? error);
			return [];
		}
	}

	async getThreadReplies(
		channelId: string,
		ts: string,
	): Promise<Array<{ user: string; text: string }>> {
		try {
			console.log(`    [Slack] Fetching thread for ${ts} in ${channelId}...`);
			const result = await this.client.conversations.replies({
				channel: channelId,
				ts,
			});
			const replies = result.messages?.slice(1) ?? [];
			console.log(`    [Slack] Got ${replies.length} replies`);
			return replies.map((m) => ({
				user: m.user ?? "",
				text: m.text ?? "",
			}));
		} catch (error: unknown) {
			const err = error as { data?: { error?: string } };
			console.error(`    [Slack] Error fetching thread ${ts}:`, err.data?.error ?? error);
			return [];
		}
	}
}
