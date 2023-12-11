import * as dotenv from 'dotenv';
dotenv.config();

import { Browser } from "puppeteer";

import { initializeVitalsReportCsv, readTrancoRankingsCsv, writeVitalsToCsv } from "./core/csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./core/browserSessionManager.js";
import { measureCWVWithPuppeteerAndLighthouse } from "./core/lighthouseVitalsAuditor.js";
import { fetchCoreWebVitalsFromCrUX } from "./core/cruxVitalsReporter.js";
import { fetchPageSpeedInsightsCWV } from "./core/psiVitalsReporter.js";

const TRANCO_CSV_FILE_PATH: string = './data/top-1m.csv';

const LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTest.csv';
const CRUX_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTest.csv';
const PSI_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTest.csv';

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
 * 1. Prepares three CSV file for recording Core Web Vitals metrics (1. With Ligthouse & Puppeteer, 2. With CrUX, 3. With PSI).
 * 2. Initializes a Puppeteer browser instance for web page interactions.
 * 3. Reads a specified range of domain rankings from the Tranco CSV file.
 * 4. For each domain, it measures the Core Web Vitals using Lighthouse and Puppeteer, and records the results in the CSV file.
 * 5. For each domain, it measures the Core Web Vitals using CruX, and records the results in the CSV file.
 * 6. For each domain, it measures the Core Web Vitals using PSI, and records the results in the CSV file.
 * 7. If an error occurs while processing a domain, it records default ('undefined') metrics for that domain in the CSV file.
 * 8. Closes each page after processing and shuts down the browser after all domains are processed.
 */

async function main(): Promise<void> {
    initializeVitalsReportCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH);
    initializeVitalsReportCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH);
    initializeVitalsReportCsv(PSI_VITALS_REPORT_CSV_FILE_PATH);

    const browser: Browser = await initializeBrowser();

    const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
    for (const rankedDomainEntry of trancoRankings) {
        const { rank, domain } : ITrancoRanking = rankedDomainEntry;

        const puppeteerAndLighthouseCWVResults = await measureCWVWithPuppeteerAndLighthouse(browser, domain);
        writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, rank, domain, puppeteerAndLighthouseCWVResults);

        const crUXCWVResultsForDesktop: ICWVResults = await fetchCoreWebVitalsFromCrUX(domain);
        writeVitalsToCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH, rank, domain, crUXCWVResultsForDesktop);

        await fetchPageSpeedInsightsCWV(domain);
    }

    await closeBrowser(browser);
}

// Entry Point
main();
