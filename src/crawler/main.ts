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

async function crawlAndMeasureCWVWithPuppeeteerAndLighthouse(): Promise<void> {
  initializeVitalsReportCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH);
  const browser: Browser = await initializeBrowser();

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
  for (const rankedDomainEntry of trancoRankings) {
      const { rank, domain } : ITrancoRanking = rankedDomainEntry;

      const puppeteerAndLighthouseCWVResults: ICWVResults = await measureCWVWithPuppeteerAndLighthouse(browser, domain);
      writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, rank, domain, puppeteerAndLighthouseCWVResults);
  }

  await closeBrowser(browser);
}

async function measureCWVWithCrUXAndPSI(): Promise<void> {
  initializeVitalsReportCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH);
  initializeVitalsReportCsv(PSI_VITALS_REPORT_CSV_FILE_PATH);

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
  for (const rankedDomainEntry of trancoRankings) {
      const { rank, domain } : ITrancoRanking = rankedDomainEntry;

      const crUXCWVResultsForDesktop: ICWVResults = await fetchCoreWebVitalsFromCrUX(domain);
      writeVitalsToCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH, rank, domain, crUXCWVResultsForDesktop);

      await fetchPageSpeedInsightsCWV(domain);
  }
}


async function main(): Promise<void> {
  // await crawlAndMeasureCWVWithPuppeeteerAndLighthouse();
  await measureCWVWithCrUXAndPSI();
}


// Entry Point
main();
