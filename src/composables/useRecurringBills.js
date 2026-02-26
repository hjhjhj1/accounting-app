import { ref, provide, inject, readonly } from 'vue'

const RecurringBillsSymbol = Symbol('recurringBills')

export const PeriodType = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  CUSTOM: 'custom'
}

export const periodOptions = [
  { value: PeriodType.MONTHLY, label: '月度', months: 1 },
  { value: PeriodType.QUARTERLY, label: '季度', months: 3 },
  { value: PeriodType.YEARLY, label: '年度', months: 12 },
  { value: PeriodType.CUSTOM, label: '自定义', months: 0 }
]

// 创建状态管理对象
export function createRecurringBillsState() {
  const recurringBills = ref([])
  const loading = ref(false)
  const previewBills = ref([])

  const generatePreviewBills = (billConfig, periods = 36) => {
    const bills = []
    const startDate = new Date(billConfig.startDate)
    const amount = parseFloat(billConfig.amount)
    
    for (let i = 0; i < periods; i++) {
      const billDate = new Date(startDate)
      
      switch (billConfig.periodType) {
        case PeriodType.MONTHLY:
          billDate.setMonth(startDate.getMonth() + i)
          break
        case PeriodType.QUARTERLY:
          billDate.setMonth(startDate.getMonth() + i * 3)
          break
        case PeriodType.YEARLY:
          billDate.setFullYear(startDate.getFullYear() + i)
          break
        case PeriodType.CUSTOM:
          if (billConfig.customMonths && billConfig.customMonths.length > 0) {
            const customMonth = billConfig.customMonths[i % billConfig.customMonths.length]
            const yearOffset = Math.floor(i / billConfig.customMonths.length)
            billDate.setFullYear(startDate.getFullYear() + yearOffset)
            billDate.setMonth(customMonth - 1)
          } else {
            billDate.setMonth(startDate.getMonth() + i)
          }
          break
      }
      
      bills.push({
        id: `preview-${i}`,
        periodNumber: i + 1,
        date: billDate.toISOString().split('T')[0],
        amount: amount,
        description: billConfig.description || '',
        category: billConfig.category || '',
        type: billConfig.type || 'expense',
        status: 'pending'
      })
    }
    
    previewBills.value = bills
    return bills
  }

  const addRecurringBill = (bill) => {
    const newBill = {
      id: Date.now().toString(),
      ...bill,
      createdAt: new Date().toISOString()
    }
    recurringBills.value.push(newBill)
    saveToStorage()
    return newBill
  }

  const updateRecurringBill = (id, updates) => {
    const index = recurringBills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      recurringBills.value[index] = { ...recurringBills.value[index], ...updates }
      saveToStorage()
      return true
    }
    return false
  }

  const deleteRecurringBill = (id) => {
    const index = recurringBills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      recurringBills.value.splice(index, 1)
      saveToStorage()
      return true
    }
    return false
  }

  const getRecurringBillById = (id) => {
    return recurringBills.value.find(b => b.id === id)
  }

  const saveToStorage = () => {
    localStorage.setItem('recurringBills', JSON.stringify(recurringBills.value))
  }

  const loadFromStorage = () => {
    const stored = localStorage.getItem('recurringBills')
    if (stored) {
      try {
        recurringBills.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to load recurring bills:', e)
        recurringBills.value = []
      }
    }
  }

  const getPeriodLabel = (periodType) => {
    const option = periodOptions.find(opt => opt.value === periodType)
    return option ? option.label : '未知'
  }

  const calculateTotalAmount = (billConfig, periods = 36) => {
    return parseFloat(billConfig.amount || 0) * periods
  }

  // 立即加载存储的数据
  loadFromStorage()

  return {
    recurringBills: readonly(recurringBills),
    previewBills: readonly(previewBills),
    loading: readonly(loading),
    generatePreviewBills,
    addRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    getRecurringBillById,
    getPeriodLabel,
    calculateTotalAmount,
    saveToStorage,
    loadFromStorage
  }
}

// Provider - 在组件中调用
export function provideRecurringBills() {
  const state = createRecurringBillsState()
  provide(RecurringBillsSymbol, state)
  return state
}

// Inject - 在子组件中调用
export function useRecurringBills() {
  const state = inject(RecurringBillsSymbol, null)
  if (!state) {
    // 如果没有找到provider，返回null让调用者处理
    console.warn('useRecurringBills: No provider found, returning null')
    return null
  }
  return state
}

// 用于在setup中直接使用（不依赖provide/inject）
export function useRecurringBillsDirect() {
  return createRecurringBillsState()
}
