import os
import json
from openai import OpenAI
from typing import Optional, Dict, Any, List
from app.schemas import Candle, AIEvaluation

def evaluate_with_llm(
    ticker: str,
    timeframe: str,
    candles: List[Candle],
    indicator_details: Dict[str, Any]
) -> Optional[AIEvaluation]:
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Warning: GEMINI_API_KEY not set")
        return None

    client = OpenAI(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key=api_key,
    )

    # Extract recent 10 candles for better pattern recognition
    recent_candles = [c.model_dump() for c in candles[-10:]]
    
    # Build a human-readable summary of what the math filters found
    indicator_summary = []
    for name, data in indicator_details.items():
        if isinstance(data, dict) and data.get('passed'):
            if name == 'ema200':
                indicator_summary.append(f"- EMA 200: Current price is {data.get('diff_pct', 0):.2f}% away from the 200-period EMA ({data.get('value', 0):.2f}). Price is NEAR the major long-term support.")
            elif name == 'ema_cross':
                indicator_summary.append(f"- EMA Crossover: Bullish crossover detected in the last 3 bars. Fast EMA ({data.get('fast_val', 0):.2f}) is now above Slow EMA ({data.get('slow_val', 0):.2f}). Momentum shift to the upside confirmed.")
            elif name == 'volume_spike':
                ratio = data.get('current_volume', 0) / data.get('sma_20', 1)
                indicator_summary.append(f"- Volume Surge: Today's volume is {ratio:.2f}x the 20-period average. Institutional activity likely.")
            elif name == 'support_resistance':
                indicator_summary.append(f"- Support Zone: Price is within {data.get('diff_pct', 0):.2f}% of a key local support level at {data.get('local_support', 0):.2f}.")
            elif name == 'fundamentals':
                indicator_summary.append(f"- Fundamentals: Stock is liquid (Vol: {data.get('volume', 0):,.0f}), significant size (MCap: {data.get('marketCap', 0):,.0f}), and is moving today ({data.get('changePct', 0):.2f}% daily change).")
            elif name == 'stochastic':
                indicator_summary.append(f"- Stochastic: %K = {data.get('k_value', 0):.1f}. Stock is OVERSOLD (below 25). A reversal/bounce is statistically likely.")
            elif name == 'williams_r':
                indicator_summary.append(f"- Williams %R: {data.get('value', 0):.1f}. Stock is in OVERSOLD territory (below -75). Reversal signal.")
            elif name == 'bollinger_bands':
                indicator_summary.append(f"- Bollinger Bands: Price is {data.get('diff_pct', 0):.2f}% from the lower Bollinger Band ({data.get('lower_band', 0):.2f}). Price is near a statistically extreme low.")
            elif name == 'vwap':
                position = "ABOVE" if data.get('price_above_vwap') else "BELOW"
                indicator_summary.append(f"- VWAP: Current price ({data.get('current_price', 0):.2f}) is {position} today's VWAP ({data.get('vwap_value', 0):.2f}). {'Bullish intraday bias confirmed.' if data.get('price_above_vwap') else 'Bearish intraday bias — potential reversal setup.'}")

    indicators_text = "\n".join(indicator_summary) if indicator_summary else "No specific indicator details available."

    # Timeframe-aware context so the AI evaluates appropriately for each trading style
    tf_lower = timeframe.lower()
    if tf_lower in ['1m', '5m']:
        trading_style = "MICRO SCALPING (1m/5m)"
        style_context = """
SCALPING EVALUATION RULES:
- The primary concern is MOMENTUM and IMMEDIATE price direction in the next 5-30 minutes.
- VWAP is the most important anchor. Price above VWAP on 5m = bullish bias for scalps.
- Look for tight consolidation (small candle bodies) followed by a breakout candle — this is ideal.
- Hammer or bullish engulfing candle at the bottom of a recent pullback = high score.
- Red flag: Consecutive large red candles with increasing volume (sellers in control). Lower score significantly.
- Red flag: Choppy, overlapping candles with no direction (whipsaw zone). Score below 60.
- For scalping, volatility is an advantage. Expect 0.5%–2% moves per setup.
- Consider if this is likely in the morning session (9:15–11:30 AM IST) — best for scalps."""
    elif tf_lower in ['15m', '30m']:
        trading_style = "SHORT-TERM INTRADAY (15m/30m)"
        style_context = """
INTRADAY SWING EVALUATION RULES:
- Focus on 1–4 hour moves within the trading day.
- VWAP relationship is important. EMA crossovers on 15m/30m are meaningful momentum signals.
- Look for clean pullbacks to support (EMA 20 or VWAP) with bullish reversal candles.
- Volume surge at the entry point greatly increases confidence.
- Red flag: Price making lower lows and lower highs on the 15m chart (downtrend intact, don't buy).
- Red flag: Setup near end of trading session (after 2:30 PM IST) — less time for the trade to work."""
    elif tf_lower in ['1h', '4h']:
        trading_style = "INTRADAY/MULTI-DAY SWING (1h/4h)"
        style_context = """
SWING TRADING EVALUATION RULES:
- Focus on moves lasting 1–5 days.
- The daily trend direction should align with this trade. A 1h setup against the daily downtrend is risky.
- EMA 200 proximity on 1h indicates a medium-term support level — meaningful.
- Volume confirmation on the breakout/reversal candle is critical.
- Look for higher highs and higher lows forming on the 1h chart (uptrend forming).
- Red flag: Large bearish engulfing candle in recent price action. Score below 70."""
    elif tf_lower == '1d':
        trading_style = "DAILY SWING TRADING"
        style_context = """
DAILY SWING EVALUATION RULES:
- Focus on moves lasting 1–3 weeks.
- EMA 200 on the daily chart is the most important institutional support level in the market.
- Fundamentals (market cap, volume) matter significantly here. Prefer Nifty 50/100 quality stocks.
- Look for weekly support levels, monthly pivot levels, and institutional accumulation patterns.
- A bullish weekly candle forming after a pullback to EMA 200 = very high score.
- Red flag: Stock in a clear 3-month downtrend with no signs of reversal. Score below 50."""
    elif tf_lower == '1wk':
        trading_style = "POSITIONAL/WEEKLY (1wk)"
        style_context = """
POSITIONAL TRADING EVALUATION RULES:
- Focus on multi-week to multi-month moves.
- Only large-cap, fundamentally strong stocks should score above 80.
- Look for major support zones (52-week lows, multi-year support) and trend reversals.
- Volume expansion on the weekly candle confirms institutional accumulation.
- This is for patient investors, not active traders. Red flag: Any short-term noise."""
    else:  # 1mo or anything else
        trading_style = "LONG-TERM / MONTHLY"
        style_context = """
LONG-TERM EVALUATION RULES:
- Focus on macro trend direction and fundamental strength.
- Only the highest quality, large-cap stocks should score above 80.
- Ignore short-term volatility. Look at the multi-year trend."""

    prompt = f"""You are an expert quantitative trading analyst specializing in Indian stock markets (NSE/BSE) and global crypto/forex markets.

A multi-stage algorithmic scanner has already passed {ticker} through a strict mathematical filter on the {timeframe} timeframe.
Your job is to perform the final human-like validation of this trade setup.

--- TRADING STYLE: {trading_style} ---
{style_context}

--- PASSED MATHEMATICAL FILTERS ---
{indicators_text}

--- RECENT PRICE ACTION (Last 10 Candles, most recent last) ---
{json.dumps(recent_candles, indent=2)}

--- YOUR TASK ---
Analyze the above data in the context of {trading_style}. Consider:
1. Is the recent price action forming a base/consolidation (bullish), or is it a "falling knife" (bearish)?
2. Do the candle shapes support a reversal or continuation in the direction expected by the active indicators?
3. Are the active indicator signals CONFLUENT (all pointing in the same direction)? More confluence = higher score.
4. Are there any red flags that should lower the score even though math passed?

--- SCORING GUIDE ---
- Score 90-100: Perfect textbook setup for {trading_style}. Multiple confluences, clean price action.
- Score 80-89: Strong setup. Clear signal with minor uncertainties. Worth alerting.
- Score 70-79: Moderate setup. Mixed price action. Do NOT alert (score < 80).
- Score 50-69: Weak. Math barely passed, chart looks uncertain.
- Score 0-49: Avoid. Red flags present despite passing math.

--- OUTPUT FORMAT ---
Respond ONLY with a valid JSON object. No markdown, no extra text.
{{
  "verdict": "BUY" | "WATCH" | "IGNORE",
  "score": <integer 0-100>,
  "rationale": "<2-3 sentence explanation referencing specific candle patterns, VWAP position, or indicator values>"
}}
"""

    try:
        response = client.chat.completions.create(
            model="gemini-3.6-flash",
            messages=[
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        parsed = json.loads(content)
        
        return AIEvaluation(
            verdict=parsed.get("verdict", "IGNORE"),
            score=parsed.get("score", 0),
            rationale=parsed.get("rationale", "No rationale provided")
        )
    except Exception as e:
        print(f"LLM Evaluation failed: {e}")
        return None
