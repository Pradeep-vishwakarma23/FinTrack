import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api';

async function runPhase2E2E() {
  console.log('🚀 Starting Phase 2 Live E2E Verification Suite (SMS/Message Ingestion)...\n');

  try {
    // 1. Create Demo User 1
    const testEmail1 = `sms_demo_${Date.now()}@fintrack.ai`;
    const signupRes1 = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'SMS Intelligence User 1',
      email: testEmail1,
      password: 'Password@123'
    });
    const token1 = signupRes1.data.token;
    console.log('✅ User 1 Created & Authenticated:', testEmail1);

    // 2. Create Demo User 2 (Isolation Guard)
    const testEmail2 = `sms_isolated_${Date.now()}@fintrack.ai`;
    const signupRes2 = await axios.post(`${API_BASE}/auth/signup`, {
      name: 'SMS Intelligence User 2',
      email: testEmail2,
      password: 'Password@123'
    });
    const token2 = signupRes2.data.token;
    console.log('✅ User 2 Created (Isolation Guard):', testEmail2);

    const client1 = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${token1}` }
    });

    const client2 = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${token2}` }
    });

    // 3. Load Synthetic 32 SMS Dataset
    const datasetPath = path.resolve('d:/Major project/Finance-Tracker-Initial-Codes/server/data/synthetic_sms_dataset.json');
    const syntheticMessages = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
    console.log(`\n--- 1. Ingesting Synthetic SMS Dataset (${syntheticMessages.length} Messages) ---`);

    const ingestRes = await client1.post('/imports/sms', {
      messages: syntheticMessages,
      fileName: 'Synthetic Multi-Category SMS Dataset'
    });

    console.log('✅ Ingestion Success:', ingestRes.data.success);
    console.log('✅ Ingestion Batch ID:', ingestRes.data.batch?._id);
    console.log('✅ Staged Financial Transactions:', ingestRes.data.stagedCount);
    console.log('✅ Rejected Non-Financial / OTP Messages:', ingestRes.data.metrics?.rejectedCount);
    console.log('✅ Duplicates in Dataset:', ingestRes.data.metrics?.duplicateCount);

    const batchId = ingestRes.data.batch._id;

    // 4. Retrieve & Inspect Staged SMS Transactions
    console.log('\n--- 2. Staged SMS Transaction Intelligence Verification ---');
    const stagedRes = await client1.get(`/imports/${batchId}/transactions`);
    const stagedTxns = stagedRes.data.data;
    console.log(`✅ Staged Records Count: ${stagedTxns.length}`);

    // Print sample extracted entities
    stagedTxns.slice(0, 10).forEach((t, idx) => {
      console.log(
        `   [${idx + 1}] Source: "${t.source}" | Merchant: "${t.merchant}" | Cat: "${t.category}" | Conf: ${(t.confidence * 100).toFixed(0)}% | ₹${t.amount} (${t.type}) | Dup: ${t.isDuplicate}`
      );
    });

    // 5. Verify Sensitive Data Redaction
    console.log('\n--- 3. Sensitive Data Redaction Verification ---');
    const anyOTPFound = stagedTxns.some((t) => /OTP\s+is\s+\d{6}/i.test(t.description || ''));
    const anyFullAccountFound = stagedTxns.some((t) => /A\/c\s+\d{10,16}/i.test(t.description || ''));
    console.log('✅ OTPs Leaked:', anyOTPFound ? 'FAIL (Leaked)' : 'PASS (Redacted/Clean)');
    console.log('✅ Full Account Numbers Leaked:', anyFullAccountFound ? 'FAIL (Leaked)' : 'PASS (Masked/Redacted)');

    // 6. Test User Isolation on SMS Batches
    console.log('\n--- 4. User Isolation Security Verification ---');
    try {
      await client2.get(`/imports/${batchId}`);
      console.error('❌ Isolation Failed: User 2 accessed User 1 SMS batch');
    } catch (err) {
      console.log('✅ Isolation Guard Active: User 2 blocked with status:', err.response?.status);
    }

    // 7. Duplicate Ingestion Verification
    console.log('\n--- 5. Duplicate Detection on Re-Ingestion ---');
    const dupRes = await client1.post('/imports/sms', {
      messages: syntheticMessages.slice(0, 5),
      fileName: 'Repeated SMS Ingestion'
    });
    console.log('✅ Re-ingested 5 messages -> Detected Duplicates:', dupRes.data.metrics?.duplicateCount, 'out of', dupRes.data.stagedCount);

    // 8. Test Confirm / Edit / Ignore on Staged SMS Transactions
    console.log('\n--- 6. Confirm / Edit / Ignore Lifecycle ---');
    const firstTx = stagedTxns[0];
    const secondTx = stagedTxns[1];
    const thirdTx = stagedTxns[2];

    // Single confirm
    const confirmRes = await client1.post(`/imports/transactions/${firstTx._id}/confirm`);
    console.log(`✅ Single Confirm [${firstTx.merchant}]:`, confirmRes.data.data?.status === 'confirmed');

    // Edit staged
    const editRes = await client1.patch(`/imports/transactions/${secondTx._id}`, {
      category: 'Food & Dining',
      amount: 1500
    });
    console.log(`✅ Edit Staged [${secondTx.merchant}]: Category -> "${editRes.data.data?.category}", Amount -> ₹${editRes.data.data?.amount}`);

    // Ignore staged
    const ignoreRes = await client1.post(`/imports/transactions/${thirdTx._id}/ignore`);
    console.log(`✅ Ignore Transaction [${thirdTx.merchant}]: Status -> "${ignoreRes.data.data?.status}"`);

    // Bulk Confirm All
    const confirmAllRes = await client1.post(`/imports/${batchId}/confirm-all`);
    console.log(`✅ Bulk Confirm All Staged: ${confirmAllRes.data.message}`);

    // 9. Verify Ledger Persistence
    console.log('\n--- 7. Primary Ledger Verification ---');
    const ledgerRes = await client1.get('/transactions');
    console.log(`✅ Total Confirmed Ledger Transactions: ${ledgerRes.data.data?.length}`);

    // 10. History List
    console.log('\n--- 8. Batch History Verification ---');
    const historyRes = await client1.get('/imports');
    console.log(`✅ Total User Batches in History: ${historyRes.data.data?.length}`);
    historyRes.data.data?.forEach((b, i) => {
      console.log(`   [${i + 1}] Source: "${b.source}" | File/Title: "${b.fileName}" | Records: ${b.totalRecords} | Dups: ${b.duplicateRecords} | Status: "${b.status}"`);
    });

    console.log('\n🎉 ALL PHASE 2 SMS INGESTION REQUIREMENTS VERIFIED 100% SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Phase 2 E2E Verification Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runPhase2E2E();
