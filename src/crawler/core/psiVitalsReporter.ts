import * as dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

import { IUrl, checkUrl } from '../util/redirectUrlTracker.js';
import { ICWVResults } from '../main.js';

const PAGE_SPEED_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

export async function fetchPageSpeedInsightsCWV(domain: string): Promise<ICWVResults> {
    const siteUrl: IUrl = {
        _url: domain,
        get url() { return this._url; },
        checkUrl: checkUrl
    }
    await siteUrl.checkUrl();

    try {
        console.log(`Fetching CWV Metrics from PageSpeed Insights for ${siteUrl.url}`);
        const psiAPIResponse = await getPSIForUrl(siteUrl.url);
        const psiMetrics = psiAPIResponse.data.lighthouseResult;
        const psiCWVResults: ICWVResults = {
            lcp: getLCP(psiMetrics),
            fid: getFID(psiMetrics),
            cls: getCLS(psiMetrics)
        }
        return psiCWVResults;
    } catch (error) {
        console.error('Error fetching data from PageSpeed Insights API:', error);
        return { lcp: null, fid: null, cls: null };
    }
}

async function getPSIForUrl(url: string) {
    const pagespeed = google.pagespeedonline('v5');
    const response = await pagespeed.pagespeedapi.runpagespeed({
        url: url,
        key: PAGE_SPEED_API_KEY,
        strategy: 'DESKTOP',
    });

    return response;
}

function getCLS(metrics: any): number | null {
    const cumulativeLayoutShift = metrics.audits['cumulative-layout-shift'];
    if (cumulativeLayoutShift && cumulativeLayoutShift.numericValue) {
        return cumulativeLayoutShift.numericValue;
    } else {
        return null;
    }
}

function getFID(metrics: any): number | null {
    const firstInputDelay = metrics.audits['max-potential-fid'];
    if (firstInputDelay && firstInputDelay.numericValue) {
        return firstInputDelay.numericValue;
    } else {
        return null;
    }
}

function getLCP(metrics: any): number | null {
    const largestContentfulPaint = metrics.audits['largest-contentful-paint'];
    if (largestContentfulPaint && largestContentfulPaint.numericValue) {
        return largestContentfulPaint.numericValue;
    } else {
        return null;
    }
}
