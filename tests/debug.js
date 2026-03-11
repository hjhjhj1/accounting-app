const { createRecurringBillingStore, BILLING_CYCLES } = require('../src/composables/useRecurringBilling.js')
const { ref, computed } = require('vue')
global.ref = ref
global.computed = computed

const store = createRecurringBillingStore()

// 测试季度账单
const quarterlyBill = {
  id: 'test2',
  name: '季度账单',
  amount: 300,
  cycle: BILLING_CYCLES.QUARTERLY,
  startDate: '2024-01-01'
}
const quarterlyResults = store.generateBills(quarterlyBill, 4)
console.log('季度账单:', quarterlyResults.map(r => r.dueDate))
console.log('期望第4期: 2025-01-01')

// 测试自定义日期
const customDatesBill = {
  id: 'test5',
  name: '自定义日期账单',
  amount: 80,
  cycle: BILLING_CYCLES.IRREGULAR,
  startDate: '2024-01-01',
  customDates: ['2024-01-15', '2024-02-15', '2024-03-15']
}
const customDatesResults = store.generateBills(customDatesBill, 5)
console.log('自定义日期:', customDatesResults.map(r => r.dueDate))
console.log('期望第1期: 2024-01-15')
console.log('期望第3期: 2024-03-15')
