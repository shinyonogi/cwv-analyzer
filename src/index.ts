import { Browser, Page } from "puppeteer";

// Importing helper functions from other modules
import { readTrancoRankingsCsv, initializeVitalsReportCsv, writeVitalsToCsv } from "./csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./browserSessionManager.js";
import { measureCWVOnBrowserPage } from "./coreWebVitalsAuditor.js";


// File paths for the CSV files
const TRANCO_CSV_FILE_PATH: string = './csvData/top-1m.csv';
const VITALS_REPORT_CSV_FILE_PATH: string = './csvData/CoreWebVitalsReport.csv';


// Interfaces for Tranco List Records and Measured Core Web Vitals Results with Lighthouse
export interface ITrancoRanking {
    rank: number;
    domain: string;
};

export interface ICWVResults {
    lcp: number | undefined;
    fid: number | undefined;
    cls: number | undefined;
};


const main = async () => {
    // Initialize the browser using Puppeteer
    const browser: Browser = await initializeBrowser();

    // Initialize the CSV file for storing the results
    initializeVitalsReportCsv(VITALS_REPORT_CSV_FILE_PATH);

    /*
    Read the domain rankings from the Tranco CSV file within the specified range
    readTrancoRankingCsv() takes 3 arguments: (pathToCsvFile, fromRank, toRank)
    Modify fromRank & toRank to set a different range
    1 <= fromRank <= 1'000'000, 1<= toRank <= 1'000'000 where fromRank <= toRank
    */
    const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10);

    // Iterate over each domain to measure its Core Web Vitals
    for (const rankedDomainEntry of trancoRankings) {
        const { rank, domain } : ITrancoRanking = rankedDomainEntry;

        try {
            // Open a new page in the browser for the current domain
            const page: Page = await openPageWithBrowser(browser, domain);

            // Measure the Core Web Vitals for the opened page
            const measuredCWV: ICWVResults = await measureCWVOnBrowserPage(browser, page);

            // Write the measured values to the CSV file
            writeVitalsToCsv(VITALS_REPORT_CSV_FILE_PATH, rank, domain, measuredCWV);

            // Close the currently opened page
            await closeCurrentPage(page);
        }catch (pageError) {
            console.error(`Error processing domain ${rankedDomainEntry.domain}:`, pageError);

            // In case of an error, write default undefined values for CWV to the CSV file
            const notMeasuredCWV: ICWVResults = {
                lcp: undefined,
                fid: undefined,
                cls: undefined
            }
            writeVitalsToCsv(VITALS_REPORT_CSV_FILE_PATH, rank, domain, notMeasuredCWV);
        }
    }

    // Close the browser after processing all domains
    await closeBrowser(browser);
};

// Execute the main function
main();
