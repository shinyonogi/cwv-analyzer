import { Browser, Page } from "puppeteer";

import { readTrancoRankingsCsv, initializeVitalsReportCsv, writeVitalsToCsv } from "./csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./browserSessionManager.js";
import { measureCWVOnBrowserPage } from "./coreWebVitalsAuditor.js";

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
 * 1. Initializes a Puppeteer browser instance for web page interactions.
 * 2. Prepares a CSV file for recording Core Web Vitals metrics.
 * 3. Reads a specified range of domain rankings from the Tranco CSV file.
 * 4. For each domain, it opens the page, measures Core Web Vitals using Lighthouse, and records the results in the CSV file.
 * 5. If an error occurs while processing a domain, it records default ('undefined') metrics for that domain in the CSV file.
 * 6. Closes each page after processing and shuts down the browser after all domains are processed.
 */
const main = async () => {
    const browser: Browser = await initializeBrowser();

    initializeVitalsReportCsv(VITALS_REPORT_CSV_FILE_PATH);

    const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10);

    for (const rankedDomainEntry of trancoRankings) {
        const { rank, domain } : ITrancoRanking = rankedDomainEntry;

        try {
            const page: Page = await openPageWithBrowser(browser, domain);

            const measuredCWV: ICWVResults = await measureCWVOnBrowserPage(browser, page);

            writeVitalsToCsv(VITALS_REPORT_CSV_FILE_PATH, rank, domain, measuredCWV);

            await closeCurrentPage(page);
        }catch (pageError) {
            console.error(`Error processing domain ${rankedDomainEntry.domain}:`, pageError);

            const notMeasuredCWV: ICWVResults = {
                lcp: undefined,
                fid: undefined,
                cls: undefined
            }
            writeVitalsToCsv(VITALS_REPORT_CSV_FILE_PATH, rank, domain, notMeasuredCWV);
        }
    }

    await closeBrowser(browser);
};

// Entry Point
main();
