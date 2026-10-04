import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getMonthlyReport, downloadMonthlyReportPDF } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);
router.get('/monthly', getMonthlyReport);
router.get('/monthly/pdf', downloadMonthlyReportPDF);

export default router;
