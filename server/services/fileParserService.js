import csv from 'csv-parser';
import { Readable } from 'stream';
import * as xlsx from 'xlsx';

const COLUMN_ALIASES = {
  date: [
    'date',
    'transaction date',
    'txn date',
    'txndate',
    'trans date',
    'value date',
    'posting date',
    'booking date',
    'time',
    'timestamp'
  ],
  description: [
    'description',
    'narration',
    'particulars',
    'details',
    'remarks',
    'transaction details',
    'title',
    'note',
    'memo',
    'summary'
  ],
  merchant: [
    'merchant',
    'payee',
    'beneficiary',
    'party name',
    'recipient',
    'vendor',
    'store',
    'merchant name'
  ],
  amount: [
    'amount',
    'txn amount',
    'transaction amount',
    'total',
    'net amount',
    'trans amount'
  ],
  debit: [
    'debit',
    'withdrawal',
    'dr',
    'debit amount',
    'dr amount',
    'spent',
    'withdrawn',
    'paid out'
  ],
  credit: [
    'credit',
    'deposit',
    'cr',
    'credit amount',
    'cr amount',
    'received',
    'deposited',
    'paid in'
  ],
  type: [
    'type',
    'transaction type',
    'txn type',
    'cr/dr',
    'd/c',
    'dr/cr'
  ],
  category: [
    'category',
    'expense category',
    'tag',
    'classification'
  ],
  reference: [
    'reference',
    'ref no',
    'ref number',
    'reference no',
    'utr',
    'transaction id',
    'txn id',
    'chq no',
    'cheque no',
    'external id',
    'id'
  ],
  paymentMethod: [
    'payment method',
    'mode',
    'channel',
    'payment mode',
    'type of payment',
    'txn mode'
  ]
};

export const cleanAmount = (val) => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return Math.abs(val);

  let str = String(val).trim();
  // check if enclosed in parentheses e.g. (100.50) representing negative/debit
  const isParenNegative = /^\(.*\)$/.test(str);
  str = str.replace(/[()]/g, '');

  // remove currency symbols and whitespace
  str = str.replace(/[₹$€£RsINR,\s]/gi, '');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
};

export const parseFlexibleDate = (val) => {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;

  // Handle Excel serial date numbers
  if (typeof val === 'number' || (!isNaN(val) && Number(val) > 25000 && Number(val) < 65000)) {
    try {
      const parsedDate = xlsx.SSF.parse_date_code(Number(val));
      if (parsedDate) {
        return new Date(Date.UTC(parsedDate.y, parsedDate.m - 1, parsedDate.d, parsedDate.H || 0, parsedDate.M || 0, parsedDate.S || 0));
      }
    } catch (e) {
      // fallback to standard parsing
    }
  }

  const str = String(val).trim();

  // Pattern: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const dateObj = new Date(year, month, day, 12, 0, 0);
    if (!isNaN(dateObj.getTime())) return dateObj;
  }

  // Standard date parsing
  const standard = new Date(str);
  if (!isNaN(standard.getTime())) return standard;

  return new Date();
};

export const detectHeaderMapping = (headers = []) => {
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    cleaned: String(h).trim().toLowerCase().replace(/[_\-.]/g, ' ')
  }));

  const mapping = {};

  for (const [standardKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const h of normalizedHeaders) {
      const isMatch = aliases.some((alias) => {
        if (h.cleaned === alias) return true;
        if (alias.length > 3) {
          return h.cleaned.includes(alias);
        }
        // For short aliases (e.g. 'cr', 'dr', 'id'), match only whole words
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        return regex.test(h.cleaned);
      });

      if (isMatch) {
        mapping[standardKey] = h.original;
        break;
      }
    }
  }

  return mapping;
};

export const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer.toString('utf-8'));

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim()
        })
      )
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve(rows))
      .on('error', (error) => reject(error));
  });
};

export const parseExcelBuffer = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet, { defval: '' });
};

export const normalizeRawRecords = (rawRows = []) => {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const sampleRow = rawRows[0] || {};
  const headers = Object.keys(sampleRow);
  const headerMap = detectHeaderMapping(headers);

  const normalized = [];

  rawRows.forEach((row, idx) => {
    // Check if row is empty
    const values = Object.values(row).filter((v) => v !== '' && v !== null && v !== undefined);
    if (values.length === 0) return;

    const rawDate = headerMap.date ? row[headerMap.date] : null;
    const date = parseFlexibleDate(rawDate);

    const rawDesc = headerMap.description ? String(row[headerMap.description]).trim() : '';
    const rawMerchant = headerMap.merchant ? String(row[headerMap.merchant]).trim() : '';
    const rawRef = headerMap.reference ? String(row[headerMap.reference]).trim() : '';
    const rawCategory = headerMap.category ? String(row[headerMap.category]).trim() : '';
    const rawPayment = headerMap.paymentMethod ? String(row[headerMap.paymentMethod]).trim() : '';

    let amount = 0;
    let type = 'expense';

    const debitVal = headerMap.debit ? cleanAmount(row[headerMap.debit]) : 0;
    const creditVal = headerMap.credit ? cleanAmount(row[headerMap.credit]) : 0;

    if (debitVal > 0 && creditVal === 0) {
      amount = debitVal;
      type = 'expense';
    } else if (creditVal > 0 && debitVal === 0) {
      amount = creditVal;
      type = 'income';
    } else if (headerMap.amount) {
      amount = cleanAmount(row[headerMap.amount]);
      const rawType = headerMap.type ? String(row[headerMap.type]).toLowerCase().trim() : '';
      if (rawType.includes('cr') || rawType.includes('credit') || rawType.includes('income')) {
        type = 'income';
      } else if (rawType.includes('dr') || rawType.includes('debit') || rawType.includes('expense')) {
        type = 'expense';
      } else if (rawType.includes('transfer')) {
        type = 'transfer';
      } else {
        // Infer from description text
        const textLower = (rawDesc + ' ' + rawMerchant).toLowerCase();
        if (textLower.includes('salary') || textLower.includes('credit') || textLower.includes('refund') || textLower.includes('cashback')) {
          type = 'income';
        } else {
          type = 'expense';
        }
      }
    }

    if (amount <= 0 && debitVal === 0 && creditVal === 0) {
      return; // Skip records with 0 amount
    }

    const title = rawMerchant || rawDesc || (type === 'income' ? 'Income Deposit' : 'Expense Payment');

    normalized.push({
      rawRowIndex: idx + 1,
      date,
      amount,
      type,
      title: title.slice(0, 120),
      description: rawDesc,
      merchant: rawMerchant,
      category: rawCategory,
      reference: rawRef,
      paymentMethod: rawPayment,
      originalData: row
    });
  });

  return normalized;
};

/**
 * Validates the binary signature (magic bytes) of an Excel buffer.
 * Standard XLSX files are ZIP packages starting with PK\x03\x04 (0x50 0x4B 0x03 0x04)
 * or other valid PK ZIP headers (PK\x05\x06, PK\x07\x08).
 * Legacy XLS files use OLE2 Compound Document header (0xD0 0xCF 0x11 0xE0).
 */
export const validateExcelBufferSignature = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 4) {
    return { valid: false, message: 'Invalid or empty Excel file payload' };
  }

  const isZip =
    buffer[0] === 0x50 &&
    buffer[1] === 0x4B &&
    ((buffer[2] === 0x03 && buffer[3] === 0x04) ||
      (buffer[2] === 0x05 && buffer[3] === 0x06) ||
      (buffer[2] === 0x07 && buffer[3] === 0x08));

  const isOle =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  if (!isZip && !isOle) {
    return {
      valid: false,
      message: 'Invalid Excel file signature. File contents do not match expected format.'
    };
  }

  return { valid: true };
};

/**
 * Validates that a CSV buffer contains text rather than binary data.
 * Inspects initial bytes for null bytes (0x00) characteristic of executable or binary payloads.
 */
export const validateCSVBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { valid: false, message: 'Invalid or empty CSV file payload' };
  }

  const checkLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < checkLength; i++) {
    if (buffer[i] === 0) {
      return {
        valid: false,
        message: 'Invalid CSV format: binary content detected'
      };
    }
  }

  return { valid: true };
};
