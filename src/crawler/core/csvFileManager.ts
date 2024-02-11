import fs from 'fs';
import csv from 'csv-parser';
import readline from 'readline';

import { ITrancoRanking, ICWVResults, IValidLinks } from '../main.js';

/**
 * Initializes a CSV file for storing Core Web Vitals results. If the file already exists, it is not overwritten.
 * @param pathToCsvFile Path to the CSV file to initialize.
 */
function initializeVitalsReportCsv(pathToCsvFile: string): void {
    const fileExists = fs.existsSync(pathToCsvFile);
    if (!fileExists) {
        const vitalsReportHeader = 'Rank,Domain,LCP,FID,CLS\n';
        fs.writeFileSync(pathToCsvFile, vitalsReportHeader);
        console.log(`Initialized ${pathToCsvFile} for storing Core Web Vitals results.`);
    }else {
        console.log(`${pathToCsvFile} already exists and will not be overwritten.`);
    }
}

function initializeValidLinksCsv(pathToCsvFile: string): void {
    const fileExists = fs.existsSync(pathToCsvFile);
    if (!fileExists) {
        const validLinkHeader = 'Domain,ValidLink\n';
        fs.writeFileSync(pathToCsvFile, validLinkHeader);
        console.log(`Initialized ${pathToCsvFile} for storing valid links.`);
    }else {
        console.log(`${pathToCsvFile} already exists and will not be overwritten.`);
    }
}

/**
 * Reads Tranco rankings from a CSV file and returns a list of rankings within the specified range.
 * @param pathToCsvFile Path to the CSV file containing the Tranco rankings.
 * @param fromRank The starting rank from which to read the domains.
 * @param toRank The ending rank up to which to read the domains.
 * @returns A promise that resolves to an array of ITrancoRanking objects.
 */
function readTrancoRankingsCsv(pathToCsvFile: string, fromRank: number, toRank: number): Promise<ITrancoRanking[]> {
    return new Promise<ITrancoRanking[]>((resolve, reject) => {
        const trancoRankings: ITrancoRanking[] = [];
        fs.createReadStream(pathToCsvFile)
            .pipe(csv({headers: ['rank', 'domain']}))
            .on('data', (data: ITrancoRanking) => {
                const isDataRankInRange: boolean = data.rank >= fromRank && data.rank <= toRank;
                if (isDataRankInRange) {
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
function writeVitalsToCsv(pathToCsvFile: string, rank: number, domain: string, measuredCWV: ICWVResults): void {
    const { lcp, fid, cls } = measuredCWV;
    const vitalsDataRow = `${rank},${domain},${lcp},${fid},${cls}\n`
    fs.appendFileSync(pathToCsvFile, vitalsDataRow);
    console.log(`Appended Core Web Vitals data for ${domain} to CSV.`);
}

function writeValidLinkToCsv(pathToCsvFile: string, domain: string, validLink: string) {
    const validLinkRow = `${domain},${validLink}\n`;
    fs.appendFileSync(pathToCsvFile, validLinkRow);
    console.log('Appended valid link to CSV.');
}

function writeVisitedDomainToCsv(pathToCsvFile: string, domain: string) {
    const visitedDomainRow = `${domain}\n`;
    fs.appendFileSync(pathToCsvFile, visitedDomainRow);
    console.log('Appended visited domain to CSV.');
}

async function readValidLinksCsv(pathToCsvFile: string): Promise<IValidLinks[]> {
    return new Promise<IValidLinks[]>((resolve, reject) => {
        const validLinks: IValidLinks[] = [];
        fs.createReadStream(pathToCsvFile)
            .pipe(csv({headers: ['domain', 'validLink']}))
            .on('data', (data: IValidLinks) => {
                validLinks.push(data);
            })
            .on('end', () => {
                console.log(`Read ${validLinks.length} valid links from CSV.`);
                resolve(validLinks);
            })
            .on('error', (readError) => {
                console.error('Error reading valid links from CSV:', readError);
                reject(readError);
            })
    });
}

async function getRowCountCsv(pathToCsvFile: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        let rowCount = 0;
        const fileStream = fs.createReadStream(pathToCsvFile);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', () => {
            rowCount++;
        });

        rl.on('close', () => {
            resolve(rowCount);
        });

        rl.on('error', reject);

    });
}

export {
    writeVitalsToCsv,
    initializeVitalsReportCsv,
    initializeValidLinksCsv,
    readTrancoRankingsCsv,
    writeValidLinkToCsv,
    readValidLinksCsv,
    getRowCountCsv,
    writeVisitedDomainToCsv
};
