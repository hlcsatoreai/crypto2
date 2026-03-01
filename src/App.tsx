import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  Zap, 
  Target, 
  BarChart3, 
  Newspaper, 
  Settings, 
  History, 
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateReport } from './services';
import { Report, SignalOpportunity } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'screener' | 'watchlist' | 'history' | 'settings'>('report');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateReport();
      setReport(data);
    } catch (err) {
      setError("OFFLINE / DATI NON DISPONIBILI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateReport();
    const interval = setInterval(handleGenerateReport, 300000); // Auto refresh every 5 mins to avoid rate limits, user can manual refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-black fill-current" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">CRYPTO SIGNAL <span className="text-emerald-500">PRO</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
              error ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", error ? "bg-red-500" : "bg-emerald-500")} />
              {error ? "Offline" : "Live"}
            </div>
            <button 
              onClick={handleGenerateReport}
              disabled={loading}
              className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'report', label: 'Report', icon: BarChart3 },
            { id: 'screener', label: 'Screener', icon: Search },
            { id: 'watchlist', label: 'Watchlist', icon: Zap },
            { id: 'history', label: 'Storico', icon: History },
            { id: 'settings', label: 'Impostazioni', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {activeTab === 'report' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {report ? (
                <>
                  {/* Report Header */}
                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BarChart3 className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-2">
                        <ShieldCheck className="w-3 h-3" />
                        Analisi Certificata
                      </div>
                      <h2 className="text-2xl font-bold mb-1">📅 SEGNALI CRYPTO - {report.date}</h2>
                      <p className="text-zinc-400 text-sm">
                        🔍 Analizzate: <span className="text-zinc-100 font-bold">{report.analyzedCount}</span> crypto | 
                        🎯 Opportunità: <span className="text-emerald-500 font-bold">{report.opportunitiesFound}</span>
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                        <span>FONTE: COINGECKO + BITGET</span>
                        <span>AGGIORNATO: {report.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Overview */}
                  <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MarketStat label="BTC PRICE" value={`$${report.marketOverview.btcPrice.toLocaleString()}`} trend={report.marketOverview.trend === 'Bullish' ? 'up' : 'down'} />
                    <MarketStat label="FEAR & GREED" value={report.marketOverview.fearGreed} />
                    <MarketStat label="TOTAL VOL 24H" value={report.marketOverview.totalVol} />
                    <MarketStat label="STRATEGY" value={report.marketOverview.strategy} highlight />
                  </section>

                  {/* Top Opportunities */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-lg font-bold uppercase tracking-tight">🏆 TOP OPPORTUNITÀ DEL GIORNO</h3>
                    </div>
                    <div className="grid gap-6">
                      {report.topOpportunities.map((opp) => (
                        <div key={opp.asset.id}>
                          <OpportunityCard 
                            opp={opp} 
                            onToggleWatchlist={toggleWatchlist} 
                            isInWatchlist={watchlist.includes(opp.asset.id)} 
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Other Sections */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Sectors */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">🔍 SETTORI IN FOCUS</h3>
                      <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-emerald-500">HOT: {report.sectors.hot.name}</span>
                            <span className="text-xs font-mono">{report.sectors.hot.performance}</span>
                          </div>
                          <p className="text-xs text-zinc-400">Leader: {report.sectors.hot.leader}</p>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                          <span className="text-xs font-bold text-red-500 uppercase">COLD: {report.sectors.cold.name}</span>
                          <p className="text-xs text-zinc-400 mt-1">{report.sectors.cold.reason}</p>
                        </div>
                      </div>
                    </section>

                    {/* Avoid List */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">⛔ DA EVITARE OGGI</h3>
                      <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-4">
                        <ul className="space-y-3">
                          {report.avoidList.map((item, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold">{item.symbol}</span>
                                <p className="text-[10px] text-zinc-500">{item.reason}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  </div>

                  {/* Disclaimer */}
                  <footer className="pt-12 pb-8 border-t border-white/5">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-500 mb-2">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Disclaimer Obbligatorio</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        Le informazioni fornite in questa applicazione hanno scopo puramente informativo e non costituiscono consulenza finanziaria, legale o di investimento. Il trading di criptovalute comporta un elevato livello di rischio e può non essere adatto a tutti gli investitori. Il valore delle criptovalute può fluttuare drasticamente e potresti perdere l'intero capitale investito. Le performance passate non sono garanzia di risultati futuri. Crypto Signal Pro non si assume alcuna responsabilità per eventuali perdite derivanti dall'uso di queste informazioni. Opera sempre con cautela e responsabilità.
                      </p>
                    </div>
                  </footer>
                </>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-red-500 mb-2">ERRORE DI CONNESSIONE</h3>
                  <p className="text-zinc-500 mb-6 max-w-md">{error}</p>
                  <button 
                    onClick={handleGenerateReport}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl font-bold transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Riprova Ora
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <RefreshCw className="w-12 h-12 text-zinc-800 animate-spin mb-4" />
                  <p className="text-zinc-500">Generazione report in corso...</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'screener' && report && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Screener di Mercato</h2>
                <span className="text-xs text-zinc-500">{report.allOpportunities.length} asset analizzati</span>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Asset</th>
                      <th className="px-6 py-4">Prezzo</th>
                      <th className="px-6 py-4">24h %</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">RSI</th>
                      <th className="px-6 py-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.allOpportunities.map((opp) => (
                      <tr key={opp.asset.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={opp.asset.image} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                            <div>
                              <div className="text-sm font-bold">{opp.asset.name}</div>
                              <div className="text-[10px] text-zinc-500">{opp.asset.symbol.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">${opp.asset.current_price.toLocaleString()}</td>
                        <td className={cn(
                          "px-6 py-4 text-sm font-mono",
                          opp.asset.price_change_percentage_24h >= 0 ? "text-emerald-500" : "text-red-500"
                        )}>
                          {opp.asset.price_change_percentage_24h.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${opp.score}%` }} />
                            </div>
                            <span className="text-xs font-bold">{opp.score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            opp.status === 'BUY' ? "bg-emerald-500/10 text-emerald-500" : 
                            opp.status === 'SELL' ? "bg-red-500/10 text-red-500" : "bg-zinc-800 text-zinc-400"
                          )}>
                            {opp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">{opp.indicators.rsi}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => toggleWatchlist(opp.asset.id)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              watchlist.includes(opp.asset.id) ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
                            )}
                          >
                            <Zap className={cn("w-4 h-4", watchlist.includes(opp.asset.id) && "fill-current")} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'watchlist' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-bold">La Tua Watchlist</h2>
              {watchlist.length > 0 && report ? (
                <div className="grid gap-6">
                  {report.allOpportunities
                    .filter(o => watchlist.includes(o.asset.id))
                    .map(opp => (
                      <div key={opp.asset.id}>
                        <OpportunityCard 
                          opp={opp} 
                          onToggleWatchlist={toggleWatchlist} 
                          isInWatchlist={true} 
                        />
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="bg-zinc-900/40 border border-dashed border-white/10 rounded-2xl py-20 text-center">
                  <Zap className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-500">Nessun asset nella tua watchlist.</p>
                  <button 
                    onClick={() => setActiveTab('screener')}
                    className="mt-4 text-emerald-500 text-sm font-bold hover:underline"
                  >
                    Esplora lo Screener
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {(activeTab === 'history' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
              <Settings className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-bold">In Arrivo</h3>
              <p className="text-sm">Questa sezione sarà disponibile a breve.</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-white/5 px-6 py-3 flex items-center justify-between z-50">
        <button onClick={() => setActiveTab('report')} className={cn("p-2", activeTab === 'report' ? "text-emerald-500" : "text-zinc-500")}><BarChart3 /></button>
        <button onClick={() => setActiveTab('screener')} className={cn("p-2", activeTab === 'screener' ? "text-emerald-500" : "text-zinc-500")}><Search /></button>
        <button onClick={() => setActiveTab('watchlist')} className={cn("p-2", activeTab === 'watchlist' ? "text-emerald-500" : "text-zinc-500")}><Zap /></button>
        <button onClick={() => setActiveTab('history')} className={cn("p-2", activeTab === 'history' ? "text-emerald-500" : "text-zinc-500")}><History /></button>
      </div>
    </div>
  );
}

function MarketStat({ label, value, trend, highlight }: { label: string, value: string, trend?: 'up' | 'down', highlight?: boolean }) {
  return (
    <div className={cn(
      "bg-zinc-900/40 border border-white/5 rounded-xl p-4",
      highlight && "border-emerald-500/20 bg-emerald-500/5"
    )}>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-bold", highlight && "text-emerald-500")}>{value}</span>
        {trend && (
          trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ opp, onToggleWatchlist, isInWatchlist }: { opp: SignalOpportunity, onToggleWatchlist?: (id: string) => void, isInWatchlist?: boolean }) {
  const formatPrice = (price: number) => {
    if (price === 0) return "0.00";
    if (price < 0.0001) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden hover:border-emerald-500/30 transition-all group">
      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <img src={opp.asset.image} alt={opp.asset.name} className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xl font-bold">{opp.asset.name}</h4>
                <span className="text-xs font-mono text-zinc-500">{opp.asset.symbol.toUpperCase()}</span>
                {onToggleWatchlist && (
                  <button 
                    onClick={() => onToggleWatchlist(opp.asset.id)}
                    className={cn(
                      "p-1 rounded-md transition-colors",
                      isInWatchlist ? "text-emerald-500 bg-emerald-500/10" : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    <Zap className={cn("w-3 h-3", isInWatchlist && "fill-current")} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-400">MCap: ${(opp.asset.market_cap / 1e9).toFixed(1)}B</span>
                <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Rank #{opp.asset.market_cap_rank}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-black tracking-tighter flex items-center gap-1",
              opp.status === 'BUY' ? "bg-emerald-500 text-black" : 
              opp.status === 'SELL' ? "bg-red-500 text-white" : 
              opp.status === 'ACCUMULATE' ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"
            )}>
              {opp.status === 'BUY' ? "🟢" : opp.status === 'SELL' ? "🔴" : "🟡"} {opp.status}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 uppercase">
              Rischio: <span className={cn(opp.risk === 'HIGH' ? "text-red-500" : "text-emerald-500")}>{opp.risk}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Entry Range</span>
              <div className="text-sm font-mono font-bold text-emerald-500">{opp.entryRange}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Stop Loss</span>
              <div className="text-sm font-mono font-bold text-red-500">{formatPrice(opp.stopLoss.price)} ({opp.stopLoss.percentage}%)</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Targets</span>
              <div className="space-y-1">
                {opp.targets.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">T{i+1} (+{t.percentage}%)</span>
                    <span className="font-mono font-bold">${formatPrice(t.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Confidenza</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${opp.confidence}%` }} />
                </div>
                <span className="text-xs font-bold font-mono">{opp.confidence}%</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Setup Tecnico</span>
              <div className="text-xs font-medium">{opp.setup}</div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase text-zinc-400">Motivazione Operativa</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed italic">"{opp.motivation}"</p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            <IndicatorBadge label="RSI" value={opp.indicators.rsi.toString()} />
            <IndicatorBadge label="MACD" value={opp.indicators.macd} />
            <IndicatorBadge label="EMA" value={opp.indicators.ema} />
            <IndicatorBadge label="VOL" value={opp.indicators.volume} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500 uppercase">Azione Immediata:</span>
            <span className="text-xs text-zinc-100">Piazza ordine limite nell'entry range con stop loss attivo.</span>
          </div>
          <a 
            href={`https://www.bitget.com/spot/${opp.asset.symbol.toUpperCase()}USDT`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/10"
          >
            Apri su Bitget
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function IndicatorBadge({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-zinc-900 border border-white/5 rounded px-2 py-1 text-center">
      <div className="text-[8px] font-bold text-zinc-500 uppercase">{label}</div>
      <div className="text-[10px] font-mono text-zinc-300">{value}</div>
    </div>
  );
}
