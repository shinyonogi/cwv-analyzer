import fs from 'fs';
import csv from 'csv-parser';
import { ITrancoRanking } from './index.js';


export const readTrancoRankingsCsv = (pathToCsvFile: string, fromRank: number, toRank: number) => {
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
};
