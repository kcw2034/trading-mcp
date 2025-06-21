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
- **💭 Social Media Research**: Reddit integration with AI-powered sentiment analysis
- **📰 News Analysis**: AI-curated news with market impact assessment

## 📚 Available Tools

**Note:** 
- OpenAI API key is required for news analysis and social sentiment analysis
- Reddit credentials are optional but enable social media research features

### Stock Screening Tools

#### `finviz_technical_screen`
Screen stocks using Finviz technical chart patterns. Find stocks matching specific patterns like channel down, triangle ascending, support levels, etc. Filter by market cap and geography.

#### `advanced_stock_filter`
Apply advanced multi-criteria stock screening with custom filter combinations. Use complex Finviz parameters to find stocks matching specific fundamental and technical criteria.

### Fundamental Analysis Tools

#### `get_fundamental_metrics`
Retrieve comprehensive fundamental data for any stock including P/E ratios, PEG, ROE, debt ratios, growth metrics, profitability margins, and more.

#### `analyze_valuation_metrics`
Compare valuation metrics across multiple stocks to identify relative value opportunities. Perfect for peer analysis and sector comparisons.

#### `financial_health_score`
Calculate an AI-powered comprehensive financial health score based on profitability, liquidity, leverage, efficiency, and growth metrics with customizable weightings.

### Insider Trading Tools

#### `get_insider_activity`
Track recent insider trading transactions by executives, directors, and large shareholders. Monitor buying and selling activity with transaction details.

#### `analyze_insider_sentiment`
Analyze insider trading patterns to determine overall sentiment (bullish, bearish, neutral) based on recent transaction history and patterns.

### Social Media Research Tools
*Requires Reddit API configuration*

#### `search_reddit_posts`
Search Reddit for posts mentioning specific stock tickers across multiple investing subreddits with time-based filtering and sorting options.

#### `get_reddit_comments`
Retrieve detailed comments from specific Reddit posts for in-depth sentiment analysis and community discussion insights.

#### `get_trending_tickers`
Identify stocks gaining social media momentum by analyzing mention frequency across Reddit investing communities.

#### `analyze_social_sentiment`
*Requires both Reddit and OpenAI APIs*

AI-powered analysis of social media sentiment combining Reddit data with advanced sentiment classification and confidence scoring.

### News Analysis Tools
*Requires OpenAI API configuration*

#### `get_latest_news`
Get and analyze recent news articles about stocks using AI-powered summarization and sentiment analysis with relevance scoring.

#### `analyze_news_impact`
Assess the potential market impact of specific news headlines or events using AI analysis to predict stock price effects.

#### `market_context_analysis`
Provide broader market and sector context analysis to understand how individual stocks fit into current market conditions.

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
- **Finviz**: No API key required (web scraping)
- **OpenAI**: Required for news analysis and social sentiment analysis
- **Reddit**: Optional, enables social media research features

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

## 🐛 Known Issues

- Finviz web scraping may occasionally fail due to rate limiting or site changes
- Reddit API has rate limits that may affect high-volume usage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📊 Example Usage

Once configured, you can use the tools through your MCP-enabled client:

```
# Screen for stocks with specific technical patterns
Use the finviz_technical_screen tool to find stocks with "triangle_ascending" pattern

# Get fundamental analysis
Use get_fundamental_metrics for "AAPL" to see comprehensive financial data

# Analyze social sentiment
Use analyze_social_sentiment for "TSLA" to see Reddit discussion sentiment
```


## ⚠️ Disclaimer

This software is for educational and research purposes only. It is not intended as financial advice. Always do your own research and consider consulting with a qualified financial advisor before making investment decisions.

The data provided by this server comes from third-party sources and may not always be accurate or up-to-date. Users should verify information independently before making any trading decisions.

---

For questions or support, please open an issue on GitHub.