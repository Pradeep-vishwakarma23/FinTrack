import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, categories, paymentMethods } from '../utils/format'

describe('Format Utility Functions', () => {
  it('formats values as Indian Rupee (INR)', () => {
    expect(formatCurrency(1000)).toBe('₹1,000')
    expect(formatCurrency(50000)).toBe('₹50,000')
    expect(formatCurrency(0)).toBe('₹0')
    expect(formatCurrency(null)).toBe('₹0')
  })

  it('formats dates consistently to en-IN format', () => {
    const formatted = formatDate('2026-03-15T00:00:00.000Z')
    expect(formatted).toContain('2026')
    expect(formatDate(null)).toBe('-')
  })

  it('provides predefined categories and payment methods list', () => {
    expect(categories).toContain('Salary')
    expect(categories).toContain('Food')
    expect(categories).toContain('Rent')
    expect(categories.length).toBe(12)

    expect(paymentMethods).toContain('upi')
    expect(paymentMethods).toContain('card')
    expect(paymentMethods.length).toBe(6)
  })
})
