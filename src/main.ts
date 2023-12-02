import { Browser, Page } from "puppeteer";

import { initializeVitalsReportCsv, readTrancoRankingsCsv, writeVitalsToCsv } from "./core/csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./core/browserSessionManager.js";
import { measureCWVOnBrowserPage } from "./core/coreWebVitalsAuditor.js";

const TRANCO_CSV_FILE_PATH: string = './csvData/top-1m.csv';
const VITALS_REPORT_CSV_FILE_PATH: string = './csvData/CoreWebVitalsReport.csv';

export interface ITrancoRanking {
    rank: number;
    domain: string;
};

export interface ICWVResults {
    lcp: number | undefined;
    fid: number | undefined;
    cls: number | undefined;
};

/**
 * Main function to measure and record Core Web Vitals for specified domains from the Tranco list.
 *
 * Steps:
 * 1. Prepares a CSV file for recording Core Web Vitals metrics.
 * 2. Initializes a Puppeteer browser instance for web page interactions.
 * 3. Reads a specified range of domain rankings from the Tranco CSV file.
 * 4. For each domain, it opens the page, measures Core Web Vitals using Lighthouse, and records the results in the CSV file.
 * 5. If an error occurs while processing a domain, it records default ('undefined') metrics for that domain in the CSV file.
 * 6. Closes each page after processing and shuts down the browser after all domains are processed.
 */
async function main() {
    initializeVitalsReportCsv(VITALS_REPORT_CSV_FILE_PATH);
    const browser: Browser = await initializeBrowser();

    const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
    for (const rankedDomainEntry of trancoRankings) {
        const { rank, domain } : ITrancoRanking = rankedDomainEntry;

        let page: Page | null = null;
        let csvResults: ICWVResults = { lcp: undefined, fid: undefined, cls: undefined }

        try {
            page = await openPageWithBrowser(browser, domain);
            csvResults = await measureCWVOnBrowserPage(browser, page);
        }catch (pageError) {
            console.error(`Error processing domain ${rankedDomainEntry.domain}:`, pageError);
        }finally {
            writeVitalsToCsv(VITALS_REPORT_CSV_FILE_PATH, rank, domain, csvResults);

            if(page) {
                await closeCurrentPage(page);
            }
        }
    }

    await closeBrowser(browser);
}

// Entry Point
main();
