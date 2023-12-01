import fs from 'fs';
import csv from 'csv-parser';

import { ITrancoRanking, ICWVResults } from './index.js';


export function readTrancoRankingsCsv(pathToCsvFile: string, fromRank: number, toRank: number){
    return new Promise<ITrancoRanking[]>((resolve, reject) => {
        const trancoRankings: ITrancoRanking[] = [];
        fs.createReadStream(pathToCsvFile)
            .pipe(csv({headers: ['rank', 'domain']}))
            .on('data', (data: ITrancoRanking) => {
                const isRankInRange: boolean = data.rank >= fromRank && data.rank <= toRank
                if (isRankInRange) {
                    trancoRankings.push(data);
                }
            })
            .on('end', () => {
                resolve(trancoRankings);
            })
            .on('error', (error) => {
                reject(error);
            })
    });
}


export function initializeVitalsReportCsv(pathToCsvFile: string): void {
    if (!fs.existsSync(pathToCsvFile)) {
        const resultCsvHeader = 'Rank,Domain,LCP,FID,CLS\n';
        fs.writeFileSync(pathToCsvFile, resultCsvHeader);
        console.log('Initialized CoreWebVitalsReport.csv');
    }else {
        console.log('Could not initialize CoreWebVitalsReport.csv, because file already exists.');
    }
}


export function writeVitalsToCsv(pathToCsvFile: string, rank: number, domain: string, measuredCWV: ICWVResults): void {
    const { lcp, fid, cls } = measuredCWV;
    const vitalsDataRow = `${rank},${domain},${lcp},${fid},${cls}\n`
    fs.appendFileSync(pathToCsvFile, vitalsDataRow);
}
