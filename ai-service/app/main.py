from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import traceback

from app.schemas import AnalyzeRequest, AnalyzeResponse, HealthResponse
from app.indicators.calculator import calculate_indicators
from app.analyzers.llm_evaluator import evaluate_with_llm

app = FastAPI(title="AI Trading Scanner API")

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="ok", service="ai-service")

@app.post("/analyze-ticker", response_model=AnalyzeResponse)
def analyze_ticker(request: AnalyzeRequest):
    try:
        if not request.candles:
            raise HTTPException(status_code=400, detail="Candles array cannot be empty")
            
        # Stage 1: Math Filter
        passed_math, indicator_details = calculate_indicators(request.candles, request.tools, request.quote)
        
        ai_eval = None
        # Stage 2: AI Evaluation (only if math filter passes and AI is enabled)
        if passed_math and request.use_ai:
            ai_eval = evaluate_with_llm(
                ticker=request.ticker,
                timeframe=request.timeframe,
                candles=request.candles,
                indicator_details=indicator_details
            )
            
        return AnalyzeResponse(
            ticker=request.ticker,
            passed_math_filter=passed_math,
            active_indicators=indicator_details,
            ai_evaluation=ai_eval
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during analysis: {traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error during analysis"}
        )
