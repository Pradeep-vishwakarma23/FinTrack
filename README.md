# FinTrack — AI-Powered Automatic Personal Finance Intelligence System

A full-stack MERN (MongoDB, Express.js, React, Node.js) web application designed for automatic financial transaction ingestion (Bank Statements CSV/Excel, SMS transaction alerts), AI-driven transaction categorization, multi-factor confidence scoring, duplicate prevention, category-level budgeting, AI financial insights, predictive spending analytics, and downloadable monthly PDF reports.

---

## Ingestion & Intelligence Pipelines
- **Phase 1 Complete**: Automated Bank Statement Ingestion (`.csv`, `.xlsx`, `.xls`) with dynamic column aliasing, Indian date format normalization, merchant extraction, duplicate fingerprinting, and interactive staged review pipeline.
- **Phase 2 Complete**: Automated Message / SMS Transaction Ingestion with sensitive data redaction (OTPs, PINs, full account numbers), entity & amount extraction, debit/credit classification, and 30+ synthetic demo dataset.

---

## Architectural Blueprint
```
+-------------------------------------------------------------------------------+
|                                 CLIENT (Vite + React)                         |
|  - Pages: Dashboard, Transactions, Imports & Staging, Budget, Insights,       |
|           Reports, Profile, Auth                                              |
|  - State: Redux Toolkit (auth, transactions, budget, insights, imports)       |
|  - Visualization: Recharts (LineChart, BarChart, PieChart)                    |
|  - HTTP: Axios Instance with JWT Interceptors & 401 Auto-Purge                |
+---------------------------------------+---------------------------------------+
                                        | (HTTP / REST API - Port 5000)
                                        v
+-------------------------------------------------------------------------------+
|                            SERVER (Node.js + Express)                         |
|  - Security: Helmet, CORS Whitelisting, Express Rate Limiter                  |
|  - Routes: /api/auth, /api/transactions, /api/imports, /api/budget,          |
|            /api/ai, /api/dashboard, /api/reports                             |
|  - Ingestion Services: fileParserService.js, smsParserService.js             |
|  - Processing Engines: transactionIntelligence.js, financeAnalyzer.js,        |
|                        aiService.js (OpenAI / Heuristic Fallbacks)            |
|  - Reporting: PDFKit Binary Stream Generator                                  |
+---------------------------------------+---------------------------------------+
                                        | (HTTP / REST API - Port 5000)
                                        v
+-------------------------------------------------------------------------------+
|                            SERVER (Node.js + Express)                         |
|  - Security: Helmet, CORS Whitelisting, Express Rate Limiter                  |
|  - Routes: /api/auth, /api/transactions, /api/budget, /api/ai,                |
|            /api/dashboard, /api/reports                                       |
|  - Middleware: JWT Auth Verification (protect)                                |
|  - Processing Engines: financeAnalyzer.js, aiService.js (OpenAI / Heuristics) |
|  - Reporting: PDFKit Binary Stream Generator                                  |
+---------------------------------------+---------------------------------------+
                                        | (Mongoose ODM)
                                        v
+-------------------------------------------------------------------------------+
|                           DATABASE (MongoDB Atlas / Local)                    |
|  - Collections: users, transactions, budgets                                  |
+-------------------------------------------------------------------------------+
```

---

## 2. Implementation Status Summary

Based on an exhaustive line-by-line audit of the existing codebase:

- **Fully Implemented**:
  - Express server initialization and lifecycle (`server.js`, `app.js`).
  - Core server middleware: `helmet`, `cors` origin configuration, `express-rate-limit` (300 requests / 15 min), JSON body parsing, and global error handling.
  - Server route hierarchy and router mounting for all modules.
  - Client tooling: Vite configuration with development API proxy (`/api` -> `http://localhost:5000`), Tailwind CSS configuration with custom theme tokens, and PostCSS setup.
  - Client Axios network client (`api.js`) with request authentication interceptors and response token eviction interceptors.
  - Client service modules with full endpoint mappings (`authService.js`, `transactionService.js`, `budgetService.js`, `dashboardService.js`, `reportService.js`, `aiService.js`).
  - Formatting utility functions (`format.js`) for INR currency, date formatting, predefined transaction categories (12), and payment methods (6).
  - Standalone dashboard component (`SummaryCard.jsx`).

- **Partially Implemented (Structural Skeletons / Stubs)**:
  - Mongoose Database Models (`User.js`, `Transaction.js`, `Budget.js`): Schema constructor calls exist, but schema fields, validations, and hooks are commented out.
  - Client Redux Store (`store.js`): Configured with an empty reducer object `{}` despite importing all slice reducers.
  - Client Root Router (`App.jsx`): Router and layout shells exist, but route declarations and authentication gate components are commented-out stubs.
  - Client Layout Components (`Layout.jsx`, `Navbar.jsx`, `Sidebar.jsx`): Container DOM structures exist, but navigation loops, auth bindings, and child outlet rendering are commented out.
  - Client UI Pages (8 pages): JSX container structures exist, but local state, Redux thunk dispatches, Recharts chart bindings, form handlers, and data tables are commented-out stubs.

- **Planned But Not Implemented (Code Missing / Stubs Only)**:
  - Backend JWT Authentication Middleware (`authMiddleware.js`): Contains only pseudocode comments; does not decode tokens or call `next()`.
  - Backend Controllers (All 6 controller files): `authController.js`, `transactionController.js`, `budgetController.js`, `dashboardController.js`, `reportController.js`, and `aiController.js` contain only pseudocode comments.
  - Financial Analytics Business Engine (`financeAnalyzer.js`): Functions (`currency`, `getMonthRange`, `summarizeTransactions`, `analyzeFinance`) contain only pseudocode comments.
  - AI Service Engine (`aiService.js`): Functions (`hasOpenAIKey`, `generateAIInsights`, `predictExpense`) contain only pseudocode comments.
  - Redux Slices (All 4 slice files): Thunks, reducer actions, and extraReducers builder cases are empty functions.

---

## 3. Complete Technology Stack

### Backend Technologies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | ES Modules (`"type": "module"`) | Runtime environment |
| **Express.js** | `^4.18.2` | RESTful API server framework |
| **Mongoose** | `^7.5.0` | Object Data Modeling (ODM) for MongoDB |
| **JSONWebToken** | `^9.0.2` | Token generation and signature verification |
| **Bcrypt** | `^5.1.1` | Cryptographic password hashing |
| **OpenAI SDK** | `^4.12.4` | LLM integration (`gpt-4o-mini`) |
| **PDFKit** | `0.18.0` | Server-side PDF generation and streaming |
| **Helmet** | `8.1.0` | HTTP security header hardening |
| **Express Rate Limit** | `8.4.1` | API rate limiting and brute-force mitigation |
| **CORS** | `^2.8.5` | Cross-Origin Resource Sharing control |
| **Dotenv** | `^16.3.1` | Environment variable management |
| **Multer** | `^1.4.5-lts.1` | Multipart/form-data upload handling |
| **Axios** | `^1.5.0` | HTTP client for external requests |
| **Nodemon** *(Dev)* | `^3.0.1` | Hot-reloading development server |
| **Jest** *(Dev)* | `^29.7.0` | Backend unit and integration testing framework |
| **Supertest** *(Dev)* | `^6.3.3` | HTTP assertion library for endpoint testing |

### Frontend Technologies
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^18.2.0` | Declarative user interface library |
| **React DOM** | `^18.2.0` | DOM renderer for React |
| **Vite** | `^5.0.2` | Next-generation frontend build tool and dev server |
| **React Router DOM** | `^6.16.0` | Client-side routing and navigation guards |
| **Redux Toolkit** | `^1.9.7` | Global application state management |
| **React-Redux** | `^8.1.3` | React bindings for Redux state subscription |
| **Recharts** | `^2.10.3` | Composable charting library for React |
| **Axios** | `^1.5.0` | Promise-based HTTP client with interceptors |
| **Tailwind CSS** | `^3.3.5` | Utility-first CSS styling framework |
| **PostCSS** | `^8.4.31` | CSS transformation pipeline |
| **Autoprefixer** | `^10.4.16` | CSS vendor prefix automation |
| **Vitest** *(Dev)* | `^0.34.6` | Vite-native unit testing framework |
| **Testing Library** *(Dev)* | `^14.1.0` | React component testing utilities |

---

## 4. Project Architecture & Directory Structure

```
Finance-Tracker-Initial-Codes/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── reading_naterial_fin_tracker.md
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── ai/                      # [Empty directory]
│       │   ├── budget/                  # [Empty directory]
│       │   ├── common/                  # [Empty directory]
│       │   ├── dashboard/
│       │   │   └── SummaryCard.jsx      # Implemented metric card component
│       │   ├── layout/
│       │   │   ├── Layout.jsx           # App layout shell
│       │   │   ├── Navbar.jsx           # Top navigation bar
│       │   │   └── Sidebar.jsx          # Side navigation bar
│       │   ├── reports/                 # [Empty directory]
│       │   └── transactions/            # [Empty directory]
│       ├── config/                      # [Empty directory]
│       ├── hooks/                       # [Empty directory]
│       ├── pages/
│       │   ├── Budget.jsx               # Monthly & category budget page
│       │   ├── Dashboard.jsx            # Financial overview & analytics dashboard
│       │   ├── Insights.jsx             # AI & rule-based recommendations page
│       │   ├── Login.jsx                # User login page
│       │   ├── Profile.jsx              # Account details & password update page
│       │   ├── Reports.jsx              # Monthly statements & PDF export page
│       │   ├── Signup.jsx               # User registration page
│       │   └── Transactions.jsx         # Transaction CRUD & filtering page
│       ├── redux/
│       │   ├── store.js                 # Redux store configuration
│       │   └── slices/
│       │       ├── authSlice.js         # Auth state, thunks, and reducers
│       │       ├── budgetSlice.js       # Budget state, thunks, and reducers
│       │       ├── insightSlice.js      # AI insights & prediction state
│       │       └── transactionSlice.js  # Transaction CRUD state & pagination
│       ├── routes/                      # [Empty directory]
│       ├── services/
│       │   ├── aiService.js             # AI insights and prediction API calls
│       │   ├── api.js                   # Axios client instance with interceptors
│       │   ├── authService.js           # Authentication API calls
│       │   ├── budgetService.js         # Budget CRUD API calls
│       │   ├── dashboardService.js      # Dashboard summary API calls
│       │   ├── reportService.js         # Report & PDF download API calls
│       │   └── transactionService.js    # Transaction CRUD API calls
│       └── utils/
│           └── format.js                # Currency, date formatting, and constants
└── server/
    ├── .env                             # Environment configuration (local)
    ├── .env.example                     # Environment configuration template
    ├── .gitignore
    ├── app.js                           # Express application & middleware setup
    ├── package.json
    ├── server.js                        # HTTP server listener & DB starter
    ├── config/                          # [Empty directory]
    ├── controllers/
    │   ├── aiController.js              # AI & prediction controllers (stubs)
    │   ├── authController.js            # Auth & account controllers (stubs)
    │   ├── budgetController.js          # Budget controllers (stubs)
    │   ├── dashboardController.js       # Dashboard summary controller (stub)
    │   ├── reportController.js          # Report & PDF stream controller (stub)
    │   └── transactionController.js     # Transaction CRUD controllers (stubs)
    ├── middleware/
    │   └── authMiddleware.js            # JWT protection middleware (stub)
    ├── models/
    │   ├── Budget.js                    # Budget Mongoose model (empty schema)
    │   ├── Transaction.js               # Transaction Mongoose model (empty schema)
    │   └── User.js                      # User Mongoose model (empty schema)
    ├── routes/
    │   ├── aiRoutes.js                  # AI route definitions
    │   ├── authRoutes.js                # Auth route definitions
    │   ├── budgetRoutes.js              # Budget route definitions
    │   ├── dashboardRoutes.js           # Dashboard route definitions
    │   ├── reportRoutes.js              # Report route definitions
    │   └── transactionRoutes.js         # Transaction route definitions
    ├── services/
    │   ├── aiService.js                 # OpenAI / Heuristic AI provider (stub)
    │   └── financeAnalyzer.js           # Deterministic analytics engine (stub)
    └── utils/                           # [Empty directory]
```

---

## 5. Database Structure & Data Models

All models reside in `server/models/`. In the existing code, all three models instantiate empty Mongoose schemas `new mongoose.Schema({})`. Below are the documented planned schemas based on the source code specifications:

### 1. User Model (`server/models/User.js`)
- **Collection Name**: `users`
- **Schema Specification**:
  ```javascript
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] 
    },
    password: { type: String, required: true, minlength: 6, select: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
  ```
- **Indexes**: `{ email: 1 }` (Unique).
- **Hooks & Methods**:
  - `pre('save')`: Hashes modified passwords with `bcrypt.genSalt(10)` and updates `updatedAt`.
  - `methods.matchPassword`: Compares plaintext password with stored hash via `bcrypt.compare`.

### 2. Transaction Model (`server/models/Transaction.js`)
- **Collection Name**: `transactions`
- **Schema Specification**:
  ```javascript
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'card', 'bank_transfer', 'upi', 'wallet', 'other'], 
      default: 'card' 
    },
    description: { type: String, trim: true },
    transactionDate: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, default: Date.now }
  }
  ```
- **Indexes**:
  - Compound Index: `{ userId: 1, transactionDate: -1 }` (Timeline sorting)
  - Compound Index: `{ userId: 1, type: 1 }` (Income vs Expense filtering)
  - Compound Index: `{ userId: 1, category: 1 }` (Category breakdown aggregation)

### 3. Budget Model (`server/models/Budget.js`)
- **Collection Name**: `budgets`
- **Schema Specification**:
  ```javascript
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    monthlyBudget: { type: Number, required: true, min: 0 },
    categoryBudgets: [
      {
        category: { type: String, required: true },
        limit: { type: Number, required: true, min: 0 }
      }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }
  ```
- **Indexes**: `{ userId: 1 }` (Unique per user).

---

## 6. API Endpoints & Routing Specification

All routes are mounted under the `/api` prefix in `server/app.js`:

| Method | Endpoint | Auth Required | Description | Controller Status |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/health` | No | Basic server liveness check | **Implemented** |
| **POST** | `/api/auth/signup` | No | Register new user account & issue JWT | Stub (Empty) |
| **POST** | `/api/auth/login` | No | Authenticate user & issue JWT | Stub (Empty) |
| **GET** | `/api/auth/me` | Yes (`protect`) | Retrieve profile of authenticated user | Stub (Empty) |
| **PUT** | `/api/auth/profile` | Yes (`protect`) | Update user name and email | Stub (Empty) |
| **PUT** | `/api/auth/password` | Yes (`protect`) | Update password with old password check | Stub (Empty) |
| **GET** | `/api/auth/stats` | Yes (`protect`) | Aggregate user transaction & savings stats | Stub (Empty) |
| **POST** | `/api/transactions` | Yes (`protect`) | Create a new income/expense transaction | Stub (Empty) |
| **GET** | `/api/transactions` | Yes (`protect`) | List transactions with filters, sort, search, pagination | Stub (Empty) |
| **PUT** | `/api/transactions/:id`| Yes (`protect`) | Update existing transaction by ID | Stub (Empty) |
| **DELETE**| `/api/transactions/:id`| Yes (`protect`)| Delete transaction by ID | Stub (Empty) |
| **POST** | `/api/budget` | Yes (`protect`) | Set or upsert monthly and category budgets | Stub (Empty) |
| **GET** | `/api/budget` | Yes (`protect`) | Fetch current user budget configurations | Stub (Empty) |
| **PUT** | `/api/budget` | Yes (`protect`) | Update existing budget configurations | Stub (Empty) |
| **GET** | `/api/dashboard/summary`| Yes (`protect`)| Get summary cards, trend, category split, recent items | Stub (Empty) |
| **GET** | `/api/reports/monthly` | Yes (`protect`) | Retrieve monthly report data or binary PDF stream (`format=pdf`)| Stub (Empty) |
| **POST** | `/api/ai/insights` | Yes (`protect`) | Generate financial insights via OpenAI or heuristic engine | Stub (Empty) |
| **POST** | `/api/ai/predict` | Yes (`protect`) | Predict future expense & evaluate budget risk | Stub (Empty) |

---

## 7. Authentication & Authorization Flow

### 1. Token Mechanism
- **JWT Signing**: Signs payload `{ id: user._id }` using secret key `JWT_SECRET` with expiry `JWT_EXPIRE` (default `7d`).
- **Authorization Header**: Client includes token in HTTP requests: `Authorization: Bearer <token>`.

### 2. Client-Side Authentication Handling (`client/src/services/api.js`)
- **Request Interceptor**: Reads `token` from `localStorage` and appends `Authorization: Bearer <token>` to request headers.
- **Response Interceptor**: Intercepts HTTP `401 Unauthorized` responses and automatically purges `token` and `user` keys from `localStorage`.

### 3. Current Implementation Status of Auth
- **Client Interceptors**: **Implemented** in `client/src/services/api.js`.
- **Backend Middleware (`protect`)**: **Not Implemented (Stub)**. The `authMiddleware.js` file currently contains only pseudocode. It does not extract headers, verify signatures, or call `next()`.
- **Route Guarding (`ProtectedRoute`)**: **Not Implemented (Stub)**. The `ProtectedRoute` component in `client/src/App.jsx` is not rendered.

---

## 8. AI Integration & Insight Generation

### Architecture & Fallback Mechanism
The application defines a **dual-tier AI analysis engine** in `server/services/aiService.js` designed to ensure that insight generation never fails even if third-party AI APIs are unreachable or unconfigured:

```
                          [User Financial Data]
                                    |
                                    v
                       [financeAnalyzer.js Engine]
                    (Deterministic summary & metrics)
                                    |
                                    v
                     [Check OpenAI Key Availability]
                                    |
                  +-----------------+-----------------+
                  | (Key Present)                     | (Key Missing / Error)
                  v                                   v
        [OpenAI API Request]               [Heuristic Rules Engine]
     Model: gpt-4o-mini                     - Top Category Overspending
     Temp: 0.4                              - Budget Usage Ratios
     Prompt: Formatted JSON Metrics         - Savings Rate Analysis
                  |                                   |
                  +-----------------+-----------------+
                                    |
                                    v
                       [Consolidated Insights Array]
```

### Current Status
- Both `generateAIInsights` and `predictExpense` in `server/services/aiService.js` are currently stubs with pseudocode comments.

---

## 9. Expense Prediction Methodology

The planned expense forecasting system in `financeAnalyzer.js` and `aiService.js` operates as follows:

1. **Monthly Bucketing**: Historical transactions are grouped by calendar month (`YYYY-MM`).
2. **Monthly Expense Averaging**: Computes average total monthly expense across past recorded months. If only one month exists, it defaults to current total expenses.
3. **Confidence Score Calculation**:
   - Computes data volume reliability based on transaction density and history.
   - Normalizes and clamps the confidence score between **55%** and **95%**.
4. **Budget Risk Assessment**:
   - Sets `budgetRisk: true` if `predictedExpense > monthlyBudget`.
   - Generates actionable savings recommendations to reduce high-spending categories.

---

## 10. Budget & Financial Analytics Engine

The financial analytics engine (`server/services/financeAnalyzer.js`) is designed to compute the following metrics:

- **Total Income**: Sum of all transactions where `type === 'income'`.
- **Total Expense**: Sum of all transactions where `type === 'expense'`.
- **Net Savings**: `totalIncome - totalExpense`.
- **Remaining Budget**: `monthlyBudget - totalExpense` (falls back to net savings if no budget is set).
- **Category Breakdown**: Aggregated expense totals per category, sorted in descending order of spending.
- **Monthly Spending Trend**: Aggregated income and expenses grouped chronologically by month (`YYYY-MM`).

---

## 11. PDF & Report Generation Engine

### Server-Side Generation (`server/controllers/reportController.js`)
- Uses the `pdfkit` library to create and stream PDF documents.
- When query parameter `format === 'pdf'` is received:
  - Sets HTTP response headers: `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="monthly-report-<period>.pdf"`.
  - Pipes the `PDFDocument` directly to Express `res`.
  - Renders:
    1. Report Header with Title and Selected Period (`YYYY-MM`).
    2. High-level Financial Summary (Income, Expense, Savings, Remaining Budget).
    3. Category Spending Breakdown Table.
    4. Recent Transactions List (limited to the first 40 entries).

### Client-Side Download (`client/src/services/reportService.js` & `Reports.jsx`)
- Axios sends request with `responseType: 'blob'`.
- Client creates a temporary Object URL (`window.URL.createObjectURL(blob)`), creates an invisible `<a>` element, triggers download, and revokes the URL.

---

## 12. Security & Protection Mechanisms

### Present in Active Code:
- **HTTP Security Headers**: `helmet()` configured in `server/app.js`.
- **CORS Whitelisting**: Strict origin checking in `server/app.js` validating incoming requests against `FRONTEND_URL` and `http://127.0.0.1:5173`.
- **API Rate Limiting**: `express-rate-limit` configured to limit requests to 300 per 15 minutes per IP address.
- **Client Token Eviction**: Automatic deletion of `token` and `user` keys from `localStorage` upon receiving 401 responses.

### Security Gaps to Address:
- `authMiddleware.js` (`protect`) must be implemented to verify JWT signatures and reject unauthorized requests.
- Passwords must be hashed using `bcrypt` in `User.js` pre-save hooks and verified during login.
- Sensitive environment credentials must never be committed to source control.

---

## 13. Frontend-Backend Communication

1. **Protocol & Format**: RESTful API over HTTP using JSON for all data exchanges and binary stream (`application/pdf`) for report exports.
2. **Development Proxy**: Vite dev server proxies `/api` requests to `http://localhost:5000` (`client/vite.config.js`).
3. **Standard Response Structure**:
   ```json
   {
     "success": true,
     "message": "Operation description",
     "data": {},
     "pagination": {
       "page": 1,
       "limit": 10,
       "total": 50,
       "pages": 5
     }
   }
   ```
4. **Standard Error Structure**:
   ```json
   {
     "success": false,
     "message": "Error description message"
   }
   ```

---

## 14. Environment Variables

The application utilizes environment variables for configuration. Create `.env` files in the respective directories based on the required keys below.

### Backend (`server/.env`)
```ini
NODE_ENV=
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRE=
OPENAI_API_KEY=
OPENAI_MODEL=
FRONTEND_URL=
```

### Frontend (`client/.env` - Optional)
```ini
VITE_API_URL=
```
*(Defaults to `http://localhost:5000/api` if not specified)*

---

## 15. Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (v6.0+) or MongoDB Atlas connection URI

### Step 1: Clone or Open the Workspace
Navigate to the project root directory:
```bash
cd "d:/Major project/Finance-Tracker-Initial-Codes"
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Configure Backend Environment
Copy `.env.example` to `.env` inside the `server/` directory and configure your database URI, JWT secret, and optional OpenAI API key:
```bash
cp .env.example .env
```

### Step 4: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## 16. Running the Application

### Running the Backend Server
From the `server/` directory:
```bash
# Development mode with Nodemon (auto-reload)
npm run dev

# Production mode
npm start
```
The server will start on `http://localhost:5000` (or the configured `PORT`).

### Running the Frontend Client
From the `client/` directory:
```bash
# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
The client will start on `http://localhost:5173`.

---

## 17. Current Known Errors & Bottlenecks

1. **Request Hanging on Protected Routes**:
   - `server/middleware/authMiddleware.js` contains an empty `protect` function. When protected routes are requested, the middleware neither calls `next()` nor returns a response, causing requests to hang until timeout.
2. **Empty Database Schemas**:
   - `server/models/User.js`, `Transaction.js`, and `Budget.js` instantiate empty schemas (`new mongoose.Schema({})`). Any attempted database inserts will not validate fields, types, or indexes.
3. **Empty Redux Store Reducer Map**:
   - `client/src/redux/store.js` defines `reducer: {}`. Redux state slices are not registered, causing any state selectors (`state.auth`, `state.transactions`, etc.) to return `undefined`.
4. **Unrendered React Routes**:
   - `client/src/App.jsx` does not declare `<Route>` elements inside `<Routes>`, meaning the client renders an empty page regardless of the URL path.
5. **Commented-Out UI Implementations**:
   - All 8 page components in `client/src/pages/` contain commented-out logic and JSX, rendering only static shell containers without working inputs, buttons, tables, or charts.

---

## 18. Missing Functionality & Code Gaps

### Backend Gaps
1. `server/middleware/authMiddleware.js`: Token extraction from `Authorization` header, `jwt.verify` verification, setting `req.userId`, and handling 401 errors.
2. `server/models/User.js`: Schema properties (`name`, `email`, `password`, `createdAt`, `updatedAt`), pre-save hashing hook, and `matchPassword` method.
3. `server/models/Transaction.js`: Schema properties (`userId`, `type`, `title`, `amount`, `category`, `paymentMethod`, `description`, `transactionDate`), enum constraints, and compound indexes.
4. `server/models/Budget.js`: Schema properties (`userId`, `monthlyBudget`, `categoryBudgets`), and uniqueness index.
5. `server/controllers/authController.js`: Implementation of `signup`, `login`, `getMe`, `updateProfile`, `changePassword`, `getAccountStats`, `generateToken`, and `sanitizeUser`.
6. `server/controllers/transactionController.js`: Implementation of `createTransaction`, `getTransactions` (with query filtering, regex search, pagination, and sorting), `updateTransaction`, and `deleteTransaction`.
7. `server/controllers/budgetController.js`: Implementation of `setBudget`, `getBudget`, and `updateBudget` with upsert logic.
8. `server/controllers/dashboardController.js`: Implementation of `getDashboardSummary` aggregating trends, category breakdown, and summary cards.
9. `server/controllers/reportController.js`: Implementation of `getMonthlyReport` supporting JSON summary and PDFKit document streaming.
10. `server/controllers/aiController.js`: Implementation of `generateInsights` and `predictSpending`.
11. `server/services/financeAnalyzer.js`: Implementation of `currency`, `getMonthRange`, `summarizeTransactions`, and `analyzeFinance`.
12. `server/services/aiService.js`: Implementation of `hasOpenAIKey`, `generateAIInsights` (with OpenAI chat completions and heuristic fallback), and `predictExpense`.

### Frontend Gaps
1. `client/src/redux/store.js`: Registering `auth`, `transactions`, `budget`, and `insights` reducers into `configureStore`.
2. `client/src/redux/slices/authSlice.js`: Implementation of async thunks (`loginUser`, `signupUser`, `refreshUser`, `updateProfileThunk`), reducers (`setUser`, `updateUser`, `logout`), and extraReducers.
3. `client/src/redux/slices/transactionSlice.js`: Implementation of async thunks (`fetchTransactions`, `saveTransaction`, `removeTransactionById`), reducers (`setFilters`, `addTransaction`, etc.), and extraReducers.
4. `client/src/redux/slices/budgetSlice.js`: Implementation of async thunks (`fetchBudget`, `saveBudget`), reducers, and extraReducers.
5. `client/src/redux/slices/insightSlice.js`: Implementation of async thunks (`fetchInsights`, `fetchPrediction`), reducers, and extraReducers.
6. `client/src/App.jsx`: Implementing `ProtectedRoute` guard and defining all public and protected `<Route>` paths.
7. `client/src/components/layout/`: Implementing active links, navigation mapping, and logout dispatch in `Sidebar.jsx`; user details display in `Navbar.jsx`; and `<Outlet />` mounting in `Layout.jsx`.
8. `client/src/pages/`: Implementing complete interactive forms, state hooks, Recharts data bindings, modals, and tables across `Login`, `Signup`, `Dashboard`, `Transactions`, `Budget`, `Reports`, `Insights`, and `Profile`.

---

## 19. Recommended Implementation Priorities

```
+-------------------------------------------------------------------------------+
| PHASE 1: Core Backend Security & Data Models                                 |
| 1. Define complete Mongoose schemas & indexes (User, Transaction, Budget)    |
| 2. Implement bcrypt hashing pre-save hooks and matchPassword in User.js       |
| 3. Implement JWT protect middleware in authMiddleware.js                      |
| 4. Implement authController.js (signup, login, getMe, profile, password)      |
+---------------------------------------+---------------------------------------+
                                        v
+-------------------------------------------------------------------------------+
| PHASE 2: Core Finance Analyzer & Transaction/Budget CRUD                      |
| 1. Implement financeAnalyzer.js (summarizeTransactions, date calculations)    |
| 2. Implement transactionController.js (CRUD, search, filters, pagination)     |
| 3. Implement budgetController.js (getBudget, setBudget upsert)                |
| 4. Implement dashboardController.js (summary analytics)                       |
+---------------------------------------+---------------------------------------+
                                        v
+-------------------------------------------------------------------------------+
| PHASE 3: AI Engine, Prediction & PDF Reporting                                |
| 1. Implement aiService.js (OpenAI integration + heuristic fallback rules)     |
| 2. Implement aiController.js (insights & spending prediction)                 |
| 3. Implement reportController.js (monthly summary + PDFKit streaming)        |
+---------------------------------------+---------------------------------------+
                                        v
+-------------------------------------------------------------------------------+
| PHASE 4: Frontend State Architecture & Routing                                |
| 1. Configure redux/store.js with all slice reducers                           |
| 2. Implement all Redux slice thunks and extraReducers (auth, tx, budget, ai)  |
| 3. Implement ProtectedRoute and complete React Router tree in App.jsx         |
| 4. Implement Layout, Navbar, and Sidebar components                           |
+---------------------------------------+---------------------------------------+
                                        v
+-------------------------------------------------------------------------------+
| PHASE 5: Frontend UI Views & Data Visualization                               |
| 1. Implement Login.jsx & Signup.jsx authentication forms                      |
| 2. Implement Transactions.jsx (filter bar, data table, pagination, modal)    |
| 3. Implement Dashboard.jsx (SummaryCards, Recharts Line/Pie/Bar charts)       |
| 4. Implement Budget.jsx (monthly budget, category limits, progress bars)      |
| 5. Implement Insights.jsx (AI cards, confidence meter, prediction alerts)     |
| 6. Implement Reports.jsx (period picker, metrics, PDF export trigger)        |
| 7. Implement Profile.jsx (user info update, password change, stats)          |
+---------------------------------------+---------------------------------------+
                                        v
+-------------------------------------------------------------------------------+
| PHASE 6: End-to-End Testing & Hardening                                       |
| 1. Validate error handling across all API endpoints                           |
| 2. Write Jest/Supertest backend integration tests                             |
| 3. Write Vitest/Testing Library frontend component tests                      |
| 4. Audit CORS, rate limits, and token expiration handling                     |
+-------------------------------------------------------------------------------+
```

---

## 20. Implementation Status Table

| Area | Component / Module | Type | Status | Current Reality in Codebase |
| :--- | :--- | :--- | :--- | :--- |
| **Server** | `server.js` | Entry Point | **IMPLEMENTED** | Server bootstrapper with DB connection call and port listener |
| **Server** | `app.js` | Configuration | **IMPLEMENTED** | Express app, Helmet, CORS, Rate Limit, JSON parser, route mounting, health check |
| **Server** | `authMiddleware.js` | Middleware | **NOT IMPLEMENTED** | Empty function stub containing only comments; does not authenticate or call `next()` |
| **Server** | `User.js` | Model | **PARTIALLY IMPLEMENTED** | Mongoose model created with empty schema `new mongoose.Schema({})`; fields in comments |
| **Server** | `Transaction.js` | Model | **PARTIALLY IMPLEMENTED** | Mongoose model created with empty schema `new mongoose.Schema({})`; fields in comments |
| **Server** | `Budget.js` | Model | **PARTIALLY IMPLEMENTED** | Mongoose model created with empty schema `new mongoose.Schema({})`; fields in comments |
| **Server** | `authRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `transactionRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `budgetRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `dashboardRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `reportRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `aiRoutes.js` | Route | **IMPLEMENTED** | Router configured with endpoint paths and method mappings |
| **Server** | `authController.js` | Controller | **NOT IMPLEMENTED** | Stubs only (`signup`, `login`, `getMe`, `updateProfile`, `changePassword`, `getAccountStats`) |
| **Server** | `transactionController.js` | Controller | **NOT IMPLEMENTED** | Stubs only (`createTransaction`, `getTransactions`, `updateTransaction`, `deleteTransaction`) |
| **Server** | `budgetController.js` | Controller | **NOT IMPLEMENTED** | Stubs only (`setBudget`, `getBudget`, `updateBudget`) |
| **Server** | `dashboardController.js` | Controller | **NOT IMPLEMENTED** | Stub only (`getDashboardSummary`) |
| **Server** | `reportController.js` | Controller | **NOT IMPLEMENTED** | Stub only (`getMonthlyReport`, `formatCurrency`) |
| **Server** | `aiController.js` | Controller | **NOT IMPLEMENTED** | Stubs only (`generateInsights`, `predictSpending`) |
| **Server** | `financeAnalyzer.js` | Service Engine | **NOT IMPLEMENTED** | Stubs only (`currency`, `getMonthRange`, `summarizeTransactions`, `analyzeFinance`) |
| **Server** | `aiService.js` | Service Engine | **NOT IMPLEMENTED** | Stubs only (`hasOpenAIKey`, `generateAIInsights`, `predictExpense`) |
| **Client** | `vite.config.js` | Build Config | **IMPLEMENTED** | Configured with React plugin and `/api` proxy to `http://localhost:5000` |
| **Client** | `tailwind.config.js` | Style Config | **IMPLEMENTED** | Configured with custom color palette (`primary`, `secondary`, `accent`) |
| **Client** | `api.js` | Service | **IMPLEMENTED** | Axios instance configured with JWT request interceptor and 401 response interceptor |
| **Client** | `authService.js` | Service | **IMPLEMENTED** | API caller functions mapped to all `/api/auth/*` endpoints |
| **Client** | `transactionService.js` | Service | **IMPLEMENTED** | API caller functions mapped to all `/api/transactions/*` endpoints |
| **Client** | `budgetService.js` | Service | **IMPLEMENTED** | API caller functions mapped to all `/api/budget/*` endpoints |
| **Client** | `dashboardService.js` | Service | **IMPLEMENTED** | API caller function mapped to `/api/dashboard/summary` |
| **Client** | `reportService.js` | Service | **IMPLEMENTED** | API caller functions mapped to `/api/reports/monthly` (JSON and Blob PDF) |
| **Client** | `aiService.js` | Service | **IMPLEMENTED** | API caller functions mapped to `/api/ai/insights` and `/api/ai/predict` |
| **Client** | `format.js` | Utility | **IMPLEMENTED** | `formatCurrency` (INR), `formatDate`, `categories` array (12), `paymentMethods` array (6) |
| **Client** | `store.js` | Redux Store | **PARTIALLY IMPLEMENTED** | Store configuration initialized with empty reducer object `reducer: {}` |
| **Client** | `authSlice.js` | Redux Slice | **PARTIALLY IMPLEMENTED** | Initial state exists; thunks, reducers, and extraReducers are empty stubs |
| **Client** | `transactionSlice.js` | Redux Slice | **PARTIALLY IMPLEMENTED** | Initial state exists; thunks, reducers, and extraReducers are empty stubs |
| **Client** | `budgetSlice.js` | Redux Slice | **PARTIALLY IMPLEMENTED** | Initial state exists; thunks, reducers, and extraReducers are empty stubs |
| **Client** | `insightSlice.js` | Redux Slice | **PARTIALLY IMPLEMENTED** | Initial state exists; thunks, reducers, and extraReducers are empty stubs |
| **Client** | `App.jsx` | Routing | **PARTIALLY IMPLEMENTED** | Router shell rendered; `ProtectedRoute` and route elements commented out |
| **Client** | `SummaryCard.jsx` | UI Component | **IMPLEMENTED** | Visual card component supporting custom tone themes (`slate`, `green`, `red`, `blue`) |
| **Client** | `Layout.jsx` | UI Component | **PARTIALLY IMPLEMENTED** | Container layout shell; Navbar, Sidebar, and Outlet bindings commented out |
| **Client** | `Navbar.jsx` | UI Component | **PARTIALLY IMPLEMENTED** | Nav container shell; user state and heading elements commented out |
| **Client** | `Sidebar.jsx` | UI Component | **PARTIALLY IMPLEMENTED** | Aside container shell; navigation items mapping and logout handler commented out |
| **Client** | `Login.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Container card layout; inputs, state, form handlers commented out |
| **Client** | `Signup.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Container card layout; inputs, state, form handlers commented out |
| **Client** | `Dashboard.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Grid layout structure; Recharts charts, cards, and data fetching commented out |
| **Client** | `Transactions.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Table & filter layout; CRUD modal, pagination, and data bindings commented out |
| **Client** | `Budget.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Form & progress layout; category inputs and progress bar logic commented out |
| **Client** | `Reports.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Report grid layout; chart rendering and PDF export trigger commented out |
| **Client** | `Insights.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Insight card layout; AI recommendations and prediction rendering commented out |
| **Client** | `Profile.jsx` | UI Page | **PARTIALLY IMPLEMENTED** | Form layout structure; profile update, password form, and stats commented out |
