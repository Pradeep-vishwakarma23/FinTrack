import {
  generateMonthlyReport,
  generateMonthlyReportPDF,
  isValidMonthFormat
} from '../services/reportService.js';

/**
 * Controller to fetch deterministic monthly financial report JSON or stream PDF.
 * Route: GET /api/reports/monthly
 * Query params:
 *   month: YYYY-MM (e.g. 2026-09)
 *   format: 'pdf' (optional)
 *   year: YYYY (backward compatibility)
 */
export const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    let monthStr = req.query.month;

    // Backward compatibility: support year and month numbers if month query is a single number or year is provided
    if (req.query.year && (!monthStr || !monthStr.includes('-'))) {
      const y = parseInt(req.query.year, 10);
      const m = parseInt(req.query.monthNumber || monthStr || '1', 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        monthStr = `${y}-${String(m).padStart(2, '0')}`;
      }
    }

    // Default to current month if neither month nor year is provided
    if (!monthStr) {
      const now = new Date();
      monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!isValidMonthFormat(monthStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-09).'
      });
    }

    // If PDF requested via query param
    if (req.query.format === 'pdf') {
      return await generateMonthlyReportPDF({ userId, month: monthStr, res });
    }

    const reportData = await generateMonthlyReport({ userId, month: monthStr });

    return res.status(200).json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('[reportController] getMonthlyReport error:', error);
    if (!res.headersSent) {
      const statusCode = error.message?.includes('Invalid month') ? 400 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Server error generating monthly report.'
      });
    }
  }
};

/**
 * Controller dedicated to streaming the PDF version of a monthly report.
 * Route: GET /api/reports/monthly/pdf
 */
export const downloadMonthlyReportPDF = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    let monthStr = req.query.month;
    if (!monthStr) {
      const now = new Date();
      monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!isValidMonthFormat(monthStr)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-09).'
      });
    }

    return await generateMonthlyReportPDF({ userId, month: monthStr, res, format: req.query.format });
  } catch (error) {
    console.error('[reportController] downloadMonthlyReportPDF error:', error);
    if (!res.headersSent) {
      const statusCode = error.message?.includes('Invalid month') ? 400 : 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Server error exporting PDF report.'
      });
    }
  }
};

export default {
  getMonthlyReport,
  downloadMonthlyReportPDF
};