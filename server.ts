import express from "express";
import axios from "axios";
import cors from "cors";

console.log("Starting server...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/*
===========================
CACHE SYSTEM PROFESSIONALE
===========================
*/

const cache = {
  universe: null as any,
  universeTime: 0,

  overview: null as any,
  overviewTime: 0,

  news: null as any,
  newsTime: 0
};

const CACHE_TTL = {
  universe: 5 * 60 * 1000,   // 5 minuti
  overview: 60 * 1000,       // 1 minuto
  news: 5 * 60 * 1000
};

function isCacheValid(cacheTime: number, ttl: number) {
  return Date.now() - cacheTime < ttl;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*
===========================
HEALTH
===========================
*/

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

/*
===========================
UNIVERSE (CoinGecko)
===========================
*/

app.get("/api/universe", async (req, res) => {

  try {

    if (cache.universe && isCacheValid(cache.universeTime, CACHE_TTL.universe)) {

      console.log("Serving universe from cache");

      return res.json({
        source: "cache",
        timestamp: new Date(cache.universeTime).toISOString(),
        data: cache.universe
      });

    }

    console.log("Fetching universe from CoinGecko...");

    // anti rate limit delay
    await delay(1200);

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          per_page: 50,
          page: 1,
          sparkline: false,
          price_change_percentage: "24h"
        },
        timeout: 10000
      }
    );

    cache.universe = response.data;
    cache.universeTime = Date.now();

    res.json({
      source: "coingecko",
      timestamp: new Date().toISOString(),
      data: response.data
    });

  } catch (error: any) {

    if (error.response?.status === 429) {

      console.log("CoinGecko rate limit hit");

      if (cache.universe) {

        return res.json({
          source: "cache-fallback",
          timestamp: new Date(cache.universeTime).toISOString(),
          data: cache.universe
        });

      }

    }

    console.error("Universe error:", error.message);

    res.status(503).json({
      status: "OFFLINE",
      message: "CoinGecko unavailable"
    });

  }

});

/*
===========================
MARKET OVERVIEW
===========================
*/

app.get("/api/market/overview", async (req, res) => {

  try {

    if (cache.overview && isCacheValid(cache.overviewTime, CACHE_TTL.overview)) {

      return res.json({
        source: "cache",
        timestamp: new Date(cache.overviewTime).toISOString(),
        data: cache.overview
      });

    }

    await delay(1000);

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/global"
    );

    cache.overview = response.data;
    cache.overviewTime = Date.now();

    res.json({
      source: "coingecko",
      timestamp: new Date().toISOString(),
      data: response.data
    });

  } catch (error) {

    if (cache.overview) {

      return res.json({
        source: "cache-fallback",
        data: cache.overview
      });

    }

    res.status(503).json({
      status: "OFFLINE"
    });

  }

});

/*
===========================
NEWS RSS
===========================
*/

app.get("/api/news", async (req, res) => {

  try {

    if (cache.news && isCacheValid(cache.newsTime, CACHE_TTL.news)) {

      return res.json({
        source: "cache",
        data: cache.news
      });

    }

    const response = await axios.get(
      "https://api.rss2json.com/v1/api.json?rss_url=https://cointelegraph.com/rss"
    );

    cache.news = response.data.items;
    cache.newsTime = Date.now();

    res.json({
      source: "rss",
      data: response.data.items
    });

  } catch (error) {

    if (cache.news) {

      return res.json({
        source: "cache-fallback",
        data: cache.news
      });

    }

    res.status(503).json({
      status: "OFFLINE"
    });

  }

});

/*
===========================
START SERVER
===========================
*/

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);

});
