# AGENTS.md - Multi-Container AI Trading Scanner System

## 1. Project Overview & Architecture
This project is an automated AI-driven market scanner designed for stock traders.
- **Frontend (`/frontend`):** Next.js (App Router, Tailwind CSS, TypeScript). Provides a strategy builder UI to toggle indicators, select tickers, configure cron schedules, and view alert history.
- **Orchestrator & Scheduler (`/backend-core`):** Node.js (Express, TypeScript, BullMQ, Mongoose). Manages cron triggers, schedules repeatable jobs in Redis, fetches market candle data, and delivers email alerts via Resend.
- **Math & AI Engine (`/ai-service`):** FastAPI (Python 3.11, TA-Lib / pandas-ta, OpenRouter/Gemini API). Calculates technical indicators for pre-filtering, then sends passed candidates to Gemini 2.5 Flash for trade setup validation.
- **Queue & Storage:** Redis 7 (BullMQ background task queue) and MongoDB 7 (users, strategies, scan history).
- **Environment:** Multi-container Docker Compose for both local development and Linux VPS deployment.

---

## 2. Directory Layout & Isolation
The project is structured as an isolated monorepo. Never blend runtimes across directories.

```text
trading-ai-scanner/
├── AGENTS.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
│
├── frontend/                   # Next.js 14+ (App Router)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│
├── backend-core/               # Node.js + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── config/             # DB & Redis connection setups
│       ├── models/             # Mongoose schemas
│       ├── queues/             # BullMQ queue producers & workers
│       ├── cron/               # Repeatable job schedule manager
│       ├── services/           # Market data fetcher & Resend mailer
│       └── routes/             # REST APIs for Next.js
│
└── ai-service/                 # FastAPI (Python 3.11)
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py             # FastAPI entrypoint
        ├── schemas.py          # Pydantic models for inputs & outputs
        ├── indicators/         # TA-Lib / pandas-ta calculations
        └── analyzers/          # OpenRouter Gemini prompt & client

3. Strict Networking & Service Discovery Rules
Inside Docker, services NEVER communicate over localhost.

Node connects to Redis using: redis:6379.

Node connects to MongoDB using: mongodb://mongo:27017/trading_db.

Node calls FastAPI using: http://fastapi-ai:8000.

All inter-service communications must pass through the internal Docker bridge network (scanner-network).

Expose only the required ports to the host:

Frontend: 3000:3000

Backend: 5000:5000

FastAPI: 8000:8000 (internal or dev inspection only)

Redis: 6379:6379 (local inspection only)

MongoDB: 27017:27017 (local inspection only)


4. Execution Pipeline & Funnel (Non-Negotiable)
Do not send raw chart lists directly to the LLM. You must follow the strict 2-stage verification funnel:

[ BullMQ Scheduled Trigger ]
            │
            ▼
[ Node.js: Fetch OHLCV Candles for User's Watchlist ]
            │
            ▼ (HTTP POST /analyze-ticker)
[ FastAPI: Stage 1 - Hard Mathematical Filter ]
  - Calculate ONLY user-selected indicators via TA-Lib / pandas-ta.
  - Evaluate enabled rules (e.g., Price near EMA 200, EMA 20/50 cross, Volume > 1.5x SMA).
  - IF conditions FAIL: Return immediately with { passed: false }.
            │ (IF conditions PASS)
            ▼
[ FastAPI: Stage 2 - AI Confluence Validation ]
  - Call OpenRouter API with model `google/gemini-2.5-flash`.
  - Provide OHLCV context and indicator metrics.
  - Return JSON: { verdict: "BUY"|"WATCH"|"IGNORE", score: number, rationale: string }.
            │
            ▼ (HTTP Response back to Node.js)
[ Node.js: Alert Delivery ]
  - Save signal record to MongoDB.
  - If score >= 80, dispatch an HTML email alert via Resend SDK to user's email.

5. Coding Standards by Service
A. Frontend (/frontend)
Framework: Next.js with TypeScript and Tailwind CSS.

Output mode: Specify output: "standalone" inside next.config.js for lightweight Docker builds.

Strategy Builder Component: Provide dynamic checkboxes and parameter fields for:

EMA 200 (tolerance percentage)

EMA 20 / EMA 50 Crossover

Dynamic Support & Resistance levels

Volume Surge (multiplier of 20-period SMA)

Cron schedule selector (e.g., every 15m, 1h, or daily market open/close)

Email notification target

B. Backend Core (/backend-core)
Runtime: Node.js (LTS), TypeScript, Express.

Queue: BullMQ with ioredis. Implement worker concurrency controls to avoid flooding data sources.

Email Provider: Resend SDK (resend).

Email payload must include: Ticker, Timeframe, Active Indicators passed, AI Score, AI Rationale, and Timestamp.

Resilience: Wrap all external HTTP calls to FastAPI and market data providers in try/catch blocks. A single ticker error must not terminate the queue worker.

C. AI Service (/ai-service)
Framework: FastAPI with Uvicorn.

Math Engine: Use pandas-ta or TA-Lib for indicator calculations.

Typing: Validate all incoming payloads and outgoing responses using Pydantic BaseModel.

LLM Provider: Google AI studio

Model: google/gemini-2.5-flash

Temperature: 0.1 (low temperature for deterministic reasoning).

Enforce JSON output format.

6. Security, Secrets & Environment Handling
NEVER hardcode API keys, passwords, or secrets in source code or Dockerfiles.

Read secrets exclusively from environment variables:

OPENROUTER_API_KEY

GEMINI_API_KEY

MONGO_INITDB_ROOT_USERNAME

MONGO_INITDB_ROOT_PASSWORD

Maintain .env.example with blank keys at all times.

Keep .env, .env.local, node_modules, and Python __pycache__ inside .gitignore.


7. Operational Instructions for the AI Agent
Incremental Delivery: Complete one task, write verification tests/checks, and request review before beginning the next.

Deterministic Code: Prioritize robust error handling and explicit types over unnecessary external dependencies.

No Breaking Changes: Never wipe existing volumes, database seeds, or .env.example entries when implementing new features.

Always Verify Builds: After modifying any service, verify that its respective Dockerfile builds cleanly without dependency conflicts.