# FinTrack Model Context Protocol (MCP) Server

The **FinTrack MCP Server** exposes FinTrack's deterministic financial intelligence tool layer directly to external AI agents, LLMs, and development tools (such as Claude Desktop, Cursor, Antigravity, and custom agentic frameworks) over the standard [Model Context Protocol (MCP)](https://modelcontextprotocol.io/).

---

## 1. Architecture Overview

```
MCP Client / External LLM (e.g. Claude Desktop, Cursor, Antigravity)
       │
       │  (JSON-RPC 2.0 over stdio)
       ▼
┌─────────────────────────────────────────────────────────────┐
│                   FinTrack MCP Server                       │
│  (server/mcp/server.js + authContext.js + toolDefinitions)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 copilotTools.js Layer                       │
│          (Read-Only Deterministic Financial Tools)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            FinTrack Banking Intelligence Engine             │
│        (bankingIntelligenceService.js + goalService.js)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Confirmed Ledger Records                    │
│      Strictly Scoped: { userId, status: 'confirmed' }       │
└─────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> The MCP server contains **zero** financial formulas of its own. It orchestrates existing deterministic intelligence functions in [`copilotTools.js`](file:///d:/Major%20project/Finance-Tracker-Initial-Codes/server/services/copilotTools.js), ensuring complete consistency between the Web/Mobile Copilot and MCP clients.

---

## 2. Available MCP Tools

All tools return verified deterministic calculations with `provider: "deterministic"`.

| Tool Name | Arguments | Description |
| :--- | :--- | :--- |
| `fintrack_get_financial_summary` | `month?` (YYYY-MM) | Returns income, expenses, net savings, savings rate, deficit status, and transaction count. |
| `fintrack_get_category_spending` | `month?` (YYYY-MM), `category?` (string) | Returns spending, percentage share, average ticket, and budget utilization for a category or all categories. |
| `fintrack_get_merchant_spending` | `month?` (YYYY-MM), `merchant?` (string), `limit?` (number) | Returns total spend, transaction count, and average ticket size for a specific merchant or top payees. |
| `fintrack_get_forecast` | `month?` (YYYY-MM) | Returns month-end expense run-rate projections, daily burn rate, and statistical forecast confidence. |
| `fintrack_get_budget_risk` | `month?` (YYYY-MM) | Returns budget velocity, risk classification (SAFE, ELEVATED, CRITICAL), and projected variance against budget. |
| `fintrack_get_anomalies` | `month?` (YYYY-MM) | Returns statistical spending anomalies, outlier transactions, and budget shock detections. |
| `fintrack_get_goal_status` | `month?` (YYYY-MM) | Returns active savings goals with progress percentage, remaining amounts, required contributions, and feasibility. |

---

## 3. Security & User Isolation Model

1. **Strict User Context Derivation**:
   - `userId` is **strictly excluded** from all tool input schemas.
   - The MCP server derives `userId` exclusively from the authenticated environment context (`FINTRACK_AUTH_TOKEN` or `FINTRACK_USER_ID`).
   - Any attempt by a client or LLM to inject `{ userId: "..." }` into tool arguments is rejected with a validation error.
2. **No Arbitrary MongoDB Queries**:
   - MCP tools never accept raw database filters or projection operators.
3. **Immutability & Zero Write Operations**:
   - The MCP layer is strictly **read-only**. It cannot create, modify, or delete transactions, budgets, goals, or user credentials.
4. **Exclusion of Unverified Transactions**:
   - Staged (unreviewed SMS/notifications) and ignored transactions are strictly filtered out.
5. **No Secret Leaks**:
   - Database connection strings, JWT secrets, and internal system prompts are never exposed in tool outputs or error messages.

---

## 4. Authentication & Environment Configuration

### Required Environment Variables

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/finance-tracker

# FinTrack User Authentication (choose one)
FINTRACK_USER_ID=6ab7c32e420b3243f6ab9fd1
# OR
FINTRACK_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your_jwt_secret_key
```

---

## 5. Local Startup & Client Configuration

### Standalone Local Execution
```bash
node server/mcp/server.js
```

### Integration with Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "fintrack": {
      "command": "node",
      "args": ["d:/Major project/Finance-Tracker-Initial-Codes/server/mcp/server.js"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/finance-tracker",
        "FINTRACK_USER_ID": "6ab7c32e420b3243f6ab9fd1"
      }
    }
  }
}
```

---

## 6. Example Tool Invocations

### Example 1: Financial Summary
**Request (`tools/call`):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "fintrack_get_financial_summary",
    "arguments": {
      "month": "2026-03"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"totalIncome\": 100000,\n  \"totalExpense\": 40000,\n  \"netSavings\": 60000,\n  \"savingsRate\": 60,\n  \"isDeficit\": false,\n  \"monthlyBudget\": 50000,\n  \"budgetRemaining\": 10000,\n  \"transactionCount\": 5,\n  \"period\": \"2026-03\",\n  \"provider\": \"deterministic\"\n}"
      }
    ]
  }
}
```

### Example 2: Category Spending
**Request (`tools/call`):**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "fintrack_get_category_spending",
    "arguments": {
      "month": "2026-03",
      "category": "Shopping"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"category\": \"Shopping\",\n  \"amount\": 7000,\n  \"percentage\": 17.5,\n  \"transactionCount\": 2,\n  \"budgetLimit\": 6000,\n  \"budgetUtilization\": 116.67,\n  \"isOverBudget\": true,\n  \"period\": \"2026-03\",\n  \"provider\": \"deterministic\"\n}"
      }
    ]
  }
}
```

---

## 7. Token Optimization & Quota Protection

1. **Deterministic Execution**:
   - Calling FinTrack MCP tools executes 100% locally against MongoDB ledger records. It does **not** make downstream calls to the Gemini API or consume LLM API tokens for financial calculations.
2. **Authoritative Grounding**:
   - Returning pre-computed, verified financial figures prevents the LLM from hallucinating numbers or performing inaccurate mental math over raw transaction lists.
3. **Quota Preservation**:
   - Standard conversational financial Q&A (summaries, categories, merchants, forecast run-rates, budget risks, anomalies, and goals) bypass external LLM API costs entirely.
