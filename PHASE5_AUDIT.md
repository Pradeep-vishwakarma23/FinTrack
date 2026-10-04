# PHASE 5 SYSTEM AUDIT & ARCHITECTURAL BLUEPRINT
**FinTrack — AI-Powered Personal Finance Intelligence System**
**Phase 5: Android Notification Access & Automatic Ingestion Pipeline**

---

## 1. Executive Overview & Current System State

FinTrack has successfully verified Phases 1 through 4:
- **Phase 1**: Automatic file ingestion (CSV/Excel) with normalization, SHA-256 fingerprint duplicate detection, categorization, and staged human review.
- **Phase 2**: Automatic SMS/message text ingestion with deterministic regex parsing, OTP/CVV/PIN redaction, confidence scoring, and staging.
- **Phase 3**: Mobile-first foundation, authentication with hardware-backed SecureStore, real-time KPIs dashboard, and virtualized ledger.
- **Phase 4**: Mobile Detected Transactions Review Center with interactive Staged Review Queue (`[Confirm]`, `[Edit]`, `[Ignore]`, `[Confirm All]`), Batch History, and Privacy explanation banner.

### Current Test Verification Status
- **Mobile Test Suite**: 119/119 tests passing (16 test suites)
- **Backend Test Suite**: 41/41 tests passing (5 test suites)
- **Web Client Test Suite**: 16/16 tests passing (4 test suites)
- **Web Client Production Bundle**: Built with 0 errors (`vite build`)

---

## 2. Mobile Architecture & Native Android Configuration

### 2.1 Current Mobile Tech Stack
- **Framework**: React Native 0.74.5 on Expo SDK 51
- **State Management**: Redux Toolkit (`@reduxjs/toolkit` 1.9.7, `react-redux` 8.1.3)
- **Navigation**: React Navigation 6 (`@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`)
- **HTTP Client**: Axios with JWT Bearer request interceptor and 401 response session-expiry handler
- **Security**: `expo-secure-store` with hardware-backed Keystore/Keyring and in-memory test fallback

### 2.2 Android Configuration (`app.json` & Native Layer)
- **Package Name**: `com.fintrack.mobile`
- **Permissions Configured**: `RECEIVE_BOOT_COMPLETED`, `POST_NOTIFICATIONS`
- **Native Android Project State**:
  - The project operates under Expo Managed / Development Build workflow.
  - No bare `android/` directory was pre-committed; native capabilities are configured via Expo Config Plugins and Android Native Modules (`NotificationListenerService`).
  - **Crucial Requirement**: Android `NotificationListenerService` requires an Android Native/Development Build (`expo run:android` or EAS Build). It cannot run inside generic Expo Go client because `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE` is a privileged system-level Android permission.

---

## 3. Existing Backend Ingestion & Staging Architecture

### 3.1 Backend Models
- **`Transaction` Model (`server/models/Transaction.js`)**:
  - `status`: Enum `['confirmed', 'staged', 'ignored']` (Default `'confirmed'`, staged items have `'staged'`).
  - `source`: Enum `['manual', 'csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms']` -> Will be extended to include `'notification'` and `'android_notification'`.
  - `confidence`: Float `0.0 - 1.0`.
  - `fingerprint`: SHA-256 hash string indexed for fast duplicate lookups.
  - `isDuplicate`: Boolean flag.
  - `importBatchId`: Reference to `ImportBatch`.
- **`ImportBatch` Model (`server/models/ImportBatch.js`)**:
  - `source`: Enum `['csv', 'excel', 'pdf', 'receipt_ocr', 'email', 'sms']` -> Will be extended to include `'notification'` and `'android_notification'`.
  - `status`: Enum `['UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED']`.
  - Metrics tracking: `totalRecords`, `processedRecords`, `confirmedRecords`, `ignoredRecords`, `duplicateRecords`.

### 3.2 Transaction Intelligence Pipeline (`server/services/transactionIntelligence.js`)
- `extractMerchantAndCategory(text, existingMerchant, existingCategory)`: 22+ merchant regex patterns with fallback to 11 keyword categories.
- `generateTransactionFingerprint({ userId, date, amount, merchant, reference, type })`: Deterministic SHA-256 hash payload: `${userId}_${dateStr}_${amount}_${merchant}_${reference}_${type}`.
- `enrichTransactions(transactions, userId, existingFingerprints)`: Annotates records with merchant, category, confidence, and `isDuplicate`.

---

## 4. Phase 5 Architecture: Android Notification Ingestion

### 4.1 Ingestion Flow
```
Android Financial Notification (Push / System Alert)
        ↓
Native Android NotificationListenerService
        ↓
Local Package & Keyword Classification (Bank / UPI / Card vs Social / Chat)
        ↓
On-Device Sensitive Data Sanitization (Zero OTP / PIN / CVV retention)
        ↓
Financial Event Extraction & Normalization
        ↓
Event Fingerprint & Local Deduplication Check
        ↓
POST /api/mobile/events (Authenticated with JWT Bearer token)
        ↓
Backend Mobile Event Controller & Intelligence Pipeline
        ↓
Duplicate Detection (against User's DB Fingerprints)
        ↓
Category Prediction & Confidence Scoring
        ↓
STAGED TRANSACTION (status: 'staged', source: 'notification')
        ↓
Mobile Detected Transactions Review Center
        ↓
User Review: [Confirm] / [Edit] / [Ignore] / [Confirm All]
        ↓
CONFIRMED FINANCIAL LEDGER & DASHBOARD ANALYTICS
```

### 4.2 Local On-Device Filtering Strategy
1. **Package / App Classification**: Checks package names against known financial app signatures (e.g., `com.google.android.apps.nbu.paisa.user` [GPay], `net.one97.paytm` [Paytm], `com.phonepe.app` [PhonePe], `com.sbi.upi`, `com.hdfc.bank`, `com.icici.bank`, `com.axis.bank`, etc.) while also inspecting general notification contents.
2. **Keyword Filtering**: Ensures notification contains strong transactional verbs (`debited`, `spent`, `credited`, `paid to`, `withdrawn`, `INR`, `Rs`, `₹`).
3. **Discards Non-Financial & Promotional Notifications**: Social media (WhatsApp, Instagram), system notifications, and promo messages without explicit currency transaction patterns are discarded immediately on-device.

### 4.3 Mandatory Security & Sensitive Data Sanitization
Before any notification payload is transmitted:
- Regex checks detect and redact or discard any message containing `OTP`, `One Time Password`, `PIN`, `CVV`, `Password`, `Security Code`.
- Account numbers and card numbers are masked to the last 4 digits (`A/c XX1234`).
- **Zero raw notification persistence**: Raw notification strings are never stored on the server and never sent to external LLMs.

---

## 5. Safest Integration Points

1. **Backend Integration**:
   - New dedicated route: `server/routes/mobileRoutes.js` registered at `/api/mobile`.
   - Controller: `server/controllers/mobileEventsController.js` handling `POST /api/mobile/events` and `GET /api/mobile/events/stats`.
   - Updates to `Transaction.js` and `ImportBatch.js` to support `'notification'` source enum.
2. **Mobile Native & Service Integration**:
   - Native Android module files in `mobile/android/` / Config Plugin:
     - `FinTrackNotificationListenerService.java` (extends `NotificationListenerService`)
     - `FinTrackNotificationModule.java` (React Native bridge exposing permission checks, intent launcher, and event emitter)
     - `FinTrackNotificationPackage.java` (ReactPackage registration)
   - JavaScript service wrapper: `mobile/src/services/notificationListenerService.js`.
   - Local on-device sanitizer & normalizer: `mobile/src/services/notificationFilter.js`.
   - Redux Slice: `mobile/src/store/slices/notificationSlice.js` managing connected status, detection counters, and live history.
   - Screen: `mobile/src/screens/notifications/ConnectedSourcesScreen.jsx`.
   - Navigation: Wire Connected Sources into `ProfileScreen` and `AppNavigator`.
   - Staged Review: Ensure `StagedReviewScreen` and `StagedTransactionCard` display `🔔 Notification` badge seamlessly.

---

## 6. Files to be Created & Modified

### Files to Create:
1. `PHASE5_AUDIT.md` (This document)
2. `server/routes/mobileRoutes.js`
3. `server/controllers/mobileEventsController.js`
4. `server/tests/mobile_events.test.js`
5. `mobile/android/app/src/main/java/com/fintrack/mobile/FinTrackNotificationListenerService.java`
6. `mobile/android/app/src/main/java/com/fintrack/mobile/FinTrackNotificationModule.java`
7. `mobile/android/app/src/main/java/com/fintrack/mobile/FinTrackNotificationPackage.java`
8. `mobile/src/services/notificationFilter.js`
9. `mobile/src/services/notificationListenerService.js`
10. `mobile/src/store/slices/notificationSlice.js`
11. `mobile/src/screens/notifications/ConnectedSourcesScreen.jsx`
12. `mobile/src/components/notifications/NotificationStatusCard.jsx`
13. `mobile/src/components/notifications/DetectionHistoryCard.jsx`
14. `mobile/src/components/notifications/PermissionExplanationModal.jsx`
15. `mobile/tests/notificationFilter.test.js`
16. `mobile/tests/notificationService.test.js`
17. `mobile/tests/notificationSlice.test.js`
18. `mobile/tests/connectedSources_workflow.test.js`
19. `PHASE5_IMPLEMENTATION_REPORT.md`

### Files to Modify:
1. `server/models/Transaction.js` (add `'notification'` / `'android_notification'` to source enum)
2. `server/models/ImportBatch.js` (add `'notification'` / `'android_notification'` to source enum)
3. `server/app.js` (register `/api/mobile` router)
4. `mobile/src/store/index.js` (register `notificationReducer`)
5. `mobile/src/navigation/AppNavigator.jsx` (add `ConnectedSources` stack screen)
6. `mobile/src/screens/profile/ProfileScreen.jsx` (add Connected Sources indicator & navigation)
7. `mobile/src/components/imports/StagedTransactionCard.jsx` (display `🔔 Notification` badge)
8. `mobile/src/components/transactions/TransactionCard.jsx` (display notification source badge in ledger)
9. `mobile/README.md` (document Phase 5 native build requirements and verification)

---

## 7. Audit Sign-Off

The audit is complete and the integration roadmap is strictly preserved. We will now proceed with the step-by-step implementation of Phase 5.
