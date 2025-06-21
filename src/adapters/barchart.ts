import axios from 'axios';
import * as cheerio from 'cheerio';
import { PutCallRatioAnalysis, PutCallRatioData } from '../types/index.js';

export class BarchartAdapter {
  private baseUrl = 'https://www.barchart.com';

  private getHeaders() {
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  async getPutCallRatio(ticker: string): Promise<PutCallRatioAnalysis> {
    try {
      const url = `${this.baseUrl}/stocks/quotes/${ticker.toUpperCase()}/put-call-ratios?orderBy=expirationDate&orderDir=desc`;
      console.debug(`Fetching put/call ratio data for ${ticker} from: ${url}`);
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000,
      });

      return this.parsePutCallRatioData(response.data, ticker);
    } catch (error) {
      console.error(`Error getting put/call ratio for ${ticker}:`, error);
      throw new Error(`Failed to get put/call ratio for ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parsePutCallRatioData(html: string, ticker: string): PutCallRatioAnalysis {
    const $ = cheerio.load(html);
    const ratiosByDate: PutCallRatioData[] = [];

    // Debug: log key parts of the HTML to understand structure
    console.debug('HTML title:', $('title').text());
    console.debug('Found tables:', $('table').length);
    
    let currentPrice: string | undefined;
    const priceElement = $('.last-price, .price, [data-ng-bind*="price"]');
    if (priceElement.length > 0) {
      currentPrice = priceElement.first().text().trim();
    }

    // Try multiple selector strategies
    let tableRows = $('table tbody tr');
    
    // Look for specific put/call ratio table indicators
    const ratioTable = $('table').filter((i, table) => {
      const tableText = $(table).text().toLowerCase();
      return tableText.includes('put/call') || tableText.includes('expiration') || tableText.includes('ratio');
    });

    if (ratioTable.length > 0) {
      tableRows = ratioTable.first().find('tbody tr');
    }

    // If no specific table found, try all table rows
    if (tableRows.length === 0) {
      tableRows = $('table tr');
    }

    // Try to find put/call open interest ratio in the page content
    const pageText = $.text();
    const ratioMatch = pageText.match(/Put\/Call Open Interest Ratio[:\s]*([0-9.]+)/i);
    let overallRatio = 0;
    
    if (ratioMatch) {
      overallRatio = parseFloat(ratioMatch[1]) || 0;
      console.debug('Found overall put/call ratio:', overallRatio);
    }

    // Parse table rows
    tableRows.each((index, row) => {
      const cells = $(row).find('td, th');
      if (cells.length >= 3) {
        const cellTexts = cells.map((i, cell) => $(cell).text().trim()).get();
        
        // Look for date-like patterns in first column
        const firstCell = cellTexts[0];
        const isDateRow = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(firstCell);
        
        if (isDateRow && cellTexts.length >= 6) {
          const expirationDate = firstCell;
          const putVolume = this.parseNumber(cellTexts[1]);
          const callVolume = this.parseNumber(cellTexts[2]);
          const volumeRatio = this.parseNumber(cellTexts[3]) || (callVolume > 0 ? putVolume / callVolume : 0);
          const putOI = this.parseNumber(cellTexts[4]);
          const callOI = this.parseNumber(cellTexts[5]);
          const oiRatio = cellTexts.length > 6 ? this.parseNumber(cellTexts[6]) || (callOI > 0 ? putOI / callOI : 0) : (callOI > 0 ? putOI / callOI : 0);

          if (expirationDate && (putVolume > 0 || callVolume > 0)) {
            ratiosByDate.push({
              expirationDate,
              putVolume,
              callVolume,
              putCallVolumeRatio: volumeRatio,
              putOpenInterest: putOI,
              callOpenInterest: callOI,
              putCallOIRatio: oiRatio,
              totalVolume: putVolume + callVolume,
              totalOpenInterest: putOI + callOI,
            });
          }
        }
      }
    });

    // If we found the overall ratio but no detailed data, create a summary entry
    if (ratiosByDate.length === 0 && overallRatio > 0) {
      ratiosByDate.push({
        expirationDate: 'Overall',
        putVolume: 0,
        callVolume: 0,
        putCallVolumeRatio: 0,
        putOpenInterest: 0,
        callOpenInterest: 0,
        putCallOIRatio: overallRatio,
        totalVolume: 0,
        totalOpenInterest: 0,
      });
    }

    const totalPutVolume = ratiosByDate.reduce((sum, data) => sum + data.putVolume, 0);
    const totalCallVolume = ratiosByDate.reduce((sum, data) => sum + data.callVolume, 0);
    const totalPutOI = ratiosByDate.reduce((sum, data) => sum + data.putOpenInterest, 0);
    const totalCallOI = ratiosByDate.reduce((sum, data) => sum + data.callOpenInterest, 0);

    const overallPutCallVolumeRatio = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0;
    const overallPutCallOIRatio = totalCallOI > 0 ? totalPutOI / totalCallOI : 0;

    const analysis = this.analyzePutCallSentiment(overallPutCallVolumeRatio, overallPutCallOIRatio, ratiosByDate);

    return {
      ticker: ticker.toUpperCase(),
      currentPrice,
      overallPutCallVolumeRatio,
      overallPutCallOIRatio,
      totalPutVolume,
      totalCallVolume,
      totalPutOI,
      totalCallOI,
      ratiosByDate,
      analysis,
    };
  }

  private analyzePutCallSentiment(volumeRatio: number, oiRatio: number, ratiosByDate: PutCallRatioData[]) {
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    const keyInsights: string[] = [];
    let interpretation = '';

    if (volumeRatio > 1.2) {
      sentiment = 'bearish';
      interpretation = 'High put/call volume ratio suggests bearish sentiment';
      keyInsights.push(`Put/call volume ratio of ${volumeRatio.toFixed(2)} indicates heavy put buying`);
    } else if (volumeRatio < 0.8) {
      sentiment = 'bullish';
      interpretation = 'Low put/call volume ratio suggests bullish sentiment';
      keyInsights.push(`Put/call volume ratio of ${volumeRatio.toFixed(2)} indicates heavy call buying`);
    } else {
      interpretation = 'Put/call volume ratio is within normal range';
      keyInsights.push(`Put/call volume ratio of ${volumeRatio.toFixed(2)} suggests neutral sentiment`);
    }

    if (oiRatio > 0) {
      if (oiRatio > 1.5) {
        keyInsights.push(`High put/call open interest ratio of ${oiRatio.toFixed(2)} suggests hedging activity`);
      } else if (oiRatio < 0.5) {
        keyInsights.push(`Low put/call open interest ratio of ${oiRatio.toFixed(2)} suggests bullish positioning`);
      }
    }

    if (ratiosByDate.length >= 3) {
      const recentRatios = ratiosByDate.slice(0, 3).map(d => d.putCallVolumeRatio);
      const isIncreasing = recentRatios[0] > recentRatios[1] && recentRatios[1] > recentRatios[2];
      const isDecreasing = recentRatios[0] < recentRatios[1] && recentRatios[1] < recentRatios[2];

      if (isIncreasing) {
        keyInsights.push('Put/call ratios are increasing across recent expiration dates');
      } else if (isDecreasing) {
        keyInsights.push('Put/call ratios are decreasing across recent expiration dates');
      }
    }

    return {
      sentiment,
      interpretation,
      keyInsights,
    };
  }

  private parseNumber(text: string): number {
    const cleaned = text.replace(/,/g, '').replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseFloat(text: string): number {
    const cleaned = text.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
} 