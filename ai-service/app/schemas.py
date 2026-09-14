from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any

class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: float

class EMA200Config(BaseModel):
    enabled: bool = False
    tolerance_pct: float = Field(default=0.5, description="Tolerance percentage from EMA 200")

class EMACrossConfig(BaseModel):
    enabled: bool = False
    fast_period: int = 20
    slow_period: int = 50

class VolumeSpikeConfig(BaseModel):
    enabled: bool = False
    multiplier: float = 1.5

class SupportResistanceConfig(BaseModel):
    enabled: bool = False
    window: int = 20

class ToolsConfig(BaseModel):
    ema200: EMA200Config = EMA200Config()
    ema_cross: EMACrossConfig = EMACrossConfig()
    volume_spike: VolumeSpikeConfig = VolumeSpikeConfig()
    support_resistance: SupportResistanceConfig = SupportResistanceConfig()

class AnalyzeRequest(BaseModel):
    ticker: str
    timeframe: str
    candles: List[Candle]
    tools: ToolsConfig

class AIEvaluation(BaseModel):
    verdict: Literal["BUY", "WATCH", "IGNORE"]
    score: float = Field(ge=0, le=100)
    rationale: str

class AnalyzeResponse(BaseModel):
    ticker: str
    passed_math_filter: bool
    active_indicators: Dict[str, Any]
    ai_evaluation: Optional[AIEvaluation] = None

class HealthResponse(BaseModel):
    status: str
    service: str
