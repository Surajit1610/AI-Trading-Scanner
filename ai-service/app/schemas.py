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

class FundamentalsConfig(BaseModel):
    enabled: bool = False
    min_volume: float = 1000000
    min_market_cap: float = 50000000000
    min_change_pct: float = 0.5
    max_change_pct: float = 2.5

class StochasticConfig(BaseModel):
    enabled: bool = False
    oversold_threshold: float = 20

class WilliamsRConfig(BaseModel):
    enabled: bool = False
    oversold_threshold: float = -80

class BollingerBandsConfig(BaseModel):
    enabled: bool = False
    tolerance_pct: float = 1.5

class VWAPConfig(BaseModel):
    enabled: bool = False
    require_above: bool = True  # True = price must be ABOVE VWAP (bullish). False = below VWAP (reversal).

class MACDConfig(BaseModel):
    enabled: bool = False
    require_positive_hist: bool = True
    fast: int = 12
    slow: int = 26
    signal: int = 9

class IchimokuConfig(BaseModel):
    enabled: bool = False
    condition: Literal['above_cloud', 'below_cloud'] = 'above_cloud'

class RSIConfig(BaseModel):
    enabled: bool = False
    period: int = 14
    condition: Literal['oversold', 'overbought'] = 'oversold'
    threshold: float = 30.0

class OpenInterestConfig(BaseModel):
    enabled: bool = False
    condition: Literal['highest', 'highest_change'] = 'highest'

class ToolsConfig(BaseModel):
    ema200: EMA200Config = EMA200Config()
    ema_cross: EMACrossConfig = EMACrossConfig()
    volume_spike: VolumeSpikeConfig = VolumeSpikeConfig()
    support_resistance: SupportResistanceConfig = SupportResistanceConfig()
    fundamentals: FundamentalsConfig = FundamentalsConfig()
    stochastic: StochasticConfig = StochasticConfig()
    williams_r: WilliamsRConfig = WilliamsRConfig()
    bollinger_bands: BollingerBandsConfig = BollingerBandsConfig()
    vwap: VWAPConfig = VWAPConfig()
    macd: MACDConfig = MACDConfig()
    ichimoku: IchimokuConfig = IchimokuConfig()
    rsi: RSIConfig = RSIConfig()
    open_interest: OpenInterestConfig = OpenInterestConfig()

class QuoteData(BaseModel):
    marketCap: float = 0
    volume: float = 0
    changePct: float = 0
    openInterest: float = 0

class AnalyzeRequest(BaseModel):
    ticker: str
    timeframe: str
    candles: List[Candle]
    quote: Optional[QuoteData] = None
    tools: ToolsConfig
    use_ai: bool = True

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
