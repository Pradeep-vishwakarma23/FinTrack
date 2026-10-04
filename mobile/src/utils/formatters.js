/**
 * Currency, date, and text formatters for FinTrack Mobile
 */

export const formatCurrency = (amount, currency = 'INR') => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    })}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(num);
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    
    if (options.short) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
    }

    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(dateString);
  }
};

export const maskAccountNumber = (accountStr) => {
  if (!accountStr || typeof accountStr !== 'string') return '';
  const digits = accountStr.replace(/\D/g, '');
  if (digits.length <= 4) return `A/c XX${digits}`;
  return `A/c XX${digits.slice(-4)}`;
};

export const getConfidenceColor = (confidenceScore) => {
  const score = typeof confidenceScore === 'number' ? confidenceScore : parseFloat(confidenceScore) || 0;
  if (score >= 90) return '#10B981'; // Green
  if (score >= 70) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
};
