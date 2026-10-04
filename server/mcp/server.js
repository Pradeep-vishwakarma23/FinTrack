/**
 * FinTrack MCP Architecture Phase 3: Isolated MCP Server
 * Exposes Model Context Protocol (MCP) interface for FinTrack deterministic tools.
 * Protocol: JSON-RPC 2.0 over standard I/O (stdio) and programmatic handler.
 * Read-only, user-isolated, confirmed ledger access only.
 */

import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MCP_TOOL_DEFINITIONS, executeMCPTool } from './toolDefinitions.js';
import { resolveAuthContext } from './authContext.js';

export { MCP_TOOL_DEFINITIONS, executeMCPTool };

dotenv.config();

export const MCP_SERVER_INFO = {
  name: 'fintrack-mcp-server',
  version: '1.0.0'
};

export const MCP_PROTOCOL_VERSION = '2024-11-05';

export const MCP_PROMPT_DEFINITIONS = [
  {
    name: 'fintrack_financial_assistant_guidelines',
    description: 'System instructions for LLMs when using FinTrack financial intelligence tools.',
    arguments: []
  }
];

export const MCP_RESOURCE_DEFINITIONS = [
  {
    uri: 'fintrack://system/overview',
    name: 'FinTrack Banking Intelligence Overview',
    description: 'Core concepts, verified metrics definitions, and read-only invariants of FinTrack.',
    mimeType: 'text/markdown'
  }
];

const RESOURCE_OVERVIEW_CONTENT = `# FinTrack Banking Intelligence System
FinTrack is an AI-powered personal financial operating system.

### Core Invariants:
1. Grounding: Financial tool responses are authoritative calculations computed strictly from confirmed ledger records.
2. Anti-Hallucination: Never invent balances, transactions, or estimates. If data is not recorded, state that it is unavailable.
3. User Isolation: All queries strictly scope to the authenticated user.
4. Immutability: The MCP layer is strictly read-only and never modifies database records.
5. Deterministic Tools: Use deterministic tools for all mathematical, historical, breakdown, and forecasting queries.
`;

const PROMPT_GUIDELINES_CONTENT = `You are FinTrack's conversational AI assistant connected via Model Context Protocol (MCP).
When answering financial questions:
1. Always use FinTrack MCP tools (e.g., fintrack_get_financial_summary, fintrack_get_category_spending, fintrack_get_merchant_spending, fintrack_get_forecast, fintrack_get_budget_risk, fintrack_get_anomalies, fintrack_get_goal_status) to fetch verified data.
2. The returned financial values are authoritative FinTrack calculations. Do not recalculate or contradict them.
3. For multi-part queries (e.g. "What did I spend and am I over budget?"), call both fintrack_get_financial_summary and fintrack_get_budget_risk.
4. Present figures in Indian Rupees (₹) with proper comma separators where applicable.`;

/**
 * Handles incoming JSON-RPC 2.0 messages from MCP clients.
 *
 * @param {Object|string} rawMessage - JSON-RPC 2.0 request or string
 * @param {Object} [context] - Connection context (e.g. authToken or userId)
 * @returns {Promise<Object|null>} JSON-RPC 2.0 response object (or null for notifications)
 */
export const handleMCPMessage = async (rawMessage, context = {}) => {
  let request;
  try {
    request = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage;
  } catch (err) {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` }
    };
  }

  if (!request || typeof request !== 'object') {
    return {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32600, message: 'Invalid Request: expected an object.' }
    };
  }

  const { id, method, params = {} } = request;

  // Handle Notifications (no response expected)
  if (method === 'notifications/initialized') {
    return null;
  }

  try {
    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: {},
              prompts: {},
              resources: {}
            },
            serverInfo: MCP_SERVER_INFO
          }
        };
      }

      case 'ping': {
        return {
          jsonrpc: '2.0',
          id,
          result: {}
        };
      }

      case 'tools/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOL_DEFINITIONS
          }
        };
      }

      case 'tools/call': {
        const { name, arguments: toolArgs = {} } = params;
        if (!name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing required parameter "name" in tools/call.' }
          };
        }

        try {
          const toolResult = await executeMCPTool({
            name,
            args: toolArgs,
            context
          });

          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2)
                }
              ]
            }
          };
        } catch (toolError) {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: `Error executing tool "${name}": ${toolError.message}`
                }
              ]
            }
          };
        }
      }

      case 'prompts/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: MCP_PROMPT_DEFINITIONS
          }
        };
      }

      case 'prompts/get': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            description: 'FinTrack Financial Assistant Guidelines',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: PROMPT_GUIDELINES_CONTENT
                }
              }
            ]
          }
        };
      }

      case 'resources/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: MCP_RESOURCE_DEFINITIONS
          }
        };
      }

      case 'resources/read': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri: 'fintrack://system/overview',
                mimeType: 'text/markdown',
                text: RESOURCE_OVERVIEW_CONTENT
              }
            ]
          }
        };
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: "${method}"` }
        };
      }
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: error.code || -32603,
        message: error.message || 'Internal error processing MCP request.'
      }
    };
  }
};

/**
 * Starts standalone stdio MCP server for CLI, Claude Desktop, Cursor, or agentic MCP clients.
 */
export const startMCPServer = async () => {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance-tracker';
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
      console.error('[FinTrack MCP] Connected to MongoDB for read-only intelligence.');
    } catch (err) {
      console.error('[FinTrack MCP] MongoDB connection error:', err.message);
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  console.error('[FinTrack MCP Server] Listening on standard I/O (JSON-RPC 2.0)...');

  rl.on('line', async (line) => {
    if (!line || !line.trim()) return;
    try {
      const response = await handleMCPMessage(line.trim());
      if (response !== null) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      const errResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: err.message }
      };
      process.stdout.write(JSON.stringify(errResponse) + '\n');
    }
  });
};

// Start stdio loop if executed directly
const isDirectExecution = () => {
  if (!process.argv[1]) return false;
  try {
    const currentFilePath = fileURLToPath(import.meta.url);
    const invokedFilePath = path.resolve(process.argv[1]);
    return currentFilePath.toLowerCase() === invokedFilePath.toLowerCase();
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  startMCPServer().catch((err) => {
    console.error('[FinTrack MCP Server] Fatal startup error:', err);
    process.exit(1);
  });
}

