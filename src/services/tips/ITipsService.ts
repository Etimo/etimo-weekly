export type Tip = {
	id: string;
	text: string;
	receivedAt: string;
};

export interface IFileTipsService {
	saveTip(text: string): Promise<Tip>;
	getTips(): Promise<Tip[]>;
	clearTips(): Promise<void>;
	consumeTips(): Promise<Tip[]>;
}
