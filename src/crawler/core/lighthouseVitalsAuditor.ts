import { RunnerResult, Flags as LighthouseOptions, Result } from "lighthouse";
import { Browser, Page } from "puppeteer";

import { ICWVResults } from "../main.js";
import { getPortOfBrowser, getUrlOfPage, openPageWithBrowser, closeCurrentPage } from "./browserSessionManager.js";

export default async function measureCWVWithPuppeteerAndLighthouse(browser: Browser, domain: string): Promise<ICWVResults> {
    let page: Page | null = null;
    let csvResults: ICWVResults = { lcp: null, fid: null, cls: null }

    try {
        page = await openPageWithBrowser(browser, domain);
        console.log(`Navigation to ${domain} with Puppeteer was successful`);
        csvResults = await measureCWVOnBrowserPage(browser, page);
        console.log(`Measurement with Lighthouse was successfull for ${domain}:`, csvResults);
    }catch (pageError) {
        console.error(`Error processing domain ${domain}:`, pageError);
    }finally {
        if(page) {
            await closeCurrentPage(page);
        }
        return csvResults;
    }
}

/**
 * Measures the Core Web Vitals for a given page in a browser.
 * @param browser The Puppeteer Browser instance.
 * @param page The Puppeteer Page instance to measure Core Web Vitals on.
 * @returns A promise that resolves to the measured Core Web Vitals results.
 */
async function measureCWVOnBrowserPage(browser: Browser, page: Page): Promise<ICWVResults> {
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

    if (!lighthouseResults) {
        throw Error("Lighthouse could not successfully measure the Core Web Vitals.");
    }

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
function configureLighthouseOptions(port: number): LighthouseOptions {
    // The main version used for the thesis
    const LIGHTHOUSE_OPTIONS: LighthouseOptions = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance'],
        port: port,
        throttling: {
            rttMs: 150,
            throughputKbps: 1.6 * 1024,
            cpuSlowdownMultiplier: 4,
            requestLatencyMs: 150 * 3.75,
            downloadThroughputKbps: 1.6 * 1024 * 0.9,
            uploadThroughputKbps: 750 * 0.9,
        },
        formFactor: 'mobile',
        screenEmulation: {
            mobile: true,
            width: 412,
            height: 823,
            deviceScaleFactor: 1.75,
            disabled: false
        },
    };

    /*
    // Alternative 1 for Testing (Better Networking Conditions)
     const LIGHTHOUSE_OPTIONS: LighthouseOptions = {
         logLevel: 'info',
         output: 'json',
         onlyCategories: ['performance'],
         port: port,
         throttling: {
             rttMs: 40,
             throughputKbps: 10 * 10240,
             cpuSlowdownMultiplier: 4,
             requestLatencyMs: 150 * 3.75,
             downloadThroughputKbps: 10 * 10240 * 0.9,
             uploadThroughputKbps: 7500 * 0.9,
        },
        formFactor: 'mobile',
        screenEmulation: {
            mobile: true,
            width: 412,
            height: 823,
            deviceScaleFactor: 1.75,
            disabled: false
        },
    };


    // ALternative 2 for Testing (Better CPU Conditions)
     const LIGHTHOUSE_OPTIONS: LighthouseOptions = {
         logLevel: 'info',
         output: 'json',
         onlyCategories: ['performance'],
         port: port,
         throttling: {
             rttMs: 150,
             throughputKbps: 1.6 * 1024,
             cpuSlowdownMultiplier: 1,
             requestLatencyMs: 150 * 3.75,
             downloadThroughputKbps: 1.6 * 1024 * 0.9,
             uploadThroughputKbps: 750 * 0.9,
         },
        formFactor: 'mobile',
        screenEmulation: {
            mobile: true,
            width: 412,
            height: 823,
            deviceScaleFactor: 1.75,
            disabled: false
        },
    };
    */

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
function getLCP(lhr: Result | undefined): number | null {
    const lcp: number | undefined = lhr?.audits['largest-contentful-paint'].numericValue;

    if (lcp) return lcp;
    else return null;
}

/**
 * Extracts the First Input Delay (FID) metric from Lighthouse results.
 * @param lhr Lighthouse Result object.
 * @returns The FID value in milliseconds, or undefined if not available.
 */
function getFID(lhr: Result | undefined): number | null {
    const fid: number | undefined = lhr?.audits['max-potential-fid'].numericValue;

    if (fid) return fid;
    else return null;
}

/**
 * Extracts the Cumulative Layout Shift (CLS) metric from Lighthouse results.
 * @param lhr Lighthouse Result object.
 * @returns The CLS value, or undefined if not available.
 */
function getCLS(lhr: Result | undefined): number | null {
    const cls: number | undefined = lhr?.audits['cumulative-layout-shift'].numericValue;

    if (cls) return cls;
    else return null;
}
