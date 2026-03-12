import { ref, computed, provide, inject } from 'vue'

const RECURRING_BILLING_KEY = Symbol('RECURRING_BILLING')

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  IRREGULAR: 'irregular'
}

export const BILLING_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income'
}

export function createRecurringBillingStore() {
  const bills = ref([])
  const currentBill = ref({
    name: '',
    amount: 0,
    type: BILLING_TYPES.EXPENSE,
    cycle: BILLING_CYCLES.MONTHLY,
    startDate: new Date().toISOString().split('T')[0],
    irregularInterval: 1,
    customDates: [],
    description: ''
  })
  
  const previewBills = ref([])
  const previewCount = ref(36)

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const generateBills = (bill, count = 36) => {
    const generated = []
    
    for (let i = 0; i < count; i++) {
      let dueDate
      
      if (bill.cycle === BILLING_CYCLES.IRREGULAR && bill.customDates?.length > 0) {
        const dateIndex = i % bill.customDates.length
        const dateStr = bill.customDates[dateIndex]
        const [year, month, day] = dateStr.split('-').map(Number)
        const yearAdd = Math.floor(i / bill.customDates.length)
        dueDate = new Date(year + yearAdd, month - 1, day)
      } else if (bill.cycle === BILLING_CYCLES.IRREGULAR) {
        const [year, month, day] = bill.startDate.split('-').map(Number)
        dueDate = new Date(year, month - 1, day)
        dueDate.setDate(dueDate.getDate() + (bill.irregularInterval || 30) * i)
      } else {
        const [year, month, day] = bill.startDate.split('-').map(Number)
        dueDate = new Date(year, month - 1, day)
        switch (bill.cycle) {
          case BILLING_CYCLES.MONTHLY:
            dueDate.setMonth(dueDate.getMonth() + i)
            break
          case BILLING_CYCLES.QUARTERLY:
            dueDate.setMonth(dueDate.getMonth() + i * 3)
            break
          case BILLING_CYCLES.YEARLY:
            dueDate.setFullYear(dueDate.getFullYear() + i)
            break
        }
      }
      
      generated.push({
        id: `${bill.id || 'temp'}-${i}`,
        name: bill.name,
        amount: bill.amount,
        type: bill.type,
        dueDate: formatDate(dueDate),
        cycle: bill.cycle,
        period: i + 1,
        description: bill.description
      })
    }
    
    return generated
  }

  const regeneratePreview = () => {
    if (currentBill.value.name && currentBill.value.amount > 0) {
      previewBills.value = generateBills(currentBill.value, previewCount.value)
    } else {
      previewBills.value = []
    }
  }

  const addBill = (billData) => {
    const newBill = {
      ...billData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    }
    bills.value.push(newBill)
    regenerateAllPreviews()
  }

  const removeBill = (billId) => {
    bills.value = bills.value.filter(b => b.id !== billId)
    regenerateAllPreviews()
  }

  const updateBill = (billId, billData) => {
    const index = bills.value.findIndex(b => b.id === billId)
    if (index !== -1) {
      bills.value[index] = { ...bills.value[index], ...billData }
      regenerateAllPreviews()
    }
  }

  const regenerateAllPreviews = () => {
    const allPreviews = []
    bills.value.forEach(bill => {
      const generated = generateBills(bill, previewCount.value)
      allPreviews.push(...generated)
    })
    allPreviews.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    previewBills.value = allPreviews
  }

  const allBillsPreview = computed(() => {
    return previewBills.value
  })

  const totalAmount = computed(() => {
    return previewBills.value.reduce((sum, bill) => sum + bill.amount, 0)
  })

  const totalExpense = computed(() => {
    return previewBills.value
      .filter(bill => bill.type === BILLING_TYPES.EXPENSE)
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const totalIncome = computed(() => {
    return previewBills.value
      .filter(bill => bill.type === BILLING_TYPES.INCOME)
      .reduce((sum, bill) => sum + bill.amount, 0)
  })

  const getBillsByDateRange = (startDate, endDate) => {
    return previewBills.value.filter(bill => {
      const dueDate = new Date(bill.dueDate)
      return dueDate >= new Date(startDate) && dueDate <= new Date(endDate)
    })
  }

  return {
    bills,
    currentBill,
    previewBills,
    previewCount,
    allBillsPreview,
    totalAmount,
    totalExpense,
    totalIncome,
    generateBills,
    regeneratePreview,
    addBill,
    removeBill,
    updateBill,
    regenerateAllPreviews,
    getBillsByDateRange
  }
}

export function provideRecurringBilling() {
  const store = createRecurringBillingStore()
  provide(RECURRING_BILLING_KEY, store)
  return store
}

export function useRecurringBilling() {
  const store = inject(RECURRING_BILLING_KEY)
  if (!store) {
    throw new Error('useRecurringBilling() must be used within a component that provides the store')
  }
  return store
}
