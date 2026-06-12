import type { AiRecommendation, MarketQuote, NewsItem } from '../types';
import { clamp, computeTechnicals } from './technicals';

export function rankOpportunities(quotes: MarketQuote[], news: NewsItem[]): AiRecommendation[] {
  return quotes.map((quote) => {
    const relatedNews = news.filter((item) => !item.symbol || item.symbol.toUpperCase().includes(quote.symbol));
    const technicals = computeTechnicals(quote);
    const positiveNews = relatedNews.filter((item) => item.sentiment === 'positive').length;
    const negativeNews = relatedNews.filter((item) => item.sentiment === 'negative').length;
    const newsScore = positiveNews * 8 - negativeNews * 10;
    const volumeScore = clamp((technicals.relativeVolume - 1) * 18, -8, 28);
    const momentumScore = clamp(quote.changePercent * 2.2, -22, 30);
    const trendScore = technicals.sma5 > technicals.sma20 ? 12 : -8;
    const rsiPenalty = technicals.rsi > 78 ? -12 : technicals.rsi < 25 ? -6 : 6;
    const score = clamp(50 + volumeScore + momentumScore + trendScore + newsScore + rsiPenalty, 0, 100);
    const confidence = clamp(score * 0.72 + Math.min(relatedNews.length, 5) * 4 + (quote.volume > 0 ? 8 : 0), 0, 100);
    const action = score >= 72 ? 'Paper Buy Candidate' : score >= 50 ? 'Watch' : 'Avoid';

    return {
      symbol: quote.symbol,
      name: quote.name,
      score,
      confidence,
      action,
      quote,
      technicals,
      news: relatedNews.slice(0, 3),
      thesis: buildThesis(quote, score, technicals.relativeVolume, relatedNews.length),
      riskNotes: buildRiskNotes(quote, technicals.rsi, negativeNews)
    } satisfies AiRecommendation;
  }).sort((a, b) => b.score - a.score);
}

function buildThesis(quote: MarketQuote, score: number, rvol: number, newsCount: number) {
  const bias = score >= 72 ? 'high-priority paper-trading candidate' : score >= 50 ? 'watchlist candidate' : 'low-quality setup';
  return `${quote.symbol} is a ${bias} based on ${quote.changePercent.toFixed(2)}% price action, ${rvol.toFixed(2)}x relative volume, and ${newsCount} recent news signal(s).`;
}

function buildRiskNotes(quote: MarketQuote, rsi: number, negativeNews: number) {
  const notes = [`Penny stocks are highly volatile; keep position size small.`];
  if (quote.volume < 500000) notes.push('Liquidity is below the preferred scanner threshold.');
  if (rsi > 78) notes.push('RSI is extended; avoid chasing vertical moves.');
  if (negativeNews > 0) notes.push('Negative news detected; confirm catalyst quality before paper entry.');
  return notes.join(' ');
}
