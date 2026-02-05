import type { ISlackService } from "./ISlackService.js";
import { MockSlackService } from "./mock.js";
import { RealSlackService } from "./real.js";

export type SlackServiceType = "slack" | "fake";

export class SlackServiceFactory {
	static create(type?: SlackServiceType): ISlackService {
		const serviceType = type ?? SlackServiceFactory.getTypeFromEnv();

		if (serviceType === "fake") {
			console.log("  📦 Slack: using mock service");
			return new MockSlackService();
		}

		const token = process.env.SLACK_BOT_TOKEN;
		if (!token) {
			throw new Error("SLACK_BOT_TOKEN is required when SERVICES_SLACK=slack");
		}
		console.log("  🔌 Slack: using real Slack API");
		return new RealSlackService(token);
	}

	static getTypeFromEnv(): SlackServiceType {
		const value = process.env.SERVICES_SLACK?.toLowerCase();
		if (value === "fake") return "fake";
		return "slack";
	}
}
