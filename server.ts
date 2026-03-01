import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import Parser from "rss-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

console.log("Starting server.ts...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const parser = new Parser();

// Configure axios defaults
const apiClient = axios.create({
  headers: {
    'User-Agent': 'CryptoSignalPro/1.0',
    'Accept': 'application/json'
  },
  timeout: 10000
});

// Cache objects
let cache = {
  universe: null,
  universeTime: 0,
  overview: null,
  overviewTime: 0,
  news: null,
  newsTime: 0
};

const CACHE_TTL = {
  universe: 15 * 60 * 1000, // 15 mins
  overview: 60 * 1000,      // 1 min
  news: 30 * 60 * 1000      // 30 mins
};

// API Routes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Server is reachable", timestamp: new Date().toISOString() });
});

// Proxy for CoinGecko Top 100
app.get("/api/universe", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.universe && (now - cache.universeTime < CACHE_TTL.universe)) {
      console.log("Serving universe from cache");
      return res.json(cache.universe);
    }

    console.log("Fetching universe from CoinGecko...");
    const response = await apiClient.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: 100,
        page: 1,
        sparkline: false,
        price_change_percentage: "24h"
      }
    });

    cache.universe = response.data;
    cache.universeTime = now;
    res.json(response.data);
  } catch (error) {
    console.error("Universe API Error:", error.response?.status, error.response?.data || error.message);
    res.status(503).json({ 
      error: "CoinGecko API Unavailable", 
      status: "OFFLINE",
      detail: error.message
    });
  }
});

// Proxy for Bitget Tickers (Public)
app.get("/api/market/overview", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.overview && (now - cache.overviewTime < CACHE_TTL.overview)) {
      return res.json(cache.overview);
    }

    // Bitget V2 API for spot tickers
    const response = await apiClient.get("https://api.bitget.com/api/v2/spot/market/tickers");
    
    // Fear & Greed Index
    const fgResponse = await apiClient.get("https://api.alternative.me/fng/");

    const data = {
      bitget: response.data.data,
      fearGreed: fgResponse.data.data[0],
      timestamp: now
    };

    cache.overview = data;
    cache.overviewTime = now;
    res.json(data);
  } catch (error) {
    console.error("Market Overview Error:", error.message);
    res.status(503).json({ error: "Market Data Unavailable", status: "OFFLINE" });
  }
});

// Bitget Candles for Technical Analysis
app.get("/api/asset/candles", async (req, res) => {
  const { symbol, granularity = '1h' } = req.query;
  const targetSymbol = (symbol as string || 'BTCUSDT').toUpperCase();

  // Basic validation to avoid obvious errors
  if (targetSymbol === 'USDTUSDT' || targetSymbol === 'USDCUSDT') {
    return res.json([]);
  }

  try {
    console.log(`Fetching candles for ${targetSymbol} with granularity ${granularity}`);
    
    const response = await apiClient.get("https://api.bitget.com/api/v2/spot/market/candles", {
      params: {
        symbol: targetSymbol,
        granularity: granularity,
        limit: 100
      }
    });

    // Handle Bitget-specific error codes gracefully
    if (response.data.code !== "00000") {
      // If symbol doesn't exist, just return empty array instead of 400
      if (response.data.code === "40034" || response.data.msg?.includes("not exist")) {
        return res.json([]);
      }
      console.error("Bitget API Error Code:", response.data.code, response.data.msg);
      return res.status(400).json({ error: response.data.msg });
    }

    res.json(response.data.data || []);
  } catch (error) {
    if (error.response) {
      // If it's a 400 from Bitget but we didn't catch the code above
      if (error.response.status === 400) {
        return res.json([]);
      }
      console.error("Candle API Error Response:", error.response.status, JSON.stringify(error.response.data));
    } else {
      console.error("Candle API Error:", error.message);
    }
    res.status(503).json({ error: "Candle Data Unavailable" });
  }
});

// News Feed
app.get("/api/news", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.news && (now - cache.newsTime < CACHE_TTL.news)) {
      return res.json(cache.news);
    }

    const feed = await parser.parseURL("https://cointelegraph.com/rss/tag/bitcoin");
    const news = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      contentSnippet: item.contentSnippet
    }));

    cache.news = news;
    cache.newsTime = now;
    res.json(news);
  } catch (error) {
    console.error("News API Error:", error.message);
    res.status(503).json({ error: "News Unavailable" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: false // Disable HMR to prevent WebSocket connection errors in this environment
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
