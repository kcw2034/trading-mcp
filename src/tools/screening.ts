import { z } from 'zod';
import { FinvizAdapter } from '../adapters/finviz.js';

// Schema for finviz technical screen
const TechnicalScreenSchema = z.object({
  pattern: z.string().default('channel_down'),
  market_cap: z.string().default('large'),
  geo: z.string().default('usa'),
  limit: z.number().default(20),
});

// Schema for advanced stock filter
const AdvancedFilterSchema = z.object({
  filters: z.record(z.string()).default({}),
  limit: z.number().default(50),
});

export async function finvizTechnicalScreen(args: unknown) {
  try {
    const { pattern, market_cap, geo, limit } = TechnicalScreenSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const results = await finviz.screenStocks(pattern, market_cap, geo);
    
    const limitedResults = results.slice(0, limit);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            query: {
              pattern,
              market_cap,
              geo,
              limit,
            },
            results: limitedResults,
            total_found: limitedResults.length,
            summary: `Found ${limitedResults.length} stocks matching technical pattern '${pattern}' with ${market_cap} market cap`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error in technical screening: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function advancedStockFilter(args: unknown) {
  try {
    const { filters, limit } = AdvancedFilterSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const results = await finviz.advancedFilter(filters);
    
    const limitedResults = results.slice(0, limit);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            query: {
              filters,
              limit,
            },
            results: limitedResults,
            total_found: limitedResults.length,
            summary: `Applied advanced filters and found ${limitedResults.length} matching stocks`,
            applied_filters: Object.keys(filters).length,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error in advanced filtering: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Common technical patterns that can be used with finviz_technical_screen
export const TECHNICAL_PATTERNS = {
  'channel_down': 'Channel Down',
  'channel_up': 'Channel Up',
  'triangle_ascending': 'Ascending Triangle',
  'triangle_descending': 'Descending Triangle',
  'wedge_falling': 'Falling Wedge',
  'wedge_rising': 'Rising Wedge',
  'support': 'Horizontal Support',
  'resistance': 'Horizontal Resistance',
  'trendline_support': 'TL Support',
  'trendline_resistance': 'TL Resistance',
  'head_shoulders': 'Head and Shoulders',
  'head_shoulders_inv': 'Head and Shoulders Inverse',
  'double_top': 'Double Top',
  'double_bottom': 'Double Bottom',
  'multiple_top': 'Multiple Top',
  'multiple_bottom': 'Multiple Bottom',
};

// Common market cap filters
export const MARKET_CAP_FILTERS = {
  'nano': 'Nano (under $50M)',
  'micro': 'Micro ($50M to $300M)',
  'small': 'Small ($300M to $2B)',
  'mid': 'Mid ($2B to $10B)',
  'large': 'Large ($10B to $200B)',
  'mega': 'Mega (over $200B)',
};

// Common filter combinations for advanced screening
export const COMMON_FILTERS = {
  value_stocks: {
    f: 'fa_pe_low,fa_peg_low,fa_pb_low',
    o: 'pe',
  },
  growth_stocks: {
    f: 'fa_epsqoq_pos,fa_eps5y_pos,fa_salesqoq_pos',
    o: 'epsqoq',
  },
  dividend_stocks: {
    f: 'fa_div_pos,fa_divyield_o3',
    o: 'dividendyield',
  },
  high_volume: {
    f: 'sh_avgvol_o500,sh_relvol_o2',
    o: 'volume',
  },
  oversold: {
    f: 'ta_rsi_os30',
    o: 'rsi',
  },
  overbought: {
    f: 'ta_rsi_ob70',
    o: 'rsi',
  },
  near_52w_high: {
    f: 'ta_highlow50d_nh',
    o: '52whigh',
  },
  near_52w_low: {
    f: 'ta_highlow50d_nl',
    o: '52wlow',
  },
}; 