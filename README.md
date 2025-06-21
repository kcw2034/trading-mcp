# Trading MCP Server

A comprehensive Model Context Protocol (MCP) server for stock analysis and trading insights. This server provides advanced stock screening, fundamental analysis, insider trading data, social media sentiment, and news analysis capabilities.

## 🚀 Features

### 📊 Stock Screening
- **Technical Pattern Screening**: Find stocks matching specific chart patterns using Finviz
- **Advanced Filtering**: Custom multi-criteria stock screening with complex filter combinations
- **Market Cap Filtering**: Filter by company size (nano, micro, small, mid, large, mega)

### 📈 Fundamental Analysis
- **Comprehensive Metrics**: P/E ratios, PEG, ROE, debt ratios, growth metrics, and more
- **Valuation Comparison**: Compare multiple stocks across key valuation metrics
- **Financial Health Score**: AI-powered composite scoring of financial health

### 🏢 Insider Trading Analysis
- **Insider Activity Tracking**: Monitor recent insider transactions by executives and directors
- **Sentiment Analysis**: Determine bullish/bearish insider sentiment from transaction patterns
- **Executive-Level Insights**: Focus on CEO, CFO, and board member activities

### 💭 Social Media Research
- **Reddit Integration**: Search across multiple investing subreddits
- **Trending Tickers**: Identify stocks gaining social media momentum
- **Sentiment Analysis**: AI-powered analysis of retail investor sentiment

### 📰 News Analysis
- **Latest News**: AI-curated and summarized recent news articles
- **Impact Assessment**: Analyze potential market impact of news events
- **Market Context**: Broader sector and market analysis

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd trading-mcp
npm install
```

2. **Configure environment variables:**
```bash
cp env.example .env
```

Edit `.env` with your API credentials:

```env
# OpenAI API Configuration (Required for news analysis)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Reddit API Configuration (Optional, for social media features)
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
REDDIT_USERNAME=your-reddit-username
REDDIT_PASSWORD=your-reddit-password
```

3. **Build the project:**
```bash
npm run build
```

4. **Start the server:**
```bash
npm start
```

## 🔧 Configuration

### Required APIs
- **Finviz**: No API key required (web scraping)
- **OpenAI**: Required for news analysis and social sentiment analysis
- **Reddit**: Optional, enables social media research features

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add to your `.env` file as `OPENAI_API_KEY`

#### Reddit API Credentials
1. Visit [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Note your `client_id` and `client_secret`
5. Add your Reddit username and password to `.env`

## 📚 Available Tools

### Stock Screening Tools

#### `finviz_technical_screen`
Screen stocks using technical chart patterns.

**Parameters:**
- `pattern` (string): Technical pattern (e.g., "channel_down", "triangle_ascending")
- `market_cap` (string): Market cap filter ("nano", "micro", "small", "mid", "large", "mega")
- `geo` (string): Geographic filter ("usa", "foreign")
- `limit` (number): Maximum results to return

#### `advanced_stock_filter`
Apply advanced multi-criteria screening.

**Parameters:**
- `filters` (object): Advanced filter parameters
- `limit` (number): Maximum results to return

### Fundamental Analysis Tools

#### `get_fundamental_metrics`
Retrieve comprehensive fundamental data for a stock.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `metrics` (array): Specific metrics to retrieve (optional)

#### `analyze_valuation_metrics`
Compare valuation metrics across multiple stocks.

**Parameters:**
- `tickers` (array): Stock ticker symbols to compare
- `metrics` (array): Valuation metrics to compare

#### `financial_health_score`
Calculate a comprehensive financial health score.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `weights` (object): Custom weights for health factors

### Insider Trading Tools

#### `get_insider_activity`
Retrieve recent insider trading transactions.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `limit` (number): Maximum transactions to return
- `transaction_types` (array): Filter by transaction types

#### `analyze_insider_sentiment`
Analyze insider trading patterns for sentiment.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `analysis_period` (number): Analysis period in days
- `min_transaction_value` (number): Minimum transaction value

### Social Media Research Tools
*Requires Reddit API configuration*

#### `search_reddit_posts`
Search Reddit for posts mentioning a stock.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `subreddits` (array): Subreddits to search
- `time_filter` (string): Time period ("hour", "day", "week", "month", "year")
- `limit` (number): Maximum posts to return
- `sort` (string): Sort order ("relevance", "hot", "top", "new")

#### `get_trending_tickers`
Find trending stock tickers on Reddit.

**Parameters:**
- `subreddits` (array): Subreddits to analyze
- `limit` (number): Maximum trending tickers to return

#### `analyze_social_sentiment`
*Requires both Reddit and OpenAI APIs*

Analyze social media sentiment using AI.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `subreddits` (array): Subreddits to analyze
- `time_filter` (string): Time period to analyze
- `max_posts` (number): Maximum posts to analyze

### News Analysis Tools
*Requires OpenAI API configuration*

#### `get_latest_news`
Get and analyze latest news articles about a stock.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `days_back` (number): Days to look back for news
- `max_articles` (number): Maximum articles to analyze
- `include_sentiment` (boolean): Include sentiment analysis

#### `analyze_news_impact`
Analyze potential market impact of news items.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `news_items` (array): News headlines or summaries to analyze

#### `market_context_analysis`
Provide broader market and sector context.

**Parameters:**
- `ticker` (string): Stock ticker symbol
- `sector` (string): Stock sector (optional)

## 🔍 Usage Examples

### Basic Stock Screening
```json
{
  "tool": "finviz_technical_screen",
  "parameters": {
    "pattern": "channel_down",
    "market_cap": "large",
    "limit": 10
  }
}
```

### Fundamental Analysis
```json
{
  "tool": "get_fundamental_metrics",
  "parameters": {
    "ticker": "AAPL",
    "metrics": ["pe", "peg", "currentRatio", "profitMargin"]
  }
}
```

### Insider Trading Analysis
```json
{
  "tool": "analyze_insider_sentiment",
  "parameters": {
    "ticker": "TSLA",
    "analysis_period": 90,
    "min_transaction_value": 50000
  }
}
```

### Social Media Research
```json
{
  "tool": "search_reddit_posts",
  "parameters": {
    "ticker": "NVDA",
    "subreddits": ["stocks", "wallstreetbets"],
    "time_filter": "week",
    "limit": 25
  }
}
```

### News Analysis
```json
{
  "tool": "get_latest_news",
  "parameters": {
    "ticker": "MSFT",
    "days_back": 7,
    "max_articles": 10,
    "include_sentiment": true
  }
}
```

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
│   │   ├── reddit.ts      # Reddit API integration
│   │   └── openai.ts      # OpenAI API integration
│   └── tools/             # Tool implementations
│       ├── screening.ts   # Stock screening tools
│       ├── fundamentals.ts # Fundamental analysis
│       ├── insider.ts     # Insider trading analysis
│       ├── social.ts      # Social media research
│       └── news.ts        # News analysis
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Rate Limiting & Usage

### API Rate Limits
- **Finviz**: Be respectful with web scraping (built-in delays)
- **Reddit API**: 60 requests per minute
- **OpenAI API**: Varies by plan (track usage in OpenAI dashboard)

### Best Practices
- Use appropriate limits to avoid hitting rate limits
- Cache results when possible for frequently requested data
- Monitor API usage and costs, especially for OpenAI

## 🐛 Troubleshooting

### Common Issues

#### "Reddit API credentials not configured"
- Ensure all Reddit environment variables are set in `.env`
- Verify your Reddit app credentials are correct
- Check that your Reddit app type is set to "script"

#### "OpenAI API key not configured"
- Verify `OPENAI_API_KEY` is set in `.env`
- Ensure your OpenAI account has API access and credits

#### "Failed to screen stocks"
- Finviz may be temporarily blocking requests
- Try different patterns or reduce request frequency
- Check your internet connection

#### TypeScript compilation errors
- Run `npm run clean && npm run build`
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (requires 18.0.0+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and research purposes only. It is not intended as financial advice. Always do your own research and consider consulting with a qualified financial advisor before making investment decisions.

The data provided by this server comes from third-party sources and may not always be accurate or up-to-date. Users should verify information independently before making any trading decisions.

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Finviz](https://finviz.com/)
- [Reddit API](https://www.reddit.com/dev/api/)
- [OpenAI API](https://platform.openai.com/docs/)

---

For questions or support, please open an issue on GitHub.