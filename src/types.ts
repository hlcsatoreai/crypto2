export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  last_updated: string;
}

export interface BitgetTicker {
  symbol: string;
  lastPr: string;
  bidPr: string;
  askPr: string;
  high24h: string;
  low24h: string;
  change24h: string;
  baseVol: string;
  quoteVol: string;
}

export interface MarketOverview {
  bitget: BitgetTicker[];
  fearGreed: {
    value: string;
    value_classification: string;
    timestamp: string;
  };
  timestamp: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
}

export interface SignalOpportunity {
  asset: CryptoAsset;
  status: 'BUY' | 'SELL' | 'WAIT' | 'ACCUMULATE';
  entryRange: string;
  targets: { price: number; percentage: number }[];
  stopLoss: { price: number; percentage: number };
  timeframe: string;
  setup: string;
  confidence: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  motivation: string;
  indicators: {
    rsi: number;
    macd: string;
    ema: string;
    volume: string;
  };
  score: number;
  isBitgetAvailable: boolean;
}

export interface Report {
  date: string;
  analyzedCount: number;
  opportunitiesFound: number;
  timestamp: string;
  topOpportunities: SignalOpportunity[];
  wildCards: SignalOpportunity[];
  dcaPicks: SignalOpportunity[];
  scalpingPicks: SignalOpportunity[];
  avoidList: { symbol: string; reason: string }[];
  sectors: {
    hot: { name: string; leader: string; performance: string };
    cold: { name: string; reason: string };
  };
  marketOverview: {
    btcPrice: number;
    ethPrice: number;
    dominance: string;
    fearGreed: string;
    totalVol: string;
    trend: string;
    strategy: string;
  };
  allOpportunities: SignalOpportunity[];
}
