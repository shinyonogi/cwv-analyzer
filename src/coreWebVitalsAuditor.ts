import { RunnerResult, Flags as LighthouseOptions, Result } from "lighthouse";
import { Browser, Page } from "puppeteer";

import { ICWVResults } from "./index.js";
import { getPortOfBrowser, getUrlOfPage } from "./browserSessionManager.js";


export async function measureCWVOnBrowserPage(browser: Browser, page: Page): Promise<ICWVResults> {
    const url: string = getUrlOfPage(page);
    const port: number = getPortOfBrowser(browser);

    const lighthouseResults: Result | undefined = await runLighthouse(url, configureLighthouseOptions(port));
    const measuredCWVResults : ICWVResults = {
        lcp: getLCP(lighthouseResults),
        fid: getFID(lighthouseResults),
        cls: getCLS(lighthouseResults)
    };

    return measuredCWVResults;
}


function configureLighthouseOptions(port: number) {
    const LIGHTHOUSE_OPTIONS: LighthouseOptions = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance'],
        // Port number of the browser has to be defined here:
        port: port,
        throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
            requestLatencyMs: 20,
            downloadThroughputKbps: 10240,
            uploadThroughputKbps: 10240,
        },
        formFactor: 'desktop',
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false
        },
    };

    return LIGHTHOUSE_OPTIONS;
}


async function runLighthouse(url: string, lighthouseOptions: LighthouseOptions): Promise<Result | undefined> {
    const lighthouse = await import('lighthouse');
    const runnerResult: RunnerResult | undefined = await lighthouse.default(url, lighthouseOptions);
    const lhr: Result | undefined = runnerResult?.lhr;

    return lhr;
}


function getLCP(lhr: Result | undefined): number | undefined {
    return lhr?.audits['largest-contentful-paint'].numericValue;
}


function getFID(lhr: Result | undefined): number | undefined {
    return lhr?.audits['max-potential-fid'].numericValue;
}


function getCLS(lhr: Result | undefined): number | undefined {
    return lhr?.audits['cumulative-layout-shift'].numericValue;
}
