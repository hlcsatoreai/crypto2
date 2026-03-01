import { CryptoAsset, SignalOpportunity } from "./types";

/**
 * Technical Analysis Utility
 * In a real app, we'd use a library like 'technicalindicators'
 * Here we implement basic logic for the demo scope.
 */

export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function analyzeAsset(asset: CryptoAsset, candles: any[]): SignalOpportunity {
  // Defensive checks for candle data
  if (!Array.isArray(candles) || candles.length === 0) {
    return {
      asset,
      status: 'WAIT',
      entryRange: "N/A",
      targets: [],
      stopLoss: { price: 0, percentage: 0 },
      timeframe: "N/A",
      setup: "Dati insufficienti",
      confidence: 0,
      risk: 'HIGH',
      motivation: "Impossibile recuperare i dati storici per un'analisi accurata.",
      indicators: { rsi: 0, macd: "N/A", ema: "N/A", volume: "N/A" },
      score: 0,
      isBitgetAvailable: false
    };
  }

  const prices = candles.map(c => {
    const close = parseFloat(c[4]);
    return isNaN(close) ? 0 : close;
  }).filter(p => p > 0);

  if (prices.length < 14) {
    return {
      asset,
      status: 'WAIT',
      entryRange: "N/A",
      targets: [],
      stopLoss: { price: 0, percentage: 0 },
      timeframe: "N/A",
      setup: "Dati insufficienti",
      confidence: 0,
      risk: 'HIGH',
      motivation: "Dati storici insufficienti per calcolare gli indicatori tecnici.",
      indicators: { rsi: 0, macd: "N/A", ema: "N/A", volume: "N/A" },
      score: 0,
      isBitgetAvailable: false
    };
  }

  const rsi = calculateRSI(prices);
  const priceChange = asset.price_change_percentage_24h;
  
  let score = 50;
  let status: SignalOpportunity['status'] = 'WAIT';
  let setup = "Consolidation";
  let motivation = "Market is currently in a neutral phase. Waiting for clear breakout confirmation.";
  
  // Simple logic for signal generation
  if (rsi < 35 && priceChange < -5) {
    score = 85;
    status = 'BUY';
    setup = "Oversold Bounce / Bullish Divergence";
    motivation = `${asset.name} is showing oversold conditions on RSI (${rsi.toFixed(2)}). Potential for a relief rally from current support levels.`;
  } else if (rsi > 70 && priceChange > 10) {
    score = 75;
    status = 'SELL';
    setup = "Overbought / Bearish Rejection";
    motivation = `${asset.name} is overextended. RSI at ${rsi.toFixed(2)} suggests a cooling period or correction is likely.`;
  } else if (priceChange > 2 && priceChange < 8 && rsi > 50 && rsi < 65) {
    score = 65;
    status = 'ACCUMULATE';
    setup = "Trend Continuation";
    motivation = `Steady upward momentum with healthy RSI. Good for long-term positioning.`;
  }

  const currentPrice = asset.current_price;
  
  return {
    asset,
    status,
    entryRange: `${(currentPrice * 0.99).toFixed(4)} - ${(currentPrice * 1.01).toFixed(4)}`,
    targets: [
      { price: currentPrice * 1.05, percentage: 5 },
      { price: currentPrice * 1.10, percentage: 10 },
      { price: currentPrice * 1.20, percentage: 20 }
    ],
    stopLoss: { price: currentPrice * 0.95, percentage: 5 },
    timeframe: "4H / 1D",
    setup,
    confidence: score,
    risk: score > 80 ? 'MEDIUM' : 'HIGH',
    motivation,
    indicators: {
      rsi: Math.round(rsi),
      macd: rsi > 50 ? "Bullish Cross" : "Neutral",
      ema: currentPrice > asset.current_price * 0.98 ? "Above EMA20" : "Below EMA20",
      volume: asset.total_volume > 100000000 ? "High" : "Moderate"
    },
    score,
    isBitgetAvailable: true // Simplified for demo
  };
}
