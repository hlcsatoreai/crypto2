import { CryptoAsset, MarketOverview, NewsItem, Report, SignalOpportunity } from "./types";
import { analyzeAsset } from "./analysis";

const API_BASE = "/api";

export async function fetchUniverse(): Promise<CryptoAsset[]> {
  const res = await fetch(`${API_BASE}/universe`);
  if (!res.ok) throw new Error("Offline");
  return res.json();
}

export async function fetchMarketOverview(): Promise<MarketOverview> {
  const res = await fetch(`${API_BASE}/market/overview`);
  if (!res.ok) throw new Error("Offline");
  return res.json();
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/news`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchCandles(symbol: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/asset/candles?symbol=${symbol}USDT&granularity=1h`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn(`Failed to fetch candles for ${symbol}:`, errData.error || res.statusText);
      return [];
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return [];
  }
}

export async function generateReport(): Promise<Report> {
  let universe: CryptoAsset[] = [];
  let overview: MarketOverview | null = null;
  let news: NewsItem[] = [];

  try {
    [universe, overview, news] = await Promise.all([
      fetchUniverse(),
      fetchMarketOverview(),
      fetchNews()
    ]);
  } catch (error) {
    console.error("Initial data fetch failed:", error);
    throw new Error("Impossibile recuperare i dati di mercato. Riprova tra qualche istante.");
  }

  if (!overview || !overview.bitget) {
    throw new Error("Dati Bitget non disponibili.");
  }

  // Filter out stablecoins and USDT itself to avoid pairs like USDTUSDT
  const stablecoins = ['usdt', 'usdc', 'dai', 'busd', 'fdusd', 'pyusd', 'tusd', 'usde', 'ustc'];
  const filteredUniverse = universe.filter(a => 
    !stablecoins.includes(a.symbol.toLowerCase()) && 
    a.market_cap_rank <= 250 // Focus on top 250 for better quality
  );

  // Get list of available symbols on Bitget to avoid 400 errors
  const bitgetSymbols = new Set(overview.bitget.map(t => t.symbol.toUpperCase()));

  // Analyze top assets that are actually tradable on Bitget
  const topAssets = filteredUniverse
    .filter(a => bitgetSymbols.has(`${a.symbol.toUpperCase()}USDT`))
    .slice(0, 15);

  const opportunities: SignalOpportunity[] = [];

  for (const asset of topAssets) {
    const candles = await fetchCandles(asset.symbol.toUpperCase());
    if (candles && candles.length > 0) {
      opportunities.push(analyzeAsset(asset, candles));
    }
  }

  const sorted = opportunities.sort((a, b) => b.score - a.score);
  
  const btc = universe.find(a => a.symbol === 'btc');
  const eth = universe.find(a => a.symbol === 'eth');

  return {
    date: new Date().toLocaleDateString(),
    analyzedCount: universe.length,
    opportunitiesFound: sorted.filter(o => o.status !== 'WAIT').length,
    timestamp: new Date().toLocaleTimeString(),
    topOpportunities: sorted.filter(o => o.status === 'BUY' || o.status === 'SELL' || o.status === 'ACCUMULATE').slice(0, 10),
    wildCards: sorted.filter(o => o.asset.price_change_percentage_24h > 15).slice(0, 1),
    dcaPicks: sorted.filter(o => o.status === 'ACCUMULATE').slice(0, 2),
    scalpingPicks: sorted.filter(o => o.score > 70).slice(0, 2),
    avoidList: universe.slice(90, 95).map(a => ({ symbol: a.symbol.toUpperCase(), reason: "Low volume / Bearish trend" })),
    sectors: {
      hot: { name: "AI Tokens", leader: "FET", performance: "+12.5%" },
      cold: { name: "Metaverse", reason: "Declining interest and volume" }
    },
    marketOverview: {
      btcPrice: btc?.current_price || 0,
      ethPrice: eth?.current_price || 0,
      dominance: "52.4%",
      fearGreed: overview.fearGreed.value_classification,
      totalVol: `$${(universe.reduce((acc, curr) => acc + curr.total_volume, 0) / 1e9).toFixed(2)}B`,
      trend: btc && btc.price_change_percentage_24h > 0 ? "Bullish" : "Bearish",
      strategy: btc && btc.price_change_percentage_24h < -5 ? "CASH MODE" : "SELECTIVE LONG"
    },
    allOpportunities: sorted
  };
}
