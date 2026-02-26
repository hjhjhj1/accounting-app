import { ref, computed, provide, inject } from 'vue'

export const RECURRING_BILLS_KEY = Symbol('recurring-bills')

export const PERIOD_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  IRREGULAR: 'irregular'
}

export const PERIOD_LABELS = {
  [PERIOD_TYPES.MONTHLY]: '月度',
  [PERIOD_TYPES.QUARTERLY]: '季度',
  [PERIOD_TYPES.YEARLY]: '年度',
  [PERIOD_TYPES.IRREGULAR]: '不规则'
}

export function createRecurringBillsStore() {
  const bills = ref([
    {
      id: 1,
      name: '房租',
      amount: 2500,
      periodType: PERIOD_TYPES.MONTHLY,
      startDate: '2026-01-01',
      dayOfMonth: 1,
      category: '住房',
      description: '每月房租',
      interval: 1,
      irregularDates: []
    },
    {
      id: 2,
      name: '网费',
      amount: 129,
      periodType: PERIOD_TYPES.MONTHLY,
      startDate: '2026-01-10',
      dayOfMonth: 10,
      category: '通信',
      description: '宽带费用',
      interval: 1,
      irregularDates: []
    },
    {
      id: 3,
      name: '物业费',
      amount: 800,
      periodType: PERIOD_TYPES.QUARTERLY,
      startDate: '2026-01-15',
      dayOfMonth: 15,
      category: '住房',
      description: '每季度物业费',
      interval: 1,
      irregularDates: []
    },
    {
      id: 4,
      name: '健身会员',
      amount: 2400,
      periodType: PERIOD_TYPES.YEARLY,
      startDate: '2026-03-01',
      dayOfMonth: 1,
      category: '运动',
      description: '年度健身卡',
      interval: 1,
      irregularDates: []
    }
  ])

  const generatedBills = ref([])
  const maxPeriods = ref(36)

  function addBill(bill) {
    const newId = bills.value.length > 0 ? Math.max(...bills.value.map(b => b.id)) + 1 : 1
    bills.value.push({ ...bill, id: newId })
    generateAllBills()
  }

  function updateBill(id, updates) {
    const index = bills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      bills.value[index] = { ...bills.value[index], ...updates }
      generateAllBills()
    }
  }

  function deleteBill(id) {
    bills.value = bills.value.filter(b => b.id !== id)
    generateAllBills()
  }

  function getBill(id) {
    return bills.value.find(b => b.id === id)
  }

  function calculateNextDate(bill, currentDate) {
    const date = new Date(currentDate)
    
    switch (bill.periodType) {
      case PERIOD_TYPES.MONTHLY:
        date.setMonth(date.getMonth() + bill.interval)
        break
      case PERIOD_TYPES.QUARTERLY:
        date.setMonth(date.getMonth() + (3 * bill.interval))
        break
      case PERIOD_TYPES.YEARLY:
        date.setFullYear(date.getFullYear() + bill.interval)
        break
      case PERIOD_TYPES.IRREGULAR:
        return null
    }
    
    if (bill.dayOfMonth) {
      const targetDay = Math.min(bill.dayOfMonth, getDaysInMonth(date))
      date.setDate(targetDay)
    }
    
    return date
  }

  function getDaysInMonth(date) {
    const testDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return testDate.getDate()
  }

  function generateBillInstances(bill, count = 36) {
    const instances = []
    
    if (bill.periodType === PERIOD_TYPES.IRREGULAR) {
      const sortedDates = [...bill.irregularDates].sort((a, b) => new Date(a) - new Date(b))
      sortedDates.slice(0, count).forEach((date, index) => {
        instances.push({
          ...bill,
          instanceId: `${bill.id}-${index}`,
          billId: bill.id,
          billName: bill.name,
          dueDate: date,
          periodIndex: index + 1,
          formattedDate: formatDate(date)
        })
      })
    } else {
      let currentDate = new Date(bill.startDate)
      
      for (let i = 0; i < count; i++) {
        instances.push({
          ...bill,
          instanceId: `${bill.id}-${i}`,
          billId: bill.id,
          billName: bill.name,
          dueDate: currentDate.toISOString().split('T')[0],
          periodIndex: i + 1,
          formattedDate: formatDate(currentDate)
        })
        
        currentDate = calculateNextDate(bill, currentDate)
        if (!currentDate) break
      }
    }
    
    return instances
  }

  function formatDate(date) {
    const d = new Date(date)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  function generateAllBills() {
    const allInstances = []
    
    bills.value.forEach(bill => {
      const instances = generateBillInstances(bill, maxPeriods.value)
      allInstances.push(...instances)
    })
    
    allInstances.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    generatedBills.value = allInstances
  }

  function getBillsByDateRange(startDate, endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return generatedBills.value.filter(instance => {
      const dueDate = new Date(instance.dueDate)
      return dueDate >= start && dueDate <= end
    })
  }

  function getMonthlyTotal(year, month) {
    const target = `${year}-${String(month).padStart(2, '0')}`
    return generatedBills.value
      .filter(b => b.dueDate.startsWith(target))
      .reduce((sum, b) => sum + b.amount, 0)
  }

  function getYearlyTotal(year) {
    const target = `${year}-`
    return generatedBills.value
      .filter(b => b.dueDate.startsWith(target))
      .reduce((sum, b) => sum + b.amount, 0)
  }

  const totalMonthlyAmount = computed(() => {
    return bills.value
      .filter(b => b.periodType === PERIOD_TYPES.MONTHLY)
      .reduce((sum, b) => sum + b.amount, 0)
  })

  const totalYearlyAmount = computed(() => {
    let total = 0
    bills.value.forEach(bill => {
      switch (bill.periodType) {
        case PERIOD_TYPES.MONTHLY:
          total += bill.amount * 12
          break
        case PERIOD_TYPES.QUARTERLY:
          total += bill.amount * 4
          break
        case PERIOD_TYPES.YEARLY:
          total += bill.amount
          break
        case PERIOD_TYPES.IRREGULAR:
          total += bill.amount * bill.irregularDates.length
          break
      }
    })
    return total
  })

  const billsCount = computed(() => bills.value.length)

  generateAllBills()

  return {
    bills,
    generatedBills,
    maxPeriods,
    totalMonthlyAmount,
    totalYearlyAmount,
    billsCount,
    addBill,
    updateBill,
    deleteBill,
    getBill,
    generateBillInstances,
    generateAllBills,
    getBillsByDateRange,
    getMonthlyTotal,
    getYearlyTotal
  }
}

export function provideRecurringBills() {
  const store = createRecurringBillsStore()
  provide(RECURRING_BILLS_KEY, store)
  return store
}

export function useRecurringBills() {
  const store = inject(RECURRING_BILLS_KEY)
  if (!store) {
    throw new Error('useRecurringBills() must be used within a RecurringBillsProvider')
  }
  return store
}
