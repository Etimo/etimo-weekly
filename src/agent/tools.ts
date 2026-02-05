import { WebClient } from "@slack/web-api";
import { tool } from "ai";
import { z } from "zod";

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export const slackTools = {
	listChannels: tool({
		description: "List public channels in the Slack workspace that the bot is a member of",
		inputSchema: z.object({
			limit: z.number().optional().default(100).describe("Max channels to return"),
		}),
		execute: async ({ limit }) => {
			try {
				// Only get channels the bot is a member of
				const result = await slack.users.conversations({
					types: "public_channel",
					limit,
				});
				console.log(`    [Slack] Bot is member of ${result.channels?.length ?? 0} channels`);
				return (
					result.channels?.map((c) => ({
						id: c.id,
						name: c.name,
						topic: c.topic?.value,
						memberCount: (c as { num_members?: number }).num_members,
					})) ?? []
				);
			} catch (error) {
				console.error("    [Slack] Error listing channels:", error);
				return { error: String(error) };
			}
		},
	}),

	getChannelHistory: tool({
		description: "Get recent messages from a Slack channel",
		inputSchema: z.object({
			channelId: z.string().describe("The channel ID (e.g., C01234567)"),
			limit: z.number().optional().default(50).describe("Max messages to return"),
			oldest: z.string().optional().describe("Only messages after this Unix timestamp"),
		}),
		execute: async ({ channelId, limit, oldest }) => {
			try {
				console.log(`    [Slack] Fetching history for channel ${channelId}...`);
				const result = await slack.conversations.history({
					channel: channelId,
					limit,
					oldest,
				});
				console.log(`    [Slack] Got ${result.messages?.length ?? 0} messages from ${channelId}`);
				return (
					result.messages?.map((m) => ({
						channelId,
						ts: m.ts,
						user: m.user,
						text: m.text,
						timestamp: m.ts,
						reactions: m.reactions?.map((r) => ({ emoji: r.name, count: r.count })),
						threadReplies: m.reply_count,
					})) ?? []
				);
			} catch (error: unknown) {
				const err = error as { data?: { error?: string } };
				console.error(`    [Slack] Error fetching ${channelId}:`, err.data?.error ?? error);
				return { error: err.data?.error ?? String(error) };
			}
		},
	}),

	getUserInfo: tool({
		description: "Get information about a Slack user by their ID",
		inputSchema: z.object({
			userId: z.string().describe("The user ID (e.g., U01234567)"),
		}),
		execute: async ({ userId }) => {
			try {
				const result = await slack.users.info({ user: userId });
				return {
					id: result.user?.id,
					name: result.user?.real_name ?? result.user?.name,
					displayName: result.user?.profile?.display_name,
				};
			} catch (error: unknown) {
				const err = error as { data?: { error?: string } };
				console.error(`    [Slack] Error fetching user ${userId}:`, err.data?.error ?? error);
				return { error: err.data?.error ?? String(error) };
			}
		},
	}),

	searchMessages: tool({
		description: "Search for messages across the workspace",
		inputSchema: z.object({
			query: z.string().describe("Search query"),
			count: z.number().optional().default(20).describe("Max results"),
		}),
		execute: async ({ query, count }) => {
			try {
				const result = await slack.search.messages({
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
				return { error: err.data?.error ?? String(error) };
			}
		},
	}),

	getThreadReplies: tool({
		description: "Get the full conversation thread for a message",
		inputSchema: z.object({
			channelId: z.string().describe("The channel ID"),
			ts: z.string().describe("The timestamp of the parent message (acts as ID)"),
		}),
		execute: async ({ channelId, ts }) => {
			try {
				console.log(`    [Slack] Fetching thread for ${ts} in ${channelId}...`);
				const result = await slack.conversations.replies({
					channel: channelId,
					ts,
				});
				// Filter out the parent message (first one) to avoid duplication
				const replies = result.messages?.slice(1) ?? [];
				console.log(`    [Slack] Got ${replies.length} replies`);
				return (
					replies.map((m) => ({
						user: m.user,
						text: m.text,
						timestamp: m.ts,
					})) ?? []
				);
			} catch (error: unknown) {
				const err = error as { data?: { error?: string } };
				console.error(`    [Slack] Error fetching thread ${ts}:`, err.data?.error ?? error);
				return { error: err.data?.error ?? String(error) };
			}
		},
	}),
};
