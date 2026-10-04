import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import {
  handleMCPMessage,
  MCP_TOOL_DEFINITIONS,
  MCP_SERVER_INFO,
  MCP_PROTOCOL_VERSION
} from '../mcp/server.js';
import { executeMCPTool } from '../mcp/toolDefinitions.js';
import { resolveAuthContext } from '../mcp/authContext.js';
import * as copilotTools from '../services/copilotTools.js';

describe('Phase 3: FinTrack MCP Server & Tool Integration Suite (mcpTools.test.js)', () => {
  const JWT_SECRET = 'test_jwt_secret_key_1234567890abcdef';
  const userAId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd1');
  const userBId = new mongoose.Types.ObjectId('6ab7c32e420b3243f6ab9fd2');

  const validTokenUserA = jwt.sign({ id: userAId.toString() }, JWT_SECRET, { expiresIn: '1d' });
  const validTokenUserB = jwt.sign({ id: userBId.toString() }, JWT_SECRET, { expiresIn: '1d' });

  const sampleTransactions = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'income',
      title: 'Monthly Salary',
      merchant: 'Tech Corp',
      amount: 100000,
      category: 'Salary',
      status: 'confirmed',
      transactionDate: new Date('2026-03-01')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Apartment Rent',
      merchant: 'Landlord',
      amount: 25000,
      category: 'Rent',
      status: 'confirmed',
      transactionDate: new Date('2026-03-02')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Groceries',
      merchant: 'DMart',
      amount: 8000,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-05')
    },
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Amazon Shopping',
      merchant: 'Amazon',
      amount: 7000,
      category: 'Shopping',
      status: 'confirmed',
      transactionDate: new Date('2026-03-10')
    },
    // Staged transaction for User A (must be excluded)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Pending SMS',
      merchant: 'Unreviewed Merchant',
      amount: 99999,
      category: 'Other',
      status: 'staged',
      transactionDate: new Date('2026-03-12')
    },
    // Ignored transaction for User A (must be excluded)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      type: 'expense',
      title: 'Ignored Promo',
      merchant: 'Spam Store',
      amount: 50000,
      category: 'Other',
      status: 'ignored',
      transactionDate: new Date('2026-03-13')
    },
    // User B transaction (must be isolated)
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userBId,
      type: 'expense',
      title: 'User B Expense',
      merchant: 'Secret Merchant',
      amount: 12345,
      category: 'Food',
      status: 'confirmed',
      transactionDate: new Date('2026-03-08')
    }
  ];

  const sampleBudget = {
    userId: userAId,
    monthlyBudget: 50000,
    categoryBudgets: [
      { category: 'Rent', limit: 30000 },
      { category: 'Food', limit: 10000 },
      { category: 'Shopping', limit: 6000 }
    ]
  };

  const sampleGoals = [
    {
      _id: new mongoose.Types.ObjectId(),
      userId: userAId,
      title: 'Emergency Fund',
      targetAmount: 120000,
      currentAmount: 60000,
      targetDate: new Date('2026-12-31'),
      status: 'in_progress',
      category: 'Emergency'
    }
  ];

  beforeAll(() => {
    process.env.JWT_SECRET = JWT_SECRET;
  });

  beforeEach(() => {
    process.env.FINTRACK_USER_ID = userAId.toString();
    delete process.env.FINTRACK_AUTH_TOKEN;

    jest.spyOn(Transaction, 'find').mockImplementation((query) => {
      const filtered = sampleTransactions.filter((t) => {
        if (query.userId && t.userId.toString() !== query.userId.toString()) return false;
        if (query.status && t.status !== query.status) return false;
        if (query.transactionDate?.$gte && t.transactionDate < query.transactionDate.$gte) return false;
        if (query.transactionDate?.$lte && t.transactionDate > query.transactionDate.$lte) return false;
        if (query.transactionDate?.$lt && t.transactionDate >= query.transactionDate.$lt) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });

    jest.spyOn(Budget, 'findOne').mockImplementation((query) => {
      if (query.userId && query.userId.toString() === userAId.toString()) {
        return Promise.resolve(sampleBudget);
      }
      return Promise.resolve(null);
    });

    jest.spyOn(Goal, 'find').mockImplementation((query) => {
      const filtered = sampleGoals.filter((g) => {
        if (query.userId && g.userId.toString() !== query.userId.toString()) return false;
        return true;
      });
      return {
        sort: jest.fn().mockResolvedValue(filtered),
        then: (resolve) => resolve(filtered)
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.FINTRACK_USER_ID;
    delete process.env.FINTRACK_AUTH_TOKEN;
  });

  // =================================================================
  // 1. TOOL REGISTRATION & SCHEMAS
  // =================================================================
  describe('MCP Tool Registration & Schema Integrity', () => {
    test('1. registers all seven expected financial tools', () => {
      const toolNames = MCP_TOOL_DEFINITIONS.map((t) => t.name);
      expect(toolNames).toContain('fintrack_get_financial_summary');
      expect(toolNames).toContain('fintrack_get_category_spending');
      expect(toolNames).toContain('fintrack_get_merchant_spending');
      expect(toolNames).toContain('fintrack_get_forecast');
      expect(toolNames).toContain('fintrack_get_budget_risk');
      expect(toolNames).toContain('fintrack_get_anomalies');
      expect(toolNames).toContain('fintrack_get_goal_status');
      expect(toolNames.length).toBe(7);
    });

    test('2. ensures userId is NEVER exposed in any public tool schema', () => {
      for (const tool of MCP_TOOL_DEFINITIONS) {
        expect(tool.inputSchema.properties.userId).toBeUndefined();
        expect(tool.inputSchema.additionalProperties).toBe(false);
      }
    });

    test('3. tool descriptions state values are authoritative FinTrack calculations', () => {
      for (const tool of MCP_TOOL_DEFINITIONS) {
        expect(tool.description).toContain('authoritative FinTrack calculations');
        expect(tool.description).toContain('Do not recalculate');
      }
    });
  });

  // =================================================================
  // 2. AUTHENTICATION & SECURITY CONTEXT BOUNDARY
  // =================================================================
  describe('Authentication & User Isolation Invariants', () => {
    test('4. rejects tool execution when no authentication context is present', async () => {
      delete process.env.FINTRACK_USER_ID;
      delete process.env.FINTRACK_AUTH_TOKEN;

      await expect(
        executeMCPTool({
          name: 'fintrack_get_financial_summary',
          args: { month: '2026-03' },
          context: {}
        })
      ).rejects.toThrow('FinTrack MCP Authentication Required');
    });

    test('5. resolves user via verified JWT token in context', () => {
      delete process.env.FINTRACK_USER_ID;
      const auth = resolveAuthContext({ authToken: validTokenUserA });
      expect(auth.userId.toString()).toBe(userAId.toString());
      expect(auth.authMethod).toBe('jwt_token');
    });

    test('6. resolves user via FINTRACK_USER_ID environment variable', () => {
      process.env.FINTRACK_USER_ID = userAId.toString();
      const auth = resolveAuthContext({});
      expect(auth.userId.toString()).toBe(userAId.toString());
      expect(auth.authMethod).toBe('secure_env_userId');
    });

    test('7. rejects client-supplied userId spoofing attempt in tool arguments', async () => {
      await expect(
        executeMCPTool({
          name: 'fintrack_get_financial_summary',
          args: {
            month: '2026-03',
            userId: userBId.toString() // Spoofing attempt
          },
          context: { userId: userAId }
        })
      ).rejects.toThrow('Security Error: Providing "userId" as a tool argument is strictly forbidden');
    });

    test('8. enforces user isolation (User B only accesses User B ledger)', async () => {
      const resUserB = await executeMCPTool({
        name: 'fintrack_get_financial_summary',
        args: { month: '2026-03' },
        context: { userId: userBId }
      });

      expect(resUserB.totalExpense).toBe(12345);
      expect(resUserB.totalIncome).toBe(0);
      expect(resUserB.transactionCount).toBe(1);
    });
  });

  // =================================================================
  // 3. DETERMINISTIC TOOL EXECUTION & REUSE OF COPILOTTOOLS
  // =================================================================
  describe('Deterministic Tool Invocations via MCP Dispatcher', () => {
    test('9. fintrack_get_financial_summary calls existing copilotTools.getFinancialSummary', async () => {
      const expected = await copilotTools.getFinancialSummary({ userId: userAId, month: '2026-03' });
      const res = await executeMCPTool({
        name: 'fintrack_get_financial_summary',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.provider).toBe('deterministic');
      expect(res.totalIncome).toBe(100000);
      expect(res.totalExpense).toBe(40000); // 25000 + 8000 + 7000
      expect(res.netSavings).toBe(60000);
      expect(res.savingsRate).toBe(60);
      expect(res.isDeficit).toBe(false);
      expect(res.transactionCount).toBe(4);
    });

    test('10. fintrack_get_category_spending calls existing copilotTools.getCategorySpending', async () => {
      const expected = await copilotTools.getCategorySpending({ userId: userAId, month: '2026-03', category: 'Shopping' });
      const res = await executeMCPTool({
        name: 'fintrack_get_category_spending',
        args: { month: '2026-03', category: 'Shopping' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.category).toBe('Shopping');
      expect(res.amount).toBe(7000);
      expect(res.budgetLimit).toBe(6000);
      expect(res.isOverBudget).toBe(true);
    });

    test('11. fintrack_get_merchant_spending calls existing copilotTools.getMerchantSpending', async () => {
      const expected = await copilotTools.getMerchantSpending({ userId: userAId, month: '2026-03', merchant: 'Amazon' });
      const res = await executeMCPTool({
        name: 'fintrack_get_merchant_spending',
        args: { month: '2026-03', merchant: 'Amazon' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.merchant).toBe('Amazon');
      expect(res.totalSpend).toBe(7000);
      expect(res.count).toBe(1);
    });

    test('12. fintrack_get_forecast calls existing copilotTools.getForecast', async () => {
      const expected = await copilotTools.getForecast({ userId: userAId, month: '2026-03' });
      const res = await executeMCPTool({
        name: 'fintrack_get_forecast',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.provider).toBe('deterministic');
      expect(typeof res.dailyBurnRate).toBe('number');
      expect(typeof res.projectedExpense).toBe('number');
    });

    test('13. fintrack_get_budget_risk calls existing copilotTools.getBudgetRisk', async () => {
      const expected = await copilotTools.getBudgetRisk({ userId: userAId, month: '2026-03' });
      const res = await executeMCPTool({
        name: 'fintrack_get_budget_risk',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.provider).toBe('deterministic');
      expect(res.monthlyBudget).toBe(50000);
      expect(res.budgetRemaining).toBe(10000);
    });

    test('14. fintrack_get_anomalies calls existing copilotTools.getAnomalies', async () => {
      const expected = await copilotTools.getAnomalies({ userId: userAId, month: '2026-03' });
      const res = await executeMCPTool({
        name: 'fintrack_get_anomalies',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.provider).toBe('deterministic');
      expect(Array.isArray(res.anomalies)).toBe(true);
    });

    test('15. fintrack_get_goal_status calls existing copilotTools.getGoalStatus', async () => {
      const expected = await copilotTools.getGoalStatus({ userId: userAId, month: '2026-03' });
      const res = await executeMCPTool({
        name: 'fintrack_get_goal_status',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(res).toEqual(expected);
      expect(res.provider).toBe('deterministic');
      expect(res.goals.length).toBe(1);
      expect(res.goals[0].title).toBe('Emergency Fund');
      expect(res.goals[0].progress).toBe(50);
    });
  });

  // =================================================================
  // 4. DATA SAFETY, IMMUTABILITY & PARAMETER VALIDATION
  // =================================================================
  describe('Data Safety & Parameter Validation Invariants', () => {
    test('16. excludes staged and ignored transactions from all calculations', async () => {
      const res = await executeMCPTool({
        name: 'fintrack_get_financial_summary',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      // 99999 staged and 50000 ignored must not be included
      expect(res.totalExpense).toBe(40000);
      expect(res.transactionCount).toBe(4);
    });

    test('17. enforces zero mutation and read-only behavior across all models', async () => {
      const createTxSpy = jest.spyOn(Transaction, 'create');
      const updateTxSpy = jest.spyOn(Transaction, 'updateOne');
      const deleteTxSpy = jest.spyOn(Transaction, 'deleteOne');
      const createGoalSpy = jest.spyOn(Goal, 'create');
      const updateGoalSpy = jest.spyOn(Goal, 'updateOne');
      const deleteGoalSpy = jest.spyOn(Goal, 'deleteOne');

      await executeMCPTool({
        name: 'fintrack_get_goal_status',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });

      expect(createTxSpy).not.toHaveBeenCalled();
      expect(updateTxSpy).not.toHaveBeenCalled();
      expect(deleteTxSpy).not.toHaveBeenCalled();
      expect(createGoalSpy).not.toHaveBeenCalled();
      expect(updateGoalSpy).not.toHaveBeenCalled();
      expect(deleteGoalSpy).not.toHaveBeenCalled();
    });

    test('18. rejects invalid month format', async () => {
      await expect(
        executeMCPTool({
          name: 'fintrack_get_financial_summary',
          args: { month: '2026-13' }, // Invalid month
          context: { userId: userAId }
        })
      ).rejects.toThrow('Invalid month format');

      await expect(
        executeMCPTool({
          name: 'fintrack_get_financial_summary',
          args: { month: 'invalid-string' },
          context: { userId: userAId }
        })
      ).rejects.toThrow('Invalid month format');
    });

    test('19. rejects invalid limit parameter', async () => {
      await expect(
        executeMCPTool({
          name: 'fintrack_get_merchant_spending',
          args: { month: '2026-03', limit: -5 },
          context: { userId: userAId }
        })
      ).rejects.toThrow('Invalid limit');

      await expect(
        executeMCPTool({
          name: 'fintrack_get_merchant_spending',
          args: { month: '2026-03', limit: 100 },
          context: { userId: userAId }
        })
      ).rejects.toThrow('Invalid limit');
    });

    test('20. verifies no external Gemini calls are made during MCP tool execution', async () => {
      const axiosSpy = jest.spyOn(axios, 'post');
      await executeMCPTool({
        name: 'fintrack_get_financial_summary',
        args: { month: '2026-03' },
        context: { userId: userAId }
      });
      expect(axiosSpy).not.toHaveBeenCalled();
    });
  });

  // =================================================================
  // 5. JSON-RPC 2.0 PROTOCOL HANDLER COMPLIANCE
  // =================================================================
  describe('JSON-RPC 2.0 Protocol Message Handling', () => {
    test('21. handles "initialize" method and returns capabilities and server info', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {}
      };

      const response = await handleMCPMessage(request);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
      expect(response.result.serverInfo.name).toBe(MCP_SERVER_INFO.name);
      expect(response.result.capabilities.tools).toBeDefined();
    });

    test('22. handles "ping" method', async () => {
      const request = { jsonrpc: '2.0', id: 2, method: 'ping' };
      const response = await handleMCPMessage(request);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.result).toEqual({});
    });

    test('23. handles "tools/list" method', async () => {
      const request = { jsonrpc: '2.0', id: 3, method: 'tools/list' };
      const response = await handleMCPMessage(request);
      expect(response.result.tools.length).toBe(7);
    });

    test('24. handles "tools/call" method with JSON response content format', async () => {
      const request = {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'fintrack_get_financial_summary',
          arguments: { month: '2026-03' }
        }
      };

      const response = await handleMCPMessage(request, { userId: userAId });
      expect(response.id).toBe(4);
      expect(response.result.content[0].type).toBe('text');
      const parsedData = JSON.parse(response.result.content[0].text);
      expect(parsedData.totalIncome).toBe(100000);
      expect(parsedData.netSavings).toBe(60000);
      expect(parsedData.provider).toBe('deterministic');
    });

    test('25. handles "prompts/list" and "prompts/get"', async () => {
      const listReq = { jsonrpc: '2.0', id: 5, method: 'prompts/list' };
      const listRes = await handleMCPMessage(listReq);
      expect(listRes.result.prompts.length).toBeGreaterThan(0);

      const getReq = { jsonrpc: '2.0', id: 6, method: 'prompts/get', params: { name: 'fintrack_financial_assistant_guidelines' } };
      const getRes = await handleMCPMessage(getReq);
      expect(getRes.result.messages[0].content.text).toContain('authoritative FinTrack calculations');
    });

    test('26. handles "resources/list" and "resources/read"', async () => {
      const listReq = { jsonrpc: '2.0', id: 7, method: 'resources/list' };
      const listRes = await handleMCPMessage(listReq);
      expect(listRes.result.resources.length).toBeGreaterThan(0);

      const readReq = { jsonrpc: '2.0', id: 8, method: 'resources/read', params: { uri: 'fintrack://system/overview' } };
      const readRes = await handleMCPMessage(readReq);
      expect(readRes.result.contents[0].text).toContain('FinTrack Banking Intelligence System');
    });

    test('27. handles unknown method with -32601 error', async () => {
      const req = { jsonrpc: '2.0', id: 9, method: 'invalid/method' };
      const res = await handleMCPMessage(req);
      expect(res.error.code).toBe(-32601);
      expect(res.error.message).toContain('Method not found');
    });

    test('28. handles invalid JSON string with -32700 parse error', async () => {
      const res = await handleMCPMessage('not-valid-json{');
      expect(res.error.code).toBe(-32700);
      expect(res.error.message).toContain('Parse error');
    });
  });
});
