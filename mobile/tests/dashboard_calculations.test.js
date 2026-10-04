describe('FinTrack Mobile - Mathematical Integrity & Edge Case Validation', () => {
  const calculateSavingsRate = (totalIncome, totalExpense) => {
    if (!totalIncome || Number(totalIncome) <= 0) return 0;
    const rate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
    return Math.max(-100, Math.min(100, rate));
  };

  const calculateBudgetRemaining = (monthlyBudget, totalExpense) => {
    if (!monthlyBudget || Number(monthlyBudget) <= 0) return 0;
    return monthlyBudget - totalExpense;
  };

  const calculateCategoryPercentage = (categoryAmount, totalExpense) => {
    if (!totalExpense || Number(totalExpense) <= 0) return 0;
    return Number(((categoryAmount / totalExpense) * 100).toFixed(1));
  };

  describe('Savings Rate Math', () => {
    it('should return 0 when totalIncome is 0 to prevent division by zero or NaN', () => {
      expect(calculateSavingsRate(0, 500)).toBe(0);
      expect(calculateSavingsRate(0, 0)).toBe(0);
      expect(calculateSavingsRate(null, 1000)).toBe(0);
      expect(calculateSavingsRate(undefined, 0)).toBe(0);
    });

    it('should return 100% when totalExpense is 0 and totalIncome > 0', () => {
      expect(calculateSavingsRate(50000, 0)).toBe(100);
    });

    it('should calculate accurate positive savings rates', () => {
      // Income = 30,000, Expenses = 9,000 => Savings = 21,000 => Rate = 70%
      expect(calculateSavingsRate(30000, 9000)).toBe(70);

      // Income = 100,000, Expenses = 25,000 => Rate = 75%
      expect(calculateSavingsRate(100000, 25000)).toBe(75);

      // Income = 40,000, Expenses = 30,000 => Rate = 25%
      expect(calculateSavingsRate(40000, 30000)).toBe(25);
    });

    it('should handle negative savings rates when expenses exceed income', () => {
      // Income = 20,000, Expenses = 25,000 => Rate = -25%
      expect(calculateSavingsRate(20000, 25000)).toBe(-25);
    });
  });

  describe('Budget Remaining Math', () => {
    it('should return 0 when monthlyBudget is not configured or 0', () => {
      expect(calculateBudgetRemaining(0, 5000)).toBe(0);
      expect(calculateBudgetRemaining(null, 2000)).toBe(0);
    });

    it('should calculate positive remaining budget when within limits', () => {
      // Budget = 50,000, Expenses = 38,000 => Remaining = 12,000
      expect(calculateBudgetRemaining(50000, 38000)).toBe(12000);
    });

    it('should return negative amount when over budget', () => {
      // Budget = 20,000, Expenses = 24,000 => Over budget by -4,000
      expect(calculateBudgetRemaining(20000, 24000)).toBe(-4000);
    });
  });

  describe('Category Percentage Math', () => {
    it('should return 0 for zero total expense', () => {
      expect(calculateCategoryPercentage(0, 0)).toBe(0);
    });

    it('should calculate exact percentage rounded to 1 decimal place', () => {
      // Food = 3,200, Total = 9,000 => (3200 / 9000) * 100 = 35.555% => 35.6%
      expect(calculateCategoryPercentage(3200, 9000)).toBe(35.6);

      // Shopping = 4,500, Total = 9,000 => 50.0%
      expect(calculateCategoryPercentage(4500, 9000)).toBe(50.0);
    });
  });
});
