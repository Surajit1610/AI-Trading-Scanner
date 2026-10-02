import pandas as pd
import pandas_ta as ta
from typing import List, Tuple, Dict, Any, Optional
from app.schemas import Candle, ToolsConfig, QuoteData

def calculate_indicators(candles: List[Candle], tools: ToolsConfig, quote: Optional[QuoteData] = None) -> Tuple[bool, Dict[str, Any]]:
    if not candles:
        return False, {"error": "No candles provided"}
    
    # Convert to DataFrame
    df = pd.DataFrame([c.model_dump() for c in candles])
    
    passed_all = True
    indicator_details = {}
    
    current_price = df['close'].iloc[-1]
    
    # EMA 200
    if tools.ema200.enabled:
        df['ema_200'] = ta.ema(df['close'], length=200)
        if df['ema_200'].notna().iloc[-1]:
            ema_200_val = df['ema_200'].iloc[-1]
            diff_pct = abs(current_price - ema_200_val) / ema_200_val * 100
            passed_ema200 = diff_pct <= tools.ema200.tolerance_pct
            indicator_details['ema200'] = {
                "value": float(ema_200_val),
                "diff_pct": float(diff_pct),
                "passed": bool(passed_ema200)
            }
            if not passed_ema200:
                passed_all = False
        else:
            indicator_details['ema200'] = {"error": "Not enough data for EMA 200", "passed": False}
            passed_all = False

    # EMA Cross
    if tools.ema_cross.enabled:
        fast_period = tools.ema_cross.fast_period
        slow_period = tools.ema_cross.slow_period
        df['ema_fast'] = ta.ema(df['close'], length=fast_period)
        df['ema_slow'] = ta.ema(df['close'], length=slow_period)
        
        if df['ema_fast'].notna().iloc[-1] and df['ema_slow'].notna().iloc[-1]:
            # Bullish crossover within last 3 bars
            crossed = False
            # Check last 3 bars
            for i in range(-3, 0):
                try:
                    if df['ema_fast'].iloc[i-1] <= df['ema_slow'].iloc[i-1] and df['ema_fast'].iloc[i] > df['ema_slow'].iloc[i]:
                        crossed = True
                        break
                except IndexError:
                    pass
                    
            indicator_details['ema_cross'] = {
                "fast_val": float(df['ema_fast'].iloc[-1]),
                "slow_val": float(df['ema_slow'].iloc[-1]),
                "passed": bool(crossed)
            }
            if not crossed:
                passed_all = False
        else:
            indicator_details['ema_cross'] = {"error": "Not enough data for EMA cross", "passed": False}
            passed_all = False

    # Volume Spike
    if tools.volume_spike.enabled:
        df['vol_sma_20'] = ta.sma(df['volume'], length=20)
        if df['vol_sma_20'].notna().iloc[-1]:
            current_vol = df['volume'].iloc[-1]
            vol_sma = df['vol_sma_20'].iloc[-1]
            multiplier = tools.volume_spike.multiplier
            
            passed_vol = current_vol >= (vol_sma * multiplier)
            indicator_details['volume_spike'] = {
                "current_volume": float(current_vol),
                "sma_20": float(vol_sma),
                "passed": bool(passed_vol)
            }
            if not passed_vol:
                passed_all = False
        else:
            indicator_details['volume_spike'] = {"error": "Not enough data for Volume SMA", "passed": False}
            passed_all = False

    # Support / Resistance
    if tools.support_resistance.enabled:
        window = tools.support_resistance.window
        # Simple pivot low calculation: min of last 'window' bars (excluding current bar)
        if len(df) > window:
            local_min = df['low'].iloc[-(window+1):-1].min()
            # check if price is within 1% of local min
            diff_pct = (current_price - local_min) / local_min * 100
            # Being "within 1%" could mean absolute difference, but since it's support, usually it's above or very slightly below
            # Let's say absolute diff <= 1%
            passed_sr = abs(diff_pct) <= 1.0
            indicator_details['support_resistance'] = {
                "local_support": float(local_min),
                "diff_pct": float(diff_pct),
                "passed": bool(passed_sr)
            }
            if not passed_sr:
                passed_all = False
        else:
            indicator_details['support_resistance'] = {"error": "Not enough data for S/R", "passed": False}
            passed_all = False

    # Fundamentals
    if tools.fundamentals.enabled:
        if not quote:
            indicator_details['fundamentals'] = {"error": "No quote data provided", "passed": False}
            passed_all = False
        else:
            vol_passed = quote.volume >= tools.fundamentals.min_volume
            mc_passed = quote.marketCap >= tools.fundamentals.min_market_cap
            
            # Absolute change percentage check
            change_passed = (tools.fundamentals.min_change_pct <= abs(quote.changePct) <= tools.fundamentals.max_change_pct)
            
            passed_fund = vol_passed and mc_passed and change_passed
            indicator_details['fundamentals'] = {
                "marketCap": quote.marketCap,
                "volume": quote.volume,
                "changePct": quote.changePct,
                "passed": bool(passed_fund)
            }
            if not passed_fund:
                passed_all = False

    # Stochastic Oscillator
    if tools.stochastic.enabled:
        stoch_df = ta.stoch(df['high'], df['low'], df['close'])
        if stoch_df is not None and not stoch_df.empty and stoch_df.iloc[-1].notna().all():
            k_val = stoch_df.iloc[-1, 0] # STOCHk
            passed_stoch = k_val <= tools.stochastic.oversold_threshold
            indicator_details['stochastic'] = {
                "k_value": float(k_val),
                "passed": bool(passed_stoch)
            }
            if not passed_stoch:
                passed_all = False
        else:
            indicator_details['stochastic'] = {"error": "Not enough data for Stochastic", "passed": False}
            passed_all = False

    # Williams %R
    if tools.williams_r.enabled:
        willr_series = ta.willr(df['high'], df['low'], df['close'])
        if willr_series is not None and not willr_series.empty and pd.notna(willr_series.iloc[-1]):
            wr_val = willr_series.iloc[-1]
            passed_wr = wr_val <= tools.williams_r.oversold_threshold
            indicator_details['williams_r'] = {
                "value": float(wr_val),
                "passed": bool(passed_wr)
            }
            if not passed_wr:
                passed_all = False
        else:
            indicator_details['williams_r'] = {"error": "Not enough data for Williams %R", "passed": False}
            passed_all = False

    # Bollinger Bands
    if tools.bollinger_bands.enabled:
        bbands_df = ta.bbands(df['close'], length=20, std=2.0)
        if bbands_df is not None and not bbands_df.empty and bbands_df.iloc[-1].notna().all():
            bbl = bbands_df.iloc[-1, 0] # Lower band
            bbu = bbands_df.iloc[-1, 2] # Upper band
            
            # Check proximity to lower band for BUY (using tolerance)
            # if tolerance is 1.5%, current_price must be within 1.5% above or below the bottom band
            diff_pct = abs(current_price - bbl) / bbl * 100
            passed_bb = diff_pct <= tools.bollinger_bands.tolerance_pct
            
            indicator_details['bollinger_bands'] = {
                "lower_band": float(bbl),
                "upper_band": float(bbu),
                "diff_pct": float(diff_pct),
                "passed": bool(passed_bb)
            }
            if not passed_bb:
                passed_all = False
        else:
            indicator_details['bollinger_bands'] = {"error": "Not enough data for Bollinger Bands", "passed": False}
            passed_all = False

    # VWAP (Volume Weighted Average Price) — Intraday Anchor
    if tools.vwap.enabled:
        try:
            df['timestamp_dt'] = pd.to_datetime(df['timestamp'])
            df['date'] = df['timestamp_dt'].dt.date
            df['typical_price'] = (df['high'] + df['low'] + df['close']) / 3
            df['tp_vol'] = df['typical_price'] * df['volume']
            # Cumsum grouped by date ensures VWAP resets every trading day
            df['cum_tp_vol'] = df.groupby('date')['tp_vol'].cumsum()
            df['cum_vol'] = df.groupby('date')['volume'].cumsum()
            df['vwap'] = df['cum_tp_vol'] / df['cum_vol']
            
            vwap_val = df['vwap'].iloc[-1]
            if pd.notna(vwap_val):
                price_above_vwap = current_price > vwap_val
                if tools.vwap.require_above:
                    passed_vwap = price_above_vwap  # Bullish: price must be above VWAP
                else:
                    passed_vwap = not price_above_vwap  # Bearish/reversal: price below VWAP
                
                indicator_details['vwap'] = {
                    "vwap_value": float(vwap_val),
                    "current_price": float(current_price),
                    "price_above_vwap": bool(price_above_vwap),
                    "require_above": bool(tools.vwap.require_above),
                    "passed": bool(passed_vwap)
                }
                if not passed_vwap:
                    passed_all = False
            else:
                indicator_details['vwap'] = {"error": "VWAP calculation returned NaN", "passed": False}
                passed_all = False
        except Exception as e:
            indicator_details['vwap'] = {"error": f"VWAP calculation failed: {str(e)}", "passed": False}
            passed_all = False

    # MACD
    if tools.macd.enabled:
        macd_df = ta.macd(df['close'], fast=tools.macd.fast, slow=tools.macd.slow, signal=tools.macd.signal)
        if macd_df is not None and not macd_df.empty and macd_df.iloc[-1].notna().all():
            macd_hist_col = [c for c in macd_df.columns if c.startswith('MACDh')][0]
            macd_hist = macd_df[macd_hist_col].iloc[-1]
            passed_macd = macd_hist > 0 if tools.macd.require_positive_hist else True
            indicator_details['macd'] = {
                "histogram": float(macd_hist),
                "passed": bool(passed_macd)
            }
            if not passed_macd:
                passed_all = False
        else:
            indicator_details['macd'] = {"error": "Not enough data for MACD", "passed": False}
            passed_all = False

    # Ichimoku Cloud
    if tools.ichimoku.enabled:
        ichimoku_df, _ = ta.ichimoku(df['high'], df['low'], df['close'])
        if ichimoku_df is not None and not ichimoku_df.empty and ichimoku_df.iloc[-1].notna().all():
            # Senkou Span A and B are usually ISA_9_26 and ISB_26_52
            span_a_col = [c for c in ichimoku_df.columns if c.startswith('ISA')][0]
            span_b_col = [c for c in ichimoku_df.columns if c.startswith('ISB')][0]
            span_a = ichimoku_df[span_a_col].iloc[-1]
            span_b = ichimoku_df[span_b_col].iloc[-1]
            
            top_of_cloud = max(span_a, span_b)
            bottom_of_cloud = min(span_a, span_b)
            
            if tools.ichimoku.condition == 'above_cloud':
                passed_ichi = current_price > top_of_cloud
            else:
                passed_ichi = current_price < bottom_of_cloud
                
            indicator_details['ichimoku'] = {
                "span_a": float(span_a),
                "span_b": float(span_b),
                "condition": tools.ichimoku.condition,
                "passed": bool(passed_ichi)
            }
            if not passed_ichi:
                passed_all = False
        else:
            indicator_details['ichimoku'] = {"error": "Not enough data for Ichimoku Cloud", "passed": False}
            passed_all = False

    # RSI
    if tools.rsi.enabled:
        rsi_series = ta.rsi(df['close'], length=tools.rsi.period)
        if rsi_series is not None and not rsi_series.empty and pd.notna(rsi_series.iloc[-1]):
            rsi_val = rsi_series.iloc[-1]
            
            if tools.rsi.condition == 'oversold':
                passed_rsi = rsi_val <= tools.rsi.threshold
            else:
                passed_rsi = rsi_val >= tools.rsi.threshold
                
            indicator_details['rsi'] = {
                "value": float(rsi_val),
                "condition": tools.rsi.condition,
                "passed": bool(passed_rsi)
            }
            if not passed_rsi:
                passed_all = False
        else:
            indicator_details['rsi'] = {"error": "Not enough data for RSI", "passed": False}
            passed_all = False

    # Open Interest
    if tools.open_interest.enabled:
        if not quote:
            indicator_details['open_interest'] = {"error": "No quote data provided", "passed": False}
            passed_all = False
        else:
            # We check if openInterest exists in QuoteData
            oi = getattr(quote, 'openInterest', 0)
            if oi is None or oi <= 0:
                indicator_details['open_interest'] = {"error": "Open Interest data unavailable for this asset", "passed": False}
                passed_all = False
            else:
                # We can't mathematically calculate "highest OI change" without historical OI feed from Yahoo Finance
                # So if they require it, and we have OI > 0, we can flag it as passed but note the limitation
                indicator_details['open_interest'] = {
                    "value": float(oi),
                    "note": "OI threshold / change evaluation limited by Yahoo Finance API",
                    "passed": True
                }

    return passed_all, indicator_details
