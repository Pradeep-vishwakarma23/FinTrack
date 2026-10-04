/**
 * FinTrack MCP Architecture Phase 3: Tool Definitions & Dispatcher
 * Exposes the 7 deterministic financial tools over MCP.
 * Reuses existing copilotTools without duplicating any financial calculations.
 * Enforces parameter validation and data safety invariants.
 */

import {
  getFinancialSummary,
  getCategorySpending,
  getMerchantSpending,
  getForecast,
  getBudgetRisk,
  getAnomalies,
  getGoalStatus
} from '../services/copilotTools.js';
import { resolveAuthContext, isValidMonthFormat } from './authContext.js';

/**
 * MCP Tool Schemas for Model Context Protocol discovery.
 * Note: userId is strictly excluded from all public tool input schemas.
 */
export const MCP_TOOL_DEFINITIONS = [
  {
    name: 'fintrack_get_financial_summary',
    description:
      "Returns the authenticated user's verified financial summary for a month, including total income, total expenses, net savings, savings rate, deficit status, budget information, and confirmed transaction count. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.",
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_category_spending',
    description:
      'Returns verified spending, percentage share, average ticket size, and budget utilization for a specific category or the complete category breakdown for a month. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        },
        category: {
          type: 'string',
          description: "Specific category name (e.g., 'Food', 'Shopping', 'Rent', 'Bills', 'Entertainment', 'Transport'). If omitted, returns complete category breakdown."
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_merchant_spending',
    description:
      'Returns verified merchant spending analytics for a specific merchant or top payees for a month, including total spend, transaction counts, and average ticket size. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        },
        merchant: {
          type: 'string',
          description: "Specific merchant or payee name (e.g., 'Amazon', 'Swiggy', 'Uber', 'DMart'). If omitted, returns top payees."
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of top merchants to return (1 to 50, default 10).',
          minimum: 1,
          maximum: 50
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_forecast',
    description:
      'Returns verified month-end expense projections, daily burn rate, days elapsed, days remaining, and statistical forecast confidence based on confirmed transactions. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_budget_risk',
    description:
      'Returns verified budget velocity, risk classification (SAFE, ELEVATED, CRITICAL), projected budget variance, and pacing status against monthly budget targets. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_anomalies',
    description:
      'Returns verified statistical spending anomalies, outlier transactions, and budget shock detections from confirmed ledger records. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.',
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    }
  },
  {
    name: 'fintrack_get_goal_status',
    description:
      "Returns the authenticated user's active savings goals with verified progress, remaining amounts, required monthly contributions, and feasibility evaluation. Read-only. The returned financial values are authoritative FinTrack calculations. Do not recalculate them.",
    inputSchema: {
      type: 'object',
      properties: {
        month: {
          type: 'string',
          description: "Target reference month in YYYY-MM format (e.g., '2026-03'). Defaults to current active month if omitted.",
          pattern: '^\\d{4}-(0[1-9]|1[0-2])$'
        }
      },
      additionalProperties: false
    }
  }
];

/**
 * Executes an MCP tool invocation using existing copilotTools.
 *
 * @param {Object} params
 * @param {string} params.name - Tool name
 * @param {Object} [params.args] - Tool arguments
 * @param {Object} [params.context] - Execution auth context
 * @returns {Promise<Object>} Verified deterministic tool results
 */
export const executeMCPTool = async ({ name, args = {}, context = {} }) => {
  // 1. Resolve and enforce authentication context
  const { userId } = resolveAuthContext(context);

  // 2. Security validation: reject client-supplied userId spoofing attempt
  if (args.userId !== undefined) {
    const error = new Error('Security Error: Providing "userId" as a tool argument is strictly forbidden. User identity is derived exclusively from authenticated MCP session.');
    error.code = -32602;
    error.statusCode = 400;
    throw error;
  }

  // 3. Parameter validation
  const { month, category, merchant, limit } = args;

  if (month !== undefined && !isValidMonthFormat(month)) {
    const error = new Error(`Invalid month format: "${month}". Expected YYYY-MM (e.g. "2026-03").`);
    error.code = -32602;
    error.statusCode = 400;
    throw error;
  }

  if (limit !== undefined) {
    const numLimit = Number(limit);
    if (isNaN(numLimit) || !Number.isInteger(numLimit) || numLimit < 1 || numLimit > 50) {
      const error = new Error(`Invalid limit: "${limit}". Must be an integer between 1 and 50.`);
      error.code = -32602;
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Dispatch to deterministic tools in copilotTools.js
  switch (name) {
    case 'fintrack_get_financial_summary': {
      return await getFinancialSummary({ userId, month });
    }

    case 'fintrack_get_category_spending': {
      return await getCategorySpending({ userId, month, category });
    }

    case 'fintrack_get_merchant_spending': {
      return await getMerchantSpending({ userId, month, limit, merchant });
    }

    case 'fintrack_get_forecast': {
      return await getForecast({ userId, month });
    }

    case 'fintrack_get_budget_risk': {
      return await getBudgetRisk({ userId, month });
    }

    case 'fintrack_get_anomalies': {
      return await getAnomalies({ userId, month });
    }

    case 'fintrack_get_goal_status': {
      return await getGoalStatus({ userId, month });
    }

    default: {
      const error = new Error(`Unknown FinTrack MCP tool: "${name}".`);
      error.code = -32601;
      error.statusCode = 404;
      throw error;
    }
  }
};
