import { Browser, Page } from "puppeteer";

import { readTrancoRankingsCsv } from "./csvFileManager.js";
import { initializeBrowser, closeBrowser, openPageWithBrowser, closeCurrentPage } from "./browserSessionManager.js";
import { measureCWVOnBrowserPage } from "./coreWebVitalsAuditor.js";

const TRANCO_CSV_FILE_PATH: string = './csvData/top-1m.csv';

export interface ITrancoRanking {
    rank: number;
    domain: string;
};

export interface CWVResults {
    lcp: number | undefined;
    fid: number | undefined;
    cls: number | undefined;
};

const main = async () => {
    const browser: Browser = await initializeBrowser();

    const trancoRankings: ITrancoRanking[] = await readTrancoRankingsCsv(TRANCO_CSV_FILE_PATH, 1, 10);
    for (const rankedDomainEntry of trancoRankings) {
        try {
            const domain: string = rankedDomainEntry.domain;
            const page: Page = await openPageWithBrowser(browser, domain);
            const measuredCWV: CWVResults = await measureCWVOnBrowserPage(browser, page);
            console.log(measuredCWV);
            await closeCurrentPage(page);
        }catch (pageError) {
            console.error(`Error processing domain ${rankedDomainEntry.domain}:`, pageError);
        }
    }

    await closeBrowser(browser);
};

main();
