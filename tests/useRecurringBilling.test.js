// 测试周期账单管理核心功能
/* eslint-env jest */
const { createRecurringBillingStore, BILLING_CYCLES, BILLING_TYPES } = require('../src/composables/useRecurringBilling.js')

describe('useRecurringBilling', () => {
  let store

  beforeEach(() => {
    store = createRecurringBillingStore()
  })

  test('初始状态检查', () => {
    expect(store.bills.value.length).toBe(0)
    expect(store.previewBills.value.length).toBe(0)
  })

  test('月度支出账单生成', () => {
    const monthlyBill = {
      id: 'test1',
      name: '月度账单',
      amount: 100,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01',
      description: '测试月度账单'
    }

    const monthlyResults = store.generateBills(monthlyBill, 12)
    expect(monthlyResults.length).toBe(12)
    expect(monthlyResults[0].dueDate).toBe('2024-01-01')
    expect(monthlyResults[1].dueDate).toBe('2024-02-01')
    expect(monthlyResults[11].dueDate).toBe('2024-12-01')
  })

  test('季度收入账单生成', () => {
    const quarterlyBill = {
      id: 'test2',
      name: '季度账单',
      amount: 300,
      type: BILLING_TYPES.INCOME,
      cycle: BILLING_CYCLES.QUARTERLY,
      startDate: '2024-01-01'
    }

    const quarterlyResults = store.generateBills(quarterlyBill, 5)
    expect(quarterlyResults.length).toBe(5)
    expect(quarterlyResults[0].dueDate).toBe('2024-01-01')
    expect(quarterlyResults[1].dueDate).toBe('2024-04-01')
    expect(quarterlyResults[4].dueDate).toBe('2025-01-01')
  })

  test('年度支出账单生成', () => {
    const yearlyBill = {
      id: 'test3',
      name: '年度账单',
      amount: 1200,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.YEARLY,
      startDate: '2024-01-01'
    }

    const yearlyResults = store.generateBills(yearlyBill, 3)
    expect(yearlyResults.length).toBe(3)
    expect(yearlyResults[0].dueDate).toBe('2024-01-01')
    expect(yearlyResults[1].dueDate).toBe('2025-01-01')
    expect(yearlyResults[2].dueDate).toBe('2026-01-01')
  })

  test('不规则周期（间隔天数）', () => {
    const irregularBill = {
      id: 'test4',
      name: '不规则账单',
      amount: 50,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.IRREGULAR,
      startDate: '2024-01-01',
      irregularInterval: 15
    }

    const irregularResults = store.generateBills(irregularBill, 3)
    expect(irregularResults.length).toBe(3)
  })

  test('自定义日期的不规则周期', () => {
    const customDatesBill = {
      id: 'test5',
      name: '自定义日期账单',
      amount: 80,
      type: BILLING_TYPES.INCOME,
      cycle: BILLING_CYCLES.IRREGULAR,
      startDate: '2024-01-01',
      customDates: ['2024-01-15', '2024-02-15', '2024-03-15']
    }

    const customDatesResults = store.generateBills(customDatesBill, 5)
    expect(customDatesResults.length).toBe(5)
    expect(customDatesResults[0].dueDate).toBe('2024-01-15')
    expect(customDatesResults[2].dueDate).toBe('2024-03-15')
  })

  test('添加支出账单', () => {
    store.addBill({
      name: '测试支出账单',
      amount: 99,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-06-01'
    })
    expect(store.bills.value.length).toBe(1)
    expect(store.bills.value[0].type).toBe(BILLING_TYPES.EXPENSE)
  })

  test('添加收入账单', () => {
    store.addBill({
      name: '测试收入账单',
      amount: 500,
      type: BILLING_TYPES.INCOME,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-06-01'
    })
    expect(store.bills.value.length).toBe(1)
    expect(store.bills.value[0].type).toBe(BILLING_TYPES.INCOME)
  })

  test('计算总金额 - 支出和收入分别统计', () => {
    store.currentBill.value = {
      name: '预览测试支出',
      amount: 100,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01'
    }
    store.regeneratePreview()
    expect(store.totalExpense.value).toBeGreaterThan(0)

    store.currentBill.value = {
      name: '预览测试收入',
      amount: 200,
      type: BILLING_TYPES.INCOME,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01'
    }
    store.regeneratePreview()
    expect(store.totalIncome.value).toBeGreaterThan(0)
  })

  test('按日期范围筛选', () => {
    store.addBill({
      name: '测试账单',
      amount: 100,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01'
    })
    store.regenerateAllPreviews()
    const filtered = store.getBillsByDateRange('2024-01-01', '2024-06-01')
    expect(filtered.length).toBeGreaterThan(0)
  })

  test('测试类型枚举', () => {
    expect(BILLING_TYPES.EXPENSE).toBe('expense')
    expect(BILLING_TYPES.INCOME).toBe('income')
  })

  test('删除账单', () => {
    store.addBill({
      name: '测试账单1',
      amount: 100,
      type: BILLING_TYPES.EXPENSE,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01'
    })
    store.addBill({
      name: '测试账单2',
      amount: 200,
      type: BILLING_TYPES.INCOME,
      cycle: BILLING_CYCLES.MONTHLY,
      startDate: '2024-01-01'
    })
    expect(store.bills.value.length).toBe(2)
    
    const billId = store.bills.value[0].id
    store.removeBill(billId)
    expect(store.bills.value.length).toBe(1)
    
    const billId2 = store.bills.value[0].id
    store.removeBill(billId2)
    expect(store.bills.value.length).toBe(0)
  })
})
