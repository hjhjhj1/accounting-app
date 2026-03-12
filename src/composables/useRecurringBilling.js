import { ref, computed, provide, inject } from 'vue'

const RECURRING_BILLING_KEY = Symbol('recurringBilling')

export function createRecurringBillingStore() {
  const bills = ref([])
  const generatedBills = ref([])
  const currentBill = ref(null)
  const loading = ref(false)

  const cycleTypes = {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    YEARLY: 'yearly',
    IRREGULAR: 'irregular'
  }

  const cycleLabels = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则周期'
  }

  const addBill = (bill) => {
    const newBill = {
      id: Date.now(),
      ...bill,
      createdAt: new Date().toISOString()
    }
    bills.value.push(newBill)
    generateBills()
  }

  const updateBill = (id, updatedBill) => {
    const index = bills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      bills.value[index] = { ...bills.value[index], ...updatedBill }
      generateBills()
    }
  }

  const deleteBill = (id) => {
    bills.value = bills.value.filter(b => b.id !== id)
    generateBills()
  }

  const setCurrentBill = (bill) => {
    currentBill.value = bill
  }

  const generateBills = () => {
    loading.value = true
    const generated = []
    
    bills.value.forEach(bill => {
      const billGenerated = generateBillInstances(bill)
      generated.push(...billGenerated)
    })

    generated.sort((a, b) => new Date(a.date) - new Date(b.date))
    generatedBills.value = generated.slice(0, 36)
    loading.value = false
  }

  const generateBillInstances = (bill) => {
    const instances = []
    const startDate = new Date(bill.startDate)
    const maxPeriods = 36

    for (let i = 0; i < maxPeriods; i++) {
      const instanceDate = calculateNextDate(startDate, bill.cycleType, bill.cycleConfig, i)
      
      if (bill.endDate && new Date(instanceDate) > new Date(bill.endDate)) {
        break
      }

      instances.push({
        id: `${bill.id}-${i}`,
        parentId: bill.id,
        name: bill.name,
        amount: bill.amount,
        date: instanceDate,
        cycleType: bill.cycleType,
        status: 'pending',
        description: bill.description
      })
    }

    return instances
  }

  const calculateNextDate = (startDate, cycleType, cycleConfig, iteration) => {
    const date = new Date(startDate)

    switch (cycleType) {
      case cycleTypes.MONTHLY:
        date.setMonth(date.getMonth() + iteration)
        break
      case cycleTypes.QUARTERLY:
        date.setMonth(date.getMonth() + (iteration * 3))
        break
      case cycleTypes.YEARLY:
        date.setFullYear(date.getFullYear() + iteration)
        break
      case cycleTypes.IRREGULAR:
        if (cycleConfig && cycleConfig.dates && cycleConfig.dates[iteration]) {
          return cycleConfig.dates[iteration]
        }
        break
    }

    return date.toISOString().split('T')[0]
  }

  const getBillsByDateRange = (startDate, endDate) => {
    return generatedBills.value.filter(bill => {
      const billDate = new Date(bill.date)
      return billDate >= new Date(startDate) && billDate <= new Date(endDate)
    })
  }

  const totalAmount = computed(() => {
    return generatedBills.value.reduce((sum, bill) => sum + parseFloat(bill.amount), 0)
  })

  const pendingBills = computed(() => {
    return generatedBills.value.filter(bill => bill.status === 'pending')
  })

  const completedBills = computed(() => {
    return generatedBills.value.filter(bill => bill.status === 'completed')
  })

  const store = {
    bills,
    generatedBills,
    currentBill,
    loading,
    cycleTypes,
    cycleLabels,
    addBill,
    updateBill,
    deleteBill,
    setCurrentBill,
    generateBills,
    getBillsByDateRange,
    totalAmount,
    pendingBills,
    completedBills
  }

  provide(RECURRING_BILLING_KEY, store)
  return store
}

export function useRecurringBilling() {
  const store = inject(RECURRING_BILLING_KEY)
  if (!store) {
    throw new Error('useRecurringBilling must be used within a RecurringBillingProvider')
  }
  return store
}
