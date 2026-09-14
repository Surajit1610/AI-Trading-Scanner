import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
import datetime

client = TestClient(app)

def generate_mock_candles(trend="up", num_candles=250):
    candles = []
    base_price = 1000.0
    
    for i in range(num_candles):
        if trend == "up":
            # Stable uptrend to pass EMA 200 and crossovers
            open_p = base_price + i
            close_p = open_p + 1
            high_p = close_p + 0.5
            low_p = open_p - 0.5
        elif trend == "down":
            # Stable downtrend to fail EMA 200
            open_p = base_price - i
            close_p = open_p - 1
            high_p = open_p + 0.5
            low_p = close_p - 0.5
        else:
            # Flat
            open_p = base_price
            close_p = base_price
            high_p = base_price + 1
            low_p = base_price - 1

        volume = 1000 + (i * 10)
        # Spike volume on the last candle if we want a volume spike
        if i == num_candles - 1 and trend == "up":
            volume = 50000 
            
        candles.append({
            "timestamp": (datetime.datetime.now() - datetime.timedelta(days=num_candles-i)).isoformat(),
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "volume": volume
        })
    return candles

@patch("app.main.evaluate_with_llm")
def test_math_filter_fail(mock_llm):
    # Setup candles in downtrend (will fail EMA200 check if price is far below)
    candles = generate_mock_candles(trend="down")
    
    payload = {
        "ticker": "AAPL",
        "timeframe": "1D",
        "candles": candles,
        "tools": {
            "ema200": {"enabled": True, "tolerance_pct": 0.5},
            "ema_cross": {"enabled": False},
            "volume_spike": {"enabled": False},
            "support_resistance": {"enabled": False}
        }
    }
    
    response = client.post("/analyze-ticker", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["passed_math_filter"] is False
    # Verify LLM was NEVER called
    mock_llm.assert_not_called()

@patch("app.main.evaluate_with_llm")
def test_math_filter_pass(mock_llm):
    # Mock LLM return value
    mock_llm.return_value = {
        "verdict": "BUY",
        "score": 90,
        "rationale": "Strong setup."
    }
    
    # Setup candles in uptrend (should pass EMA200 and Volume Spike if configured correctly)
    candles = generate_mock_candles(trend="up")
    
    # We will test with EMA200 enabled (but wide tolerance so it passes) and Volume Spike
    payload = {
        "ticker": "NVDA",
        "timeframe": "1D",
        "candles": candles,
        "tools": {
            "ema200": {"enabled": True, "tolerance_pct": 50.0}, # wide tolerance for mock data
            "ema_cross": {"enabled": False},
            "volume_spike": {"enabled": True, "multiplier": 1.5},
            "support_resistance": {"enabled": False}
        }
    }
    
    response = client.post("/analyze-ticker", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["passed_math_filter"] is True
    # Verify LLM WAS called
    mock_llm.assert_called_once()
    assert data["ai_evaluation"]["verdict"] == "BUY"
