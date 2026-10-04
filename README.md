# FinTrack — AI-Powered Automatic Personal Finance Intelligence System

**FinTrack** is an intelligent, full-stack, cross-platform personal finance management and intelligence system. It automates financial tracking by ingesting transactions from bank statements (CSV/XLSX), financial SMS messages, and real-time Android push notifications, classifies and categorizes expenses using deterministic heuristic rules and Google Gemini AI, enforces multi-layer duplicate prevention, and delivers verified, deterministic analytics, goals, action plans, monthly PDF statements, Model Context Protocol (MCP) server tooling, and a conversational AI Copilot.

---

## 1. Project Overview

FinTrack is engineered as an end-to-end financial intelligence solution consisting of:
- **Express.js / Node.js Backend**: RESTful API server, native JSON-RPC 2.0 Model Context Protocol (MCP) server, deterministic financial calculation engine, LLM query routing and optimization layer, and PDFKit report streaming engine.
- **React (Vite) Web Application**: Modern responsive web dashboard with Redux Toolkit state management, Recharts analytics, drag-and-drop file/SMS import staging workflows, financial goals, and embedded AI Copilot drawer.
- **React Native (Expo) Android Mobile Application**: Dedicated mobile experience with hardware-backed SecureStore authentication, biometric-grade security practices, real-time push notification interception, categorized financial ledger, intelligence dashboards, and docked floating AI Copilot.
- **MongoDB Database**: Schema-enforced document store for users, transactions, budgets, financial goals, actionable financial steps, and multi-turn Copilot sessions with strict per-user data isolation.

---

## 2. Problem Statement

Traditional personal finance applications suffer from critical operational and architectural flaws:
1. **High Manual Burden**: Users are required to enter every transaction manually, leading to abandonment within weeks.
2. **Privacy Risks & Fragmented Data**: Bank aggregators often demand raw banking credentials or store unredacted Personal Identifiable Information (PII), OTPs, and full account numbers on third-party servers.
3. **LLM Hallucinations & Financial Inaccuracy**: Standard conversational AI chatbots hallucinate financial math, fabricate balances, and produce contradictory numbers because they attempt arithmetic calculations inside LLM token generation.
4. **Duplicate Spikes**: Multi-channel notifications, SMS alerts, and subsequent bank statement uploads often double- or triple-count identical expenses.
5. **Passive Tracking without Actionable Guidance**: Typical budget apps display historical charts without evaluating budget velocity, goal feasibility, recurring commitments, or concrete step-by-step remediation plans.

---

## 3. Project Objectives

1. **Automated Zero-Friction Ingestion**: Ingest bank statements (`.csv`, `.xlsx`, `.xls`), SMS financial texts, and native Android push notifications automatically.
2. **Strict Grounded Truth & Deterministic Mathematics**: Ensure all sums, averages, burn rates, savings metrics, and feasibility scores are calculated deterministically by tested JavaScript engines—never by LLM text completion.
3. **Privacy by Design**: Automatically detect and strip OTPs, PINs, bank account numbers, debit/credit card digits, and non-financial messages locally before persistent storage.
4. **Staged Confirmation Pipeline**: Route newly intercepted transactions through a dedicated review inbox (`staged`) before committing them to the verified financial ledger (`confirmed`).
5. **Conversational Financial Copilot with Native MCP Tools**: Provide a context-aware assistant powered by Google Gemini and read-only MCP financial tools with zero hallucinated calculations.
6. **Cost-Optimized LLM Execution**: Implement deterministic routing, intelligent caching, in-flight deduplication, and heuristic fallback guarantees to minimize API overhead and prevent service interruption.

---

## 4. Key Innovation

FinTrack introduces an **Air-Gapped Hybrid Intelligence Architecture**:
- **Deterministic Core Layer**: Financial mathematics (totals, velocity, run-rate forecast, mom growth, category limits, goal feasibility) are computed 100% deterministically from verified ledger facts.
- **Model Context Protocol (MCP) Boundary**: The AI Copilot and Gemini models access user financial facts exclusively through structured, read-only JSON-RPC 2.0 tools with strict user JWT scoping. The LLM is never permitted to execute database writes, delete records, or guess financial figures.
- **Dual-Tier Dual-Engine Intelligence**: If Google Gemini is unavailable, rate-limited, or network-disconnected, FinTrack automatically switches to the built-in deterministic heuristic engine, ensuring zero downtime and 100% uptime for financial advice.

---

## 5. Core Features

- **Multi-Source Ingestion**:
  - Bank Statements (CSV, Excel `.xlsx`, `.xls`) with dynamic header aliasing.
  - Financial SMS bulk text parsing with regex pattern extraction.
  - Android `NotificationListenerService` capturing real-time banking notifications.
- **Smart Security & Filtering**:
  - Instant OTP/Security alert rejection.
  - PII masking for account and card numbers.
  - Multi-tier SHA-256 fingerprint deduplication.
- **Staged Transaction Inbox**:
  - Interactive Confirm, Edit, or Ignore/Delete workflow before transactions enter ledger analytics.
- **Comprehensive Ledger & Category Budgeting**:
  - Virtualized transactions ledger with search, category filtering, source badges, and custom pagination.
  - Monthly overall budget and category-specific spending caps with color-coded threshold alerts.
- **Banking Intelligence & Predictive Analytics**:
  - Net Savings Rate, Daily Burn Rate, and Month-End Run-Rate Forecast.
  - Spending Anomalies detection (outliers, budget shocks, spikes).
  - Top Merchants ranking and Category Utilization tracking.
  - Recurring Subscriptions & Fixed Obligations detector with price-hike alerts.
  - Multi-month trend trajectory (6-month / 12-month MoM comparisons).
- **Financial Goals & Action Plans**:
  - Target tracking with deterministic feasibility scoring (`On Track`, `Challenging`, `Low Feasibility`, `At Risk`).
  - AI-generated, verified Action Plans with measurable monthly and 6-month financial impacts.
- **Conversational FinTrack Copilot**:
  - Multi-turn conversational memory with persistent session context.
  - What-If simulations (e.g. "What if I cut Food by 20% and add ₹10,000 income?").
  - Contextual "Explain This" metrics deep-dives.
  - Proactive intelligence alerts for deficits and budget shocks.
- **Branded Monthly PDF Statement Generation**:
  - Vectorized PDF financial statements with income/expense summaries, category breakdown tables, and verified transaction histories.

---

## 6. Complete System Architecture

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|                                                                                       |
|   +---------------------------------------+   +-----------------------------------+   |
|   |         React (Vite) Web Client       |   |      React Native (Expo) Mobile   |   |
|   |  - Redux Toolkit State Management     |   |  - Android Notification Ingestion |   |
|   |  - Recharts Visual Analytics          |   |  - Hardware SecureStore Storage   |   |
|   |  - Responsive Glassmorphism UI        |   |  - Docked Floating Copilot Hub    |   |
|   |  - File & SMS Staging Dropzones       |   |  - Virtualized Infinite Ledger    |   |
|   +-------------------+-------------------+   +-----------------+-----------------+   |
+-----------------------|-----------------------------------------|---------------------+
                        | (HTTPS / REST API / JSON-RPC 2.0)       |
                        v                                         v
+---------------------------------------------------------------------------------------+
|                                   BACKEND SERVER LAYER                                |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                    Express.js Gateway & Security Middleware                   |   |
|   |  - Helmet HTTP Security Headers         - Express Rate Limiter (Brute-Force)  |   |
|   |  - Strict CORS Whitelisting             - JWT Authentication & Verification   |   |
|   +---------------------------------------+---------------------------------------+   |
|                                           |                                           |
|   +---------------------------------------v---------------------------------------+   |
|   |                           Ingestion & Parsing Pipeline                        |   |
|   |  - File Parser Service (CSV / XLSX)   - Financial Notification Filter         |   |
|   |  - SMS Parser Engine                  - OTP Rejection & PII Sanitizer         |   |
|   |  - SHA-256 Deduplication Hash Engine  - Staging Repository (ImportBatch)      |   |
|   +---------------------------------------+---------------------------------------+   |
|                                           |                                           |
|   +---------------------------------------v---------------------------------------+   |
|   |                      Deterministic Financial Core Engine                      |   |
|   |  - Banking Intelligence Calculator    - Run-Rate & Burn-Rate Forecaster       |   |
|   |  - Anomaly & Shock Detection Engine   - Subscription & Cadence Analyzer       |   |
|   |  - Multi-Month Trend Analyzer         - Goal Feasibility Evaluator            |   |
|   |  - PDFKit Statement Streamer          - Action Plan Generator                 |   |
|   +-------------------+-----------------------------------+-----------------------+   |
|                       |                                   |                           |
|   +-------------------v-------------------+   +-----------v-----------------------+   |
|   |     Native JSON-RPC 2.0 MCP Server    |   |    LLM Cost & Router Optimizer    |   |
|   |  - Tool: get_monthly_summary          |   |  - Intent Classifier & Fast-Path  |   |
|   |  - Tool: get_category_breakdown       |   |  - In-Flight Request Deduplicator |   |
|   |  - Tool: get_spending_anomalies       |   |  - Multi-Tier Response Cache      |   |
|   |  - Tool: get_expense_forecast         |   |  - Dual-Engine Fallback Handler   |   |
|   |  - Tool: get_recurring_subscriptions  |   |  - Privacy-Preserving Telemetry   |   |
|   |  - Tool: run_what_if_simulation       |   +-------------------+---------------+   |
|   +-------------------+-------------------+                       |                   |
+-----------------------|-------------------------------------------|-------------------+
                        |                                           |
                        v                                           v
+-----------------------------------+               +-----------------------------------+
|          DATABASE LAYER           |               |             AI LAYER              |
|                                   |               |                                   |
|   MongoDB Database / Mongoose     |               |   Google Gemini REST API          |
|   - users       - transactions    |               |   - Model: gemini-2.0-flash       |
|   - budgets     - goals           |               |   - Strict JSON structured output |
|   - actionplans - copilotsessions |               |   - Grounded mathematical facts   |
|   - importbatches                 |               |   - Fallback Heuristic Generator  |
+-----------------------------------+               +-----------------------------------+
```

---

## 7. Web Application

Built with **React 18, Vite, and Redux Toolkit**, styled using modern CSS tokens and Tailwind CSS:
- **Financial Dashboard**: Real-time KPI summaries (Income, Expense, Net Savings, Savings Rate), Recharts dynamic spending trajectories, category donut breakdown, and pending detected transaction counter.
- **Ledger & Transactions Page**: Full CRUD ledger with search debouncing, category pills, date range picker, source badges, and pagination.
- **Imports & Staging**: Dedicated dropzone supporting CSV and Excel spreadsheets, pasteable SMS bulk interface, and interactive transaction review table.
- **Budgeting & Category Caps**: Monthly budget ceiling manager with progress indicators and automatic overspend warnings.
- **Intelligence & Analytics**: Full intelligence suite displaying Expense Run-Rate Forecast, Budget Velocity, Spending Anomalies, Top Merchants, and Recurring Subscriptions.
- **Financial Goals & Action Plans**: Visual savings goals with deterministic feasibility metrics, What-If simulation modals, and verified AI Action Plans.
- **Financial Statement Reports**: Interactive period selector with instant in-browser PDF generation and streaming download.
- **FinTrack Copilot Chat Drawer**: Slide-over AI assistant interface with follow-up suggestion chips, What-If calculator, and explain metric cards.

---

## 8. Android Mobile Application

Built with **React Native 0.74, Expo SDK 51, and Redux Toolkit**:
- **Hardware-Backed Security**: Persistent session tokens stored in `expo-secure-store` (backed by Android `EncryptedSharedPreferences`).
- **5-Tab Navigation**:
  - `Home`: Editorial financial summary cards, live alerts, and detected transaction alerts.
  - `Ledger`: Virtualized infinite-scroll ledger with search, category filtering, and manual transaction creation.
  - `Insights`: Financial Health Snapshot, Expense Forecast, Budget Velocity, Spending Anomalies, Top Merchants, Category Utilization, Recurring Subscriptions, Multi-Month Trends, and AI Financial Advisor.
  - `Goals`: Savings targets, feasibility analysis, What-If simulations, and AI Action Plans.
  - `Profile`: User details, account lifetime statistics, and secure sign-out.
- **Docked Floating Copilot Launcher**: Responsive, non-intrusive floating action dock (`[FinTrack Copilot] [ + ]`) anchored right above the bottom navigation bar, preventing overlap with goal cards or ledger items across 360px, 390px, and 412px device widths.
- **Mobile PDF Statement Flow**: Direct API integration downloading binary statements to device storage with `expo-sharing` support for WPS Office, Adobe Acrobat, and Google Drive.

---

## 9. Automatic Financial Data Ingestion

FinTrack implements an intelligent multi-channel ingestion pipeline:

```
[ Bank Statement (.csv / .xlsx) ]
[ SMS Message Text              ]  --> [ Extraction & Normalization ] --> [ Sanitization & PII Masking ] --> [ SHA-256 Deduplication ] --> [ Staged Review Inbox ] --> [ Confirmed Ledger ]
[ Android Push Notification     ]
```

### Ingestion Sources
1. **Bank Statements (CSV, Excel `.xlsx`, `.xls`)**:
   - Dynamic header aliasing across Indian and international banking formats (HDFC, ICICI, SBI, Axis, Kotak, Chase, Standard Chartered).
   - Date parser supporting `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`, and ISO formats.
   - Intelligent Debit/Credit balance column reconciliation.
2. **Financial SMS Ingestion**:
   - Regex-based parser extracting transaction amounts (INR ₹, $, €), merchant/payee entities, dates, and debit/credit status.
3. **Android Push Notifications**:
   - Intercepts banking app notifications via native listener.

### Filtering, Security & Staging
- **Instant OTP & Non-Financial Rejection**: Discards one-time passwords (OTPs), authentication requests, promotional spam, and balance-only inquiries.
- **PII Masking**: Redacts bank account numbers (e.g. `A/C ending in XX1234`), card numbers, and personal identifiers before database entry.
- **SHA-256 Deduplication Engine**: Generates unique fingerprints (`hash(userId + amount + transactionDate + normalizedMerchant)`) preventing duplicate insertions across notification, SMS, and bank statement uploads.
- **Interactive Staged Review**: Intercepted transactions reside in `staged` status until the user approves (`confirm`), modifies (`edit`), or dismisses (`ignore`) them.

---

## 10. Financial Intelligence Engine

The deterministic intelligence engine strictly operates on **confirmed ledger transactions**, guaranteeing verified numbers:
- **Income, Expenses & Net Savings**: Exact deterministic sums for the selected calendar month.
- **Savings Rate**: Safe division formula with zero-income protection: `(Net Savings / Total Income) * 100`.
- **Expense Run-Rate & Daily Burn Rate**:
  $$\text{Daily Burn Rate} = \frac{\text{Total Expense MTD}}{\text{Days Elapsed}}$$
  $$\text{Projected Expense} = \text{Daily Burn Rate} \times \text{Total Days in Month}$$
- **Budget Velocity & Risk**: Pace tracking comparing spending velocity against target monthly budget (`SAFE`, `ELEVATED`, `CRITICAL`).
- **Spending Anomalies**: Identifies statistical outliers, sudden category spikes, and budget shocks exceeding 40% of monthly allocation.
- **Top Merchants & Category Utilization**: Aggregates total spend, transaction counts, average ticket size, and percentage of overall expenses.
- **Recurring Commitments Detector**: Detects fixed auto-pay obligations (weekly, biweekly, monthly, quarterly) with price increase tracking.
- **Multi-Month Financial Trends**: Comparative Month-over-Month (MoM) cashflow trajectories across 6-month and 12-month windows.

---

## 11. AI Advisor

Integrated with **Google Gemini (`gemini-2.0-flash`)** with strict grounding:
- **Verified Facts Prompting**: The AI model is supplied with pre-computed mathematical figures from the deterministic engine.
- **Zero Arithmetic Delegation**: Gemini is never asked to calculate sums, averages, or balances.
- **Grounded Advice & Strategic Insights**: Formulates executive summaries, savings opportunities, and category reduction strategies.
- **Transparent Dual-Engine Fallback**: If Gemini API quota is exceeded or network is offline, the backend automatically generates rule-based deterministic advice, tagging the payload with `provider: "heuristic"`.

---

## 12. Conversational FinTrack Copilot

FinTrack Copilot is a conversational financial assistant providing interactive advisory:
- **Multi-Turn Contextual Sessions**: Maintains conversation history (`CopilotSession`) scoped by user and reference month.
- **What-If Scenario Simulation**: Interactively evaluates hypothetical scenarios (e.g., *"What if I reduce Dining by 15% and earn ₹5,000 extra?"*) with real-time recalculation of net savings, savings rate, and run-rate projections.
- **Contextual Follow-Up Resolution**: Resolves pronoun references (e.g., *"How much did I spend on it?"* following *"What was my highest expense?"*) via intent planning.
- **Interactive "Explain This" Modals**: Instant one-tap breakdown of any metric or card (Savings Rate, Forecast, Anomalies, Merchants).
- **Proactive Insights**: Highlights cash flow deficits, rapid burn rates, and subscription hikes directly in dashboard banners.

---

## 13. MCP Architecture

FinTrack implements an **internal JSON-RPC 2.0 Model Context Protocol (MCP) Server** (`server/mcp/server.js`):

```
[ Copilot Service / LLM Client ] 
               |
      (JSON-RPC 2.0 Request)
               v
[ FinTrack Native MCP Server ]
   ├── authContext (User JWT & ID Scoping)
   ├── Read-Only Financial Tool Registry:
   │     ├── get_monthly_summary
   │     ├── get_category_breakdown
   │     ├── get_spending_anomalies
   │     ├── get_expense_forecast
   │     ├── get_recurring_subscriptions
   │     └── run_what_if_simulation
   └── Response Serialization & Grounding
```

### Architectural Guarantees:
- **Read-Only Enforcement**: Tools only read confirmed ledger data; no write, update, or delete operations are permitted through MCP.
- **User Isolation**: All tool calls strictly require verified user authentication context.
- **Deterministic Tool Execution**: Tools invoke the backend calculation services directly, returning exact JSON structures.

---

## 14. LLM Cost & Performance Optimization

To achieve low latency and minimal API overhead, FinTrack implements an optimization layer (`server/services/llmOptimizationService.js`):
1. **Deterministic Fast-Path Routing**: Standard factual queries (e.g., *"What was my total spend in September?"*) are answered directly by local MCP tools in <15ms without invoking Gemini.
2. **In-Flight Request Deduplication**: Concurrent identical queries share a single active execution promise.
3. **Multi-Tier Response Cache**: Caches identical query responses with smart invalidation upon transaction mutations.
4. **Exponential Backoff & Error Classification**: Gracefully retries transient network errors while instantly falling back on 429 quota exhaustion.
5. **Privacy-Preserving Telemetry**: Logs latency, token usage, tool call counts, and provider tags without storing sensitive financial payload data.

---

## 15. Goals & Action Plans

### Financial Goals (`/api/goals`)
- Create savings milestones (e.g., Emergency Fund, Vacation, Down Payment) with target dates and amounts.
- **Deterministic Feasibility Scoring**:
  - `Target Achieved`: Current savings $\ge$ target amount.
  - `On Track`: Verified monthly net savings comfortably exceed required monthly contribution.
  - `Challenging`: Monthly required contribution exceeds 60% of net monthly savings.
  - `Low Feasibility`: Monthly required contribution exceeds 100% of current net savings.
  - `At Risk`: User currently in monthly cash deficit.

### AI Action Plans (`/api/action-plans`)
- Generates verified, actionable steps from confirmed ledger facts.
- Computes measurable monthly impact (₹/mo) and cumulative 6-month projected savings.
- Trackable status workflow: `Active`, `Completed`, `Dismissed`.

---

## 16. PDF Financial Reports

- **Server-Side PDFKit Engine** (`server/controllers/reportController.js`): Generates downloadable financial statements for any selected month.
- **Document Structure**:
  - Branded header with metadata (period, generation timestamp, account name).
  - Executive Financial Position (Income, Expense, Net Savings, Savings Rate).
  - Category Utilization & Limits breakdown table.
  - Complete chronological transaction record with formatted currency and status badges.
- **Transport & Storage Pipeline**:
  - Web: Direct binary streaming blob download.
  - Mobile: Base64/binary transport saved to device file system with native sharing support (`expo-sharing`).

---

## 17. Security Architecture & Hardening

1. **Authentication & Password Security**:
   - JWT authentication tokens with configurable expiration (`JWT_EXPIRE`).
   - `bcrypt` cryptographic password hashing (salt factor 10).
2. **User Data Isolation**:
   - Every database query strictly scopes documents by `{ userId: req.userId }`.
3. **HTTP & API Hardening**:
   - `helmet` security headers enabled.
   - `express-rate-limit` protecting API endpoints (300 req / 15 min).
   - Restricted CORS whitelisting (`FRONTEND_URL`, localhost, Expo development schemes).
4. **Mobile Platform Security**:
   - `expo-secure-store` with hardware-backed encryption.
   - Android cleartext traffic blocked in release builds (local development hosts permitted via `network_security_config.xml`).
5. **PII Sanitization & Logging**:
   - Automated masking of card and account digits in notifications and SMS.
   - Production error handler suppressing stack traces and internal database schemas.

---

## 18. UI/UX Design System

- **Web Application**:
  - Curated high-contrast slate & emerald palette (`#0B0F17`, `#131B2B`, `#10B981`, `#6366F1`).
  - Fluid glassmorphic cards, responsive sidebar navigation, and interactive Recharts tooltips.
- **Mobile Application**:
  - Crisp, modern light theme with semantic emerald (`#10B981`), sapphire (`#2563EB`), and danger (`#EF4444`) accents.
  - High-performance virtualized lists with debounced search inputs.
  - Fully responsive layout verified across 360 × 800, 390 × 844, and 412 × 915 Android viewports.
  - Docked floating Copilot hub positioned safely above bottom navigation tabs.

---

## 19. Technology Stack

### Web Frontend
- **Framework**: React 18 (Vite)
- **State Management**: Redux Toolkit & React-Redux
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS, PostCSS, Vanilla CSS Tokens
- **Visualizations**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios with JWT request/response interceptors

### Mobile Frontend (Android)
- **Framework**: React Native 0.74 / Expo SDK 51
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Security**: Expo SecureStore
- **File & Sharing**: Expo DocumentPicker, Expo Sharing, Expo FileSystem
- **Icons**: Expo Vector Icons (Feather)

### Backend Server
- **Runtime**: Node.js (ES Modules `"type": "module"`)
- **Framework**: Express.js
- **Database ODM**: Mongoose 7
- **Security**: Helmet, Express Rate Limit, CORS, JSONWebToken, Bcrypt
- **File Parsing**: Multer, `csv-parser`, `xlsx`
- **PDF Generation**: PDFKit

### AI & Protocols
- **Primary LLM**: Google Gemini API (`gemini-2.0-flash`) via REST API
- **Protocol**: Model Context Protocol (MCP) JSON-RPC 2.0
- **Fallback Engine**: Local Deterministic Heuristic Intelligence Engine

### Testing Frameworks
- **Backend**: Jest, Supertest
- **Web Frontend**: Vitest, React Testing Library
- **Mobile**: Jest, Jest-Expo, React Test Renderer

---

## 20. API Architecture

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | No | Register new account & issue JWT |
| **POST** | `/api/auth/login` | No | Verify credentials & issue JWT |
| **GET** | `/api/auth/me` | Yes | Get authenticated user profile |
| **PUT** | `/api/auth/profile` | Yes | Update user profile name/email |
| **PUT** | `/api/auth/password` | Yes | Update password with current password verification |
| **GET** | `/api/auth/stats` | Yes | Lifetime account summary statistics |
| **GET** | `/api/transactions` | Yes | Get transactions with search, filter & pagination |
| **POST** | `/api/transactions` | Yes | Create manual transaction |
| **PUT** | `/api/transactions/:id` | Yes | Update transaction |
| **DELETE** | `/api/transactions/:id` | Yes | Delete transaction |
| **POST** | `/api/imports/upload` | Yes | Ingest CSV / XLSX bank statement |
| **POST** | `/api/imports/sms` | Yes | Ingest bulk financial SMS text |
| **GET** | `/api/imports/staged` | Yes | List staged transactions pending review |
| **POST** | `/api/imports/confirm/:id`| Yes | Confirm staged transaction to ledger |
| **POST** | `/api/imports/confirm-all`| Yes | Bulk confirm staged transactions |
| **DELETE**| `/api/imports/ignore/:id` | Yes | Dismiss staged transaction |
| **POST** | `/api/mobile/events` | Yes | Ingest Android push notification event |
| **GET** | `/api/mobile/events/stats`| Yes | Get mobile interception & duplicate stats |
| **GET** | `/api/budget` | Yes | Get monthly budget & category caps |
| **POST** | `/api/budget` | Yes | Set monthly budget & category caps |
| **GET** | `/api/dashboard/summary` | Yes | Dashboard KPI aggregation |
| **GET** | `/api/intelligence/summary`| Yes | Banking Intelligence metrics & forecast |
| **GET** | `/api/intelligence/trends` | Yes | Multi-month comparative trajectory |
| **GET** | `/api/intelligence/subscriptions` | Yes | Recurring commitments & obligations |
| **GET** | `/api/ai-advisor/advice` | Yes | Grounded AI Financial Advisor |
| **POST** | `/api/ai-advisor/query` | Yes | Financial Q&A with verified facts |
| **POST** | `/api/ai-advisor/what-if` | Yes | Deterministic What-If scenario simulation |
| **POST** | `/api/copilot/chat` | Yes | Conversational FinTrack Copilot message |
| **POST** | `/api/copilot/explain` | Yes | Contextual "Explain This" metric analysis |
| **GET** | `/api/copilot/insights` | Yes | Proactive financial notifications |
| **GET** | `/api/goals` | Yes | List savings goals with feasibility |
| **POST** | `/api/goals` | Yes | Create savings goal |
| **PUT** | `/api/goals/:id` | Yes | Update savings goal |
| **DELETE**| `/api/goals/:id` | Yes | Delete savings goal |
| **GET** | `/api/action-plans` | Yes | List AI financial action plans |
| **POST** | `/api/action-plans/generate` | Yes | Generate action plans from verified facts |
| **PATCH**| `/api/action-plans/:id/status` | Yes | Update action plan status |
| **GET** | `/api/reports` | Yes | Monthly financial report (JSON or PDF stream) |

---

## 21. Database Models

1. **`User`**: `name`, `email` (unique index), `password` (bcrypt hash), `createdAt`, `updatedAt`.
2. **`Transaction`**: `userId` (indexed), `title`, `amount`, `type` (`income`/`expense`), `category`, `paymentMethod`, `transactionDate`, `status` (`staged`/`confirmed`/`ignored`), `source` (`manual`/`csv`/`excel`/`sms`/`notification`), `fingerprint` (indexed), `rawText`, `isDuplicate`.
3. **`Budget`**: `userId` (unique index), `monthlyBudget`, `categoryBudgets` (`[{ category, limit }]`).
4. **`Goal`**: `userId`, `title`, `targetAmount`, `currentAmount`, `targetDate`, `category`, `priority`, `status` (`in_progress`/`completed`/`paused`/`cancelled`), `notes`.
5. **`ActionPlan`**: `userId`, `title`, `description`, `actionType`, `category`, `priority`, `targetAmount`, `monthlyImpact`, `potentialSixMonthImpact`, `rationale`, `status` (`active`/`completed`/`dismissed`).
6. **`CopilotSession`**: `userId`, `month`, `messages` (`[{ role, content, suggestedFollowUps, timestamp }]`), `sessionSummary`.
7. **`ImportBatch`**: `userId`, `filename`, `sourceType`, `totalRecords`, `stagedCount`, `confirmedCount`, `duplicateCount`.

---

## 22. Testing & Validation

### Automated Test Suite Totals
- **Backend Automated Tests (Jest / Supertest)**: **31 test suites**, **564 passing tests** verifying auth, ingestion, banking intelligence, subscriptions, forecasting, goals, action plans, security headers, rate limiting, duplicate hashing, MCP server tools, and LLM optimization.
- **Web Frontend Tests (Vitest / React Testing Library)**: **22 test suites**, **115 passing tests** verifying dashboard charts, transaction forms, budget progress bars, report downloads, goal feasibility calculations, and Redux slice states.
- **Mobile Test Suite (Jest-Expo / React Test Renderer)**: **38 test suites**, **284 passing tests** verifying mobile components, responsive headers, formatting, offline storage, transaction detail modals, month pickers, and copilot flows.

### Physical Device Validation
- **Device Tested**: Android Physical Hardware (`CPH2381` / Oppo Reno7 5G, Android 13/14).
- **Tested Viewports**: `360 × 800`, `390 × 844`, `412 × 915`.
- **Validation Checklist**:
  - [x] Zero header collisions across all Insights intelligence cards.
  - [x] Floating Copilot dock docked above bottom navigation with zero obstruction of Goal feasibility metrics.
  - [x] Filter pills horizontal edge-to-edge scrolling with zero end-chip clipping.
  - [x] Real-time notification interception and background deduplication.
  - [x] OTP and security SMS instant rejection.
  - [x] Monthly PDF report download, local storage verification, and native viewer opening (`expo-sharing`).
  - [x] Conversational Copilot session persistence and What-If scenario calculations.

---

## 23. Current Implementation Status

| Feature / Module | Status | Notes |
| :--- | :---: | :--- |
| **User Authentication & Authorization** | **COMPLETE** | JWT auth, bcrypt password hashing, profile management |
| **Transaction CRUD & Pagination** | **COMPLETE** | Multi-field search, category filters, sorting, virtualized FlatList |
| **Bank Statement Ingestion (CSV/Excel)** | **COMPLETE** | Dynamic header aliasing, Indian date parser, staging inbox |
| **SMS Financial Ingestion** | **COMPLETE** | Entity extraction, debit/credit parser, PII masking |
| **Android Push Notification Ingestion** | **COMPLETE** | Background interception, OTP rejection, deduplication |
| **Deduplication Engine** | **COMPLETE** | SHA-256 fingerprinting across all ingestion channels |
| **Category Budgeting & Limit Tracking** | **COMPLETE** | Monthly ceiling, category caps, visual threshold alerts |
| **Deterministic Financial Core** | **COMPLETE** | Income, expense, net savings, burn rate, run-rate forecast |
| **Predictive Analytics & Anomalies** | **COMPLETE** | Outlier detection, budget shocks, confidence estimation |
| **Recurring Subscriptions Detector** | **COMPLETE** | Cadence detection (weekly to quarterly), price hike alerts |
| **Multi-Month Financial Trends** | **COMPLETE** | 6M and 12M comparative MoM trajectories |
| **Google Gemini AI Advisor** | **COMPLETE** | Grounded financial summaries with heuristic fallback |
| **Conversational FinTrack Copilot** | **COMPLETE** | Multi-turn sessions, What-If simulator, Explain This modals |
| **Model Context Protocol (MCP) Server**| **COMPLETE** | Native JSON-RPC 2.0 server with 6 read-only financial tools |
| **LLM Optimization & Fast-Path** | **COMPLETE** | In-flight deduplication, deterministic routing, response cache |
| **Financial Goals & Feasibility** | **COMPLETE** | Target tracking with deterministic status evaluations |
| **Action Plans Generator** | **COMPLETE** | Verified financial steps with measurable monthly/6M impact |
| **Branded PDF Report Generator** | **COMPLETE** | Server-side PDFKit stream, client download, mobile sharing |
| **Security Hardening** | **COMPLETE** | Helmet, CORS, Rate Limit, SecureStore, cleartext protection |
| **React (Vite) Web Client** | **COMPLETE** | Responsive glassmorphic dashboard, Recharts, Redux Toolkit |
| **React Native (Expo) Mobile App** | **COMPLETE** | Validated on physical Android CPH2381, docked Copilot |
| **Cloud Hosting & Production Deployment**| **PENDING** | Local development verified; cloud deployment pending |

---

## 24. Project Directory Structure

```
Finance-Tracker-Initial-Codes/
├── client/                        # React (Vite) Web Application
│   ├── src/
│   │   ├── components/            # UI components (dashboard, goals, copilot, etc.)
│   │   ├── pages/                 # Route pages (Dashboard, Transactions, Insights, etc.)
│   │   ├── redux/                 # Redux Toolkit store & feature slices
│   │   ├── services/              # Axios API service endpoints
│   │   └── test/                  # Web unit and component test suites (Vitest)
│   ├── package.json
│   └── vite.config.js
├── mobile/                        # React Native (Expo) Android Application
│   ├── src/
│   │   ├── components/            # Mobile UI components (insights, goals, copilot, etc.)
│   │   ├── navigation/            # BottomTab & NativeStack navigators
│   │   ├── screens/               # Screen views (Home, Ledger, Insights, Goals, Profile)
│   │   ├── services/              # API services & SecureStore storage
│   │   ├── store/                 # Redux Toolkit mobile store & slices
│   │   └── theme/                 # Mobile typography, colors, and layout tokens
│   ├── tests/                     # Mobile component and unit test suites (Jest-Expo)
│   ├── app.json                   # Expo configuration & Android permissions
│   └── package.json
├── server/                        # Express.js / Node.js Backend Application
│   ├── controllers/               # Route controllers (auth, transactions, copilot, etc.)
│   ├── mcp/                       # Native JSON-RPC 2.0 MCP Server & LLM Client
│   ├── middleware/                # JWT auth, error handlers, rate limiters
│   ├── models/                    # Mongoose database schemas (User, Transaction, etc.)
│   ├── routes/                    # Express REST route definitions
│   ├── services/                  # Deterministic calculation engines & Gemini client
│   ├── tests/                     # Backend automated test suites (Jest / Supertest)
│   ├── app.js                     # Express application configuration
│   ├── server.js                  # HTTP server listener
│   ├── package.json
│   └── .env.example               # Backend environment variable template
├── docs/                          # Architectural reports and audit documentation
├── test_files/                    # Synthetic sample statement files (CSV, XLSX)
└── README.md                      # Project documentation
```

---

## 25. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Expo Go App / Android Device** (for mobile development)

### 1. Backend Setup (`server/`)
```bash
cd server
npm install
cp .env.example .env
# Configure your MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY in .env
npm run dev
# Server starts on http://localhost:5000
```

### 2. Web Frontend Setup (`client/`)
```bash
cd client
npm install
npm run dev
# Web application starts on http://localhost:5173
```

### 3. Mobile Android Setup (`mobile/`)
```bash
cd mobile
npm install
npx expo start
# Press 'a' to open in Android emulator or scan QR code via Expo Go on physical device
```

### Running Test Suites
```bash
# Run backend tests
cd server && npm test

# Run web frontend tests
cd client && npm test

# Run mobile tests
cd mobile && npm test
```

---

## 26. Environment Variables

Configure these variables in [`server/.env`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/server/.env.example):

| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Optional | `development` | Environment mode (`development` / `production`) |
| `PORT` | Optional | `5000` | HTTP port for backend server |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/ai-finance-tracker` | MongoDB connection connection string |
| `JWT_SECRET` | **Yes** | *[Random 256-bit Secret]* | Secret key for signing and verifying JWT tokens |
| `JWT_EXPIRE` | Optional | `7d` | Token lifetime before expiration |
| `GEMINI_API_KEY` | Optional | *[Google AI Studio Key]* | API key for Google Gemini (`gemini-2.0-flash`) |
| `GEMINI_MODEL` | Optional | `gemini-2.0-flash` | Gemini model variant |
| `OPENAI_API_KEY` | Optional | *[Optional Legacy Key]* | Legacy OpenAI key for dual-compatibility |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Allowed origin for Cross-Origin Resource Sharing |

---

## 27. Production Architecture

The verified target production topology:

```
[ Android Mobile App (Release APK) ] ──┐
                                       ├──> [ Cloudflare / AWS CloudFront (SSL Termination) ]
[ React Web Client (Production Build) ] ──┘                        │
                                                                   v
                                                     [ NGINX Reverse Proxy ]
                                                                   │
                                                                   v
                                                  [ Node.js / Express API Cluster ]
                                                  (PM2 Process Manager / Docker)
                                                    │                   │
                                                    v                   v
                                          [ MongoDB Atlas ]     [ Google Gemini API ]
                                          (Encrypted Cluster)   (Secure TLS REST)
```

> **Deployment Status**: The application is verified for local and physical Android device execution. Cloud deployment to production infrastructure (e.g. AWS / DigitalOcean / Atlas) is pending.

---

## 28. Future Enhancements

1. **Account Aggregator (AA) Framework Integration**: Direct integration with RBI-regulated Account Aggregators (e.g. Setu, OneMoney) for automated bank feeds.
2. **Multi-Currency & FX Normalization**: Real-time foreign exchange rate conversion for multi-currency accounts.
3. **Receipt OCR & Invoice Scanning**: Edge-based camera optical character recognition to extract line items from paper receipts.
4. **Shared Family / Joint Accounts**: Role-based access control for shared household budgets with granular privacy settings.
5. **Investment Portfolio Tracking**: Mutual funds, stocks, and fixed deposit portfolio tracking with automated NAV updates.

---

## 29. Project Completion Summary

The **FinTrack — AI-Powered Automatic Personal Finance Intelligence System** has achieved 100% implementation of its functional and architectural scope:
- Automated multi-source ingestion (CSV, XLSX, SMS, Android Notifications) with zero manual overhead.
- Dual-tier intelligence with verified mathematical calculations and Google Gemini AI grounding.
- Internal Model Context Protocol (MCP) server integration for secure, isolated AI tool execution.
- High-performance, cross-platform client delivery across modern Web and native Android mobile.
- Validated with over 960+ automated tests across backend, web, and mobile suites and verified on physical Android hardware (`CPH2381`).
