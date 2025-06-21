import { z } from 'zod';
import { BarchartAdapter } from '../adapters/barchart.js';

const PutCallRatioSchema = z.object({
  ticker: z.string(),
});

export async function getPutCallRatio(args: unknown) {
  try {
    const { ticker } = PutCallRatioSchema.parse(args);
    
    const barchart = new BarchartAdapter();
    const ratioData = await barchart.getPutCallRatio(ticker);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            put_call_analysis: ratioData,
            summary: `Retrieved put/call ratio data for ${ticker.toUpperCase()}. Overall volume ratio: ${ratioData.overallPutCallVolumeRatio.toFixed(2)} (${ratioData.analysis.sentiment} sentiment)`,
            interpretation: ratioData.analysis.interpretation,
            key_insights: ratioData.analysis.keyInsights,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting put/call ratio for ${args && typeof args === 'object' && 'ticker' in args ? (args as any).ticker : 'unknown ticker'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
} 