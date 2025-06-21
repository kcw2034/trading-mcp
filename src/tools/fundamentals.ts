import { z } from 'zod';
import { FinvizAdapter } from '../adapters/finviz.js';
import { FundamentalMetrics } from '../types/index.js';

// Schema for getting fundamental metrics
const FundamentalMetricsSchema = z.object({
  ticker: z.string(),
  metrics: z.array(z.string()).optional(),
});

// Schema for valuation analysis
const ValuationAnalysisSchema = z.object({
  tickers: z.array(z.string()),
  metrics: z.array(z.string()).default(['pe', 'forwardPE', 'peg', 'priceToBook']),
});

// Schema for financial health score
const FinancialHealthSchema = z.object({
  ticker: z.string(),
  weights: z.object({
    profitability: z.number().default(0.3),
    liquidity: z.number().default(0.2),
    leverage: z.number().default(0.2),
    efficiency: z.number().default(0.15),
    growth: z.number().default(0.15),
  }).default({}),
});

export async function getFundamentalMetrics(args: unknown) {
  try {
    const { ticker, metrics } = FundamentalMetricsSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const fundamentals = await finviz.getFundamentals(ticker);
    
    // Filter metrics if specified
    let filteredMetrics = fundamentals;
    if (metrics && metrics.length > 0) {
      filteredMetrics = { ticker: fundamentals.ticker };
      metrics.forEach(metric => {
        const key = metric as keyof FundamentalMetrics;
        if (key in fundamentals) {
          (filteredMetrics as any)[key] = fundamentals[key];
        }
      });
    }
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            fundamentals: filteredMetrics,
            requested_metrics: metrics || 'all',
            summary: `Retrieved fundamental metrics for ${ticker.toUpperCase()}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting fundamentals for ${args && typeof args === 'object' && 'ticker' in args ? (args as any).ticker : 'unknown ticker'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function analyzeValuationMetrics(args: unknown) {
  try {
    const { tickers, metrics } = ValuationAnalysisSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const valuations: { [ticker: string]: any } = {};
    const errors: string[] = [];
    
    // Get fundamentals for each ticker
    for (const ticker of tickers) {
      try {
        const fundamentals = await finviz.getFundamentals(ticker);
        valuations[ticker] = fundamentals;
      } catch (error) {
        errors.push(`${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Calculate comparative analysis
    const analysis = calculateValuationComparison(valuations, metrics);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            tickers,
            metrics,
            valuations,
            comparative_analysis: analysis,
            errors: errors.length > 0 ? errors : undefined,
            summary: `Analyzed valuation metrics for ${Object.keys(valuations).length} out of ${tickers.length} requested tickers`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error in valuation analysis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function calculateFinancialHealthScore(args: unknown) {
  try {
    const { ticker, weights } = FinancialHealthSchema.parse(args);
    
    const finviz = new FinvizAdapter();
    const fundamentals = await finviz.getFundamentals(ticker);
    
    const healthScore = calculateHealthScore(fundamentals, weights);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            health_score: healthScore,
            weights,
            fundamentals,
            summary: `Financial health score: ${healthScore.overall_score}/100 (${healthScore.rating})`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error calculating health score for ${args && typeof args === 'object' && 'ticker' in args ? (args as any).ticker : 'unknown ticker'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

function calculateValuationComparison(valuations: { [ticker: string]: FundamentalMetrics }, metrics: string[]) {
  const tickers = Object.keys(valuations);
  if (tickers.length === 0) return {};
  
  const analysis: any = {
    metrics_comparison: {},
    rankings: {},
    outliers: {},
    average_values: {},
  };
  
  // Calculate averages and comparisons for each metric
  metrics.forEach(metric => {
    const values: { [ticker: string]: number } = {};
    const numericValues: number[] = [];
    
    tickers.forEach(ticker => {
      const value = (valuations[ticker] as any)[metric];
      if (value && value !== '-' && !isNaN(parseFloat(value))) {
        const numValue = parseFloat(value);
        values[ticker] = numValue;
        numericValues.push(numValue);
      }
    });
    
    if (numericValues.length > 0) {
      const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const sorted = Object.entries(values).sort(([,a], [,b]) => a - b);
      
      analysis.metrics_comparison[metric] = values;
      analysis.rankings[metric] = sorted.map(([ticker]) => ticker);
      analysis.average_values[metric] = avg;
      
      // Identify outliers (values > 2 standard deviations from mean)
      const stdDev = Math.sqrt(numericValues.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / numericValues.length);
      const outlierThreshold = stdDev * 2;
      
      analysis.outliers[metric] = Object.entries(values)
        .filter(([, value]) => Math.abs(value - avg) > outlierThreshold)
        .map(([ticker, value]) => ({ ticker, value, deviation: Math.abs(value - avg) }));
    }
  });
  
  return analysis;
}

function calculateHealthScore(fundamentals: FundamentalMetrics, weights: any) {
  const scores = {
    profitability: 0,
    liquidity: 0,
    leverage: 0,
    efficiency: 0,
    growth: 0,
  };
  
  const details: any = {};
  
  // Profitability Score (0-100)
  let profitabilityScore = 50; // neutral start
  if (fundamentals.profitMargin) {
    const margin = parseFloat(fundamentals.profitMargin.replace('%', ''));
    if (!isNaN(margin)) {
      profitabilityScore = Math.min(100, Math.max(0, 50 + margin * 2));
      details.profit_margin = `${margin}%`;
    }
  }
  if (fundamentals.returnOnEquity) {
    const roe = parseFloat(fundamentals.returnOnEquity.replace('%', ''));
    if (!isNaN(roe)) {
      const roeScore = Math.min(100, Math.max(0, 50 + roe * 3));
      profitabilityScore = (profitabilityScore + roeScore) / 2;
      details.return_on_equity = `${roe}%`;
    }
  }
  scores.profitability = profitabilityScore;
  
  // Liquidity Score (0-100)
  let liquidityScore = 50;
  if (fundamentals.currentRatio) {
    const ratio = parseFloat(fundamentals.currentRatio);
    if (!isNaN(ratio)) {
      // Ideal current ratio is around 1.5-3
      if (ratio >= 1.5 && ratio <= 3) {
        liquidityScore = 90;
      } else if (ratio >= 1 && ratio < 1.5) {
        liquidityScore = 70;
      } else if (ratio > 3) {
        liquidityScore = 60; // Too much cash might indicate poor capital allocation
      } else {
        liquidityScore = 20; // Below 1 is concerning
      }
      details.current_ratio = ratio;
    }
  }
  scores.liquidity = liquidityScore;
  
  // Leverage Score (0-100)
  let leverageScore = 50;
  if (fundamentals.debtToEquity) {
    const debtToEquity = parseFloat(fundamentals.debtToEquity);
    if (!isNaN(debtToEquity)) {
      // Lower debt-to-equity is generally better
      if (debtToEquity <= 0.3) {
        leverageScore = 90;
      } else if (debtToEquity <= 0.6) {
        leverageScore = 70;
      } else if (debtToEquity <= 1.0) {
        leverageScore = 50;
      } else {
        leverageScore = Math.max(10, 50 - (debtToEquity - 1) * 20);
      }
      details.debt_to_equity = debtToEquity;
    }
  }
  scores.leverage = leverageScore;
  
  // Efficiency Score (P/E based)
  let efficiencyScore = 50;
  if (fundamentals.pe) {
    const pe = parseFloat(fundamentals.pe);
    if (!isNaN(pe) && pe > 0) {
      // Reasonable P/E ratios (varies by sector, but generally 15-25 is good)
      if (pe >= 10 && pe <= 20) {
        efficiencyScore = 80;
      } else if (pe >= 5 && pe < 10) {
        efficiencyScore = 70;
      } else if (pe > 20 && pe <= 30) {
        efficiencyScore = 60;
      } else if (pe > 30) {
        efficiencyScore = Math.max(20, 60 - (pe - 30));
      } else {
        efficiencyScore = 30; // Very low P/E might indicate problems
      }
      details.price_to_earnings = pe;
    }
  }
  scores.efficiency = efficiencyScore;
  
  // Growth Score
  let growthScore = 50;
  if (fundamentals.epsGrowth) {
    const epsGrowth = parseFloat(fundamentals.epsGrowth.replace('%', ''));
    if (!isNaN(epsGrowth)) {
      growthScore = Math.min(100, Math.max(0, 50 + epsGrowth));
      details.eps_growth = `${epsGrowth}%`;
    }
  }
  scores.growth = growthScore;
  
  // Calculate weighted overall score
  const overallScore = Math.round(
    scores.profitability * weights.profitability +
    scores.liquidity * weights.liquidity +
    scores.leverage * weights.leverage +
    scores.efficiency * weights.efficiency +
    scores.growth * weights.growth
  );
  
  // Determine rating
  let rating = 'Poor';
  if (overallScore >= 80) rating = 'Excellent';
  else if (overallScore >= 70) rating = 'Good';
  else if (overallScore >= 60) rating = 'Fair';
  else if (overallScore >= 40) rating = 'Below Average';
  
  return {
    overall_score: overallScore,
    rating,
    component_scores: scores,
    details,
    interpretation: {
      profitability: getProfitabilityInterpretation(scores.profitability),
      liquidity: getLiquidityInterpretation(scores.liquidity),
      leverage: getLeverageInterpretation(scores.leverage),
      efficiency: getEfficiencyInterpretation(scores.efficiency),
      growth: getGrowthInterpretation(scores.growth),
    },
  };
}

function getProfitabilityInterpretation(score: number): string {
  if (score >= 80) return 'Strong profitability metrics';
  if (score >= 60) return 'Adequate profitability';
  if (score >= 40) return 'Below average profitability';
  return 'Poor profitability performance';
}

function getLiquidityInterpretation(score: number): string {
  if (score >= 80) return 'Strong liquidity position';
  if (score >= 60) return 'Adequate liquidity';
  if (score >= 40) return 'Liquidity concerns';
  return 'Poor liquidity position';
}

function getLeverageInterpretation(score: number): string {
  if (score >= 80) return 'Conservative debt levels';
  if (score >= 60) return 'Manageable debt levels';
  if (score >= 40) return 'Elevated debt levels';
  return 'High debt burden';
}

function getEfficiencyInterpretation(score: number): string {
  if (score >= 80) return 'Attractive valuation';
  if (score >= 60) return 'Fair valuation';
  if (score >= 40) return 'Expensive valuation';
  return 'Very expensive or concerning valuation';
}

function getGrowthInterpretation(score: number): string {
  if (score >= 80) return 'Strong growth prospects';
  if (score >= 60) return 'Moderate growth expected';
  if (score >= 40) return 'Limited growth prospects';
  return 'Declining or negative growth';
} 