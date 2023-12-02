import fs from 'fs';
import csv from 'csv-parser';

import { ITrancoRanking, ICWVResults } from '../main.js';

/**
 * Initializes a CSV file for storing Core Web Vitals results. If the file already exists, it is not overwritten.
 * @param pathToCsvFile Path to the CSV file to initialize.
 */
export function initializeVitalsReportCsv(pathToCsvFile: string): void {
    if (!fs.existsSync(pathToCsvFile)) {
        const vitalsReportHeader = 'Rank,Domain,LCP,FID,CLS\n';
        fs.writeFileSync(pathToCsvFile, vitalsReportHeader);
        console.log('Initialized CoreWebVitalsReport.csv');
    }else {
        console.log('CoreWebVitalsReport.csv already exists and will not be overwritten.');
    }
}

/**
 * Reads Tranco rankings from a CSV file and returns a list of rankings within the specified range.
 * @param pathToCsvFile Path to the CSV file containing the Tranco rankings.
 * @param fromRank The starting rank from which to read the domains.
 * @param toRank The ending rank up to which to read the domains.
 * @returns A promise that resolves to an array of ITrancoRanking objects.
 */
export function readTrancoRankingsCsv(pathToCsvFile: string, fromRank: number, toRank: number): Promise<ITrancoRanking[]> {
    return new Promise<ITrancoRanking[]>((resolve, reject) => {
        const trancoRankings: ITrancoRanking[] = [];
        fs.createReadStream(pathToCsvFile)
            .pipe(csv({headers: ['rank', 'domain']}))
            .on('data', (data: ITrancoRanking) => {
                const isRankInRange: boolean = data.rank >= fromRank && data.rank <= toRank;
                if (isRankInRange) {
                    trancoRankings.push(data);
                }
            })
            .on('end', () => {
                console.log(`Read ${trancoRankings.length} domain rankings from CSV.`);
                resolve(trancoRankings);
            })
            .on('error', (readError) => {
                console.error('Error reading Tranco rankings from CSV:', readError);
                reject(readError);
            })
    });
}

/**
 * Appends Core Web Vitals data for a domain to the CSV file.
 * @param pathToCsvFile Path to the CSV file where data should be written.
 * @param rank Rank of the domain.
 * @param domain Domain name.
 * @param measuredCWV Core Web Vitals results to write to the CSV file.
 */
export function writeVitalsToCsv(pathToCsvFile: string, rank: number, domain: string, measuredCWV: ICWVResults): void {
    const { lcp, fid, cls } = measuredCWV;
    const vitalsDataRow = `${rank},${domain},${lcp},${fid},${cls}\n`
    fs.appendFileSync(pathToCsvFile, vitalsDataRow);
    console.log(`Appended Core Web Vitals data for ${domain} to CSV.`);
}
