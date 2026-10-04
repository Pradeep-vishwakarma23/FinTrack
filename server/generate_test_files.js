import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';

const testDir = path.resolve('d:/Major project/Finance-Tracker-Initial-Codes/test_files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 1. Synthetic Bank Statement CSV
const csvData = `Date,Description,Withdrawal,Deposit,Reference
15/08/2025,UPI/SWIGGY/4582910283/BANGALORE,450.00,,UPI458291
16/08/2025,NEFT CR-INFOSYS TECHNOLOGIES-SALARY,,95000.00,NEFT98271
17/08/2025,UBER INDIA RIDES BANGALORE,320.50,,UBER77123
18/08/2025,ELECTRICITY BESCOM ONLINE PAYMENT,1850.00,,BESCOM991
19/08/2025,AMAZON PAY INDIA PURCHASE,2499.00,,AMZN88192
20/08/2025,NETFLIX ENTERTAINMENT SUBSCRIPTION,649.00,,NETFLIX001
21/08/2025,ZERODHA BROKING EQUITY INVESTMENT,15000.00,,ZERODHA99
22/08/2025,APOLLO PHARMACY MEDICALS,560.00,,APOLLO123
`;

fs.writeFileSync(path.join(testDir, 'synthetic_hdfc_statement.csv'), csvData, 'utf-8');

// 2. Synthetic Bank Statement XLSX
const excelData = [
  { 'Txn Date': '2025-08-10', 'Narration': 'ZOMATO ONLINE RESTAURANT', 'Debit Amount': 680.00, 'Credit Amount': 0, 'Ref No': 'ZOM99182' },
  { 'Txn Date': '2025-08-11', 'Narration': 'AIRTEL PREPAID RECHARGE', 'Debit Amount': 479.00, 'Credit Amount': 0, 'Ref No': 'AIR88271' },
  { 'Txn Date': '2025-08-12', 'Narration': 'FLIPKART INTERNET RETAIL', 'Debit Amount': 3499.00, 'Credit Amount': 0, 'Ref No': 'FLP33190' },
  { 'Txn Date': '2025-08-13', 'Narration': 'GROWW INVESTMENTS MUTUAL FUND', 'Debit Amount': 5000.00, 'Credit Amount': 0, 'Ref No': 'GRW55123' },
  { 'Txn Date': '2025-08-14', 'Narration': 'DIVIDEND CREDIT TCS LTD', 'Debit Amount': 0, 'Credit Amount': 1200.00, 'Ref No': 'DIV77102' }
];

const worksheet = xlsx.utils.json_to_sheet(excelData);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'HDFC_Statement');
xlsx.writeFile(workbook, path.join(testDir, 'synthetic_icici_statement.xlsx'));

console.log('Created synthetic test files successfully in:', testDir);
