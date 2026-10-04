/**
 * FinTrack MCP Architecture Phase 4.2: Controlled Local LLM + MCP Tool-Calling Prototype
 * Demonstrates LLM tool discovery, intent selection, MCP execution, and grounded answer synthesis.
 * Uses local stdio MCP server as the single source of financial truth.
 * Zero database writes, zero financial recalculations in LLM, zero leak of JWT or database internals.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import { FinTrackMCPClient } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Isolated LLM Interface (Gemini REST with Deterministic Reasoning Fallback)
 */
export class LLMProvider {
  constructor() {
    this.geminiCallCount = 0;
    this.isGeminiAvailable = Boolean(
      GEMINI_API_KEY &&
      GEMINI_API_KEY.trim().length > 10 &&
      !GEMINI_API_KEY.includes('your_api_key_here')
    );
  }

  /**
   * Calls Google Gemini REST API safely with JSON structure.
   */
  async callGemini(prompt, systemInstruction = '', responseSchema = null) {
    if (!this.isGeminiAvailable) {
      throw new Error('Gemini API key not configured or invalid.');
    }

    this.geminiCallCount++;
    const apiKey = GEMINI_API_KEY.trim();
    const model = GEMINI_MODEL;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
    ];

    let lastError = null;
    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(endpoint, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const cleanJson = rawText.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        lastError = err;
        if (err.response?.status === 400 || err.response?.status === 403) {
          break;
        }
      }
    }

    throw lastError || new Error('Gemini call failed.');
  }

  /**
   * Selects an MCP tool using LLM (or deterministic reasoning fallback).
   */
  async selectTool({ question, tools, month = '2026-03' }) {
    const systemPrompt = `You are a financial AI routing engine connected to FinTrack via Model Context Protocol (MCP).
Available MCP tools:
${JSON.stringify(tools, null, 2)}

Given the user question:
1. If the question requires factual financial data, select the single most appropriate tool and parameters.
2. If no tool is needed, respond with action: "answer" and a polite message.
3. NEVER invent or pass a "userId" parameter.
4. Output strict JSON only in this format:
{
  "action": "tool",
  "tool": "<tool_name>",
  "arguments": { "month": "${month}", ... }
}
OR
{
  "action": "answer",
  "message": "<text>"
}`;

    const userPrompt = `User question: "${question}"\nTarget Month: "${month}"`;

    if (this.isGeminiAvailable) {
      try {
        const result = await this.callGemini(userPrompt, systemPrompt);
        if (result && (result.action === 'tool' || result.action === 'answer')) {
          return { decision: result, provider: 'Gemini' };
        }
      } catch (err) {
        // Fall back gracefully to deterministic reasoning engine
      }
    }

    // Deterministic Mock LLM Tool Selection Fallback
    const qLower = question.toLowerCase();
    let selectedTool = 'fintrack_get_financial_summary';
    const toolArgs = { month };

    if (qLower.includes('shopping') || qLower.includes('food') || qLower.includes('category') || qLower.includes('spent on')) {
      selectedTool = 'fintrack_get_category_spending';
      if (qLower.includes('shopping')) toolArgs.category = 'Shopping';
      else if (qLower.includes('food')) toolArgs.category = 'Food';
    } else if (qLower.includes('forecast') || qLower.includes('project') || qLower.includes('burn rate')) {
      selectedTool = 'fintrack_get_forecast';
    } else if (qLower.includes('budget') || qLower.includes('risk') || qLower.includes('velocity')) {
      selectedTool = 'fintrack_get_budget_risk';
    } else if (qLower.includes('unusual') || qLower.includes('anomaly') || qLower.includes('outlier')) {
      selectedTool = 'fintrack_get_anomalies';
    } else if (qLower.includes('goal') || qLower.includes('target')) {
      selectedTool = 'fintrack_get_goal_status';
    } else if (qLower.includes('merchant') || qLower.includes('amazon') || qLower.includes('swiggy')) {
      selectedTool = 'fintrack_get_merchant_spending';
    }

    return {
      decision: {
        action: 'tool',
        tool: selectedTool,
        arguments: toolArgs
      },
      provider: 'Deterministic Fallback'
    };
  }

  /**
   * Generates a final natural-language response using ONLY verified tool results.
   */
  async generateAnswer({ question, toolName, verifiedData }) {
    const systemPrompt = `You are FinTrack AI Assistant.
Rules:
1. Use ONLY the verified financial values returned by the FinTrack MCP tool.
2. DO NOT recalculate, modify, or hallucinate financial values.
3. If a value is not in the data, state that it is unavailable.
4. Format currency figures in Indian Rupees (₹) with appropriate commas.
5. Keep the response concise, authoritative, and direct.
Output JSON:
{
  "answer": "<your natural language answer>"
}`;

    const userPrompt = `User Question: "${question}"
Executed Tool: "${toolName}"
Verified FinTrack Tool Output:
${JSON.stringify(verifiedData, null, 2)}`;

    if (this.isGeminiAvailable) {
      try {
        const result = await this.callGemini(userPrompt, systemPrompt);
        if (result?.answer) {
          return { answer: result.answer, provider: 'Gemini' };
        }
      } catch (err) {
        // Fall back gracefully
      }
    }

    // Deterministic Natural Language Synthesis Fallback
    let answer = '';
    switch (toolName) {
      case 'fintrack_get_financial_summary': {
        const income = Number(verifiedData.totalIncome || 0).toLocaleString('en-IN');
        const expense = Number(verifiedData.totalExpense || 0).toLocaleString('en-IN');
        const net = Number(verifiedData.netSavings || 0).toLocaleString('en-IN');
        const rate = verifiedData.savingsRate || 0;
        answer = `You have ₹${net} in net savings for ${verifiedData.period || 'this month'} (Total Income: ₹${income}, Total Expenses: ₹${expense}), with a savings rate of ${rate}%.`;
        break;
      }
      case 'fintrack_get_category_spending': {
        const cat = verifiedData.category || 'your requested category';
        const amt = Number(verifiedData.amount || 0).toLocaleString('en-IN');
        const limit = verifiedData.budgetLimit ? ` against a budget limit of ₹${Number(verifiedData.budgetLimit).toLocaleString('en-IN')}` : '';
        answer = `You spent ₹${amt} on ${cat} for ${verifiedData.period || 'this month'}${limit}.`;
        break;
      }
      case 'fintrack_get_forecast': {
        const burn = Number(verifiedData.dailyBurnRate || 0).toLocaleString('en-IN');
        const proj = Number(verifiedData.projectedExpense || 0).toLocaleString('en-IN');
        answer = `Your daily burn rate is ₹${burn}, with a projected month-end expense total of ₹${proj}.`;
        break;
      }
      case 'fintrack_get_budget_risk': {
        const risk = verifiedData.riskLevel || (verifiedData.isExceedingBudget ? 'CRITICAL' : 'SAFE');
        const rem = Number(verifiedData.budgetRemaining || 0).toLocaleString('en-IN');
        answer = `Your budget risk is currently ${risk}. You have ₹${rem} remaining from your monthly budget.`;
        break;
      }
      case 'fintrack_get_anomalies': {
        const count = verifiedData.anomalies?.length || 0;
        answer = count > 0
          ? `Detected ${count} unusual transaction(s) in your confirmed ledger.`
          : 'No unusual transactions or spending anomalies were detected for this period.';
        break;
      }
      case 'fintrack_get_goal_status': {
        const count = verifiedData.goals?.length || 0;
        answer = `You have ${count} active savings goal(s) on track.`;
        break;
      }
      default: {
        answer = `Retrieved verified financial metrics for ${toolName}.`;
      }
    }

    return { answer, provider: 'Deterministic Fallback' };
  }
}

/**
 * Executes a controlled LLM + MCP query.
 */
export async function runLLMMCPInteraction(mcpClient, llmProvider, question, month = '2026-03') {
  const initialLlmCalls = llmProvider.geminiCallCount;
  let mcpCallCount = 0;

  // 1. Tool discovery
  const tools = await mcpClient.listTools();

  // 2. LLM tool selection
  const { decision, provider: selectProvider } = await llmProvider.selectTool({
    question,
    tools,
    month
  });

  let verifiedResult = null;
  let finalAnswer = '';
  let activeToolName = '';

  if (decision.action === 'tool') {
    activeToolName = decision.tool;

    // Security Invariant Validation: Reject unauthorized tool requests
    const allowedNames = tools.map((t) => t.name);
    if (!allowedNames.includes(activeToolName)) {
      throw new Error(`Security Violation: LLM requested unknown/unauthorized tool "${activeToolName}".`);
    }

    if (decision.arguments?.userId !== undefined) {
      throw new Error('Security Violation: LLM attempted to pass "userId" parameter.');
    }

    // 3. Execute deterministic tool via MCP stdio client
    mcpCallCount++;
    verifiedResult = await mcpClient.callTool(activeToolName, decision.arguments);

    // 4. LLM answer synthesis strictly grounded on verified data
    const { answer } = await llmProvider.generateAnswer({
      question,
      toolName: activeToolName,
      verifiedData: verifiedResult
    });
    finalAnswer = answer;
  } else {
    finalAnswer = decision.message || 'No financial tool was needed for this query.';
  }

  const totalLlmCalls = llmProvider.geminiCallCount - initialLlmCalls;

  return {
    question,
    llmDecision: activeToolName || 'None (Direct Answer)',
    mcpTool: activeToolName || 'None',
    verifiedResult,
    llmAnswer: finalAnswer,
    provider: llmProvider.isGeminiAvailable ? 'Gemini + MCP' : 'Local Reasoning + MCP',
    geminiCalls: totalLlmCalls,
    mcpCalls: mcpCallCount
  };
}

/**
 * Runs security invariant tests against the LLM + MCP boundary.
 */
export async function runSecurityTests(mcpClient) {
  console.log('\n==================================================');
  console.log('Running LLM + MCP Security Invariant Tests');
  console.log('==================================================\n');

  const secResults = [];

  // Test 1: Reject LLM userId injection
  try {
    await mcpClient.callTool('fintrack_get_financial_summary', {
      month: '2026-03',
      userId: '6ab7c32e420b3243f6ab9fd2' // Spoof attempt
    });
    secResults.push({ test: '1. Reject LLM userId injection', passed: false });
  } catch (err) {
    secResults.push({
      test: '1. Reject LLM userId injection',
      passed: err.message.includes('forbidden') || err.message.includes('userId')
    });
  }

  // Test 2: Reject Unknown Tool
  try {
    await mcpClient.callTool('fintrack_unknown_mutation_tool', { month: '2026-03' });
    secResults.push({ test: '2. Reject Unknown MCP tool', passed: false });
  } catch (err) {
    secResults.push({ test: '2. Reject Unknown MCP tool', passed: true });
  }

  // Test 3: Reject Write Operations
  const tools = await mcpClient.listTools();
  const writeOps = ['create', 'update', 'delete', 'modify', 'insert', 'drop'];
  const hasWriteTool = tools.some((t) => writeOps.some((w) => t.name.includes(w)));
  secResults.push({ test: '3. Write Operations Blocked (0 write tools)', passed: !hasWriteTool });

  // Test 4: Reject Invalid Tool Argument
  try {
    await mcpClient.callTool('fintrack_get_merchant_spending', { month: '2026-03', limit: -99 });
    secResults.push({ test: '4. Reject Invalid Tool Argument', passed: false });
  } catch (err) {
    secResults.push({ test: '4. Reject Invalid Tool Argument', passed: true });
  }

  for (const r of secResults) {
    console.log(`[Security Test] ${r.test}: ${r.passed ? 'PASSED (✓)' : 'FAILED (✗)'}`);
  }

  return secResults.every((r) => r.passed);
}

/**
 * Main Demonstration Runner
 */
async function runDemo() {
  console.log('==================================================');
  console.log('FinTrack LLM + MCP Controlled Tool-Calling Demo');
  console.log('==================================================\n');

  // Verify / set authentication context
  const authUserId = process.env.FINTRACK_USER_ID || '6ab7c32e420b3243f6ab9fd1';
  process.env.FINTRACK_USER_ID = authUserId;
  process.env.USE_MOCK_DB = 'true'; // Enable isolated test ledger for demo

  const mcpClient = new FinTrackMCPClient({
    env: { FINTRACK_USER_ID: authUserId, USE_MOCK_DB: 'true' }
  });
  const llmProvider = new LLMProvider();

  try {
    // 1. Start MCP Client & perform handshake
    await mcpClient.start();
    await mcpClient.initialize();
    const discoveredTools = await mcpClient.listTools();

    console.log(`✓ MCP Handshake Completed. Discovered ${discoveredTools.length} FinTrack Tools.`);
    console.log(`✓ LLM Provider: ${llmProvider.isGeminiAvailable ? `Google Gemini (${GEMINI_MODEL})` : 'Deterministic Reasoning Engine'}\n`);

    const demoQuestions = [
      'What is my net savings?',
      'How much did I spend on Shopping?',
      'What is my financial forecast?',
      'Am I at risk of exceeding my budget?',
      'Did I have any unusual transactions?'
    ];

    const testMatrix = [];

    for (const question of demoQuestions) {
      const result = await runLLMMCPInteraction(mcpClient, llmProvider, question, '2026-03');

      console.log('--------------------------------------------------');
      console.log(`Question:\n${result.question}\n`);
      console.log(`LLM decision:\n${result.llmDecision}\n`);
      console.log(`MCP tool:\n${result.mcpTool}\n`);
      console.log('Verified result:');
      if (result.verifiedResult) {
        if (result.verifiedResult.totalIncome !== undefined) {
          console.log(`Income: ₹${Number(result.verifiedResult.totalIncome).toLocaleString('en-IN')}`);
          console.log(`Expenses: ₹${Number(result.verifiedResult.totalExpense).toLocaleString('en-IN')}`);
          console.log(`Net savings: ₹${Number(result.verifiedResult.netSavings).toLocaleString('en-IN')}`);
          console.log(`Savings rate: ${result.verifiedResult.savingsRate}%`);
        } else {
          console.log(JSON.stringify(result.verifiedResult, null, 2));
        }
      }
      console.log(`\nLLM answer:\n"${result.llmAnswer}"\n`);
      console.log(`Provider:\n${result.provider}\n`);
      console.log(`Gemini calls:\n${result.geminiCalls}\n`);
      console.log(`MCP calls:\n${result.mcpCalls}`);

      testMatrix.push({
        question: result.question,
        selectedTool: result.llmDecision,
        mcpCalls: result.mcpCalls,
        llmCalls: result.geminiCalls,
        answer: result.llmAnswer,
        success: Boolean(result.verifiedResult && result.llmAnswer)
      });
    }

    // Run Security Tests
    const securityPassed = await runSecurityTests(mcpClient);

    // Summary Matrix
    console.log('\n==================================================');
    console.log('DEMONSTRATION TEST MATRIX SUMMARY');
    console.log('==================================================');
    console.table(
      testMatrix.map((t) => ({
        Question: t.question,
        Tool: t.selectedTool,
        MCP_Calls: t.mcpCalls,
        LLM_Calls: t.llmCalls,
        Status: t.success ? 'PASSED' : 'FAILED'
      }))
    );

    await mcpClient.stop();
    const allSuccess = testMatrix.every((t) => t.success) && securityPassed;
    console.log(`\nOVERALL DEMO STATUS: ${allSuccess ? 'ALL PASSED (✓)' : 'FAILED'}`);
    process.exit(allSuccess ? 0 : 1);
  } catch (err) {
    console.error('\n❌ Fatal Demo Error:', err);
    await mcpClient.stop();
    process.exit(1);
  }
}

// Run CLI directly if executed
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runDemo();
}
