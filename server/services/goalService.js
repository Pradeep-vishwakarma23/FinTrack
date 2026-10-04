/**
 * FinTrack Phase 6.4.1: Goal Deterministic Calculation Engine
 * Pure mathematical algorithms for savings goals, remaining timelines,
 * required contributions, and feasibility evaluation.
 * Deterministic only — LLMs never compute these figures.
 */

/**
 * Calculates remaining balance needed to reach target amount.
 * @param {Object} params
 * @param {number} params.targetAmount
 * @param {number} params.currentAmount
 * @returns {number} Non-negative remaining amount rounded to 2 decimal places.
 */
export const calculateRemainingAmount = ({ targetAmount = 0, currentAmount = 0 } = {}) => {
  const target = Math.max(0, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);
  const diff = target - current;
  return Number(Math.max(0, diff).toFixed(2));
};

/**
 * Calculates months remaining between reference date and target date.
 * If targetDate is in the current month, returns 1.
 * If targetDate is in the past, returns 0.
 * @param {Object} params
 * @param {Date|string} params.targetDate
 * @param {Date|string} [params.referenceDate]
 * @returns {number}
 */
export const calculateMonthsRemaining = ({ targetDate, referenceDate } = {}) => {
  if (!targetDate) return 0;
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) return 0;

  const ref = referenceDate ? new Date(referenceDate) : new Date();
  if (isNaN(ref.getTime())) return 0;

  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();
  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth();

  const totalMonths = (targetYear - refYear) * 12 + (targetMonth - refMonth);

  if (totalMonths < 0) {
    return 0; // Overdue / past
  }

  // Inclusive of current active month
  return totalMonths + 1;
};

/**
 * Calculates required monthly savings to achieve target on time.
 * @param {Object} params
 * @param {number} [params.targetAmount]
 * @param {number} [params.currentAmount]
 * @param {number} [params.remainingAmount]
 * @param {Date|string} [params.targetDate]
 * @param {Date|string} [params.referenceDate]
 * @param {number} [params.monthsRemaining]
 * @returns {number} Required monthly contribution.
 */
export const calculateRequiredMonthlySavings = ({
  targetAmount = 0,
  currentAmount = 0,
  remainingAmount,
  targetDate,
  referenceDate,
  monthsRemaining
} = {}) => {
  const rem = remainingAmount !== undefined
    ? Math.max(0, Number(remainingAmount) || 0)
    : calculateRemainingAmount({ targetAmount, currentAmount });

  if (rem <= 0) return 0;

  const months = monthsRemaining !== undefined
    ? Math.max(0, Number(monthsRemaining) || 0)
    : calculateMonthsRemaining({ targetDate, referenceDate });

  if (months <= 0) {
    return Number(rem.toFixed(2)); // Entire remaining amount due immediately
  }

  return Number((rem / months).toFixed(2));
};

/**
 * Calculates percentage progress towards target amount (0% to 100%).
 * @param {Object} params
 * @param {number} params.targetAmount
 * @param {number} params.currentAmount
 * @returns {number}
 */
export const calculateProgressPercentage = ({ targetAmount = 0, currentAmount = 0 } = {}) => {
  const target = Math.max(0, Number(targetAmount) || 0);
  const current = Math.max(0, Number(currentAmount) || 0);

  if (target <= 0) return 0;
  if (current <= 0) return 0;

  const pct = (current / target) * 100;
  return Number(Math.min(100, Math.max(0, pct)).toFixed(1));
};

/**
 * Determines deterministic feasibility of achieving goal based on user's net monthly savings.
 * @param {Object} params
 * @param {number} params.requiredMonthlySavings
 * @param {number} [params.netMonthlySavings]
 * @returns {Object} Feasibility score, category status, and explanation.
 */
export const calculateFeasibility = ({ requiredMonthlySavings = 0, netMonthlySavings = 0 } = {}) => {
  const req = Math.max(0, Number(requiredMonthlySavings) || 0);
  const net = Number(netMonthlySavings) || 0;

  if (req <= 0) {
    return {
      status: 'ACHIEVED',
      score: 100,
      message: 'Goal target amount has been achieved.'
    };
  }

  if (net <= 0) {
    return {
      status: 'UNFEASIBLE_DEFICIT',
      score: 0,
      message: 'Current cash flow is in a deficit. Monthly expenses exceed income.'
    };
  }

  if (net >= req) {
    return {
      status: 'HIGHLY_FEASIBLE',
      score: 100,
      message: 'Current net monthly savings fully cover the required monthly contribution.'
    };
  }

  const coveragePct = Math.round((net / req) * 100);

  if (coveragePct >= 70) {
    return {
      status: 'MODERATELY_FEASIBLE',
      score: coveragePct,
      message: `Current savings cover ${coveragePct}% of required monthly contribution. Minor budget adjustments recommended.`
    };
  }

  return {
    status: 'LOW_FEASIBILITY',
    score: coveragePct,
    message: `Current savings cover only ${coveragePct}% of required contribution. Re-evaluate timeline or reduce discretionary spending.`
  };
};

/**
 * Enriches a goal document or plain object with all computed metrics.
 * @param {Object} goal
 * @param {Object} [options]
 * @param {Date|string} [options.referenceDate]
 * @param {number} [options.netMonthlySavings]
 * @returns {Object}
 */
export const enrichGoalWithCalculations = (goal = {}, { referenceDate, netMonthlySavings = 0 } = {}) => {
  const plain = typeof goal.toObject === 'function' ? goal.toObject() : { ...goal };

  const targetAmount = Math.max(0, Number(plain.targetAmount) || 0);
  const currentAmount = Math.max(0, Number(plain.currentAmount) || 0);
  const targetDate = plain.targetDate;

  const remainingAmount = calculateRemainingAmount({ targetAmount, currentAmount });
  const monthsRemaining = calculateMonthsRemaining({ targetDate, referenceDate });
  const requiredMonthlySavings = calculateRequiredMonthlySavings({
    remainingAmount,
    monthsRemaining
  });
  const progressPercentage = calculateProgressPercentage({ targetAmount, currentAmount });
  const feasibility = calculateFeasibility({
    requiredMonthlySavings,
    netMonthlySavings
  });

  const refTime = (referenceDate ? new Date(referenceDate) : new Date()).getTime();
  const targetTime = targetDate ? new Date(targetDate).getTime() : 0;
  const isCompleted = currentAmount >= targetAmount || plain.status === 'completed';
  const isOverdue = !isCompleted && targetTime < refTime && monthsRemaining === 0;

  return {
    ...plain,
    remainingAmount,
    progressPercentage,
    monthsRemaining,
    requiredMonthlySavings,
    feasibility,
    isCompleted,
    isOverdue
  };
};
