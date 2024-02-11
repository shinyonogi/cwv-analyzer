import * as dotenv from 'dotenv';
dotenv.config();

import { chromeuxreport_v1, google } from 'googleapis';
import { GaxiosError } from 'gaxios';

import { ICWVResults } from "../main.js";
import urlPreCheckFactory from '../util/redirectUrlTracker.js';

const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

export interface ICrUXCWVResults {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    validLink: string | null;
};

/**
 * Fetches Core Web Vitals data from the Chrome UX Report for a given domain.
 * @param domain The domain to fetch the Core Web Vitals for.
 * @returns A promise resolving to the Core Web Vitals results.
 */
export async function fetchCWVFromCrUX(domain: string): Promise<ICrUXCWVResults> {
    const url: string | null = await urlPreCheckFactory(domain);

    if (url) {
        try {
            const cwvResultsCrux: ICWVResults = await fetchCWVFromCrUXForUrl(url);
            return {...cwvResultsCrux, validLink: url};
        }catch (apiError) {
            if (apiError instanceof GaxiosError) console.error('Error Fetching CWV Metrics from CrUX', apiError.status);
            else console.error('Error Fetching CWV Metrics from CrUX', apiError);

            return { lcp: null, fid: null, cls: null, validLink: null };
        }
    }else {
        const prefixes = ['https://www.', 'https://', 'http://www.', 'http://'];
        for (const prefix of prefixes) {
            try {
                const fullUrl = prefix + domain;
                const cwvResultsCrux: ICWVResults = await fetchCWVFromCrUXForUrl(fullUrl);
                return {...cwvResultsCrux, validLink: fullUrl};
            } catch (error) {
                if (error instanceof GaxiosError) console.log(`Failed to fetch ${prefix}${domain}: ${error}`);
                else console.error(`Failed to fetch ${prefix}${domain}: ${error}`);
            }
        }
        console.log(`Failed to fetch CWV Metrics from CrUX for ${domain}`);
        return { lcp: null, fid: null, cls: null, validLink: null };
    }
}

async function fetchCWVFromCrUXForUrl(url: string): Promise<ICWVResults> {
    console.log(`Fetching CWV Metrics from CrUX for ${url}`);
    const crUXAPIResponse = await getChromeUXReportForUrl(url);
    const crUXMetrics = crUXAPIResponse.data.record?.metrics;
    const crUXCWVResults: ICWVResults = {
        lcp: getLCP(crUXMetrics),
        fid: getFID(crUXMetrics),
        cls: getCLS(crUXMetrics)
    }
    return crUXCWVResults;
}

/**
 * Internal function to get the Chrome UX Report response for a given URL.
 * @param url The URL to get the Chrome UX Report for.
 * @returns A promise resolving to the Chrome UX Report response.
 */
async function getChromeUXReportForUrl(url: string) {
    const chromeuxreport: chromeuxreport_v1.Chromeuxreport = google.chromeuxreport('v1');
    const response = await chromeuxreport.records.queryRecord({
        key: GOOGLE_CLOUD_API_KEY,
        requestBody: {
            origin: url,
            metrics: ['first_input_delay', 'largest_contentful_paint', 'cumulative_layout_shift']
        },
    });

    return response;
}

function getLCP(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | null {
    const lcpMetrics = metrics?.largest_contentful_paint;
    if (lcpMetrics && lcpMetrics.percentiles) {
        return lcpMetrics.percentiles.p75;
    }

    return null;
}

function getFID(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | null {
    const fidMetrics = metrics?.first_input_delay;
    if (fidMetrics && fidMetrics.percentiles) {
        return fidMetrics.percentiles.p75;
    }

    return null;
}

function getCLS(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | null {
    const clsMetrics = metrics?.cumulative_layout_shift;
    if (clsMetrics && clsMetrics.percentiles) {
        return clsMetrics.percentiles.p75;
    }

    return null;
}
