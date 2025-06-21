#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { advancedStockFilter } from './tools/screening.js';
import { getFundamentalMetrics, analyzeValuationMetrics, calculateFinancialHealthScore } from './tools/fundamentals.js';
import { getInsiderActivity, analyzeInsiderSentiment } from './tools/insider.js';
import { searchRedditPosts, getRedditComments, getTrendingTickers, analyzeSocialSentiment } from './tools/social.js';
import { getLatestNews, analyzeNewsImpact, getMarketContext } from './tools/news.js';
import { getPutCallRatio } from './tools/options.js';
import { isRedditConfigured, isOpenAIConfigured } from './config.js';

const server = new Server(
  {
    name: 'trading-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'screen_stocks_advanced_filters',
    description: 'Comprehensive stock screening using Finviz filters that supports technical patterns, fundamental criteria, and multi-parameter filtering. Use this when you need to find stocks matching specific investment criteria like channel down patterns, profitable companies, or large-cap stocks. The tool returns a ranked list of stocks with key metrics including market cap, P/E ratios, and current prices. Supports complex filter combinations for advanced screening strategies using Finviz format parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          description: 'Advanced filter parameters using Finviz format. Use "f" for basic filters (comma-separated), "s" for technical signals, "o" for ordering. Example: {"f": "cap_large,fa_pe_profitable,geo_usa", "s": "ta_p_channeldown", "o": "marketcap"}',
          default: {},
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 50,
        },
      },
    },
  },

  {
    name: 'get_fundamental_stock_metrics',
    description: 'Comprehensive fundamental analysis tool that retrieves detailed financial metrics including P/E ratios, PEG, ROE, debt ratios, growth rates, and profitability margins. Use this when conducting deep fundamental analysis of individual stocks for investment decisions or valuation assessments. The tool returns complete financial data with key ratios, growth metrics, and profitability indicators. Supports selective metric retrieval for targeted analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific metrics to retrieve (optional, returns all if not specified)',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'compare_stock_valuations',
    description: 'Relative valuation analysis tool that compares key valuation metrics across multiple stocks to identify undervalued or overvalued opportunities. Use this when performing peer analysis, sector comparisons, or evaluating multiple investment candidates side-by-side. The tool returns a comparative analysis with P/E, PEG, Price-to-Book ratios and highlights relative value opportunities. Essential for making informed investment decisions based on relative attractiveness.',
    inputSchema: {
      type: 'object',
      properties: {
        tickers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of stock ticker symbols to compare',
        },
        metrics: {
          type: 'array',
          items: { type: 'string' },
          description: 'Valuation metrics to compare',
          default: ['pe', 'forwardPE', 'peg', 'priceToBook'],
        },
      },
      required: ['tickers'],
    },
  },
  {
    name: 'calculate_financial_health_score',
    description: 'Financial health analysis tool that calculates a comprehensive score based on profitability, liquidity, leverage, efficiency, and growth metrics. Use this when evaluating the overall financial strength of a company for investment decisions, risk assessment, or portfolio screening. Returns a weighted health score (0-100) with detailed breakdowns of each category, component analysis, and actionable insights. Allows custom weighting of different financial factors to match your investment strategy.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        weights: {
          type: 'object',
          description: 'Custom weights for different health factors',
          properties: {
            profitability: { type: 'number', default: 0.3 },
            liquidity: { type: 'number', default: 0.2 },
            leverage: { type: 'number', default: 0.2 },
            efficiency: { type: 'number', default: 0.15 },
            growth: { type: 'number', default: 0.15 },
          },
        },
      },
      required: ['ticker'],
    },
  },

  {
    name: 'track_insider_trading_activity',
    description: 'Insider trading monitoring tool that retrieves recent transactions by executives, directors, and major shareholders including buy/sell activity, transaction amounts, and timing. Use this when analyzing insider sentiment, investigating potential red flags, or looking for bullish insider buying signals before making investment decisions. The tool returns detailed transaction history with insider names, positions, transaction types, and monetary values. Helps identify patterns of insider confidence or concern.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of transactions to return',
          default: 10,
        },
        transaction_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by transaction types (buy, sell, etc.)',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'analyze_insider_sentiment',
    description: 'Insider sentiment analysis tool that evaluates trading patterns to determine overall insider confidence (bullish, bearish, neutral) based on recent transaction history and patterns. Use this when assessing management confidence, detecting potential insider knowledge of upcoming events, or validating your investment thesis with insider behavior. The tool returns sentiment classification, confidence scores, transaction pattern analysis, and key insights about insider motivation. Particularly valuable for identifying stocks with strong insider support.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        analysis_period: {
          type: 'number',
          description: 'Analysis period in days',
          default: 90,
        },
        min_transaction_value: {
          type: 'number',
          description: 'Minimum transaction value to include in analysis',
          default: 10000,
        },
      },
      required: ['ticker'],
    },
  },

  {
    name: 'get_put_call_ratio',
    description: 'Options market analysis tool that retrieves put/call ratio data from Barchart to assess market sentiment and options flow. Use this when analyzing options market sentiment, detecting potential market reversals, or understanding institutional hedging activity. The tool returns comprehensive put/call ratios for different expiration dates, volume and open interest data, and AI-powered sentiment analysis. Higher put/call ratios typically indicate bearish sentiment, while lower ratios suggest bullish sentiment. Essential for options traders and investors looking to gauge market sentiment.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['ticker'],
    },
  },
];

if (isRedditConfigured()) {
  tools.push(
    {
      name: 'search_reddit_stock_discussions',
      description: 'Social media research tool that searches Reddit for posts mentioning specific stock tickers across multiple investing subreddits including WallStreetBets, r/stocks, and r/investing. Use this when gauging retail investor sentiment, identifying emerging trends, or researching community opinions about specific stocks. The tool returns relevant posts with titles, content, engagement metrics, and timestamps. Essential for understanding retail investor behavior and social sentiment around your investment targets.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol to search for',
          },
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'Subreddits to search in',
            default: ['stocks', 'wallstreetbets', 'investing', 'SecurityAnalysis'],
          },
          time_filter: {
            type: 'string',
            enum: ['hour', 'day', 'week', 'month', 'year'],
            description: 'Time period to search within',
            default: 'week',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of posts to return',
            default: 25,
          },
          sort: {
            type: 'string',
            enum: ['relevance', 'hot', 'top', 'new'],
            description: 'Sort order for results',
            default: 'hot',
          },
        },
        required: ['ticker'],
      },
    },
    {
      name: 'extract_reddit_post_comments',
      description: 'Comment analysis tool that retrieves detailed comments from specific Reddit posts to analyze community sentiment and extract investment insights. Use this when diving deeper into specific discussions, analyzing comment sentiment, or gathering detailed opinions from a particular post about a stock. The tool returns comment threads with content, scores, timestamps, and user engagement data. Valuable for understanding the depth of community sentiment beyond just post titles.',
      inputSchema: {
        type: 'object',
        properties: {
          post_id: {
            type: 'string',
            description: 'Reddit post ID',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of comments to return',
            default: 100,
          },
        },
        required: ['post_id'],
      },
    },
    {
      name: 'discover_trending_stocks',
      description: 'Social momentum detection tool that identifies stocks gaining significant attention and discussion volume across Reddit investing communities. Use this when looking for emerging investment opportunities, detecting viral stock movements, or identifying potential meme stock candidates before they peak. The tool returns ranked lists of trending tickers with mention frequency, sentiment indicators, and community engagement metrics. Perfect for staying ahead of retail investor trends and social media-driven market movements.',
      inputSchema: {
        type: 'object',
        properties: {
          subreddits: {
            type: 'array',
            items: { type: 'string' },
            description: 'Subreddits to analyze for trending tickers',
            default: ['wallstreetbets', 'stocks'],
          },
          limit: {
            type: 'number',
            description: 'Maximum number of trending tickers to return',
            default: 20,
          },
        },
      },
    }
  );
}

if (isOpenAIConfigured()) {
  tools.push(
    {
      name: 'analyze_stock_news_sentiment',
      description: 'AI-powered news analysis tool that retrieves and analyzes recent news articles about stocks using advanced summarization and sentiment classification. Use this when researching current events affecting a stock, assessing news-driven price movements, or staying updated on company developments. The tool returns analyzed articles with sentiment scores, key themes, market relevance ratings, and AI-generated summaries. Essential for understanding how current events may impact your investment decisions.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol',
          },
          days_back: {
            type: 'number',
            description: 'Number of days to look back for news',
            default: 7,
          },
          max_articles: {
            type: 'number',
            description: 'Maximum number of articles to analyze',
            default: 10,
          },
          include_sentiment: {
            type: 'boolean',
            description: 'Include sentiment analysis for each article',
            default: true,
          },
        },
        required: ['ticker'],
      },
    },
    {
      name: 'assess_news_market_impact',
      description: 'Market impact assessment tool that analyzes how specific news headlines or events will likely affect stock price movements using AI-powered analysis. Use this when evaluating the significance of breaking news, earnings announcements, or major corporate events for investment timing decisions. The tool returns impact predictions, confidence levels, historical context, and trading implications. Crucial for making informed buy/sell decisions around news events.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol',
          },
          news_items: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of news headlines or summaries to analyze',
          },
        },
        required: ['ticker', 'news_items'],
      },
    },
    {
      name: 'analyze_market_sector_context',
      description: 'Broader market context analysis tool that provides comprehensive sector and market condition analysis to understand how individual stocks fit into current economic trends. Use this when evaluating whether stock movements are company-specific or part of broader market/sector trends, assessing systematic risk, or making sector rotation decisions. The tool returns market condition assessments, sector performance analysis, relative positioning, and macroeconomic context. Essential for understanding the bigger picture behind individual stock performance.',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: {
            type: 'string',
            description: 'Stock ticker symbol',
          },
          sector: {
            type: 'string',
            description: 'Stock sector for enhanced context (optional)',
          },
        },
        required: ['ticker'],
      },
    }
  );
}

if (isRedditConfigured() && isOpenAIConfigured()) {
  tools.push({
    name: 'analyze_social_media_sentiment',
    description: 'Advanced social sentiment analysis tool that combines Reddit post data with AI-powered sentiment classification to gauge retail investor sentiment and community opinion. Use this when assessing overall market sentiment, detecting sentiment shifts before price movements, or validating investment decisions against community consensus. The tool returns comprehensive sentiment analysis with confidence scores, key themes, emotional indicators, and community engagement metrics. Combines the reach of social media monitoring with the precision of AI analysis for superior market sentiment insights.',
    inputSchema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        subreddits: {
          type: 'array',
          items: { type: 'string' },
          description: 'Subreddits to analyze',
          default: ['stocks', 'wallstreetbets', 'investing'],
        },
        time_filter: {
          type: 'string',
          enum: ['hour', 'day', 'week', 'month', 'year'],
          description: 'Time period to analyze',
          default: 'week',
        },
        max_posts: {
          type: 'number',
          description: 'Maximum number of posts to analyze',
          default: 50,
        },
      },
      required: ['ticker'],
    },
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'screen_stocks_advanced_filters':
        return await advancedStockFilter(args);

      case 'get_fundamental_stock_metrics':
        return await getFundamentalMetrics(args);
      case 'compare_stock_valuations':
        return await analyzeValuationMetrics(args);
      case 'calculate_financial_health_score':
        return await calculateFinancialHealthScore(args);

      case 'track_insider_trading_activity':
        return await getInsiderActivity(args);
      case 'analyze_insider_sentiment':
        return await analyzeInsiderSentiment(args);

      case 'get_put_call_ratio':
        return await getPutCallRatio(args);

      case 'search_reddit_stock_discussions':
        return await searchRedditPosts(args);
      case 'extract_reddit_post_comments':
        return await getRedditComments(args);
      case 'discover_trending_stocks':
        return await getTrendingTickers(args);

      case 'analyze_stock_news_sentiment':
        return await getLatestNews(args);
      case 'assess_news_market_impact':
        return await analyzeNewsImpact(args);
      case 'analyze_market_sector_context':
        return await getMarketContext(args);

      case 'analyze_social_media_sentiment':
        return await analyzeSocialSentiment(args);

      default:
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  
  console.error('Trading MCP Server starting...');
  console.error(`Configured tools: ${tools.length}`);
  console.error(`Reddit configured: ${isRedditConfigured()}`);
  console.error(`OpenAI configured: ${isOpenAIConfigured()}`);
  
  await server.connect(transport);
  console.error('Trading MCP Server running');
}

process.on('SIGINT', () => {
  console.error('Trading MCP Server shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Trading MCP Server shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
