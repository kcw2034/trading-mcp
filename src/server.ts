#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import { finvizTechnicalScreen, advancedStockFilter } from './tools/screening.js';
import { getFundamentalMetrics, analyzeValuationMetrics, calculateFinancialHealthScore } from './tools/fundamentals.js';
import { getInsiderActivity, analyzeInsiderSentiment } from './tools/insider.js';
import { searchRedditPosts, getRedditComments, getTrendingTickers, analyzeSocialSentiment } from './tools/social.js';
import { getLatestNews, analyzeNewsImpact, getMarketContext } from './tools/news.js';

// Import configuration helpers
import { isRedditConfigured, isOpenAIConfigured } from './config.js';

// Initialize the server
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

// Define all available tools
const tools: Tool[] = [
  // Stock Screening Tools
  {
    name: 'finviz_technical_screen',
    description: 'Screen stocks using Finviz technical patterns and filters. Finds stocks matching specific technical chart patterns.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Technical pattern to screen for (e.g., channel_down, triangle_ascending, support)',
          default: 'channel_down',
        },
        market_cap: {
          type: 'string',
          description: 'Market cap filter (nano, micro, small, mid, large, mega)',
          default: 'large',
        },
        geo: {
          type: 'string',
          description: 'Geographic filter (usa, foreign)',
          default: 'usa',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 20,
        },
      },
    },
  },
  {
    name: 'advanced_stock_filter',
    description: 'Apply advanced Finviz filters for custom stock screening with multiple filter combinations.',
    inputSchema: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          description: 'Advanced filter parameters as key-value pairs (e.g., {"f": "fa_pe_low,ta_rsi_os30", "o": "pe"})',
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

  // Fundamental Analysis Tools
  {
    name: 'get_fundamental_metrics',
    description: 'Retrieve comprehensive fundamental metrics for a stock including P/E, PEG, ROE, debt ratios, and growth metrics.',
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
    name: 'analyze_valuation_metrics',
    description: 'Compare valuation metrics across multiple stocks to identify relative value opportunities.',
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
    name: 'financial_health_score',
    description: 'Calculate a comprehensive financial health score based on profitability, liquidity, leverage, efficiency, and growth metrics.',
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

  // Insider Trading Tools
  {
    name: 'get_insider_activity',
    description: 'Retrieve recent insider trading activity for a stock including transactions by executives and directors.',
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
    description: 'Analyze insider trading patterns to determine overall insider sentiment (bullish, bearish, neutral).',
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
];

// Conditional tools that require API configuration
if (isRedditConfigured()) {
  tools.push(
    // Social Media Research Tools
    {
      name: 'search_reddit_posts',
      description: 'Search Reddit for posts mentioning a specific stock ticker across multiple subreddits.',
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
      name: 'get_reddit_comments',
      description: 'Retrieve comments from a specific Reddit post for detailed sentiment analysis.',
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
      name: 'get_trending_tickers',
      description: 'Find trending stock tickers mentioned across Reddit investing communities.',
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
    // News Analysis Tools
    {
      name: 'get_latest_news',
      description: 'Get and analyze the latest news articles about a stock using AI-powered summarization and sentiment analysis.',
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
      name: 'analyze_news_impact',
      description: 'Analyze the potential market impact of specific news items on a stock price.',
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
      name: 'market_context_analysis',
      description: 'Provide broader market and sector context analysis for a stock.',
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

// Add social sentiment analysis if both Reddit and OpenAI are configured
if (isRedditConfigured() && isOpenAIConfigured()) {
  tools.push({
    name: 'analyze_social_sentiment',
    description: 'Analyze social media sentiment for a stock by combining Reddit posts with AI-powered sentiment analysis.',
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

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // Stock Screening Tools
      case 'finviz_technical_screen':
        return await finvizTechnicalScreen(args);
      case 'advanced_stock_filter':
        return await advancedStockFilter(args);

      // Fundamental Analysis Tools
      case 'get_fundamental_metrics':
        return await getFundamentalMetrics(args);
      case 'analyze_valuation_metrics':
        return await analyzeValuationMetrics(args);
      case 'financial_health_score':
        return await calculateFinancialHealthScore(args);

      // Insider Trading Tools
      case 'get_insider_activity':
        return await getInsiderActivity(args);
      case 'analyze_insider_sentiment':
        return await analyzeInsiderSentiment(args);

      // Social Media Research Tools (Reddit required)
      case 'search_reddit_posts':
        return await searchRedditPosts(args);
      case 'get_reddit_comments':
        return await getRedditComments(args);
      case 'get_trending_tickers':
        return await getTrendingTickers(args);

      // News Analysis Tools (OpenAI required)
      case 'get_latest_news':
        return await getLatestNews(args);
      case 'analyze_news_impact':
        return await analyzeNewsImpact(args);
      case 'market_context_analysis':
        return await getMarketContext(args);

      // Social Sentiment Analysis (Both Reddit and OpenAI required)
      case 'analyze_social_sentiment':
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

// Start the server
/**
 * Main function to start the Trading MCP Server
 * Initializes the server with stdio transport and connects to the MCP protocol
 */
async function main() {
  const transport = new StdioServerTransport();
  
  console.error('Trading MCP Server starting...');
  console.error(`Configured tools: ${tools.length}`);
  console.error(`Reddit configured: ${isRedditConfigured()}`);
  console.error(`OpenAI configured: ${isOpenAIConfigured()}`);
  
  await server.connect(transport);
  console.error('Trading MCP Server running');
}

// Handle shutdown gracefully
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