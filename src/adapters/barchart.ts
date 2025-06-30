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

    // Extract overall put/call ratio data from the summary section
    let totalPutVolume = 0;
    let totalCallVolume = 0;
    let totalPutOI = 0;
    let totalCallOI = 0;
    let overallVolumeRatio = 0;
    let overallOIRatio = 0;

    // Look for the summary section with totals
    const summarySection = $('.bc-futures-options-quotes-totals, .bc-put-call-ratio-totals');
    if (summarySection.length > 0) {
      console.debug('Found summary section for put/call data');
      
      // Extract values from the data rows
      summarySection.find('.bc-futures-options-quotes-totals__data-row').each((_, row) => {
        const $row = $(row);
        const text = $row.text().trim();
        const strongValue = $row.find('strong').text().trim();
        
        if (text.includes('Put Volume Total')) {
          totalPutVolume = this.parseNumber(strongValue);
          console.debug('Found Put Volume Total:', totalPutVolume);
        } else if (text.includes('Call Volume Total')) {
          totalCallVolume = this.parseNumber(strongValue);
          console.debug('Found Call Volume Total:', totalCallVolume);
        } else if (text.includes('Put/Call Volume Ratio')) {
          overallVolumeRatio = this.parseNumber(strongValue);
          console.debug('Found Put/Call Volume Ratio:', overallVolumeRatio);
        } else if (text.includes('Put Open Interest Total')) {
          totalPutOI = this.parseNumber(strongValue);
          console.debug('Found Put Open Interest Total:', totalPutOI);
        } else if (text.includes('Call Open Interest Total')) {
          totalCallOI = this.parseNumber(strongValue);
          console.debug('Found Call Open Interest Total:', totalCallOI);
        } else if (text.includes('Put/Call Open Interest Ratio')) {
          overallOIRatio = this.parseNumber(strongValue);
          console.debug('Found Put/Call Open Interest Ratio:', overallOIRatio);
        }
      });
    }

    // If we didn't find the structured data, try alternative parsing methods
    if (totalPutVolume === 0 && totalCallVolume === 0) {
      console.debug('Summary section not found, trying alternative parsing methods');
      
      // Try to extract from page text using regex patterns
      const pageText = $.text();
      
      const putVolumeMatch = pageText.match(/Put Volume Total[:\s]+([0-9,]+)/i);
      if (putVolumeMatch) {
        totalPutVolume = this.parseNumber(putVolumeMatch[1]);
        console.debug('Regex found Put Volume Total:', totalPutVolume);
      }
      
      const callVolumeMatch = pageText.match(/Call Volume Total[:\s]+([0-9,]+)/i);
      if (callVolumeMatch) {
        totalCallVolume = this.parseNumber(callVolumeMatch[1]);
        console.debug('Regex found Call Volume Total:', totalCallVolume);
      }
      
      const volumeRatioMatch = pageText.match(/Put\/Call Volume Ratio[:\s]+([0-9.]+)/i);
      if (volumeRatioMatch) {
        overallVolumeRatio = this.parseNumber(volumeRatioMatch[1]);
        console.debug('Regex found Put/Call Volume Ratio:', overallVolumeRatio);
      }
      
      const putOIMatch = pageText.match(/Put Open Interest Total[:\s]+([0-9,]+)/i);
      if (putOIMatch) {
        totalPutOI = this.parseNumber(putOIMatch[1]);
        console.debug('Regex found Put Open Interest Total:', totalPutOI);
      }
      
      const callOIMatch = pageText.match(/Call Open Interest Total[:\s]+([0-9,]+)/i);
      if (callOIMatch) {
        totalCallOI = this.parseNumber(callOIMatch[1]);
        console.debug('Regex found Call Open Interest Total:', totalCallOI);
      }
      
      const oiRatioMatch = pageText.match(/Put\/Call Open Interest Ratio[:\s]+([0-9.]+)/i);
      if (oiRatioMatch) {
        overallOIRatio = this.parseNumber(oiRatioMatch[1]);
        console.debug('Regex found Put/Call Open Interest Ratio:', overallOIRatio);
      }
    }

    // Validate extracted ratios against calculated ratios
    if (overallVolumeRatio === 0 && totalCallVolume > 0) {
      overallVolumeRatio = totalPutVolume / totalCallVolume;
      console.debug('Calculated volume ratio from totals:', overallVolumeRatio);
    }
    
    if (overallOIRatio === 0 && totalCallOI > 0) {
      overallOIRatio = totalPutOI / totalCallOI;
      console.debug('Calculated OI ratio from totals:', overallOIRatio);
    }

    // Try to parse table data for individual expiration dates (existing logic)
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

    // Parse table rows for detailed data by expiration
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

    // If we found overall data but no detailed data, create a summary entry
    if (ratiosByDate.length === 0 && (totalPutVolume > 0 || totalCallVolume > 0 || overallVolumeRatio > 0)) {
      ratiosByDate.push({
        expirationDate: 'Overall',
        putVolume: totalPutVolume,
        callVolume: totalCallVolume,
        putCallVolumeRatio: overallVolumeRatio,
        putOpenInterest: totalPutOI,
        callOpenInterest: totalCallOI,
        putCallOIRatio: overallOIRatio,
        totalVolume: totalPutVolume + totalCallVolume,
        totalOpenInterest: totalPutOI + totalCallOI,
      });
    }

    // Use the extracted totals if available, otherwise sum from detailed data
    const finalTotalPutVolume = totalPutVolume > 0 ? totalPutVolume : ratiosByDate.reduce((sum, data) => sum + data.putVolume, 0);
    const finalTotalCallVolume = totalCallVolume > 0 ? totalCallVolume : ratiosByDate.reduce((sum, data) => sum + data.callVolume, 0);
    const finalTotalPutOI = totalPutOI > 0 ? totalPutOI : ratiosByDate.reduce((sum, data) => sum + data.putOpenInterest, 0);
    const finalTotalCallOI = totalCallOI > 0 ? totalCallOI : ratiosByDate.reduce((sum, data) => sum + data.callOpenInterest, 0);

    const finalOverallPutCallVolumeRatio = overallVolumeRatio > 0 ? overallVolumeRatio : (finalTotalCallVolume > 0 ? finalTotalPutVolume / finalTotalCallVolume : 0);
    const finalOverallPutCallOIRatio = overallOIRatio > 0 ? overallOIRatio : (finalTotalCallOI > 0 ? finalTotalPutOI / finalTotalCallOI : 0);

    console.debug('Final parsed values:', {
      totalPutVolume: finalTotalPutVolume,
      totalCallVolume: finalTotalCallVolume,
      volumeRatio: finalOverallPutCallVolumeRatio,
      totalPutOI: finalTotalPutOI,
      totalCallOI: finalTotalCallOI,
      oiRatio: finalOverallPutCallOIRatio,
    });

    const analysis = this.analyzePutCallSentiment(finalOverallPutCallVolumeRatio, finalOverallPutCallOIRatio, ratiosByDate);

    const validationResult = this.validatePutCallData({
      totalPutVolume: finalTotalPutVolume,
      totalCallVolume: finalTotalCallVolume,
      volumeRatio: finalOverallPutCallVolumeRatio,
      totalPutOI: finalTotalPutOI,
      totalCallOI: finalTotalCallOI,
      oiRatio: finalOverallPutCallOIRatio,
    });

    return {
      ticker: ticker.toUpperCase(),
      currentPrice,
      overallPutCallVolumeRatio: finalOverallPutCallVolumeRatio,
      overallPutCallOIRatio: finalOverallPutCallOIRatio,
      totalPutVolume: finalTotalPutVolume,
      totalCallVolume: finalTotalCallVolume,
      totalPutOI: finalTotalPutOI,
      totalCallOI: finalTotalCallOI,
      ratiosByDate,
      analysis,
      validationResult,
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

  private parseNumber(value: string): number {
    if (!value || typeof value !== 'string') return 0;
    
    // Remove commas, whitespace, and other non-numeric characters except decimals and negative signs
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  private parseFloat(text: string): number {
    const cleaned = text.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private validatePutCallData(data: {
    totalPutVolume: number;
    totalCallVolume: number;
    volumeRatio: number;
    totalPutOI: number;
    totalCallOI: number;
    oiRatio: number;
  }): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let isValid = true;

    // Check if we have any meaningful data
    if (data.totalPutVolume === 0 && data.totalCallVolume === 0 && data.totalPutOI === 0 && data.totalCallOI === 0) {
      isValid = false;
      warnings.push('No put/call volume or open interest data found');
      return { isValid, warnings };
    }

    // Validate volume ratio consistency
    if (data.totalCallVolume > 0) {
      const calculatedRatio = data.totalPutVolume / data.totalCallVolume;
      if (data.volumeRatio > 0 && Math.abs(calculatedRatio - data.volumeRatio) > 0.1) {
        warnings.push(`Volume ratio mismatch: extracted ${data.volumeRatio.toFixed(2)}, calculated ${calculatedRatio.toFixed(2)}`);
      }
    }

    // Validate OI ratio consistency
    if (data.totalCallOI > 0) {
      const calculatedOIRatio = data.totalPutOI / data.totalCallOI;
      if (data.oiRatio > 0 && Math.abs(calculatedOIRatio - data.oiRatio) > 0.1) {
        warnings.push(`OI ratio mismatch: extracted ${data.oiRatio.toFixed(2)}, calculated ${calculatedOIRatio.toFixed(2)}`);
      }
    }

    // Check for unrealistic values
    if (data.volumeRatio > 10) {
      warnings.push(`Unusually high put/call volume ratio: ${data.volumeRatio.toFixed(2)}`);
    }

    if (data.oiRatio > 5) {
      warnings.push(`Unusually high put/call OI ratio: ${data.oiRatio.toFixed(2)}`);
    }

    // Warn if only partial data is available
    if ((data.totalPutVolume > 0 || data.totalCallVolume > 0) && data.volumeRatio === 0) {
      warnings.push('Volume data found but ratio not extracted - calculating from volumes');
    }

    if ((data.totalPutOI > 0 || data.totalCallOI > 0) && data.oiRatio === 0) {
      warnings.push('Open interest data found but ratio not extracted - calculating from totals');
    }

    console.debug('Data validation result:', { isValid, warnings, data });
    return { isValid, warnings };
  }
} 