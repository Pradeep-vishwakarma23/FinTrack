import {
  formatCurrency,
  formatDate,
  maskAccountNumber,
  getConfidenceColor,
} from '../src/utils/formatters.js';

describe('FinTrack Mobile - Formatters & UI Helpers', () => {
  describe('formatCurrency', () => {
    it('should format INR currency properly with rupee symbol', () => {
      expect(formatCurrency(480)).toBe('₹480');
      expect(formatCurrency(1250)).toBe('₹1,250');
      expect(formatCurrency(30000)).toBe('₹30,000');
      expect(formatCurrency(99.5)).toBe('₹99.50');
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0)).toBe('₹0');
      expect(formatCurrency(-500)).toBe('₹-500');
    });

    it('should handle string inputs gracefully', () => {
      expect(formatCurrency('1500')).toBe('₹1,500');
      expect(formatCurrency(null)).toBe('₹0');
    });
  });

  describe('formatDate', () => {
    it('should format standard ISO dates to Indian date format', () => {
      const result = formatDate('2026-09-26T10:30:00Z');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).not.toBe('N/A');
    });

    it('should format short dates', () => {
      const result = formatDate('2026-09-26T10:30:00Z', { short: true });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should return N/A for null or invalid dates', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
      expect(formatDate('invalid-date-string')).toBe('N/A');
    });
  });

  describe('maskAccountNumber', () => {
    it('should mask full bank account numbers keeping only the last 4 digits', () => {
      expect(maskAccountNumber('5010043219876')).toBe('A/c XX9876');
      expect(maskAccountNumber('XXXX1234')).toBe('A/c XX1234');
      expect(maskAccountNumber('A/c 9876')).toBe('A/c XX9876');
    });

    it('should handle short digit strings', () => {
      expect(maskAccountNumber('123')).toBe('A/c XX123');
      expect(maskAccountNumber('')).toBe('');
    });
  });

  describe('getConfidenceColor', () => {
    it('should return green for high confidence >= 90', () => {
      expect(getConfidenceColor(96)).toBe('#10B981');
      expect(getConfidenceColor(90)).toBe('#10B981');
    });

    it('should return amber for medium confidence between 70 and 89', () => {
      expect(getConfidenceColor(85)).toBe('#F59E0B');
      expect(getConfidenceColor(70)).toBe('#F59E0B');
    });

    it('should return red for low confidence < 70', () => {
      expect(getConfidenceColor(65)).toBe('#EF4444');
      expect(getConfidenceColor(40)).toBe('#EF4444');
    });
  });
});
