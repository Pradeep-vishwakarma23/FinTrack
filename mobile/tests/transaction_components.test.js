import { getSourceBadge } from '../src/components/transactions/TransactionCard.jsx';
import { formatCurrency, formatDate } from '../src/utils/formatters.js';

describe('FinTrack Mobile - Transaction Ledger Helpers & Badges', () => {
  describe('getSourceBadge mapping', () => {
    it('should return Notification badge with primary variant', () => {
      const badge = getSourceBadge('notification');
      expect(badge.label).toBe('📱 Notification');
      expect(badge.variant).toBe('primary');
    });

    it('should return SMS badge with warning variant', () => {
      const badge = getSourceBadge('sms');
      expect(badge.label).toBe('💬 SMS');
      expect(badge.variant).toBe('warning');
    });

    it('should return Email badge with info variant', () => {
      const badge = getSourceBadge('email');
      expect(badge.label).toBe('✉️ Email');
      expect(badge.variant).toBe('info');
    });

    it('should return CSV / Excel / Manual badge', () => {
      expect(getSourceBadge('csv').label).toBe('📄 CSV');
      expect(getSourceBadge('excel').label).toBe('📊 Excel');
      expect(getSourceBadge('manual').label).toBe('✏️ Manual');
    });

    it('should return null for unknown or empty source', () => {
      expect(getSourceBadge('')).toBeNull();
      expect(getSourceBadge(null)).toBeNull();
    });
  });

  describe('Currency & Date formatting in ledger', () => {
    it('should format transaction amounts with Rupee sign', () => {
      expect(formatCurrency(480)).toBe('₹480');
      expect(formatCurrency(1250)).toBe('₹1,250');
      expect(formatCurrency(30000)).toBe('₹30,000');
    });

    it('should format short dates properly for cards', () => {
      const formatted = formatDate('2026-09-26T14:30:00Z', { short: true });
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
    });
  });
});
