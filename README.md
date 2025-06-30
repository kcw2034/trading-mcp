# Trading MCP Server

A comprehensive Model Context Protocol (MCP) server for stock analysis and trading insights. This server provides advanced stock screening, fundamental analysis, insider trading data, social media sentiment, and news analysis capabilities.

## 📋 MCP Configuration

Add this to your MCP configuration file (typically `~/.cursor/mcp.json` or your IDE's MCP settings):

```json
{
  "mcpServers": {
    "trading-mcp": {
      "command": "node",
      "args": ["/path/to/trading-mcp/dist/server.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-openai-api-key-here",
        "REDDIT_CLIENT_ID": "your-reddit-client-id",
        "REDDIT_CLIENT_SECRET": "your-reddit-client-secret",
        "REDDIT_USERNAME": "your-reddit-username",
        "REDDIT_PASSWORD": "your-reddit-password"
      }
    }
  }
}
```

## 🚀 Features

- **📊 Stock Screening**: Technical pattern recognition and advanced multi-criteria filtering
- **📈 Fundamental Analysis**: Comprehensive metrics, valuation comparison, and AI health scoring
- **🏢 Insider Trading**: Real-time insider activity tracking and sentiment analysis
- **📊 Options Analysis**: Put/call ratio data and options market sentiment analysis
- **💭 Social Media Research**: Reddit integration with AI-powered sentiment analysis
- **📰 News Analysis**: AI-curated news with market impact assessment
- **🎯 Comprehensive Analysis**: All-in-one stock analysis combining multiple data sources

## 📚 Available Tools

**Note:** 
- OpenAI API key is required for news analysis and social sentiment analysis
- Reddit credentials are optional but enable social media research features

### Stock Screening Tools

#### `screen_stocks_advanced_filters`
Comprehensive stock screening using Finviz filters that supports technical patterns, fundamental criteria, and multi-parameter filtering. Use this when you need to find stocks matching specific investment criteria like channel down patterns, profitable companies, or large-cap stocks. The tool returns a ranked list of stocks with key metrics including market cap, P/E ratios, and current prices. Supports complex filter combinations for advanced screening strategies using Finviz format parameters.

**Parameters:**
- `filters` (object): Advanced filter parameters using Finviz format. Use "f" for basic filters including technical patterns (comma-separated), "o" for ordering. Technical patterns should use ta_pattern_* format (e.g., ta_pattern_channeldown). Example: `{"f": "cap_large,fa_pe_profitable,geo_usa,ta_pattern_channeldown", "o": "marketcap"}`
- `limit` (number, default: 50): Maximum number of results to return

### Fundamental Analysis Tools

#### `get_fundamental_stock_metrics`
Comprehensive fundamental analysis tool that retrieves detailed financial metrics including P/E ratios, PEG, ROE, debt ratios, growth rates, and profitability margins. Use this when conducting deep fundamental analysis of individual stocks for investment decisions or valuation assessments. The tool returns complete financial data with key ratios, growth metrics, and profitability indicators. Supports selective metric retrieval for targeted analysis.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `metrics` (array, optional): Specific metrics to retrieve (returns all if not specified)

#### `compare_stock_valuations`
Relative valuation analysis tool that compares key valuation metrics across multiple stocks to identify undervalued or overvalued opportunities. Use this when performing peer analysis, sector comparisons, or evaluating multiple investment candidates side-by-side. The tool returns a comparative analysis with P/E, PEG, Price-to-Book ratios and highlights relative value opportunities. Essential for making informed investment decisions based on relative attractiveness.

**Parameters:**
- `tickers` (array, required): Array of stock ticker symbols to compare
- `metrics` (array, default: ['pe', 'forwardPE', 'peg', 'priceToBook']): Valuation metrics to compare

#### `calculate_financial_health_score`
Financial health analysis tool that calculates a comprehensive score based on profitability, liquidity, leverage, efficiency, and growth metrics. Use this when evaluating the overall financial strength of a company for investment decisions, risk assessment, or portfolio screening. Returns a weighted health score (0-100) with detailed breakdowns of each category, component analysis, and actionable insights. Allows custom weighting of different financial factors to match your investment strategy.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `weights` (object, optional): Custom weights for different health factors
  - `profitability` (number, default: 0.3)
  - `liquidity` (number, default: 0.2)
  - `leverage` (number, default: 0.2)
  - `efficiency` (number, default: 0.15)
  - `growth` (number, default: 0.15)

### Insider Trading Tools

#### `analyze_insider_activity`
Comprehensive insider trading analysis tool that monitors recent transactions and analyzes sentiment patterns. Retrieves buy/sell activity by executives, directors, and major shareholders, then evaluates trading patterns to determine overall insider confidence (bullish, bearish, neutral). Returns detailed transaction history with sentiment analysis, confidence scores, and key insights about insider motivation. Essential for identifying stocks with strong insider support or potential red flags.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `limit` (number, default: 10): Maximum number of transactions to return for display
- `transaction_types` (array, optional): Filter by transaction types (buy, sell, etc.)
- `analysis_period` (number, default: 90): Analysis period in days for sentiment calculation
- `min_transaction_value` (number, default: 10000): Minimum transaction value to include in sentiment analysis

### Options Analysis Tools

#### `get_put_call_ratio`
Options market analysis tool that retrieves put/call ratio data from Barchart to assess market sentiment and options flow. Use this when analyzing options market sentiment, detecting potential market reversals, or understanding institutional hedging activity. The tool returns comprehensive put/call ratios for different expiration dates, volume and open interest data, and AI-powered sentiment analysis. Higher put/call ratios typically indicate bearish sentiment, while lower ratios suggest bullish sentiment. Essential for options traders and investors looking to gauge market sentiment.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol

### Comprehensive Analysis Tools

#### `comprehensive_stock_analysis`
Ultimate comprehensive stock analysis tool that combines multiple analyses in parallel to provide a complete investment evaluation. Executes fundamental metrics, financial health scoring, insider trading analysis, put/call ratio analysis, and when configured, news analysis and Reddit sentiment analysis. Use this when you need a complete overview of a stock across all analysis dimensions for investment decision-making. Returns a formatted report with all analysis results, key insights, and investment summary.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol to analyze

### Social Media Research Tools
*Requires Reddit API configuration*

#### `discover_trending_stocks`
Social momentum detection tool that identifies stocks gaining significant attention and discussion volume across Reddit investing communities. Use this when looking for emerging investment opportunities, detecting viral stock movements, or identifying potential meme stock candidates before they peak. The tool returns ranked lists of trending tickers with mention frequency, sentiment indicators, and community engagement metrics. Perfect for staying ahead of retail investor trends and social media-driven market movements.

**Parameters:**
- `subreddits` (array, default: ['wallstreetbets', 'stocks']): Subreddits to analyze for trending tickers
- `limit` (number, default: 20): Maximum number of trending tickers to return

#### `analyze_reddit_sentiment`
*Requires both Reddit and OpenAI APIs*

Comprehensive Reddit sentiment analysis tool that searches for stock discussions across multiple investing subreddits and uses AI to analyze retail investor sentiment. Combines Reddit post search, optional comment extraction, and advanced sentiment classification to gauge community opinion and engagement. Use this when assessing retail investor sentiment, detecting sentiment shifts, or validating investment decisions against community consensus. Returns posts, sentiment analysis with confidence scores, key themes, and community engagement metrics.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `subreddits` (array, default: ['stocks', 'wallstreetbets', 'investing', 'SecurityAnalysis']): Subreddits to search for discussions
- `time_filter` (string, default: 'week'): Time period to search within ('hour', 'day', 'week', 'month', 'year')
- `limit` (number, default: 25): Maximum number of posts to retrieve
- `sort` (string, default: 'hot'): Sort order for results ('relevance', 'hot', 'top', 'new')
- `max_posts_for_sentiment` (number, default: 50): Maximum number of posts to use for sentiment analysis
- `include_comments` (boolean, default: false): Whether to include comments from a specific post
- `post_id_for_comments` (string, optional): Specific post ID to retrieve comments from
- `comment_limit` (number, default: 100): Maximum number of comments to retrieve if include_comments is true

### News Analysis Tools
*Requires OpenAI API configuration*

#### `analyze_news_and_market_context`
Comprehensive news and market analysis tool that combines recent news sentiment analysis, market impact assessment, and broader sector context analysis. Use this when researching current events affecting a stock, evaluating news-driven price movements, or understanding how individual stocks fit into current market trends. Returns analyzed articles with sentiment scores, impact predictions, sector performance analysis, and macroeconomic context. Essential for making informed investment decisions based on current market conditions.

**Parameters:**
- `ticker` (string, required): Stock ticker symbol
- `days_back` (number, default: 7): Number of days to look back for news
- `max_articles` (number, default: 10): Maximum number of articles to analyze
- `include_sentiment` (boolean, default: true): Include sentiment analysis for each article
- `sector` (string, optional): Stock sector for enhanced context analysis
- `news_items` (array, optional): Specific news headlines or summaries to analyze for market impact

## 🛠️ Installation & Setup

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd trading-mcp
npm install
```

2. **Build the project:**
```bash
npm run build
```

3. **Configure in your MCP client:**
Add the MCP configuration shown above to your MCP client settings with your API credentials.

## 🔧 Configuration

### Required APIs
- **OpenAI**: Required for news analysis and social sentiment analysis
- **Reddit**: Required for social media research features

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add to your MCP configuration as `OPENAI_API_KEY`

#### Reddit API Credentials
1. Visit [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Note your `client_id` and `client_secret`
5. Add your Reddit credentials to your MCP configuration

## 🏗️ Architecture

```
trading-mcp/
├── src/
│   ├── server.ts          # Main MCP server
│   ├── config.ts          # Configuration management
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts
│   ├── adapters/          # External API adapters
│   │   ├── finviz.ts      # Finviz web scraping
│   │   ├── barchart.ts    # Barchart options data scraping
│   │   ├── reddit.ts      # Reddit API integration
│   │   └── openai.ts      # OpenAI API integration
│   └── tools/             # Tool implementations
│       ├── screening.ts   # Stock screening tools
│       ├── fundamentals.ts # Fundamental analysis
│       ├── insider.ts     # Insider trading analysis
│       ├── options.ts     # Options analysis tools
│       ├── social.ts      # Social media research
│       ├── news.ts        # News analysis
│       └── comprehensive.ts # Comprehensive analysis
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 Known Issues

- Finviz web scraping may occasionally fail due to rate limiting or site changes
- Barchart web scraping may occasionally fail due to site changes or rate limiting
- Reddit API has rate limits that may affect high-volume usage
- OpenAI API usage incurs costs based on tokens consumed

## 📊 Example Usage

Once configured, you can use the tools through your MCP-enabled client:

```
# Screen for stocks with specific technical patterns
Use screen_stocks_advanced_filters with filters: {"f": "ta_pattern_channeldown,cap_large,geo_usa"}

# Get comprehensive fundamental analysis
Use get_fundamental_stock_metrics for "AAPL" to see detailed financial data

# Compare multiple stocks
Use compare_stock_valuations for ["AAPL", "MSFT", "GOOGL"] to compare valuations

# Calculate financial health score
Use calculate_financial_health_score for "TSLA" to get AI-powered health assessment

# Analyze insider activity
Use analyze_insider_activity for "NVDA" to see insider trading patterns and sentiment

# Get options market sentiment
Use get_put_call_ratio for "SPY" to see put/call ratios and options sentiment

# Comprehensive analysis (all-in-one)
Use comprehensive_stock_analysis for "AMZN" to get complete multi-dimensional analysis

# Analyze social sentiment (requires Reddit + OpenAI)
Use analyze_reddit_sentiment for "GME" to see Reddit community sentiment

# Get trending stocks (requires Reddit)
Use discover_trending_stocks to find stocks gaining social media momentum

# Analyze news and market context (requires OpenAI)
Use analyze_news_and_market_context for "META" to get news analysis and market context
```

## ⚠️ Disclaimer

This software is for educational and research purposes only. It is not intended as financial advice. Always do your own research and consider consulting with a qualified financial advisor before making investment decisions.

The data provided by this server comes from third-party sources and may not always be accurate or up-to-date. Users should verify information independently before making any trading decisions.

Stock trading and investing involves risk, including the potential loss of principal. Past performance does not guarantee future results.

---

For questions or support, please open an issue on GitHub.