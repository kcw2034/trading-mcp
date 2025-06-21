import { z } from 'zod';
import { RedditAdapter } from '../adapters/reddit.js';
import { OpenAIAdapter } from '../adapters/openai.js';
import { isRedditConfigured, isOpenAIConfigured } from '../config.js';

// Schema for Reddit post search
const RedditSearchSchema = z.object({
  ticker: z.string(),
  subreddits: z.array(z.string()).default(['stocks', 'wallstreetbets', 'investing', 'SecurityAnalysis']),
  time_filter: z.enum(['hour', 'day', 'week', 'month', 'year']).default('week'),
  limit: z.number().default(25),
  sort: z.enum(['relevance', 'hot', 'top', 'new']).default('hot'),
});

// Schema for getting Reddit comments
const RedditCommentsSchema = z.object({
  post_id: z.string(),
  limit: z.number().default(100),
});

// Schema for trending tickers
const TrendingTickersSchema = z.object({
  subreddits: z.array(z.string()).default(['wallstreetbets', 'stocks']),
  limit: z.number().default(20),
});

// Schema for social sentiment analysis
const SocialSentimentSchema = z.object({
  ticker: z.string(),
  subreddits: z.array(z.string()).default(['stocks', 'wallstreetbets', 'investing']),
  time_filter: z.enum(['hour', 'day', 'week', 'month', 'year']).default('week'),
  max_posts: z.number().default(50),
});

/**
 * Utility function to create configuration error response
 * @param configType - Type of configuration that's missing
 * @returns Standard error response object
 */
function createConfigErrorResponse(configType: 'reddit' | 'openai' | 'social-sentiment') {
  const messages = {
    reddit: 'Reddit API credentials are not configured. Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, and REDDIT_PASSWORD environment variables.',
    openai: 'OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.',
    'social-sentiment': 'Both Reddit and OpenAI API credentials are required for social sentiment analysis. Please configure both services.',
  };

  return {
    content: [
      {
        type: "text" as const,
        text: messages[configType],
      },
    ],
    isError: true,
  };
}

export async function searchRedditPosts(args: unknown) {
  if (!isRedditConfigured()) {
    return createConfigErrorResponse('reddit');
  }

  try {
    const { ticker, subreddits, time_filter, limit, sort } = RedditSearchSchema.parse(args);
    
    const reddit = new RedditAdapter();
    const searchResult = await reddit.searchPosts(ticker, subreddits, time_filter, limit, sort);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            search_params: {
              subreddits,
              time_filter,
              limit,
              sort,
            },
            results: searchResult,
            summary: `Found ${searchResult.totalFound} Reddit posts mentioning ${ticker.toUpperCase()}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error searching Reddit posts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getRedditComments(args: unknown) {
  if (!isRedditConfigured()) {
    return createConfigErrorResponse('reddit');
  }

  try {
    const { post_id, limit } = RedditCommentsSchema.parse(args);
    
    const reddit = new RedditAdapter();
    const comments = await reddit.getPostComments(post_id, limit);
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            post_id,
            limit,
            comments,
            total_comments: comments.length,
            summary: `Retrieved ${comments.length} comments from Reddit post ${post_id}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting Reddit comments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getTrendingTickers(args: unknown) {
  if (!isRedditConfigured()) {
    return createConfigErrorResponse('reddit');
  }

  try {
    const { subreddits, limit } = TrendingTickersSchema.parse(args);
    
    const reddit = new RedditAdapter();
    const tickerMentions = await reddit.getTrendingTickers(subreddits);
    
    // Sort by mention count and limit results
    const sortedTickers = Object.entries(tickerMentions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([ticker, mentions]) => ({ ticker, mentions }));
    
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            subreddits,
            trending_tickers: sortedTickers,
            total_unique_tickers: Object.keys(tickerMentions).length,
            summary: `Found ${sortedTickers.length} trending tickers across ${subreddits.join(', ')}`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error getting trending tickers: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

export async function analyzeSocialSentiment(args: unknown) {
  if (!isRedditConfigured() || !isOpenAIConfigured()) {
    return createConfigErrorResponse('social-sentiment');
  }

  try {
    const { ticker, subreddits, time_filter, max_posts } = SocialSentimentSchema.parse(args);
    
    // Get Reddit posts
    const reddit = new RedditAdapter();
    const searchResult = await reddit.searchPosts(ticker, subreddits, time_filter, max_posts, 'hot');
    
    if (searchResult.posts.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              ticker: ticker.toUpperCase(),
              error: 'No Reddit posts found for sentiment analysis',
              suggestion: 'Try expanding the time filter or checking different subreddits',
            }, null, 2),
          },
        ],
      };
    }

    // Analyze sentiment with OpenAI
    const openai = new OpenAIAdapter();
    const sentimentAnalysis = await openai.analyzeSocialSentiment(searchResult.posts);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ticker: ticker.toUpperCase(),
            analysis_params: {
              subreddits,
              time_filter,
              posts_analyzed: searchResult.posts.length,
            },
            sentiment_analysis: sentimentAnalysis,
            top_posts: searchResult.posts.slice(0, 10).map(post => ({
              title: post.title,
              score: post.score,
              subreddit: post.subreddit,
              url: post.url,
            })),
            summary: `Social sentiment: ${sentimentAnalysis.overallSentiment} (score: ${sentimentAnalysis.sentimentScore})`,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error analyzing social sentiment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

// Helper function to extract ticker symbols from text
export function extractTickersFromText(text: string): string[] {
  const tickerRegex = /\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b/g;
  const tickers = new Set<string>();
  let match;
  
  while ((match = tickerRegex.exec(text)) !== null) {
    const ticker = (match[1] || match[2]).toUpperCase();
    // Filter out common false positives
    if (ticker.length >= 2 && ticker.length <= 5 && !isCommonWord(ticker)) {
      tickers.add(ticker);
    }
  }
  
  return Array.from(tickers);
}

function isCommonWord(word: string): boolean {
  const commonWords = [
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE',
    'OUR', 'HAD', 'SEE', 'GET', 'MAY', 'SAY', 'SHE', 'USE', 'HOW', 'NOW', 'MAN', 'NEW',
    'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'END', 'WHY', 'TRY', 'GOD', 'SIX',
    'DOG', 'EAT', 'AGO', 'SIT', 'FUN', 'BAD', 'YES', 'YET', 'ARM', 'FAR', 'OFF', 'ILL',
    'EGG', 'ADD', 'LOT', 'BIG', 'BED', 'RUN', 'TOP', 'CAR', 'CUT', 'AGE', 'BAG', 'OWN'
  ];
  
  return commonWords.includes(word);
}

// Common subreddits for stock discussions
export const STOCK_SUBREDDITS = {
  // Main stock discussion subreddits
  'stocks': 'General stock discussions',
  'investing': 'Long-term investment discussions',
  'SecurityAnalysis': 'Security analysis and valuation',
  'ValueInvesting': 'Value investing focused',
  'financialindependence': 'FIRE movement discussions',
  
  // Trading focused
  'wallstreetbets': 'High-risk trading and options',
  'options': 'Options trading discussions',
  'StockMarket': 'General stock market news',
  'daytrading': 'Day trading strategies',
  'pennystocks': 'Penny stock discussions',
  
  // Sector specific
  'biotech_stocks': 'Biotechnology stocks',
  'tech_stocks': 'Technology stocks',
  'energy_stocks': 'Energy sector stocks',
  'REITs': 'Real Estate Investment Trusts',
  
  // Analysis focused
  'DDintoGME': 'Deep analysis posts',
  'Superstonk': 'GameStop focused but includes general DD',
  'StockAnalysis': 'Stock analysis and research',
};
