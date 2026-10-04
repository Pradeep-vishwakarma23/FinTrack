/**
 * FinTrack MCP Architecture Phase 4.1: Standalone Local MCP Client Test Harness
 * Connects directly to server/mcp/server.js subprocess over stdio JSON-RPC 2.0.
 * Read-only, user-isolated, native Node.js built-ins only (zero external MCP packages).
 */

import { spawn } from 'child_process';
import path from 'path';
import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

// Load environment variables from server/.env if available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const EXPECTED_PROTOCOL_VERSION = '2024-11-05';
const EXPECTED_SERVER_NAME = 'fintrack-mcp-server';
const EXPECTED_TOOLS = [
  'fintrack_get_financial_summary',
  'fintrack_get_category_spending',
  'fintrack_get_merchant_spending',
  'fintrack_get_forecast',
  'fintrack_get_budget_risk',
  'fintrack_get_anomalies',
  'fintrack_get_goal_status'
];

export class FinTrackMCPClient {
  constructor(options = {}) {
    this.serverScriptPath = options.serverScriptPath || path.resolve(__dirname, 'server.js');
    this.timeoutMs = options.timeoutMs || 10000;
    const preloadPath = path.resolve(__dirname, '../tests/mockDbPreload.js');
    this.nodeArgs = options.nodeArgs || (
      process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test'
        ? ['--import', pathToFileURL(preloadPath).href]
        : []
    );
    this.env = { ...process.env, ...options.env };
    this.proc = null;
    this.rl = null;
    this.pendingRequests = new Map();
    this.requestId = 1;
    this.isInitialized = false;
  }

  /**
   * Spawns the MCP server child process over standard I/O (stdio).
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.proc = spawn('node', [...this.nodeArgs, this.serverScriptPath], {
          env: this.env,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        this.rl = readline.createInterface({
          input: this.proc.stdout,
          terminal: false
        });

        this.proc.stderr.on('data', (chunk) => {
          // Internal server log messages on stderr are non-fatal protocol logging
          const msg = chunk.toString().trim();
          if (process.env.DEBUG_MCP) {
            console.error(`[Server Log] ${msg}`);
          }
        });

        this.proc.on('error', (err) => {
          this._rejectAllPending(new Error(`Failed to spawn MCP server process: ${err.message}`));
          reject(err);
        });

        this.proc.on('exit', (code, signal) => {
          const reason = `Server process exited unexpectedly with code ${code} (signal: ${signal})`;
          this._rejectAllPending(new Error(reason));
        });

        this.rl.on('line', (line) => {
          if (!line || !line.trim()) return;
          this._handleIncomingLine(line.trim());
        });

        // Allow child process stdio channels to initialize
        setTimeout(() => resolve(this), 250);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handles incoming JSON-RPC 2.0 messages from stdout.
   */
  _handleIncomingLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch (err) {
      console.error('[MCP Client] Warning: Received malformed JSON from server:', line);
      return;
    }

    // Ignore notifications (no id)
    if (message.id === undefined || message.id === null) {
      return;
    }

    if (this.pendingRequests.has(message.id)) {
      const { resolve, reject, timeoutId } = this.pendingRequests.get(message.id);
      clearTimeout(timeoutId);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        const err = new Error(message.error.message || 'JSON-RPC Error');
        err.code = message.error.code;
        err.data = message.error.data;
        return reject(err);
      }

      resolve(message.result);
    }
  }

  /**
   * Rejects all pending requests when process terminates.
   */
  _rejectAllPending(err) {
    for (const [, { reject, timeoutId }] of this.pendingRequests.entries()) {
      clearTimeout(timeoutId);
      reject(err);
    }
    this.pendingRequests.clear();
  }

  /**
   * Sends a JSON-RPC 2.0 request and awaits the matching response.
   */
  async sendRequest(method, params = {}) {
    if (!this.proc || this.proc.killed) {
      throw new Error('Cannot send request: MCP server subprocess is not running.');
    }

    const id = this.requestId++;
    const payload = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP Request timed out after ${this.timeoutMs}ms for method "${method}" (ID: ${id})`));
        }
      }, this.timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeoutId });

      try {
        this.proc.stdin.write(JSON.stringify(payload) + '\n');
      } catch (err) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(id);
        reject(new Error(`Failed to write request to server stdin: ${err.message}`));
      }
    });
  }

  /**
   * Sends a JSON-RPC 2.0 notification (no response expected).
   */
  sendNotification(method, params = {}) {
    if (!this.proc || this.proc.killed) {
      throw new Error('Cannot send notification: MCP server subprocess is not running.');
    }

    const payload = {
      jsonrpc: '2.0',
      method,
      params
    };

    this.proc.stdin.write(JSON.stringify(payload) + '\n');
  }

  /**
   * Executes standard MCP handshake sequence.
   */
  async initialize() {
    const result = await this.sendRequest('initialize', {
      protocolVersion: EXPECTED_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: 'fintrack-mcp-client',
        version: '1.0.0'
      }
    });

    if (!result || result.protocolVersion !== EXPECTED_PROTOCOL_VERSION) {
      throw new Error(`Protocol version mismatch: Expected "${EXPECTED_PROTOCOL_VERSION}", received "${result?.protocolVersion}"`);
    }

    if (result.serverInfo?.name !== EXPECTED_SERVER_NAME) {
      throw new Error(`Server name mismatch: Expected "${EXPECTED_SERVER_NAME}", received "${result?.serverInfo?.name}"`);
    }

    // Send required notifications/initialized
    this.sendNotification('notifications/initialized');
    this.isInitialized = true;
    return result;
  }

  /**
   * Discovers and validates all exposed MCP tools.
   */
  async listTools() {
    const result = await this.sendRequest('tools/list', {});
    const tools = result?.tools || [];

    // 1. Verify exactly 7 expected tools exist
    const discoveredNames = tools.map((t) => t.name);
    const missingTools = EXPECTED_TOOLS.filter((name) => !discoveredNames.includes(name));
    if (missingTools.length > 0 || tools.length !== EXPECTED_TOOLS.length) {
      throw new Error(`Tool discovery validation failed. Missing: [${missingTools.join(', ')}]. Total: ${tools.length}`);
    }

    // 2. Verify userId is strictly excluded from all public schemas
    for (const tool of tools) {
      if (tool.inputSchema?.properties?.userId !== undefined) {
        throw new Error(`Security Violation: Tool "${tool.name}" exposes forbidden "userId" in input schema!`);
      }
      if (tool.inputSchema?.additionalProperties !== false) {
        throw new Error(`Security Warning: Tool "${tool.name}" allows arbitrary additionalProperties!`);
      }
    }

    return tools;
  }

  /**
   * Invokes an MCP tool safely.
   */
  async callTool(name, toolArguments = {}) {
    // Client-side invariant check: NEVER send userId
    if (toolArguments.userId !== undefined) {
      throw new Error('Client Security Invariant: Supplying "userId" in tool arguments is strictly forbidden.');
    }

    const response = await this.sendRequest('tools/call', {
      name,
      arguments: toolArguments
    });

    if (response?.isError) {
      const errorText = response.content?.[0]?.text || 'Unknown MCP tool error';
      throw new Error(`MCP Tool Execution Error: ${errorText}`);
    }

    const contentText = response?.content?.[0]?.text;
    if (!contentText) {
      throw new Error(`Malformed tool response: Missing text content in result.`);
    }

    try {
      return JSON.parse(contentText);
    } catch {
      return contentText;
    }
  }

  /**
   * Shuts down the subprocess cleanly.
   */
  async stop() {
    return new Promise((resolve) => {
      if (!this.proc || this.proc.killed) {
        return resolve({ code: 0, signal: null });
      }

      this.proc.on('close', (code, signal) => {
        resolve({ code, signal });
      });

      try {
        this.proc.stdin.end();
      } catch {
        // Ignored
      }

      setTimeout(() => {
        if (this.proc && !this.proc.killed) {
          try {
            this.proc.kill('SIGTERM');
          } catch {
            // Ignored
          }
        }
      }, 500);
    });
  }
}

/**
 * CLI Execution Handler
 */
async function runClientCLI() {
  console.log('==================================================');
  console.log('FinTrack MCP Client — Phase 4.1 Standalone Harness');
  console.log('==================================================\n');

  // Check authentication context from environment
  const authToken = process.env.FINTRACK_AUTH_TOKEN;
  const authUserId = process.env.FINTRACK_USER_ID;

  if (!authToken && !authUserId) {
    console.error('❌ MCP authentication context is missing.');
    console.error('Please set FINTRACK_AUTH_TOKEN (JWT) or FINTRACK_USER_ID in your environment.\n');
    process.exit(1);
  }

  const authMethod = authToken ? 'FINTRACK_AUTH_TOKEN (JWT)' : 'FINTRACK_USER_ID';
  const client = new FinTrackMCPClient();

  try {
    // 1. Spawn server subprocess
    await client.start();
    const pid = client.proc?.pid;

    // 2. Initialize protocol
    const initResult = await client.initialize();

    // 3. Discover and validate tools
    const tools = await client.listTools();

    // 4. Execute deterministic tool call: fintrack_get_financial_summary
    const targetMonth = process.env.FINTRACK_TARGET_MONTH || '2026-03';
    const summary = await client.callTool('fintrack_get_financial_summary', {
      month: targetMonth
    });

    // 5. Print formatted output
    console.log('FinTrack MCP Client');
    console.log('-------------------');
    console.log(`Server: connected (PID: ${pid})`);
    console.log(`Protocol: ${initResult.protocolVersion}`);
    console.log(`Tools discovered: ${tools.length}`);
    console.log(`Authentication: valid (${authMethod})`);
    console.log(`Tool: fintrack_get_financial_summary`);
    console.log(`Month: ${targetMonth}`);
    console.log(`Provider: ${summary.provider || 'deterministic'}`);
    console.log('--------------------------------------------------');
    console.log('Verified Financial Metrics:');
    console.log(`• Total Income:       ₹${Number(summary.totalIncome || 0).toLocaleString('en-IN')}`);
    console.log(`• Total Expense:      ₹${Number(summary.totalExpense || 0).toLocaleString('en-IN')}`);
    console.log(`• Net Savings:        ₹${Number(summary.netSavings || 0).toLocaleString('en-IN')}`);
    console.log(`• Savings Rate:       ${summary.savingsRate || 0}%`);
    console.log(`• Deficit Status:     ${summary.isDeficit ? 'DEFICIT' : 'SURPLUS'}`);
    console.log(`• Monthly Budget:     ₹${Number(summary.monthlyBudget || 0).toLocaleString('en-IN')}`);
    console.log(`• Budget Remaining:   ₹${Number(summary.budgetRemaining || 0).toLocaleString('en-IN')}`);
    console.log(`• Confirmed Tx Count: ${summary.transactionCount || 0}`);
    console.log('==================================================\n');

    // 6. Clean shutdown
    await client.stop();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MCP Client Integration Error:', err.message);
    await client.stop();
    process.exit(1);
  }
}

// Run CLI directly if executed from command line
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runClientCLI();
}
