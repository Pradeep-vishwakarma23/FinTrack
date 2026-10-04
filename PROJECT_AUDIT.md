# FinTrack: Codebase Audit & System Upgrade Architecture

**Project Title**: FinTrack — AI-Powered Automatic Personal Finance Intelligence System  
**Academic / System Context**: BE CSE Major Project  
**Phase**: Phase 0 — Comprehensive Codebase Audit & Architecture Specification  
**Audit Date**: September 26, 2026  
**Status**: Current Baseline Operational (100% Passing Tests, Production Build Verified)

---

## 1. Executive Summary & Audit Objectives

The existing **FinTrack** codebase has been inspected and verified as a fully working MERN-stack application. It possesses:
- Working JWT authentication with password hashing (bcrypt) and user isolation.
- Complete transaction CRUD with pagination, multi-field regex search, category and type filtering, and sorting.
- User budget configuration with category allocations and overspend progress meters.
- Deterministic financial analytics engine (`financeAnalyzer.js`) computing metrics, savings, category splits, and monthly trends.
- OpenAI-backed financial insights (`gpt-4o-mini`) with seamless fallback to deterministic heuristic rules.
- Baseline statistical expense prediction with density-weighted confidence estimation and budget overrun risk flags.
- Monthly financial statements with binary PDF streaming using `PDFKit`.
- Full Redux Toolkit state architecture and responsive React (Vite + Tailwind CSS + Recharts) frontend.

### Upgrade Mandate
The project will be upgraded from a manual expense tracker into an **AI-Powered Automatic Personal Finance Intelligence System**:
1. **Automated Ingestion Layer**: CSV, Excel (XLSX), Bank Statement PDF, Receipt OCR, Email Transaction Alerts (safe dev mode & OAuth roadmap), and SMS/Message text streams.
2. **Transaction Intelligence Pipeline**: Automated entity extraction (amount, date, merchant, transaction type, payment mode), rule-based and AI-powered categorization, deterministic duplicate detection (hash fingerprints), and confidence scoring (High / Medium / Low).
3. **Human-in-the-Loop Verification**: Review workflow (`/imports`) enabling batch confirmation, field-level inline editing, and duplicate resolution prior to final ledger commitment.
4. **Advanced Financial Intelligence**: Explainable statistical forecasting (moving averages, evaluation metrics MAE/RMSE/MAPE), statistical anomaly detection (z-score, deviation analysis), multi-pillar Financial Health Score (0–100), Financial Goals tracker, What-If Simulator (`/simulator`), Affordability Analyzer ("Can I afford this?"), and a Context-Grounded AI Financial Advisor (`/assistant`).

---

## 2. Current Working Baseline Architecture

```
+-------------------------------------------------------------------------------+
|                            CLIENT (Vite + React 18)                           |
|  - Pages: Dashboard, Transactions, Budget, Insights, Reports, Profile, Auth  |
|  - State: Redux Toolkit (authSlice, transactionSlice, budgetSlice, insight)   |
|  - Visuals: Recharts (LineChart, BarChart, PieChart), Tailwind CSS           |
|  - HTTP: Axios Instance with Bearer Interceptors & 401 Auto-Purge             |
+---------------------------------------+---------------------------------------+
                                        | (REST API via /api Proxy - Port 5000)
                                        v
+-------------------------------------------------------------------------------+
|                         SERVER (Node.js + Express.js)                         |
|  - Security: Helmet, CORS Whitelisting, Express Rate Limit (300 req/15 min)   |
|  - Routes: /api/auth, /api/transactions, /api/budget, /api/ai,                |
|            /api/dashboard, /api/reports                                       |
|  - Middleware: JWT Bearer Verification (protect)                              |
|  - Engines: financeAnalyzer.js, aiService.js (OpenAI / Heuristics)            |
|  - Reporting: PDFKit Binary Stream Generator                                  |
+---------------------------------------+---------------------------------------+
                                        | (Mongoose ODM)
                                        v
+-------------------------------------------------------------------------------+
|                           DATABASE (MongoDB / Atlas)                          |
|  - Collections: users, transactions, budgets                                  |
+-------------------------------------------------------------------------------+
```

---

## 3. Inventory of Existing Working Modules & Files

### Backend (`server/`)
| File | Type | Current Status | Description | Reusability in Upgrade |
| :--- | :--- | :--- | :--- | :--- |
| `server.js` | Entry Point | **Working** | DB connection bootstrapper & listener on port 5000 | 100% Preserved |
| `app.js` | App Config | **Working** | Express app, Helmet, CORS, Rate Limit, route mounting | Core preserved; add new routes |
| `models/User.js` | DB Model | **Working** | User schema, bcrypt pre-save hashing, `matchPassword` | 100% Preserved |
| `models/Transaction.js`| DB Model | **Working** | Schema for user transactions, indexes on date/type/category | Extend schema with source, fingerprint, confidence, recurring |
| `models/Budget.js` | DB Model | **Working** | Budget schema with category limits sub-schema | 100% Preserved |
| `middleware/authMiddleware.js` | Middleware | **Working** | Bearer token validation, `req.userId` injection | 100% Preserved across all new APIs |
| `controllers/authController.js` | Controller | **Working** | Signup, login, getMe, profile update, password change, stats | 100% Preserved |
| `controllers/transactionController.js` | Controller | **Working** | CRUD, search, filter, sort, pagination | Preserved as verified final ledger CRUD |
| `controllers/budgetController.js` | Controller | **Working** | Get, set (upsert), update budget limits | 100% Preserved |
| `controllers/dashboardController.js` | Controller | **Working** | Aggregates summary cards, trends, categories, recent records | Preserved; feed into advanced analytics |
| `controllers/reportController.js` | Controller | **Working** | Monthly statement aggregation & PDFKit binary streaming | 100% Preserved |
| `controllers/aiController.js` | Controller | **Working** | AI insights & spending forecast endpoints | Extend for AI Advisor and Anomaly endpoints |
| `services/financeAnalyzer.js` | Service | **Working** | Deterministic calculations (income, expense, savings, trend) | Extend with Anomaly, Health Score, Simulator |
| `services/aiService.js` | Service | **Working** | OpenAI chat completions + heuristic rules engine fallback | Extend with transaction intelligence & AI Advisor |
| `tests/financeAnalyzer.test.js` | Tests | **Working** | 5 unit tests for calculations and heuristic fallback | Preserved and augmented |
| `tests/aiService.test.js` | Tests | **Working** | 3 unit tests for key validation and risk forecasting | Preserved and augmented |
| `tests/auth_api.test.js` | Tests | **Working** | 5 integration tests for health, auth, and route protection | Preserved and augmented |

### Frontend (`client/`)
| File | Type | Current Status | Description | Reusability in Upgrade |
| :--- | :--- | :--- | :--- | :--- |
| `src/main.jsx` | Entry | **Working** | React 18 root with Redux Provider | 100% Preserved |
| `src/App.jsx` | Router | **Working** | Route configuration with `ProtectedRoute` & `PublicRoute` | Add `/imports`, `/goals`, `/simulator`, `/assistant` |
| `src/redux/store.js` | Store | **Working** | Configured with `auth`, `transactions`, `budget`, `insights` | Add `importSlice`, `goalSlice`, `assistantSlice` |
| `src/redux/slices/authSlice.js` | Slice | **Working** | User authentication state, token persistence | 100% Preserved |
| `src/redux/slices/transactionSlice.js` | Slice | **Working** | Transactions state, pagination, and CRUD | 100% Preserved |
| `src/redux/slices/budgetSlice.js` | Slice | **Working** | Budget state and category allocations | 100% Preserved |
| `src/redux/slices/insightSlice.js` | Slice | **Working** | AI recommendations and forecast state | 100% Preserved |
| `src/services/api.js` | Network | **Working** | Axios instance with JWT interceptors & auto-eviction | 100% Preserved |
| `src/services/*Service.js` | Network | **Working** | Service wrappers for existing API endpoints | Add `importService.js`, `goalService.js`, `advisorService.js` |
| `src/utils/format.js` | Utility | **Working** | Currency (INR), date formatting, categories, payment methods | 100% Preserved & extended |
| `src/components/layout/Layout.jsx` | Layout | **Working** | Shell with Sidebar, Navbar, and Outlet | 100% Preserved |
| `src/components/layout/Navbar.jsx` | Layout | **Working** | Top bar with user profile display | 100% Preserved |
| `src/components/layout/Sidebar.jsx` | Layout | **Working** | Side navigation links | Add navigation items for new modules |
| `src/components/dashboard/SummaryCard.jsx` | Component | **Working** | Styled metric KPI card | Reused across all new pages |
| `src/pages/Login.jsx` & `Signup.jsx` | Pages | **Working** | Authentication forms | 100% Preserved |
| `src/pages/Dashboard.jsx` | Page | **Working** | Overview with Recharts Line, Pie, Bar charts | 100% Preserved |
| `src/pages/Transactions.jsx` | Page | **Working** | Search, filter, table, pagination, modal | 100% Preserved |
| `src/pages/Budget.jsx` | Page | **Working** | Budget allocation & progress bars | 100% Preserved |
| `src/pages/Insights.jsx` | Page | **Working** | AI recommendations & confidence bar | 100% Preserved |
| `src/pages/Reports.jsx` | Page | **Working** | Monthly statements & PDF download | 100% Preserved |
| `src/pages/Profile.jsx` | Page | **Working** | User profile, password, and account stats | 100% Preserved |
| `src/test/*.test.js` | Tests | **Working** | Vitest tests for formatting and Redux slices | Preserved and augmented |

---

## 4. Target Architecture for Automatic Intelligence System

```
===================================================================================
                     FINANCIAL DATA INGESTION & INTELLIGENCE PIPELINE
===================================================================================

       +------------------------------------------------------------------+
       |                     DATA INGESTION LAYER                         |
       |  [CSV / XLSX]   [Bank PDF]   [Receipt OCR]   [Email]   [SMS/Msg] |
       +--------------------------------+---------------------------------+
                                        |
                                        v
       +------------------------------------------------------------------+
       |                      PARSING & NORMALIZATION                     |
       |  - Intelligent Column Header Detection (Date, Amount, Narration) |
       |  - Currency & Decimal Cleaner (INR, Commas, CR/DR, Lakhs)        |
       |  - ISO Date Normalizer (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)      |
       +--------------------------------+---------------------------------+
                                        |
                                        v
       +------------------------------------------------------------------+
       |                   TRANSACTION INTELLIGENCE ENGINE                |
       |  - Merchant Extraction & Cleaning (e.g. "UPI/Swiggy/123" -> Swiggy)
       |  - Transaction Type Inference (Debit/Credit/Transfer)            |
       |  - Category Classification (OpenAI JSON + Deterministic Rules)   |
       |  - Deterministic Fingerprinting & Duplicate Detection            |
       |  - Confidence Scoring (High: >85%, Medium: 60-85%, Low: <60%)   |
       +--------------------------------+---------------------------------+
                                        |
                                        v
       +------------------------------------------------------------------+
       |               STAGING BATCH & HUMAN VERIFICATION                 |
       |  - ImportBatch Model: (Status: REVIEW_REQUIRED, COMPLETED)        |
       |  - Staged ImportedTransaction Records                            |
       |  - Interactive Review Screen: Confirm / Edit / Ignore / Batch    |
       +--------------------------------+---------------------------------+
                                        | (User Confirms)
                                        v
       +------------------------------------------------------------------+
       |                    PRIMARY FINANCIAL LEDGER                      |
       |  - Normalized Verified Transactions Collection (MongoDB)         |
       +--------------------------------+---------------------------------+
                                        |
                                        v
       +------------------------------------------------------------------+
       |                  FINANCIAL INTELLIGENCE ENGINE                   |
       |  - Advanced Analytics & Recurring Expense Detection              |
       |  - Statistical Forecasting (Moving Average, MAE/RMSE/MAPE)       |
       |  - Anomaly Detection (Z-Score & Deviation Flags)                 |
       |  - Multi-Pillar Financial Health Score (0-100)                   |
       |  - Financial Goals & Target Savings Calculator                   |
       |  - What-If Scenario Simulator                                    |
       |  - Affordability Analyzer ("Can I Afford This?")                 |
       |  - Context-Grounded AI Finance Advisor (/assistant)              |
       +------------------------------------------------------------------+
```

---

## 5. Database Schema Evolution

### 1. Enhanced `Transaction` Model (`server/models/Transaction.js`)
*Maintains 100% backwards compatibility with existing records while adding ingestion metadata:*
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true, index: true },
  paymentMethod: { type: String, default: 'card' },
  description: { type: String, trim: true, default: '' },
  transactionDate: { type: Date, required: true, default: Date.now, index: true },
  
  // New Ingestion & Intelligence Fields:
  merchant: { type: String, trim: true, default: '' },
  source: { 
    type: String, 
    enum: ['manual', 'csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms'], 
    default: 'manual' 
  },
  sourceReference: { type: String, default: '' },
  externalTransactionId: { type: String, default: '' },
  confidence: { type: Number, min: 0, max: 1, default: 1.0 },
  status: { type: String, enum: ['confirmed', 'staged', 'ignored'], default: 'confirmed' },
  fingerprint: { type: String, index: true },
  isDuplicate: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, default: '' }, // 'daily', 'weekly', 'monthly', 'yearly'
  importBatchId: { type: ObjectId, ref: 'ImportBatch', default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

### 2. New `ImportBatch` Model (`server/models/ImportBatch.js`)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, enum: ['csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms'], required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  totalRecords: { type: Number, default: 0 },
  processedRecords: { type: Number, default: 0 },
  confirmedRecords: { type: Number, default: 0 },
  ignoredRecords: { type: Number, default: 0 },
  duplicateRecords: { type: Number, default: 0 },
  failedRecords: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED'], 
    default: 'REVIEW_REQUIRED' 
  },
  summary: {
    totalIncome: { type: Number, default: 0 },
    totalExpense: { type: Number, default: 0 },
    highConfidenceCount: { type: Number, default: 0 },
    lowConfidenceCount: { type: Number, default: 0 }
  },
  errorMessage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}
```

### 3. New `FinancialGoal` Model (`server/models/FinancialGoal.js`)
```javascript
{
  userId: { type: ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true, min: 1 },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date, required: true },
  category: { type: String, default: 'Savings' },
  monthlyContribution: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'achieved', 'paused'], default: 'active' },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

---

## 6. Proposed API Roadmap

### Phase 1 & 2: Ingestion & Verification APIs
- `POST /api/imports/csv` — Multipart file upload, intelligent parsing, duplicate detection, and staged batch creation.
- `POST /api/imports/excel` — Multi-sheet XLSX parsing and staging.
- `GET /api/imports` — List user import batches with processing metrics.
- `GET /api/imports/:id` — Get import batch summary and statistics.
- `GET /api/imports/:id/transactions` — Fetch staged records for review.
- `PATCH /api/imports/transactions/:id` — Edit staged record (category, merchant, amount, date, type).
- `POST /api/imports/transactions/:id/confirm` — Commit single staged transaction into primary ledger.
- `POST /api/imports/transactions/:id/ignore` — Mark single staged transaction as ignored.
- `POST /api/imports/:id/confirm-all` — Batch commit all non-ignored staged records into primary ledger.
- `DELETE /api/imports/:id` — Discard entire staged import batch.

### Subsequent Phase APIs
- `POST /api/imports/sms` — Ingest raw SMS text / message batches.
- `POST /api/imports/email` — Safe development mode email text parser.
- `POST /api/imports/pdf` — Bank statement table and text extraction.
- `POST /api/imports/receipt` — Receipt image OCR and line extraction.
- `GET /api/intelligence/anomalies` — Statistical anomaly and deviation detection.
- `GET /api/intelligence/health-score` — Multi-pillar financial health score (0–100) with breakdown.
- `POST /api/intelligence/simulator` — What-if budget and expense reduction simulator.
- `POST /api/intelligence/affordability` — "Can I Afford This?" purchase evaluation.
- `POST /api/intelligence/assistant` — Context-grounded AI financial advisor conversation.
- `GET/POST/PUT/DELETE /api/goals` — Full Financial Goals CRUD & required savings tracker.

---

## 7. Files to be Modified vs Files to be Created

### Files to be Modified (Preserving existing logic):
1. `server/models/Transaction.js` — Add ingestion fields, indexes, and source tracking.
2. `server/app.js` — Mount new routers (`/api/imports`, `/api/intelligence`, `/api/goals`).
3. `server/package.json` — Add parsers (`csv-parser`, `xlsx`, `pdf-parse`, `tesseract.js`, etc.).
4. `client/package.json` — Frontend utility packages if needed.
5. `client/src/App.jsx` — Add routes for `/imports`, `/goals`, `/simulator`, `/assistant`.
6. `client/src/redux/store.js` — Register `importSlice`, `goalSlice`, `advisorSlice`.
7. `client/src/components/layout/Sidebar.jsx` — Add navigation icons for Imports, Goals, Simulator, AI Advisor.
8. `README.md` — Document upgraded architecture and new ingestion workflows.

### Files to be Created:
#### Backend:
1. `server/models/ImportBatch.js` — Import batch status and stats model.
2. `server/models/FinancialGoal.js` — Financial goals tracking model.
3. `server/services/fileParserService.js` — Intelligent CSV & Excel column mapper and cleaner.
4. `server/services/transactionIntelligence.js` — Merchant detection, category predictor, duplicate hasher, confidence scorer.
5. `server/controllers/importController.js` — Staged upload, review, edit, confirmation handlers.
6. `server/routes/importRoutes.js` — Import routing endpoints.
7. `server/tests/import_csv_excel.test.js` — Test suite for file ingestion, normalization, and duplicate detection.

#### Frontend:
1. `client/src/services/importService.js` — API client for upload and review endpoints.
2. `client/src/redux/slices/importSlice.js` — Redux state for staged transactions and batches.
3. `client/src/pages/Imports.jsx` — Complete Import & Review UI with upload zone, history, and review table.
4. `client/src/test/importSlice.test.js` — Frontend unit test for import slice state transitions.

---

## 8. Phase 1 Implementation Plan (CSV & Excel Ingestion)

When approved to proceed, Phase 1 will execute with the following precision steps:

1. **Install backend dependencies**: `csv-parser` and `xlsx` for parsing, `multer` for secure in-memory file handling.
2. **Create `server/models/ImportBatch.js`** and update `server/models/Transaction.js` with non-breaking field additions.
3. **Build `server/services/fileParserService.js`**:
   - Dynamic header mapping (handling variations of Date, Amount, Narration, Merchant, Balance, CR/DR, Category).
   - Robust date normalizer supporting Indian (`DD/MM/YYYY`, `DD-MM-YYYY`) and ISO formats.
   - Robust amount parser cleaning commas, `₹`, `Rs.`, and extracting signs from `Debit`/`Credit` or `DR`/`CR` columns.
4. **Build `server/services/transactionIntelligence.js`**:
   - Merchant regex heuristics (e.g. UPI handles, POS tags, Swiggy, Zomato, Amazon, Uber, Electricity Board).
   - Category classifier with deterministic fallback keywords and confidence rating (0.0 to 1.0).
   - Deterministic SHA-256 fingerprint generation based on `{userId, date, amount, merchant, externalId}` to flag duplicates.
5. **Implement `server/controllers/importController.js` & `server/routes/importRoutes.js`**:
   - File validation (file type `.csv`, `.xlsx`, `.xls`, max 5MB).
   - Ingest into `ImportBatch` with staged transactions (status: `staged`).
   - Staged record query, editing, single confirmation, and batch confirmation into main ledger.
6. **Implement Frontend `Imports.jsx` page & `importSlice.js`**:
   - Drag-and-drop upload zone with format badges and progress indicators.
   - Staged review table with inline category/merchant/type editing, duplicate warnings, confidence badges, and confirm/ignore actions.
   - Batch confirmation and commit into primary ledger.
7. **Write and run comprehensive test suites** (Jest backend tests + Vitest frontend tests + Vite production build).

---

## 9. Testing & Quality Assurance Plan

### Automated Test Coverage Checklist:
- [ ] Valid CSV with standard headers (Date, Description, Amount, Type).
- [ ] Valid XLSX with Debit/Credit columns and multi-row narration.
- [ ] Indian date format handling (`DD/MM/YYYY`).
- [ ] Number cleaning with commas (e.g. `1,25,000.50` -> `125000.50`).
- [ ] Duplicate transaction detection and fingerprint warning.
- [ ] Merchant extraction from noisy UPI narrations.
- [ ] Category prediction with high (>85%) vs low (<60%) confidence scoring.
- [ ] Batch confirm commits staged records to `Transaction` collection.
- [ ] User data isolation (user A cannot see or confirm user B's import batches).
- [ ] Malformed row tolerance (corrupt rows skipped with informative error count without crashing batch).

---

## 10. Verification of Existing Functionality

The current baseline application is intact:
- Backend tests: **13/13 passing** (`server/tests/`)
- Frontend tests: **8/8 passing** (`client/src/test/`)
- Frontend production bundle: **Built successfully** with Vite
- Server & Client servers: **Active and functional**

*Awaiting approval to begin Phase 1.*
