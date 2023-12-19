import * as dotenv from 'dotenv';
dotenv.config();

import { chromeuxreport_v1, google } from 'googleapis';
import { GaxiosError } from 'gaxios';

import { ICWVResults } from "../main.js";
import urlFactory from '../util/redirectUrlTracker.js';

const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

/**
 * Fetches Core Web Vitals data from the Chrome UX Report for a given domain.
 * @param domain The domain to fetch the Core Web Vitals for.
 * @returns A promise resolving to the Core Web Vitals results.
 */
export default async function fetchCWVFromCrUX(domain: string): Promise<ICWVResults> {
    const url: string = urlFactory(domain);

    try {
        console.log(`Fetching CWV Metrics from CrUX for ${url}`);
        const crUXAPIResponse = await getChromeUXReportForUrl(url);
        const crUXMetrics = crUXAPIResponse.data.record?.metrics;
        const crUXCWVResults: ICWVResults = {
            lcp: getLCP(crUXMetrics),
            fid: getFID(crUXMetrics),
            cls: getCLS(crUXMetrics)
        }
        return crUXCWVResults;
    }catch (apiError) {
        if (apiError instanceof GaxiosError)
            console.error('Error Fetching CWV Metrics from CrUX', apiError.status);
        else
            console.error('Error Fetching CWV Metrics from CrUX', apiError);
        return { lcp: null, fid: null, cls: null };
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
