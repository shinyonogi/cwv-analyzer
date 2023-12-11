import * as dotenv from 'dotenv';
dotenv.config();

import { google } from 'googleapis';

const PAGE_SPEED_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

export async function fetchPageSpeedInsightsCWV(domain: string): Promise<void> {
    const url: string = 'https://www.' + domain;

    try {
        const pagespeed = google.pagespeedonline('v5');
        const response = await pagespeed.pagespeedapi.runpagespeed({
            url,
            key: PAGE_SPEED_API_KEY,
            strategy: 'DESKTOP',
        });

        const lighthouseResult = response.data.lighthouseResult;
        if (lighthouseResult && lighthouseResult.audits) {
            const cumulativeLayoutShift = lighthouseResult.audits['cumulative-layout-shift'];
            if (cumulativeLayoutShift && cumulativeLayoutShift.numericValue) {
                console.log(cumulativeLayoutShift.numericValue);
            }

            const largestContentfulPaint = lighthouseResult.audits['largest-contentful-paint'];
            if (largestContentfulPaint && largestContentfulPaint.score) {
                console.log(largestContentfulPaint.numericValue);
            }

            const firstInputDelay = lighthouseResult.audits['max-potential-fid'];
            if (firstInputDelay && firstInputDelay.numericValue) {
                console.log(firstInputDelay.numericValue);
            }
        }

    } catch (error) {
        console.error('Error fetching data from PageSpeed Insights API:', error);
        //throw error;
    }
}
