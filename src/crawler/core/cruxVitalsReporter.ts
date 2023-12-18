import * as dotenv from 'dotenv';
dotenv.config();

import { chromeuxreport_v1, google } from 'googleapis';

import { ICWVResults } from "../main.js";

const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

/**
 * Fetches Core Web Vitals data from the Chrome UX Report for a given domain.
 * @param domain The domain to fetch the Core Web Vitals for.
 * @returns A promise resolving to the Core Web Vitals results.
 */
export async function fetchCoreWebVitalsFromCrUX(domain: string): Promise<ICWVResults> {
    const origin: string = `https://www.${domain}`;
    let crUXCWVResults: ICWVResults = { lcp: undefined, fid: undefined, cls: undefined }

    try {
        const crUXAPIResponse = await getChromeUXReportForUrl(origin);
        const crUXMetrics = crUXAPIResponse.data.record?.metrics;
        crUXCWVResults = {
            lcp: getLCP(crUXMetrics),
            fid: getFID(crUXMetrics),
            cls: getCLS(crUXMetrics)
        }
    }catch (apiError) {
        console.error('Error Fetching CWV Metrics from CrUX', apiError);
    }finally {
        return crUXCWVResults;
    }
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

function getLCP(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | undefined {
    const lcpMetrics = metrics?.largest_contentful_paint;
    if (lcpMetrics && lcpMetrics.percentiles) {
        return lcpMetrics.percentiles.p75;
    }

    return undefined;
}

function getFID(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | undefined {
    const fidMetrics = metrics?.first_input_delay;
    if (fidMetrics && fidMetrics.percentiles) {
        return fidMetrics.percentiles.p75;
    }

    return undefined;
}

function getCLS(metrics: { [key: string]: chromeuxreport_v1.Schema$Metric; } | null | undefined): number | undefined {
    const clsMetrics = metrics?.cumulative_layout_shift;
    if (clsMetrics && clsMetrics.percentiles) {
        return clsMetrics.percentiles.p75;
    }

    return undefined;
}
