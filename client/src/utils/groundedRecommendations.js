/**
 * Pure helper to generate data-grounded financial recommendations
 * derived strictly from Phase 6.1 Banking Intelligence data.
 */

export const formatMonthLabel = (periodStr) => {
  if (!periodStr || typeof periodStr !== 'string') return 'this period'
  const parts = periodStr.split('-')
  if (parts.length !== 2) return periodStr
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const date = new Date(year, month, 1)
  if (isNaN(date.getTime())) return periodStr
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const formatINR = (val) =>
  `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export const generateGroundedRecommendations = ({
  summary = null,
  anomalies = [],
  forecast = null,
  period = ''
} = {}) => {
  const recommendations = []
  const monthLabel = formatMonthLabel(period)

  const metrics = summary?.metrics || {}
  const totalIncome = Number(metrics.totalIncome || 0)
  const totalExpense = Number(metrics.totalExpense || 0)
  const netSavings = Number(metrics.netSavings !== undefined ? metrics.netSavings : totalIncome - totalExpense)
  const savingsRate = Number(metrics.savingsRate || 0)
  const isDeficit = metrics.isDeficit || netSavings < 0
  const transactionCount = Number(metrics.transactionCount || 0)

  const categories = Array.isArray(summary?.categorySpending) ? summary.categorySpending : []
  const anomalyList = Array.isArray(anomalies) && anomalies.length > 0
    ? anomalies
    : (Array.isArray(summary?.anomalies) ? summary.anomalies : [])
  const activeForecast = forecast || summary?.forecast || null

  // 1. Zero transactions check
  if (transactionCount === 0 && totalIncome === 0 && totalExpense === 0) {
    return [
      `No transaction records found for ${monthLabel}. Record your income and expenses to unlock data-grounded insights.`
    ]
  }

  // 2. Cashflow & Savings Analysis (strictly avoids contradictory positive savings messaging during deficit)
  if (isDeficit) {
    recommendations.push(
      `Cash Flow Deficit: Total expenses (${formatINR(totalExpense)}) exceed recorded income (${formatINR(totalIncome)}) by ${formatINR(Math.abs(netSavings))} for ${monthLabel}.`
    )
    recommendations.push(
      'Consider auditing recent purchases and minimizing discretionary expenses to recover cash flow balance.'
    )
  } else if (totalIncome > 0 && netSavings > 0) {
    recommendations.push(
      `Positive Savings: Your net savings for ${monthLabel} are ${formatINR(netSavings)}, representing a savings rate of ${savingsRate}% on recorded earnings.`
    )
    if (savingsRate >= 20) {
      recommendations.push(
        'Solid financial discipline! Consider allocating surplus savings into emergency funds or assets.'
      )
    }
  } else if (totalIncome > 0 && totalExpense === 0) {
    recommendations.push(
      `All recorded income (${formatINR(totalIncome)}) has been preserved with zero expenses for ${monthLabel}.`
    )
  }

  // 3. Category Spending Insights & Trimming Recommendation
  if (categories.length > 0 && totalExpense > 0) {
    const topCat = categories[0]
    recommendations.push(
      `Highest Category Spend: ${topCat.category} is your top expense category, totaling ${formatINR(topCat.amount)} (${topCat.percentage}% of total expenses).`
    )

    if (topCat.amount > 0) {
      const potentialSaving = Math.round(topCat.amount * 0.15)
      recommendations.push(
        `Reducing ${topCat.category} spending by 15% would save approximately ${formatINR(potentialSaving)} in ${monthLabel}.`
      )
    }
  }

  // 4. Category Over-Budget Alerts
  const overBudgetCats = categories.filter((c) => c.isOverBudget)
  for (const oc of overBudgetCats) {
    recommendations.push(
      `Category Overspend: ${oc.category} spending (${formatINR(oc.amount)}) exceeded your target limit of ${formatINR(oc.budgetLimit)}.`
    )
  }

  // 5. Anomaly Alerts (Only if actual anomalies exist)
  if (anomalyList.length > 0) {
    const topAnomaly = anomalyList[0]
    const countText = anomalyList.length === 1 ? '1 spending anomaly' : `${anomalyList.length} spending anomalies`
    recommendations.push(
      `Anomaly Alert: ${countText} detected in ${monthLabel}, including ${topAnomaly.title || topAnomaly.merchant} (${formatINR(topAnomaly.amount)}).`
    )
  }

  // 6. Forecast & Budget Risk Guidance
  if (activeForecast && activeForecast.projectedExpense > 0) {
    const dailyBurnRate = activeForecast.dailyBurnRate || 0
    const projectedExpense = activeForecast.projectedExpense || 0
    recommendations.push(
      `Spending Pace: Current daily burn rate is ${formatINR(dailyBurnRate)}/day, with projected month-end expenses of ${formatINR(projectedExpense)}.`
    )

    const monthlyBudget = Number(activeForecast.monthlyBudget || metrics.monthlyBudget || 0)
    const riskLevel = activeForecast.riskLevel || 'SAFE'

    if (monthlyBudget > 0) {
      if (riskLevel === 'CRITICAL') {
        const overrun = Math.max(0, projectedExpense - monthlyBudget)
        recommendations.push(
          `Critical Budget Alert: Projected spending (${formatINR(projectedExpense)}) exceeds your ${formatINR(monthlyBudget)} budget by ${formatINR(overrun)}.`
        )
      } else if (riskLevel === 'ELEVATED') {
        recommendations.push(
          `Elevated Budget Pace: Spending is projected to utilize ${activeForecast.riskDetails?.projectedUtilization || 90}% of your monthly budget.`
        )
      } else if (riskLevel === 'SAFE') {
        const surplus = Math.max(0, monthlyBudget - projectedExpense)
        recommendations.push(
          `Healthy Budget Pace: Spending is on track with a projected surplus of ${formatINR(surplus)}.`
        )
      }
    }
  }

  return recommendations
}
