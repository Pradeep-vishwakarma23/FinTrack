import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  uploadCSV,
  uploadExcel,
  ingestSMSMessages,
  getImportBatches,
  getImportBatchById,
  getStagedTransactions,
  updateStagedTransaction,
  confirmTransaction,
  ignoreTransaction,
  confirmAllBatchTransactions,
  deleteImportBatch
} from '../controllers/importController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.use(protect);

router.post('/csv', upload.single('file'), uploadCSV);
router.post('/excel', upload.single('file'), uploadExcel);
router.post('/sms', upload.single('file'), ingestSMSMessages);
router.get('/', getImportBatches);
router.get('/:id', getImportBatchById);
router.get('/:id/transactions', getStagedTransactions);
router.patch('/transactions/:id', updateStagedTransaction);
router.post('/transactions/:id/confirm', confirmTransaction);
router.post('/transactions/:id/ignore', ignoreTransaction);
router.post('/:id/confirm-all', confirmAllBatchTransactions);
router.delete('/:id', deleteImportBatch);

export default router;
