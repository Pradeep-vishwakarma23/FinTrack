/**
 * Phase 8 Final Context & Routing Stabilization Live Validation Script
 * Executes the controlled multi-turn What-If conversation directly on the live database.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { planCopilotQuery, QUERY_TYPES } from '../services/copilotQueryPlanner.js';
import { processCopilotChat } from '../services/copilotService.js';
import { getUsageStats, resetUsageStats } from '../services/llmUsageTracker.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const runLiveValidation = async () => {
  console.log('====================================================');
  console.log('FinTrack Copilot Final Context & Routing Live Validation');
  console.log('====================================================');

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGO_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  // Find or create test user
  let user = await User.findOne({ email: 'testcopilot_final@example.com' });
  if (!user) {
    user = await User.create({
      name: 'Copilot Final Tester',
      email: 'testcopilot_final@example.com',
      password: 'HashedPasswordTest123!',
      isVerified: true
    });
  }

  const userId = user._id.toString();
  const testMonth = '2026-09';

  // Seed confirmed transactions matching production test ledger (Income: 10,925, Shopping: 475, Food: 350 -> Total Expenses: 825)
  await Transaction.deleteMany({ userId });
  await Transaction.create([
    {
      userId,
      title: 'Salary & Earnings',
      amount: 10925,
      type: 'income',
      category: 'Salary',
      source: 'manual',
      status: 'confirmed',
      transactionDate: new Date('2026-09-01T10:00:00.000Z')
    },
    {
      userId,
      title: 'Shopping Outflow',
      amount: 475,
      type: 'expense',
      category: 'Shopping',
      merchant: 'TEST MART',
      source: 'manual',
      status: 'confirmed',
      transactionDate: new Date('2026-09-05T14:30:00.000Z')
    },
    {
      userId,
      title: 'Food & Dining Outflow',
      amount: 350,
      type: 'expense',
      category: 'Food',
      merchant: 'Swiggy',
      source: 'manual',
      status: 'confirmed',
      transactionDate: new Date('2026-09-10T20:00:00.000Z')
    }
  ]);

  resetUsageStats();

  let sessionId = null;

  // Turn 1: "What if I reduce my top category by 20%?"
  console.log('\n--- Turn 1: "What if I reduce my top category by 20%?" ---');
  const plan1 = planCopilotQuery({ message: 'What if I reduce my top category by 20%?', month: testMonth });
  console.log('Planned Type:', plan1.type, '| Intent:', plan1.intent, '| Requires LLM:', plan1.requiresLLM);
  const res1 = await processCopilotChat({ userId, message: 'What if I reduce my top category by 20%?', month: testMonth });
  sessionId = res1.sessionId;
  console.log('Response Provider:', res1.provider);
  console.log('Message:', res1.data.message);
  console.log('Gemini Calls so far:', getUsageStats().geminiCalls);

  // Turn 2: "For 10%"
  console.log('\n--- Turn 2: "For 10%" (Contextual Follow-Up) ---');
  const sessionDoc2 = await mongoose.model('CopilotSession').findById(sessionId);
  const plan2 = planCopilotQuery({ message: 'For 10%', history: sessionDoc2.messages, month: testMonth });
  console.log('Planned Type:', plan2.type, '| Intent:', plan2.intent, '| Params:', JSON.stringify(plan2.params), '| Requires LLM:', plan2.requiresLLM);
  const res2 = await processCopilotChat({ userId, sessionId, message: 'For 10%', month: testMonth });
  console.log('Response Provider:', res2.provider);
  console.log('Message:', res2.data.message);
  console.log('Gemini Calls so far:', getUsageStats().geminiCalls);

  // Turn 3: "What would my new expenses be?"
  console.log('\n--- Turn 3: "What would my new expenses be?" ---');
  const sessionDoc3 = await mongoose.model('CopilotSession').findById(sessionId);
  const plan3 = planCopilotQuery({ message: 'What would my new expenses be?', history: sessionDoc3.messages, month: testMonth });
  console.log('Planned Type:', plan3.type, '| Intent:', plan3.intent, '| Requires LLM:', plan3.requiresLLM);
  const res3 = await processCopilotChat({ userId, sessionId, message: 'What would my new expenses be?', month: testMonth });
  console.log('Response Provider:', res3.provider);
  console.log('Message:', res3.data.message);
  console.log('Gemini Calls so far:', getUsageStats().geminiCalls);

  // Turn 4: "Which category contributed the most?"
  console.log('\n--- Turn 4: "Which category contributed the most?" ---');
  const res4 = await processCopilotChat({ userId, sessionId, message: 'Which category contributed the most?', month: testMonth });
  console.log('Response Provider:', res4.provider);
  console.log('Message:', res4.data.message);
  console.log('Gemini Calls so far:', getUsageStats().geminiCalls);

  console.log('\n====================================================');
  console.log('Final Telemetry Stats:');
  console.log(JSON.stringify(getUsageStats(), null, 2));
  console.log('====================================================');

  // Clean up
  await Transaction.deleteMany({ userId });
  await mongoose.model('CopilotSession').deleteMany({ userId });
  await User.deleteOne({ _id: user._id });

  await mongoose.disconnect();
  console.log('Live validation completed successfully.');
};

runLiveValidation().catch((err) => {
  console.error('Validation failed with error:', err);
  process.exit(1);
});
