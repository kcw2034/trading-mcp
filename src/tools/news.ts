import { z } from 'zod';
import { OpenAIAdapter } from '../adapters/openai.js';
import { isOpenAIConfigured } from '../config.js';

// Schema for getting latest news
const LatestNewsSchema = z.object({
  ticker: z.string(),
  days_back: z.number().default(7),
  max_articles: z.number().default(10),
  include_sentiment: z.boolean().default(true),
});

// Schema for news impact analysis
const NewsImpactSchema = z.object({
  ticker: z.string(),
  news_items: z.array(z.string()),
});

// Schema for market context analysis
const MarketContextSchema = z.object({
  ticker: z.string(),
  sector: z.string().optional(),
});

/**
 * Utility function to create OpenAI configuration error response
 */
function createOpenAIConfigErrorResponse() {
  return {
    content: [
      {
        type: "text" as const,
        text: 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
      },
    ],
    isError: true,
  };
}

export async function getLatestNews(args: unknown) {
  if (!isOpenAIConfigured()) {
    return createOpenAIConfigErrorResponse();
  }

  try {
    const { ticker, days_back, max_articles, include_sentiment } = LatestNewsSchema.parse(args);
    
    const openai = new OpenAIAdapter();
    const newsAnalysis = await openai.getLatestNews(ticker, days_back, max_articles, include_sentiment);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            analysis_params: {
              days_back,
              max_articles,
              include_sentiment,
            },
            news_analysis: newsAnalysis,
            summary: `Found ${newsAnalysis.articles.length} news articles for ${ticker.toUpperCase()}. Overall sentiment: ${newsAnalysis.overallSentiment}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting latest news for ${args && typeof args === 'object' && 'ticker' in args ? (args as any).ticker : 'unknown ticker'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function analyzeNewsImpact(args: unknown) {
  if (!isOpenAIConfigured()) {
    return createOpenAIConfigErrorResponse();
  }

  try {
    const { ticker, news_items } = NewsImpactSchema.parse(args);
    
    if (news_items.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ticker: ticker.toUpperCase(),
              error: 'No news items provided for analysis',
              suggestion: 'Please provide an array of news headlines or summaries to analyze',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
    
    const openai = new OpenAIAdapter();
    const impactAnalysis = await openai.analyzeNewsImpact(ticker, news_items);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            news_items_analyzed: news_items.length,
            impact_analysis: impactAnalysis,
            summary: `News impact for ${ticker.toUpperCase()}: ${impactAnalysis.overallImpact} (impact score: ${impactAnalysis.impactScore}/10)`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error analyzing news impact: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getMarketContext(args: unknown) {
  if (!isOpenAIConfigured()) {
    return createOpenAIConfigErrorResponse();
  }

  try {
    const { ticker, sector } = MarketContextSchema.parse(args);
    
    const openai = new OpenAIAdapter();
    const marketContext = await openai.getMarketContext(ticker, sector);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            sector: sector || 'Not specified',
            market_context: marketContext,
            summary: `Market context analysis completed for ${ticker.toUpperCase()}${sector ? ` in ${sector} sector` : ''}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting market context for ${args && typeof args === 'object' && 'ticker' in args ? (args as any).ticker : 'unknown ticker'}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Helper function to extract key news themes from articles
export function extractNewsThemes(articles: any[]): string[] {
  const themes = new Set<string>();
  
  const keywordCategories = {
    earnings: ['earnings', 'revenue', 'profit', 'loss', 'eps', 'quarterly', 'annual'],
    merger: ['merger', 'acquisition', 'buyout', 'takeover', 'deal'],
    product: ['product', 'launch', 'release', 'innovation', 'patent'],
    management: ['ceo', 'cfo', 'executive', 'management', 'leadership', 'resignation'],
    regulation: ['regulation', 'regulatory', 'fda', 'sec', 'compliance', 'approval'],
    partnership: ['partnership', 'collaboration', 'alliance', 'joint venture'],
    legal: ['lawsuit', 'litigation', 'settlement', 'court', 'legal'],
    upgrade: ['upgrade', 'downgrade', 'rating', 'analyst', 'target price'],
  };
  
  articles.forEach(article => {
    const text = `${article.headline} ${article.summary || ''}`.toLowerCase();
    
    Object.entries(keywordCategories).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        themes.add(theme);
      }
    });
  });
  
  return Array.from(themes);
}

// Helper function to assess news urgency
export function assessNewsUrgency(articles: any[]): 'high' | 'medium' | 'low' {
  const urgentKeywords = [
    'breaking', 'urgent', 'alert', 'emergency', 'crisis', 'bankruptcy', 
    'scandal', 'investigation', 'halt', 'suspended', 'delisting'
  ];
  
  const moderateKeywords = [
    'earnings', 'acquisition', 'merger', 'partnership', 'approval', 
    'launch', 'upgrade', 'downgrade'
  ];
  
  const urgentCount = articles.filter(article => {
    const text = `${article.headline} ${article.summary || ''}`.toLowerCase();
    return urgentKeywords.some(keyword => text.includes(keyword));
  }).length;
  
  const moderateCount = articles.filter(article => {
    const text = `${article.headline} ${article.summary || ''}`.toLowerCase();
    return moderateKeywords.some(keyword => text.includes(keyword));
  }).length;
  
  if (urgentCount > 0) return 'high';
  if (moderateCount >= 2) return 'medium';
  return 'low';
}

// Helper function to categorize news sources by credibility
export function categorizeNewsSources(articles: any[]): {
  high_credibility: string[];
  medium_credibility: string[];
  low_credibility: string[];
} {
  const highCredibilitySources = [
    'reuters', 'bloomberg', 'wall street journal', 'wsj', 'financial times', 
    'ft', 'associated press', 'ap', 'cnbc', 'marketwatch', 'yahoo finance'
  ];
  
  const mediumCredibilitySources = [
    'cnn', 'fox business', 'seeking alpha', 'motley fool', 'investopedia',
    'barrons', 'forbes', 'business insider', 'thestreet'
  ];
  
  const categorized = {
    high_credibility: [] as string[],
    medium_credibility: [] as string[],
    low_credibility: [] as string[],
  };
  
  articles.forEach(article => {
    const source = article.source?.toLowerCase() || '';
    
    if (highCredibilitySources.some(trusted => source.includes(trusted))) {
      if (!categorized.high_credibility.includes(article.source)) {
        categorized.high_credibility.push(article.source);
      }
    } else if (mediumCredibilitySources.some(medium => source.includes(medium))) {
      if (!categorized.medium_credibility.includes(article.source)) {
        categorized.medium_credibility.push(article.source);
      }
    } else {
      if (!categorized.low_credibility.includes(article.source)) {
        categorized.low_credibility.push(article.source);
      }
    }
  });
  
  return categorized;
}

// News analysis constants
export const NEWS_CATEGORIES = {
  earnings: 'Earnings and Financial Results',
  merger: 'Mergers and Acquisitions',
  product: 'Product Launches and Innovation',
  management: 'Management Changes',
  regulation: 'Regulatory and Compliance',
  partnership: 'Partnerships and Alliances',
  legal: 'Legal and Litigation',
  upgrade: 'Analyst Ratings and Upgrades',
  market: 'General Market News',
  sector: 'Sector-Specific News',
};

export const IMPACT_LEVELS = {
  high: 'Significant market impact expected',
  medium: 'Moderate market impact expected',
  low: 'Limited market impact expected',
};

export const SENTIMENT_INDICATORS = {
  positive: ['growth', 'profit', 'revenue beat', 'upgrade', 'partnership', 'acquisition', 'approval'],
  negative: ['loss', 'revenue miss', 'downgrade', 'lawsuit', 'investigation', 'decline', 'bankruptcy'],
  neutral: ['maintenance', 'meeting', 'announcement', 'update', 'statement'],
}; 