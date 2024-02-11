// Import dotenv for environment variable management: Google Cloud API Key
import * as dotenv from 'dotenv';
dotenv.config();

import { Browser } from "puppeteer";
import {
    initializeValidLinksCsv,
    initializeVitalsReportCsv,
    readTrancoRankingsCsv,
    writeVitalsToCsv,
    writeValidLinkToCsv,
    readValidLinksCsv,
    getRowCountCsv,
    writeVisitedDomainToCsv
} from "./core/csvFileManager.js";
import { initializeBrowser, closeBrowser } from "./core/browserSessionManager.js";
import measureCWVWithPuppeteerAndLighthouse from "./core/lighthouseVitalsAuditor.js";
import { ICrUXCWVResults, fetchCWVFromCrUX} from "./core/cruxVitalsReporter.js";

// File paths for CSV data files
const TRANCO_CSV_FILE_PATH: string = './data/top-1m.csv';
const LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportLighthouse.csv';
const CRUX_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportCrUX.csv';
const CRUX_VALID_LINKS_CSV_FILE_PATH: string = './data/util/ValidLinks.csv';
const CRAWLER_VISITED_CSV_FILE_PATH: string = './data/util/CrawlerVisited.csv';

// Interface definitions for data structures used
export interface ITrancoRanking {
    rank: number;
    domain: string;
};
export interface ICWVResults {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
};

export interface IValidLinks {
    domain: string;
    validLink: string;
};

process.on('SIGINT', () => {
    console.log('SIGINT signal received. Shutting down...');
    process.exit(0);
});

function timeout(ms: number): Promise<void> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

async function performDataRetrievalCWVWithCrUX(): Promise<void> {
  console.log("Starting Data Retrieval with CrUX...");

  initializeVitalsReportCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH);
  initializeValidLinksCsv(CRUX_VALID_LINKS_CSV_FILE_PATH);

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 100000);
  for (const { rank, domain } of trancoRankings) {
      const crUXCWVResults: ICrUXCWVResults = await fetchCWVFromCrUX(domain);
      const { lcp, fid, cls, validLink } = crUXCWVResults;

      if (validLink) { // If CrUX succesfully reponded, the link is valid and existent
          writeVitalsToCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH, rank, domain, { lcp, fid, cls });
          writeValidLinkToCsv(CRUX_VALID_LINKS_CSV_FILE_PATH, domain, validLink);
      }else { // If CrUX did not respond, the link is considered invalid and the CWV data is set to null
          writeVitalsToCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH, rank, domain, { lcp: null, fid: null, cls: null });
          writeValidLinkToCsv(CRUX_VALID_LINKS_CSV_FILE_PATH, domain, 'null');
      }
  }
}

async function crawlAndMeasureCWVWithPuppeeteerAndLighthouse(): Promise<void> {
    console.log('Starting Measuring with Puppeteer and Ligthouse...');

    //let numerOfVisitingAttemptsWithCrawler: number = await getRowCountCsv(CRAWLER_VISITED_CSV_FILE_PATH);
    //let numerOfSuccessfulMeasurement: number = await getRowCountCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH);
    let numerOfVisitingAttemptsWithCrawler: number = 0;
    let numerOfSuccessfulMeasurement: number  = 0;

    initializeVitalsReportCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH);
    let browser: Browser = await initializeBrowser();

    const validLinks: IValidLinks[] = await readValidLinksCsv(CRUX_VALID_LINKS_CSV_FILE_PATH);
    for (const [index, { domain, validLink }] of validLinks.entries()) {
        try {
            if (index <= numerOfSuccessfulMeasurement) continue;

            // This condition is to prevent the crawler from visiting the same domain that resulted in an error
            if (numerOfSuccessfulMeasurement < numerOfVisitingAttemptsWithCrawler) {
                writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, index, domain, { lcp: null, fid: null, cls: null });
                numerOfSuccessfulMeasurement++;
                continue;
            }

            writeVisitedDomainToCsv(CRAWLER_VISITED_CSV_FILE_PATH, domain);
            numerOfVisitingAttemptsWithCrawler++;

            try {
                const puppeteerAndLighthouseCWVResults: ICWVResults | void = await Promise.race([measureCWVWithPuppeteerAndLighthouse(browser, validLink), timeout(1000 * 60)]);
                writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, index, domain, puppeteerAndLighthouseCWVResults as ICWVResults);
            }catch (timeoutError) {
                console.error(`Timeout while processing ${domain}:`, timeoutError);
                writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, index, domain, { lcp: null, fid: null, cls: null });
                if (browser) await closeBrowser(browser);
                console.log('Restarting Browser...');
                browser = await initializeBrowser();
                continue;
            }
            numerOfSuccessfulMeasurement++;
        }catch(unexpectedBrowserError) {
            console.error(`Unexpected error with Puppeteer Browser while processing ${domain}:`, unexpectedBrowserError);
            if (browser) await closeBrowser(browser);
            console.log('Restarting Browser...');
            browser = await initializeBrowser();
        }
    }
    await closeBrowser(browser);
}

async function main(): Promise<void> {
    console.log("Program starting...")

    const timeoutMs = 1000 * 60 * 60 * 6; //Shut down the Program after 6 hours
    setTimeout(() => {
        console.log('Timeout reached. Shutting down...');
        process.exit(0);
    }, timeoutMs);

    //await performDataRetrievalCWVWithCrUX();
    await crawlAndMeasureCWVWithPuppeeteerAndLighthouse();
}

// Entry Point
main();
