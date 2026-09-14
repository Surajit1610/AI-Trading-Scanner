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
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("Warning: OPENROUTER_API_KEY not set")
        return None

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )

    # Extract recent 5 candles
    recent_candles = [c.model_dump() for c in candles[-5:]]
    
    prompt = f"""
    You are an expert AI trading assistant.
    Analyze the following technical indicator metrics and recent price action for {ticker} on the {timeframe} timeframe.
    
    Recent 5 Candles:
    {json.dumps(recent_candles, indent=2)}
    
    Indicator Metrics (Passed Math Filters):
    {json.dumps(indicator_details, indent=2)}
    
    Provide your evaluation as a JSON object with exactly these fields:
    - verdict: Must be one of "BUY", "WATCH", or "IGNORE"
    - score: A number from 0 to 100 indicating setup quality (100 being perfect)
    - rationale: A short string explaining the reasoning behind the score and verdict
    
    Ensure the response is valid JSON and contains NO markdown formatting outside the JSON object.
    """

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
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
