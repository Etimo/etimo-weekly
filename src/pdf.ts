import puppeteer from "puppeteer";
import type { NewspaperEdition } from "./schemas/article.js";
import { renderNewspaper } from "./templates/render.js";

export interface PdfOptions {
	format?: "Tabloid" | "A3" | "A4" | "Letter";
	landscape?: boolean;
}

const defaultOptions: PdfOptions = {
	format: "Tabloid",
	landscape: false,
};

export async function generatePdf(
	edition: NewspaperEdition,
	outputPath: string,
	options: PdfOptions = {},
): Promise<void> {
	const opts = { ...defaultOptions, ...options };
	const html = renderNewspaper(edition);

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
	});

	try {
		const page = await browser.newPage();

		await page.setContent(html, {
			waitUntil: "networkidle0",
		});

		await page.pdf({
			path: outputPath,
			format: opts.format,
			landscape: opts.landscape,
			printBackground: true,
			preferCSSPageSize: true,
		});

		console.log(`✅ Generated PDF: ${outputPath}`);
	} finally {
		await browser.close();
	}
}

export async function generatePdfFromHtml(
	html: string,
	outputPath: string,
	options: PdfOptions = {},
): Promise<void> {
	const opts = { ...defaultOptions, ...options };

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
	});

	try {
		const page = await browser.newPage();

		await page.setContent(html, {
			waitUntil: "networkidle0",
		});

		await page.pdf({
			path: outputPath,
			format: opts.format,
			landscape: opts.landscape,
			printBackground: true,
			preferCSSPageSize: true,
		});

		console.log(`✅ Generated PDF: ${outputPath}`);
	} finally {
		await browser.close();
	}
}
