export type Tip = {
	id: string;
	text: string;
	receivedAt: string;
	consumed?: boolean;
	consumedByEdition?: number;
	consumedAt?: string;
};

export interface ITipsRepository {
	saveTip(text: string): Promise<Tip>;
	getTips(): Promise<Tip[]>;
	clearTips(): Promise<void>;
	consumeTips(editionNumber: number): Promise<Tip[]>;
}
