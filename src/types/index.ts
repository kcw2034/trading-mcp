// Stock screening types
export interface ScreeningResult {
  ticker: string;
  company: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: string;
  pe: string;
  price: string;
  change: string;
  volume: string;
}

export interface FilterConfig {
  technical?: string[];
  fundamental?: string[];
  descriptive?: string[];
  performance?: string[];
}

// Fundamental analysis types
export interface FundamentalMetrics {
  ticker: string;
  rsi14?: string;
  sma200?: string;
  pe?: string;
  forwardPE?: string;
  peg?: string;
  currentRatio?: string;
  insiderOwn?: string;
  shortFloat?: string;
  profitMargin?: string;
  marketCap?: string;
  epsGrowth?: string;
  salesGrowth?: string;
  debtToEquity?: string;
  priceToBook?: string;
  returnOnEquity?: string;
}

// Insider trading types
export interface InsiderTransaction {
  insider: string;
  relationship: string;
  date: string;
  transactionType: string;
  cost: string;
  shares: string;
  value: string;
  sharesTotal: string;
}

export interface InsiderActivity {
  ticker: string;
  transactions: InsiderTransaction[];
  totalTransactions: number;
}

// Social media types
export interface RedditPost {
  title: string;
  author: string;
  score: number;
  numComments: number;
  url: string;
  createdUtc: string;
  subreddit: string;
  selftext: string;
}

export interface RedditSearchResult {
  posts: RedditPost[];
  totalFound: number;
  searchQuery: string;
}

// News analysis types
export interface NewsArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  impactScore?: number;
}

export interface NewsAnalysis {
  ticker: string;
  articles: NewsArticle[];
  overallSentiment: 'positive' | 'negative' | 'neutral';
  keyThemes: string[];
  marketImpact: 'high' | 'medium' | 'low';
}

// Configuration types
export interface Config {
  openaiApiKey?: string;
  reddit?: {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
  };
} 