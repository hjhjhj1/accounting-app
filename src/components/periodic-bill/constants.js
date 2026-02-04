// 周期类型定义
export const PeriodType = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
}

// 周期类型显示文本
export const PeriodTypeLabels = {
  [PeriodType.MONTHLY]: '月度',
  [PeriodType.QUARTERLY]: '季度',
  [PeriodType.YEARLY]: '年度',
  [PeriodType.CUSTOM]: '自定义'
}

// 周期类型对应的月份间隔
export const PeriodTypeMonths = {
  [PeriodType.MONTHLY]: 1,
  [PeriodType.QUARTERLY]: 3,
  [PeriodType.YEARLY]: 12,
  [PeriodType.CUSTOM]: 0 // 自定义周期需要单独设置
}
