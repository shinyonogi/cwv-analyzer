import { RunnerResult, Flags as LighthouseOptions, Result } from "lighthouse";
import { Browser, Page } from "puppeteer";

import { ICWVResults } from "./index.js";
import { getPortOfBrowser, getUrlOfPage } from "./browserSessionManager.js";

/**
 * Measures the Core Web Vitals for a given page in a browser.
 * @param browser The Puppeteer Browser instance.
 * @param page The Puppeteer Page instance to measure Core Web Vitals on.
 * @returns A promise that resolves to the measured Core Web Vitals results.
 */
export async function measureCWVOnBrowserPage(browser: Browser, page: Page): Promise<ICWVResults> {
    const url: string = getUrlOfPage(page);
    const port: number = getPortOfBrowser(browser);

    // Promise for Lighthouse to run and gather results
    const lighthousePromise: Result | undefined = await runLighthouse(url, configureLighthouseOptions(port));

    // Promise that resolves to undefined after a timeout (30 seconds)
    const timeoutPromise = new Promise<undefined>((resolve) => {
        setTimeout(() => {
            resolve(undefined);
        }, 30000);
    });

    // Race the promises to either get results from Lighthouse or hit the timeout
    const lighthouseResults: Result | undefined = await Promise.race([lighthousePromise, timeoutPromise]);

    // Check if Lighthouse results were successfully obtained
    if (!lighthouseResults) {
        throw Error("Lighthouse could not successfully measure the Core Web Vitals.");
    }

    // Extract and return the Core Web Vitals from the Lighthouse results
    const measuredCWVResults : ICWVResults = {
        lcp: getLCP(lighthouseResults),
        fid: getFID(lighthouseResults),
        cls: getCLS(lighthouseResults)
    };

    console.log(`Measured Core Web Vitals for ${url}:`, measuredCWVResults);
    return measuredCWVResults;
}

/**
 * Configures the options for running Lighthouse.
 * @param port The port number of the browser.
 * @returns A LighthouseOptions object with specified configurations.
 *
 * Configurations include:
 * - logLevel: Verbosity of Lighthouse logs.
 * - output: Format of the results (here set to 'json').
 * - onlyCategories: Specifies the categories of audits to run (here focusing on 'performance').
 * - port: The port on which the browser instance is running.
 * - throttling: Network and CPU throttling settings to simulate various conditions.
 * - formFactor: The type of device to simulate (desktop/mobile).
 * - screenEmulation: Screen properties for emulation.
 */
function configureLighthouseOptions(port: number) {
    // Configuration options for Lighthouse
    const LIGHTHOUSE_OPTIONS: LighthouseOptions = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance'],
        // Port number of the browser has to be defined here
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

/**
 * Runs Lighthouse to measure the Core Web Vitals of a given URL.
 * @param url The URL of the page to audit.
 * @param lighthouseOptions Options for the Lighthouse audit.
 * @returns A promise that resolves to Lighthouse Result or undefined if an error occurs.
 *
 * Catches and logs errors encountered during the Lighthouse run.
 */
async function runLighthouse(url: string, lighthouseOptions: LighthouseOptions): Promise<Result | undefined> {
    try {
        const lighthouse = await import('lighthouse');
        const runnerResult: RunnerResult | undefined = await lighthouse.default(url, lighthouseOptions);
        const lhr: Result | undefined = runnerResult?.lhr;

        return lhr;
    } catch(lighthouseError) {
        console.log('Error measuring with Ligthouse', lighthouseError);

        return undefined;
    }
}

/**
 * Extracts the Largest Contentful Paint (LCP) metric from Lighthouse results.
 * @param lhr Lighthouse Result object.
 * @returns The LCP value in milliseconds, or undefined if not available.
 */
function getLCP(lhr: Result | undefined): number | undefined {
    return lhr?.audits['largest-contentful-paint'].numericValue;
}

/**
 * Extracts the First Input Delay (FID) metric from Lighthouse results.
 * @param lhr Lighthouse Result object.
 * @returns The FID value in milliseconds, or undefined if not available.
 */
function getFID(lhr: Result | undefined): number | undefined {
    return lhr?.audits['max-potential-fid'].numericValue;
}

/**
 * Extracts the Cumulative Layout Shift (CLS) metric from Lighthouse results.
 * @param lhr Lighthouse Result object.
 * @returns The CLS value, or undefined if not available.
 */
function getCLS(lhr: Result | undefined): number | undefined {
    return lhr?.audits['cumulative-layout-shift'].numericValue;
}
