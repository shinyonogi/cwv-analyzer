import * as dotenv from 'dotenv';
dotenv.config();

import { Browser } from "puppeteer";

import { initializeVitalsReportCsv, readTrancoRankingsCsv, writeVitalsToCsv } from "./core/csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./core/browserSessionManager.js";
import { measureCWVWithPuppeteerAndLighthouse } from "./core/lighthouseVitalsAuditor.js";
import { fetchCWVFromCrUX } from "./core/cruxVitalsReporter.js";
import { fetchPageSpeedInsightsCWV } from "./core/psiVitalsReporter.js";

const TRANCO_CSV_FILE_PATH: string = './data/top-1m.csv';

const LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTest.csv';
const CRUX_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTestCrUX.csv';
const PSI_VITALS_REPORT_CSV_FILE_PATH: string = './data/CoreWebVitalsReportTestPSI.csv';

export interface ITrancoRanking {
    rank: number;
    domain: string;
};

export interface ICWVResults {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
};

async function crawlAndMeasureCWVWithPuppeeteerAndLighthouse(): Promise<void> {
  console.log('Start measuring with Puppeteer and Ligthouse!');

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
  initializeVitalsReportCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH);

  const browser: Browser = await initializeBrowser();
  for (const rankedDomainEntry of trancoRankings) {
      const { rank, domain } : ITrancoRanking = rankedDomainEntry;
      const puppeteerAndLighthouseCWVResults: ICWVResults = await measureCWVWithPuppeteerAndLighthouse(browser, domain);
      writeVitalsToCsv(LIGHTHOUSE_VITALS_REPORT_CSV_FILE_PATH, rank, domain, puppeteerAndLighthouseCWVResults);
  }
  await closeBrowser(browser);
}

async function measureCWVWithCrUX(): Promise<void> {
  console.log("Start measuring with CrUX!");

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
  initializeVitalsReportCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH);

  for (const rankedDomainEntry of trancoRankings) {
      const { rank, domain } : ITrancoRanking = rankedDomainEntry;
      const crUXCWVResults: ICWVResults = await fetchCWVFromCrUX(domain);
      writeVitalsToCsv(CRUX_VITALS_REPORT_CSV_FILE_PATH, rank, domain, crUXCWVResults);
  }
}

async function measureCWVWithPSI(): Promise<void> {
  console.log('Start measuring with PSI!');

  const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10000);
  initializeVitalsReportCsv(PSI_VITALS_REPORT_CSV_FILE_PATH);

  for (const rankedDomainEntry of trancoRankings) {
      const { rank, domain } : ITrancoRanking = rankedDomainEntry;
      const psiCWVResults: ICWVResults = await fetchPageSpeedInsightsCWV(domain);
      writeVitalsToCsv(PSI_VITALS_REPORT_CSV_FILE_PATH, rank, domain, psiCWVResults);
  }
}


async function main(): Promise<void> {
  // await crawlAndMeasureCWVWithPuppeeteerAndLighthouse();
  await measureCWVWithCrUX();
  // await measureCWVWithPSI();
}


// Entry Point
main();
