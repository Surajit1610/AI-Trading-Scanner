import pandas as pd
import pandas_ta as ta
from typing import List, Tuple, Dict, Any
from app.schemas import Candle, ToolsConfig

def calculate_indicators(candles: List[Candle], tools: ToolsConfig) -> Tuple[bool, Dict[str, Any]]:
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

    # If no indicators are enabled, it technically passes the math filter (or fails depending on business logic).
    # Let's assume it passes if no active indicators caused a failure.
    
    return passed_all, indicator_details
