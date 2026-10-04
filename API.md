# FinTrack API Specification

Base URL: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register new user | `{ name, email, password }` -> `{ success, token, user }` |
| `POST` | `/auth/login` | Login user | `{ email, password }` -> `{ success, token, user }` |
| `GET` | `/auth/me` | Fetch authenticated profile | Header: `Authorization: Bearer <token>` |
| `PUT` | `/auth/profile` | Update profile information | `{ name, email, currency }` |

---

## 2. Ingestion & Staging (`/api/imports`)

All import endpoints require `Authorization: Bearer <token>`.

### Ingestion Endpoints

#### `POST /api/imports/csv`
- Content-Type: `multipart/form-data`
- Body: `file` (.csv statement)
- Response: `{ success, message, batch, stagedCount }`

#### `POST /api/imports/excel`
- Content-Type: `multipart/form-data`
- Body: `file` (.xlsx or .xls statement)
- Response: `{ success, message, batch, stagedCount }`

#### `POST /api/imports/sms`
- Content-Type: `application/json` or `multipart/form-data`
- Body (JSON):
  ```json
  {
    "messages": [
      {
        "text": "UPI payment of Rs.480 to SWIGGY on 26-09-2026 was successful. Ref: UPI48192019",
        "date": "2026-09-26T12:30:00Z"
      }
    ],
    "fileName": "Optional custom batch name"
  }
  ```
- Or Body (Single Text / Multiple lines):
  ```json
  {
    "text": "UPI payment of Rs.480 to SWIGGY\nINR 1,250 debited for AMAZON"
  }
  ```
- Response: `{ success, message, batch, stagedCount, metrics }`

### Staged Review & Batch Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/imports` | List user's import batch history |
| `GET` | `/imports/:id` | Get metadata for a specific batch |
| `GET` | `/imports/:id/transactions` | Get staged transactions for review |
| `PATCH`| `/imports/transactions/:id` | Update staged transaction fields (`merchant`, `category`, `amount`, `type`, `date`) |
| `POST` | `/imports/transactions/:id/confirm` | Confirm single staged transaction into primary ledger |
| `POST` | `/imports/transactions/:id/ignore` | Mark transaction as ignored |
| `POST` | `/imports/:id/confirm-all` | Bulk confirm all staged transactions in a batch |
| `DELETE`| `/imports/:id` | Discard import batch and remove unconfirmed staged records |

---

## 3. Primary Financial Ledger (`/api/transactions`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/transactions` | List confirmed ledger transactions |
| `POST` | `/transactions` | Create manual transaction |
| `GET` | `/transactions/:id` | Get transaction details |
| `PUT` | `/transactions/:id` | Update confirmed transaction |
| `DELETE`| `/transactions/:id` | Delete confirmed transaction |

---

## 4. Dashboard, Budget, Insights & Reports

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/dashboard/summary` | Ledger metrics, income vs expense, monthly trend |
| `GET` | `/budget` | Monthly budget and category limits |
| `POST` | `/budget` | Set or update monthly budget |
| `GET` | `/ai/insights` | AI-generated financial insights |
| `GET` | `/reports/pdf` | Generate and download ledger summary PDF |
