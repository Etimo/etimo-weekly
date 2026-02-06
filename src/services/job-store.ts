export type JobStatus = "pending" | "running" | "completed" | "failed";

export type JobResult = {
	editionNumber: number;
	articleCount: number;
	pdfFilename: string;
	publishedToSlack: boolean;
};

export type Job = {
	id: string;
	status: JobStatus;
	createdAt: string;
	startedAt?: string;
	completedAt?: string;
	options: {
		includeAudio: boolean;
		publishToSlack: boolean;
	};
	result?: JobResult;
	error?: string;
};

class JobStore {
	private jobs = new Map<string, Job>();

	create(options: Job["options"]): Job {
		const job: Job = {
			id: crypto.randomUUID(),
			status: "pending",
			createdAt: new Date().toISOString(),
			options,
		};
		this.jobs.set(job.id, job);
		return job;
	}

	get(id: string): Job | undefined {
		return this.jobs.get(id);
	}

	hasRunningJob(): boolean {
		for (const job of this.jobs.values()) {
			if (job.status === "running") return true;
		}
		return false;
	}

	markRunning(id: string): void {
		const job = this.jobs.get(id);
		if (job) {
			job.status = "running";
			job.startedAt = new Date().toISOString();
		}
	}

	markCompleted(id: string, result: JobResult): void {
		const job = this.jobs.get(id);
		if (job) {
			job.status = "completed";
			job.completedAt = new Date().toISOString();
			job.result = result;
		}
	}

	markFailed(id: string, error: string): void {
		const job = this.jobs.get(id);
		if (job) {
			job.status = "failed";
			job.completedAt = new Date().toISOString();
			job.error = error;
		}
	}
}

export const jobStore = new JobStore();
