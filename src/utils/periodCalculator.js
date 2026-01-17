export const PeriodType = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  IRREGULAR: 'irregular'
}

export function calculateNextBillingDate(currentDate, periodType, customInterval = null) {
  const date = new Date(currentDate)

  switch (periodType) {
    case PeriodType.MONTHLY:
      date.setMonth(date.getMonth() + 1)
      break
    case PeriodType.QUARTERLY:
      date.setMonth(date.getMonth() + 3)
      break
    case PeriodType.YEARLY:
      date.setFullYear(date.getFullYear() + 1)
      break
    case PeriodType.IRREGULAR:
      if (customInterval && customInterval.days) {
        date.setDate(date.getDate() + customInterval.days)
      } else if (customInterval && customInterval.months) {
        date.setMonth(date.getMonth() + customInterval.months)
      }
      break
    default:
      throw new Error(`Unsupported period type: ${periodType}`)
  }

  return date
}

export function generateBillingSchedule(startDate, periodType, totalPeriods = 36, customSchedule = null) {
  const schedule = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < totalPeriods; i++) {
    const billingDate = new Date(currentDate)

    schedule.push({
      id: `bill-${i + 1}`,
      periodNumber: i + 1,
      date: billingDate,
      dateText: formatDate(billingDate),
      status: 'pending',
      amount: 0
    })

    if (periodType === PeriodType.IRREGULAR && customSchedule && customSchedule[i]) {
      const interval = customSchedule[i]
      if (interval.days) {
        currentDate.setDate(currentDate.getDate() + interval.days)
      } else if (interval.months) {
        currentDate.setMonth(currentDate.getMonth() + interval.months)
      }
    } else {
      currentDate = calculateNextBillingDate(currentDate, periodType, customSchedule?.[0])
    }
  }

  return schedule
}

export function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPeriodTypeName(periodType) {
  const names = {
    [PeriodType.MONTHLY]: '月度',
    [PeriodType.QUARTERLY]: '季度',
    [PeriodType.YEARLY]: '年度',
    [PeriodType.IRREGULAR]: '不规则'
  }
  return names[periodType] || periodType
}

export function generateIrregularSchedule(intervals) {
  return intervals.map(interval => {
    if (typeof interval === 'number') {
      return { days: interval }
    }
    return interval
  })
}

export default {
  PeriodType,
  calculateNextBillingDate,
  generateBillingSchedule,
  formatDate,
  getPeriodTypeName,
  generateIrregularSchedule
}
