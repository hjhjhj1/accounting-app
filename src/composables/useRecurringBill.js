import { ref, computed, readonly } from 'vue'

const RECURRING_BILLS_KEY = 'recurring-bills'

const loadBills = () => {
  try {
    const data = localStorage.getItem(RECURRING_BILLS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

const saveBills = (bills) => {
  localStorage.setItem(RECURRING_BILLS_KEY, JSON.stringify(bills))
}

const bills = ref(loadBills())

const activeBills = computed(() => 
  bills.value.filter(b => b.isActive)
)

const generateBillDates = (bill, count = 36) => {
  const dates = []
  const startDate = new Date(bill.startDate)
  let currentDate = new Date(startDate)
  
  for (let i = 0; i < count; i++) {
    dates.push({
      index: i + 1,
      date: new Date(currentDate),
      formatted: formatDate(currentDate),
      amount: bill.amount,
      status: currentDate < new Date() ? 'overdue' : 'pending'
    })
    
    if (bill.cycleType === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + bill.cycleValue)
    } else if (bill.cycleType === 'quarterly') {
      currentDate.setMonth(currentDate.getMonth() + (3 * bill.cycleValue))
    } else if (bill.cycleType === 'yearly') {
      currentDate.setFullYear(currentDate.getFullYear() + bill.cycleValue)
    } else if (bill.cycleType === 'custom') {
      currentDate.setDate(currentDate.getDate() + bill.cycleValue)
    } else if (bill.cycleType === 'irregular') {
      if (bill.irregularPattern && bill.irregularPattern[i]) {
        const pattern = bill.irregularPattern[i]
        if (pattern.type === 'days') {
          currentDate.setDate(currentDate.getDate() + pattern.value)
        } else if (pattern.type === 'months') {
          currentDate.setMonth(currentDate.getMonth() + pattern.value)
        }
      } else {
        break
      }
    }
  }
  
  return dates
}

const formatDate = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const addBill = (bill) => {
  const newBill = {
    ...bill,
    id: Date.now(),
    createdAt: new Date().toISOString(),
    isActive: true
  }
  bills.value.push(newBill)
  saveBills(bills.value)
  return newBill
}

const updateBill = (id, updates) => {
  const index = bills.value.findIndex(b => b.id === id)
  if (index !== -1) {
    bills.value[index] = { ...bills.value[index], ...updates }
    saveBills(bills.value)
  }
}

const deleteBill = (id) => {
  bills.value = bills.value.filter(b => b.id !== id)
  saveBills(bills.value)
}

const toggleBillActive = (id) => {
  const bill = bills.value.find(b => b.id === id)
  if (bill) {
    bill.isActive = !bill.isActive
    saveBills(bills.value)
  }
}

export const useRecurringBill = () => {
  return {
    bills: readonly(bills),
    activeBills,
    addBill,
    updateBill,
    deleteBill,
    toggleBillActive,
    generateBillDates
  }
}

export const recurringBillKey = Symbol('recurringBill')
