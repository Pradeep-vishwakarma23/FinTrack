# FinTrack Mobile — AI-Powered Personal Finance Intelligence

**FinTrack Mobile** is the mobile-first companion client for the FinTrack financial intelligence platform. Built with **React Native (0.74+) and Expo**, it connects directly to the FinTrack Express.js backend to provide automated transaction detection, intelligent financial analytics, and grounded AI insights.

---

## 1. Implemented Features

### Phase 1: Mobile Foundation & Authentication
- **Modern Glassmorphic Dark UI**: High-contrast slate design system (`#0B0F17`, `#131B2B`, `#6366F1`, `#06B6D4`) matching the web client.
- **5-Tab Navigation Shell**:
  - `Home`: Financial dashboard, KPI summaries, category visualizer, spending trends, and detected transaction alerts.
  - `Ledger`: Transaction ledger, search, multi-factor filters, and manual entry.
  - `Insights`: Financial health and AI recommendations placeholder.
  - `Goals`: Savings milestones and What-If simulator placeholder.
  - `Profile`: User details, security status, and account actions.
- **JWT Authentication Flow**:
  - Sign in with email and password (`POST /api/auth/login`).
  - Sign up with name, email, and password validation (`POST /api/auth/signup`).
  - Automatic session restoration on launch via `GET /api/auth/me`.
  - Sign out with secure credential wiping.
  - 401 response interceptor with automatic session expiration handling.
- **Hardware-Backed SecureStore**:
  - `expo-secure-store` (Android `EncryptedSharedPreferences` / iOS Keychain) with `AsyncStorage` fallback for tests.

### Phase 2: Mobile Dashboard & Financial Summary
- **4 Primary Financial KPIs**:
  - **Monthly Income**: Real recorded earnings with `+` status badge.
  - **Monthly Expenses**: Real recorded spending with `-` status badge.
  - **Net Savings**: Deterministic difference (`Income - Expenses`) with glow container.
  - **Savings Rate**: Safe percentage formula with zero-income divide-by-zero protection (`0%` default).
- **Pending Detected Transactions Alert**:
  - Prominent alert banner displaying count of intercepted transactions waiting for verification (`⚡ N Items Detected`).
- **Grounded Financial Alerts**:
  - Real-time alerts based on actual metrics: Monthly budget overrun, 80%+ budget utilization warning, negative cashflow, and healthy savings milestone.
- **Category Spending Visualization**:
  - Interactive breakdown showing category names, formatted amounts (INR ₹), percentage share, and colored progress tracks.
- **Monthly Spending Trend**:
  - Responsive timeline bar comparison of inflow vs outflow across recent months.
- **Budget Progress & Category Limits**:
  - Overall monthly budget usage vs remaining balance, plus category-specific limits (Food, Shopping, Bills) with warning tints.
  - Clean empty state when no budgets are configured.
- **Recent Transactions Ledger Preview**:
  - Top 5 confirmed transactions displaying merchant, category, formatted date, amount with sign/color, payment method, and source badge (`📱 Notification`, `💬 SMS`, `📄 CSV`, `✏️ Manual`).
- **Pull-To-Refresh & Skeleton Loading**:
  - Native `RefreshControl` updating live metrics on demand with loading skeletons and error banners with retry action.

### Phase 3: Mobile Transactions & Intelligent Ledger
- **Virtualized Ledger with Infinite Scrolling**:
  - High-performance `FlatList` with pagination, automatic onEndReached fetching, deduplicated item appending, and footer loading indicators.
- **Search & Debouncing**:
  - Multi-field search querying merchant names, categories, titles, and notes with 350ms debouncing and one-tap clear button.
- **Multi-Factor Filter Pills**:
  - **Type Filter**: All, Expense, Income.
  - **Category Filter**: All, Food, Shopping, Bills, Transport, Entertainment, Healthcare, Education, Salary, Rent, Investments, Other.
  - **Source Filter**: All, 📱 Notification, 💬 SMS, ✉️ Email, 📄 CSV, 📊 Excel, ✏️ Manual.
  - **Sort Options**: Newest (`latest`), Oldest (`oldest`), Highest Amount (`amount_desc`), Lowest Amount (`amount_asc`).
  - Active filter count indicator and one-tap `Reset ✕` pill.
- **Filtered Compact Summary Bar**:
  - Top summary bar displaying dynamic inflow, outflow, and net balance calculated for the active search/filter subset.
- **Transaction Card Visuals**:
  - Clean cards showing Merchant name, formatted amount (`+ ₹500` in emerald / `- ₹480` in rose), category, formatted date, payment method, source indicator, and AI confidence percentage badge.
- **Transaction Details Modal**:
  - Slide-up modal displaying full metadata, timestamps, payment method, external transaction references, AI extraction reasoning, duplicate warning flags, and `[Edit]` / `[Delete]` actions.
- **Manual Add Transaction Modal (`+ Add Transaction`)**:
  - Modal with type selector toggle (`Expense ↑` / `Income ↓`), amount input with validation, merchant/title input, category pill picker, payment method selector, notes, and backend duplicate detection warning.
- **Edit & Delete Actions**:
  - Instant in-place transaction editing and deletion with local state updates.
- **Empty & Error States**:
  - Contextual empty states for empty ledger vs zero filter results with quick action buttons.

---

## 2. Project Structure

```
mobile/
├── assets/                    # App icons & splash images
├── src/
│   ├── config/
│   │   └── env.js             # Environment variables & API endpoints
│   ├── theme/
│   │   ├── colors.js          # Dark palette & semantic colors
│   │   ├── typography.js      # Font scales & weights
│   │   ├── spacing.js         # Spacing, border radius, shadows
│   │   └── index.js           # Consolidated theme export
│   ├── services/
│   │   ├── api.js             # Axios client with JWT interceptors & 401 handler
│   │   ├── secureStore.js     # Hardware-backed SecureStore with AsyncStorage fallback
│   │   ├── authService.js     # Auth API requests (login, signup, getMe, restore)
│   │   ├── dashboardService.js# Dashboard summary & budget API service
│   │   └── transactionService.js# Transaction CRUD, filter, & search API service
│   ├── store/
│   │   ├── index.js           # Redux Toolkit store configuration
│   │   └── slices/
│   │       ├── authSlice.js   # Auth state, session restoration & thunks
│   │       ├── dashboardSlice.js # Dashboard state, KPI formulas & alert engine
│   │       └── transactionSlice.js # Transaction ledger state, pagination & filters
│   ├── navigation/
│   │   ├── RootNavigator.jsx  # Root container handling Splash/Auth/App switching
│   │   ├── AuthNavigator.jsx  # Native stack for Login & Signup
│   │   └── AppNavigator.jsx   # 5-Tab Bottom Navigator (Home, Ledger, Insights, Goals, Profile)
│   ├── components/            # Reusable design system components
│   │   ├── Text.jsx           # Theme-aware typography
│   │   ├── Button.jsx         # Buttons with loading, variants, and disabled states
│   │   ├── Input.jsx          # Inputs with password show/hide & validation errors
│   │   ├── Card.jsx           # Glassmorphic containers with border glow
│   │   ├── Container.jsx      # SafeArea & KeyboardAvoidingView container
│   │   ├── Header.jsx         # Navigation top header
│   │   ├── ErrorBanner.jsx    # Dismissable error/warning alert banner
│   │   ├── LoadingIndicator.jsx# Branded loading spinner
│   │   ├── Badge.jsx          # Status and confidence score badges
│   │   ├── dashboard/         # Modular dashboard components
│   │   │   ├── FinancialSummaryCards.jsx
│   │   │   ├── PendingDetectedBanner.jsx
│   │   │   ├── FinancialAlertsSection.jsx
│   │   │   ├── CategorySpendingSection.jsx
│   │   │   ├── SpendingTrendSection.jsx
│   │   │   ├── BudgetProgressSection.jsx
│   │   │   ├── RecentTransactionsSection.jsx
│   │   │   └── DashboardSkeleton.jsx
│   │   └── transactions/      # Modular transaction components
│   │       ├── TransactionCard.jsx
│   │       ├── TransactionSummaryBar.jsx
│   │       ├── TransactionSearchBar.jsx
│   │       ├── TransactionFilterBar.jsx
│   │       ├── StagedAlertBanner.jsx
│   │       ├── TransactionDetailModal.jsx
│   │       ├── AddTransactionModal.jsx
│   │       └── EditTransactionModal.jsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.jsx # Animated startup screen during session check
│   │   │   ├── LoginScreen.jsx  # Sign in screen with validation & demo fill
│   │   │   └── SignupScreen.jsx # Registration screen
│   │   ├── dashboard/
│   │   │   └── HomeScreen.jsx   # Active Financial Dashboard
│   │   ├── transactions/
│   │   │   └── TransactionsScreen.jsx # Active Transactions Ledger
│   │   ├── insights/
│   │   │   └── InsightsPlaceholderScreen.jsx
│   │   ├── goals/
│   │   │   └── GoalsPlaceholderScreen.jsx
│   │   └── profile/
│   │       └── ProfileScreen.jsx# User account info & logout
│   └── utils/
│       ├── validators.js      # Email, password, and form validation functions
│       └── formatters.js      # Currency (INR), date, and account masking
├── tests/
│   ├── authSlice.test.js      # Redux auth slice unit tests
│   ├── components.test.js     # Theme tokens & design system tests
│   ├── dashboardSlice.test.js # Dashboard state & alert engine tests
│   ├── dashboardService.test.js # Dashboard API service tests
│   ├── dashboard_calculations.test.js # Math integrity & divide-by-zero guards
│   ├── formatters.test.js     # Currency & date formatters tests
│   ├── mobile_auth_e2e.test.js# Live API integration tests
│   ├── secureStore.test.js    # Secure store tests
│   ├── transactionSlice.test.js # Transaction state, pagination, and modal tests
│   ├── transactionService.test.js # Transaction service & query building tests
│   ├── transaction_components.test.js # Source badges & ledger formatting tests
│   └── validators.test.js     # Validation utility tests
├── App.jsx                    # Root React Native component
├── index.js                   # Expo root registration
├── app.json                   # Expo app manifest
├── babel.config.js            # Babel preset configuration
├── jest.config.cjs            # Jest test configuration
├── jest.setup.js              # Mock setup for React Native & SecureStore
└── package.json
```

---

## 3. Installation & Setup

### Prerequisites
- Node.js >= 18 (Tested on v24.15)
- npm >= 9 (Tested on v11.12)
- FinTrack Backend running on `http://localhost:5000`

### Step 1: Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### Step 2: Start Development Server
```bash
# Start Expo Metro Bundler
npx expo start

# Or start directly for Android
npx expo start --android

# Or start for Web preview
npx expo start --web
```

---

## 4. Backend Connection Guide

| Environment | Backend URL | Notes |
| :--- | :--- | :--- |
| **Android Emulator** | `http://10.0.2.2:5000/api` | Default Android localhost alias |
| **iOS Simulator** | `http://localhost:5000/api` | Standard localhost |
| **Physical Device (Expo Go)** | `http://<YOUR_PC_LAN_IP>:5000/api` | Use the in-app "Server" settings on the Login screen to set your PC's IP address (e.g. `http://192.168.1.15:5000/api`) |

---

## 5. Running Tests

```bash
cd mobile
npx jest --config jest.config.cjs --runInBand
```

**Test Suite Coverage (87 tests, 12 suites)**:
- `transactionSlice.test.js`: Redux transaction state transitions, pagination appending, filter reducers, and CRUD lifecycle
- `transactionService.test.js`: API query string construction, serialization, and CRUD request endpoints
- `transaction_components.test.js`: Source indicators, AI confidence badges, and ledger formatting
- `dashboardSlice.test.js`: Redux dashboard state transitions, metric population, and data-grounded alert computation
- `dashboard_calculations.test.js`: Mathematical integrity, division by zero guards, and boundary cases
- `dashboardService.test.js`: Summary, budget, and transaction API requests
- `validators.test.js`: Form validations (email, password >=6 chars, name, password match)
- `formatters.test.js`: Currency (INR ₹), date formatting, account masking, confidence colors
- `authSlice.test.js`: Redux auth state transitions, session restoration, and token expiration
- `secureStore.test.js`: Hardware-backed SecureStore operations and auth cleanup
- `components.test.js`: Design tokens and environment configuration
- `mobile_auth_e2e.test.js`: Live API communication with backend auth endpoints

### Phase 4: Mobile Imports & Intelligent Staged Review Pipeline
- **Connected Ingestion Sources**:
  - **CSV Statement Ingestion**: Document picker picking `.csv` files and posting to `POST /api/imports/csv`.
  - **Excel Spreadsheet Ingestion**: Native `.xlsx` / `.xls` spreadsheet upload posting to `POST /api/imports/excel`.
  - **SMS / Message Text Ingestion**: Safe message text paste modal and synthetic Indian bank SMS demo generator (`POST /api/imports/sms`).
- **Detected Transactions Review Center (`StagedReviewScreen`)**:
  - **Central Staging Queue**: Protected queue displaying intercepted transactions awaiting verification before entering the primary financial ledger.
  - **Staged vs Confirmed Distinction**: Staged items are isolated with `status: 'staged'` and do not impact ledger balance or budget analytics until confirmed.
  - **AI Confidence Breakdown**: Real-time confidence score visualization (High Confidence ≥85%, Medium Confidence 60-84%, Review Recommended <60%).
  - **Duplicate Detection Alerts**: Flagged duplicate warnings (`⚠️ Possible Duplicate Detected`) when a similar transaction exists in the database or batch.
  - **Individual Transaction Actions**:
    - `[Confirm]`: Commits single staged transaction into primary ledger, recalculates balance, and updates dashboard metrics.
    - `[Edit]`: Opens `StagedEditModal` allowing user to refine merchant, amount, category, type, and date before confirming without creating duplicates.
    - `[Ignore]`: Prompts confirmation and marks transaction ignored without deleting historical batch records.
  - **Bulk Confirmation (`[Confirm All]`)**:
    - Executes bulk confirmation endpoint (`POST /api/imports/:id/confirm-all`) with confirmation prompt.
  - **Queue Filters**: Filter tabs for `All`, `High Conf`, `Review Req`, and `Duplicates`.
  - **Empty "All Caught Up" State**: Clear visual confirmation when all staged transactions are verified.
- **Import Batch History**:
  - Historical batch list showing source badges (`📄 CSV`, `📊 Excel`, `💬 SMS`), date, filename, detected count, confirmed count, ignored count, and pending count with batch discard action.
- **Privacy & Zero-OTP Guarantee Banner**:
  - Educational privacy banner explaining that transaction data is parsed with deterministic regex patterns, and sensitive OTPs or auth tokens are filtered out on ingestion and never stored.

---

## 2. Project Structure

```
mobile/
├── assets/                    # App icons & splash images
├── src/
│   ├── config/
│   │   └── env.js             # Environment variables & API endpoints
│   ├── theme/
│   │   ├── colors.js          # Dark palette & semantic colors
│   │   ├── typography.js      # Font scales & weights
│   │   ├── spacing.js         # Spacing, border radius, shadows
│   │   └── index.js           # Consolidated theme export
│   ├── services/
│   │   ├── api.js             # Axios client with JWT interceptors & 401 handler
│   │   ├── secureStore.js     # Hardware-backed SecureStore with AsyncStorage fallback
│   │   ├── authService.js     # Auth API requests (login, signup, getMe, restore)
│   │   ├── dashboardService.js# Dashboard summary & budget API service
│   │   ├── transactionService.js# Transaction CRUD, filter, & search API service
│   │   └── importService.js   # CSV, Excel, SMS ingestion & staging review API service
│   ├── store/
│   │   ├── index.js           # Redux Toolkit store configuration
│   │   └── slices/
│   │       ├── authSlice.js   # Auth state, session restoration & thunks
│   │       ├── dashboardSlice.js # Dashboard state, KPI formulas & alert engine
│   │       ├── transactionSlice.js # Transaction ledger state, pagination & filters
│   │       └── importSlice.js # Import batches, staged queue & confirm thunks
│   ├── navigation/
│   │   ├── RootNavigator.jsx  # Root container handling Splash/Auth/App switching
│   │   ├── AuthNavigator.jsx  # Native stack for Login & Signup
│   │   └── AppNavigator.jsx   # Main Navigation Stack (MainTabs, Imports, StagedReview)
│   ├── components/            # Reusable design system components
│   │   ├── Text.jsx           # Theme-aware typography
│   │   ├── Button.jsx         # Buttons with loading, variants, and disabled states
│   │   ├── Input.jsx          # Inputs with password show/hide & validation errors
│   │   ├── Card.jsx           # Glassmorphic containers with border glow
│   │   ├── Container.jsx      # SafeArea & KeyboardAvoidingView container
│   │   ├── Header.jsx         # Navigation top header
│   │   ├── ErrorBanner.jsx    # Dismissable error/warning alert banner
│   │   ├── LoadingIndicator.jsx# Branded loading spinner
│   │   ├── Badge.jsx          # Status and confidence score badges
│   │   ├── dashboard/         # Modular dashboard components
│   │   │   ├── FinancialSummaryCards.jsx
│   │   │   ├── PendingDetectedBanner.jsx
│   │   │   ├── FinancialAlertsSection.jsx
│   │   │   ├── CategorySpendingSection.jsx
│   │   │   ├── SpendingTrendSection.jsx
│   │   │   ├── BudgetProgressSection.jsx
│   │   │   ├── RecentTransactionsSection.jsx
│   │   │   └── DashboardSkeleton.jsx
│   │   ├── transactions/      # Modular transaction components
│   │   │   ├── TransactionCard.jsx
│   │   │   ├── TransactionSummaryBar.jsx
│   │   │   ├── TransactionSearchBar.jsx
│   │   │   ├── TransactionFilterBar.jsx
│   │   │   ├── StagedAlertBanner.jsx
│   │   │   ├── TransactionDetailModal.jsx
│   │   │   ├── AddTransactionModal.jsx
│   │   │   └── EditTransactionModal.jsx
│   │   └── imports/           # Modular import & review components
│   │       ├── ImportSourceSelector.jsx
│   │       ├── SMSPasteModal.jsx
│   │       ├── BatchHistoryCard.jsx
│   │       ├── StagedTransactionCard.jsx
│   │       ├── StagedEditModal.jsx
│   │       ├── PrivacyBanner.jsx
│   │       └── ImportProgressModal.jsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── SplashScreen.jsx # Animated startup screen during session check
│   │   │   ├── LoginScreen.jsx  # Sign in screen with validation & demo fill
│   │   │   └── SignupScreen.jsx # Registration screen
│   │   ├── dashboard/
│   │   │   └── HomeScreen.jsx   # Active Financial Dashboard
│   │   ├── transactions/
│   │   │   └── TransactionsScreen.jsx # Active Transactions Ledger
│   │   ├── imports/
│   │   │   ├── ImportsScreen.jsx # Import portal & batch history
│   │   │   └── StagedReviewScreen.jsx # Detected transactions review queue
│   │   ├── insights/
│   │   │   └── InsightsPlaceholderScreen.jsx
│   │   ├── goals/
│   │   │   └── GoalsPlaceholderScreen.jsx
│   │   └── profile/
│   │       └── ProfileScreen.jsx# User account info, imports shortcut & logout
│   └── utils/
│       ├── validators.js      # Email, password, and form validation functions
│       └── formatters.js      # Currency (INR), date, and account masking
├── tests/
│   ├── authSlice.test.js      # Redux auth slice unit tests
│   ├── components.test.js     # Theme tokens & design system tests
│   ├── dashboardSlice.test.js # Dashboard state & alert engine tests
│   ├── dashboardService.test.js # Dashboard API service tests
│   ├── dashboard_calculations.test.js # Math integrity & divide-by-zero guards
│   ├── formatters.test.js     # Currency & date formatters tests
│   ├── importService.test.js  # CSV, Excel, SMS, and staged review API service tests
│   ├── importSlice.test.js    # Redux import slice reducers & thunk tests
│   ├── import_components.test.js # Import UI components & modal interactions
│   ├── import_workflow.test.js# Import screen rendering & staging queue tests
│   ├── mobile_auth_e2e.test.js# Live API integration tests
│   ├── secureStore.test.js    # Secure store tests
│   ├── transactionSlice.test.js # Transaction state, pagination, and modal tests
│   ├── transactionService.test.js # Transaction service & query building tests
│   ├── transaction_components.test.js # Source badges & ledger formatting tests
│   └── validators.test.js     # Validation utility tests
├── App.jsx                    # Root React Native component
├── index.js                   # Expo root registration
├── app.json                   # Expo app manifest
├── babel.config.js            # Babel preset configuration
├── jest.config.cjs            # Jest test configuration
├── jest.setup.js              # Mock setup for React Native & SecureStore
└── package.json
```

---

## 3. Installation & Setup

### Prerequisites
- Node.js >= 18 (Tested on v24.15)
- npm >= 9 (Tested on v11.12)
- FinTrack Backend running on `http://localhost:5000`

### Step 1: Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### Step 2: Start Development Server
```bash
# Start Expo Metro Bundler
npx expo start

# Or start directly for Android
npx expo start --android

# Or start for Web preview
npx expo start --web
```

---

## 4. Backend Connection Guide

| Environment | Backend URL | Notes |
| :--- | :--- | :--- |
| **Android Emulator** | `http://10.0.2.2:5000/api` | Default Android localhost alias |
| **iOS Simulator** | `http://localhost:5000/api` | Standard localhost |
| **Physical Device (Expo Go)** | `http://<YOUR_PC_LAN_IP>:5000/api` | Use the in-app "Server" settings on the Login screen to set your PC's IP address (e.g. `http://192.168.1.15:5000/api`) |

---

## 5. Running Tests

```bash
cd mobile
npx jest --config jest.config.cjs --runInBand
```

**Test Suite Coverage (119 tests, 16 suites)**:
- `importService.test.js`: CSV, Excel, SMS, and Staged review API endpoints
- `importSlice.test.js`: Import batch management, staged queue reducers, and thunk state lifecycle
- `import_components.test.js`: Staged transaction cards, duplicate warnings, confidence scores, and modals
- `import_workflow.test.js`: End-to-end import screens and review queue workflow
- `transactionSlice.test.js`: Redux transaction state transitions, pagination appending, and filter reducers
- `transactionService.test.js`: API query string construction and CRUD request endpoints
- `transaction_components.test.js`: Source indicators, AI confidence badges, and ledger formatting
- `dashboardSlice.test.js`: Redux dashboard state transitions and alert computation
- `dashboard_calculations.test.js`: Mathematical integrity and division by zero guards
- `dashboardService.test.js`: Summary, budget, and transaction API requests
- `validators.test.js`: Form validations (email, password >=6 chars, name)
- `formatters.test.js`: Currency (INR ₹), date formatting, account masking
### Phase 5: Android Notification Access & Automatic Financial Ingestion
- **Native Android NotificationListenerService Bridge**:
  - `FinTrackNotificationListenerService.java`: Extends Android `NotificationListenerService` to detect financial push notifications at the native OS layer.
  - Declares `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` in `AndroidManifest.xml`.
  - Native `FinTrackNotificationModule.java` exposing `isPermissionGranted()`, `openNotificationSettings()`, and event emitter.
  - **Build Requirement**: Requires Android Native / Prebuild APK (`npx expo run:android`). Not compatible with basic Expo Go sandboxed runtime.
- **On-Device Local Notification Filtering & Zero-OTP Sanitization**:
  - `notificationFilter.js`: Client-side defense-in-depth executing before any network transmission.
  - **Zero-OTP Guarantee**: Instantly detects and discards OTPs, PINs, CVVs, passwords, verification codes, and secret tokens on-device. Never transmits or logs raw notification text.
  - **Financial Relevancy Classification**: Filters out non-financial apps (WhatsApp, Instagram, Telegram) lacking explicit financial transaction verbs.
  - **Deterministic Event Fingerprinting**: Hashes `merchant`, `amount`, `type`, `date`, and `package` to discard duplicate push notifications before backend calls.
- **Connected Sources & Detection History Screen (`ConnectedSourcesScreen`)**:
  - **Real-Time Connection Status**: Visual status card (`● Connected` in emerald / `○ Not Connected` in rose) with `[Enable Notification Detection]` / `[Disable Notification Detection]`.
  - **Permission Explanation Flow**: Informative modal explaining on-device filtering and privacy guarantees before launching system settings.
  - **Live Detection Metrics**: Displays notifications processed, financial events detected, duplicates ignored, and sensitive OTPs discarded.
  - **Developer Testing Sandbox**: Integrated triggers (`Test Debit Notification`, `Test Salary Income`, `Test Sensitive OTP Discard`) for verifying on-device sanitization and staging.
- **Review Center & Dashboard Integration**:
  - Staged notification transactions display `🔔 NOTIFICATION` badge in `StagedReviewScreen`.
  - Staged transactions are included in Dashboard `Pending Detected Transactions` counter without affecting confirmed ledger totals until user clicks `[Confirm]`.

---

## 2. Project Structure

```
mobile/
├── android/                   # Native Android Project
│   └── app/src/main/java/com/fintrack/mobile/notifications/
│       ├── FinTrackNotificationListenerService.java
│       ├── FinTrackNotificationModule.java
│       └── FinTrackNotificationPackage.java
├── src/
│   ├── config/
│   │   └── env.js             # Environment variables & API endpoints
│   ├── theme/
│   │   ├── colors.js          # Dark palette & semantic colors
│   │   ├── typography.js      # Font scales & weights
│   │   ├── spacing.js         # Spacing, border radius, shadows
│   │   └── index.js           # Consolidated theme export
│   ├── services/
│   │   ├── api.js             # Axios client with JWT interceptors & 401 handler
│   │   ├── secureStore.js     # Hardware-backed SecureStore with AsyncStorage fallback
│   │   ├── authService.js     # Auth API requests (login, signup, getMe, restore)
│   │   ├── dashboardService.js# Dashboard summary & budget API service
│   │   ├── transactionService.js# Transaction CRUD, filter, & search API service
│   │   ├── importService.js   # CSV, Excel, SMS ingestion & staging review API service
│   │   ├── notificationFilter.js # On-device zero-OTP sanitization & regex parser
│   │   └── notificationListenerService.js # Native Android listener bridge & stats API
│   ├── store/
│   │   ├── index.js           # Redux store config (auth, dashboard, transaction, import, notification)
│   │   └── slices/
│   │       ├── authSlice.js
│   │       ├── dashboardSlice.js
│   │       ├── transactionSlice.js
│   │       ├── importSlice.js
│   │       └── notificationSlice.js # Listener status, ingestion stats & thunks
│   ├── navigation/
│   │   ├── RootNavigator.jsx
│   │   ├── AuthNavigator.jsx
│   │   └── AppNavigator.jsx   # Main Navigation Stack (MainTabs, Imports, StagedReview, ConnectedSources)
│   ├── components/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── imports/
│   │   └── notifications/     # Modular notification & connected sources cards
│   │       ├── NotificationStatusCard.jsx
│   │       ├── DetectionHistoryCard.jsx
│   │       └── PermissionExplanationModal.jsx
│   ├── screens/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── imports/
│   │   ├── notifications/
│   │   │   └── ConnectedSourcesScreen.jsx # Connected sources & notification manager
│   │   └── profile/
│   │       └── ProfileScreen.jsx# User account info, imports & connected sources shortcuts
│   └── utils/
│       ├── validators.js
│       └── formatters.js
├── tests/                     # 20 Test Suites / 145 Unit & Integration Tests
│   ├── notificationFilter.test.js # On-device zero-OTP sanitization & regex tests
│   ├── notificationService.test.js# Notification listener API & bridge tests
│   ├── notificationSlice.test.js  # Redux notification slice state & thunk tests
│   ├── connectedSources_workflow.test.js # Connected sources UI & simulation tests
│   ├── importService.test.js
│   ├── importSlice.test.js
│   ├── import_components.test.js
│   ├── import_workflow.test.js
│   ├── transactionSlice.test.js
│   ├── transactionService.test.js
│   ├── transaction_components.test.js
│   ├── dashboardSlice.test.js
│   ├── dashboard_calculations.test.js
│   ├── dashboardService.test.js
│   ├── validators.test.js
│   ├── formatters.test.js
│   ├── authSlice.test.js
│   ├── secureStore.test.js
│   ├── components.test.js
│   └── mobile_auth_e2e.test.js
├── App.jsx
├── index.js
├── app.json
├── babel.config.js
├── jest.config.cjs
├── jest.setup.js
└── package.json
```

---

## 3. Installation & Android Native Build

### Prerequisites
- Node.js >= 18 (Tested on v24.15)
- Android SDK & JDK 17 (for Native Android builds)
- FinTrack Backend running on `http://localhost:5000`

### Step 1: Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### Step 2: Native Android Build (Required for Real Notification Access)
```bash
# Generate native android/ project with prebuild
npx expo prebuild --platform android

# Run on connected Android device or emulator
npx expo run:android
```

> **Note on Expo Go**: Android `NotificationListenerService` requires native OS-level service binding declared in `AndroidManifest.xml`. Standard Expo Go does not support custom native services. Use `npx expo run:android` or the built-in synthetic notification sandbox in `ConnectedSourcesScreen` for development/testing.

---

## 4. Running Tests

```bash
cd mobile
npm test
```

**Test Suite Coverage (145 tests, 20 suites — 100% Passing)**:
- `notificationFilter.test.js`: On-device zero-OTP discard, PII masking, amount & merchant extraction, deterministic fingerprint deduplication
- `notificationService.test.js`: Native listener bridge, mock permission toggling, API submission
- `notificationSlice.test.js`: Redux notification slice state, permissions, ingestion thunks, local counter increments
- `connectedSources_workflow.test.js`: Connected sources screen rendering, permission modal, developer test triggers
- `importService.test.js`: CSV, Excel, SMS, and Staged review API endpoints
- `importSlice.test.js`: Import batch management, staged queue reducers, and thunk lifecycle
- `import_components.test.js`: Staged transaction cards, duplicate warnings, confidence scores
- `import_workflow.test.js`: End-to-end import screens and review queue workflow
- `transactionSlice.test.js`: Redux transaction state transitions, pagination, and filter reducers
- `transactionService.test.js`: API query string construction and CRUD request endpoints
- `transaction_components.test.js`: Source indicators, AI confidence badges, and ledger formatting
- `dashboardSlice.test.js`: Redux dashboard state transitions and alert computation
- `dashboard_calculations.test.js`: Mathematical integrity and division by zero guards
- `dashboardService.test.js`: Summary, budget, and transaction API requests
- `validators.test.js`: Form validations
- `formatters.test.js`: Currency (INR ₹), date formatting, account masking
- `authSlice.test.js`: Redux auth state transitions and session restoration
- `secureStore.test.js`: Hardware-backed SecureStore operations
- `components.test.js`: Design tokens and environment configuration
- `mobile_auth_e2e.test.js`: Live API communication with backend auth endpoints
