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
  signal: z.string().optional(),
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
    const { filters, signal, limit } = AdvancedFilterSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const results = await finviz.advancedFilter(filters, signal);
    
    const limitedResults = results.slice(0, limit);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            query: {
              filters,
              signal,
              limit,
            },
            results: limitedResults,
            total_found: limitedResults.length,
            summary: `Applied advanced filters${signal ? ` with signal '${signal}'` : ''} and found ${limitedResults.length} matching stocks`,
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

// Helper function to build common filter combinations with optional signal
export function buildScreeningFilters(options: {
  geo?: 'usa' | 'foreign';
  marketCap?: 'nano' | 'micro' | 'small' | 'mid' | 'large' | 'mega';
  profitable?: boolean;
  peRange?: 'low' | 'high' | 'u5' | 'u10' | 'u15' | 'u20' | 'u25' | 'o5' | 'o10' | 'o15' | 'o20' | 'o25';
  signal?: string; // Use signal instead of technicalPattern for proper Finviz support
  orderBy?: string;
}): { f: string; s?: string; o?: string } {
  const filters: string[] = [];
  
  if (options.geo) {
    filters.push(`geo_${options.geo}`);
  }
  
  if (options.marketCap) {
    filters.push(`cap_${options.marketCap}`);
  }
  
  if (options.profitable) {
    filters.push('fa_pe_profitable');
  }
  
  if (options.peRange) {
    filters.push(`fa_pe_${options.peRange}`);
  }
  
  const result: { f: string; s?: string; o?: string } = {
    f: filters.join(',')
  };
  
  if (options.signal) {
    result.s = options.signal;
  }
  
  if (options.orderBy) {
    result.o = options.orderBy;
  }
  
  return result;
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

// Common Finviz filter codes for reference
export const FINVIZ_FILTERS = {
  // Geographic filters
  geo_usa: 'USA only',
  geo_foreign: 'Foreign (ex-USA)',
  
  // Market cap filters
  cap_nano: 'Nano (under $50M)',
  cap_micro: 'Micro ($50M to $300M)', 
  cap_small: 'Small ($300M to $2B)',
  cap_mid: 'Mid ($2B to $10B)',
  cap_large: 'Large ($10B to $200B)',
  cap_mega: 'Mega (over $200B)',
  
  // P/E ratio filters
  fa_pe_profitable: 'P/E ratio > 0 (profitable companies)',
  fa_pe_pos: 'P/E ratio > 0 (same as profitable)',
  fa_pe_low: 'P/E ratio < 15',
  fa_pe_high: 'P/E ratio > 25',
  fa_pe_u5: 'P/E ratio < 5',
  fa_pe_u10: 'P/E ratio < 10',
  fa_pe_u15: 'P/E ratio < 15',
  fa_pe_u20: 'P/E ratio < 20',
  fa_pe_u25: 'P/E ratio < 25',
  fa_pe_o5: 'P/E ratio > 5',
  fa_pe_o10: 'P/E ratio > 10',
  fa_pe_o15: 'P/E ratio > 15',
  fa_pe_o20: 'P/E ratio > 20',
  fa_pe_o25: 'P/E ratio > 25',
  
  // Technical pattern filters (deprecated - use FINVIZ_SIGNALS instead)
  ta_pattern_channeldown: 'Channel Down pattern',
  ta_pattern_channelup: 'Channel Up pattern',
  ta_pattern_tlresistance: 'Trendline Resistance',
  ta_pattern_tlsupport: 'Trendline Support',
  ta_pattern_triangleascending: 'Ascending Triangle',
  ta_pattern_triangledescending: 'Descending Triangle',
  ta_pattern_wedgeascending: 'Ascending Wedge',
  ta_pattern_wedgedescending: 'Descending Wedge',
};

// Finviz signal codes (use these for signal parameter, not filters)
export const FINVIZ_SIGNALS = {
  // Technical Analysis Signals
  ta_p_channeldown: 'Channel Down',
  ta_p_channelup: 'Channel Up', 
  ta_p_tlresistance: 'Trendline Resistance',
  ta_p_tlsupport: 'Trendline Support',
  ta_p_wedgeup: 'Wedge Up',
  ta_p_wedgedown: 'Wedge Down',
  ta_p_triangleascending: 'Triangle Ascending',
  ta_p_triangledescending: 'Triangle Descending',
  ta_p_wedge: 'Wedge',
  ta_p_channel: 'Channel',
  ta_p_doubletop: 'Double Top',
  ta_p_doublebottom: 'Double Bottom',
  ta_p_multipletop: 'Multiple Top',
  ta_p_multiplebottom: 'Multiple Bottom',
  ta_p_headandshoulders: 'Head and Shoulders',
  ta_p_headandshouldersins: 'Head and Shoulders Inverse',
  ta_p_horizontals: 'Horizontal Support',
  ta_p_horizontalsr: 'Horizontal Resistance',
}; 