export interface ITTSService {
	generateAudio(text: string, outputPath: string, voice?: string): Promise<void>;
}
