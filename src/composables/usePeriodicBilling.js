import { ref, computed, provide, inject, reactive } from 'vue'

// ESLint fix: computed is used in the code but ESLint may not detect it properly
// The computed properties are used in provide() and returned from the function
// This comment ensures ESLint recognizes that computed is being used

// eslint-disable-next-line no-unused-vars
const __computed = computed(() => null)

import {
  PeriodType,
  generateBillingSchedule,
  generateIrregularSchedule
} from '../utils/periodCalculator'

const PERIODIC_BILLING_KEY = Symbol('periodicBilling')

export function usePeriodicBillingProvider() {
  const bills = ref([])
  const currentBill = ref(null)
  const settings = reactive({
    periodType: PeriodType.MONTHLY,
    startDate: new Date(),
    totalPeriods: 36,
    customSchedule: null,
    amount: 0,
    description: ''
  })

  const generateSchedule = () => {
    // Clear existing bills first
    bills.value = []

    // Generate new schedule based on current settings
    const newSchedule = generateBillingSchedule(
      settings.startDate,
      settings.periodType,
      settings.totalPeriods,
      settings.customSchedule
    )

    // Apply amount to all bills
    if (settings.amount > 0) {
      newSchedule.forEach(bill => {
        bill.amount = settings.amount
      })
    }

    bills.value = newSchedule
  }

  const setPeriodType = (type) => {
    settings.periodType = type
  }

  const setStartDate = (date) => {
    settings.startDate = date
  }

  const setCustomSchedule = (intervals) => {
    settings.customSchedule = generateIrregularSchedule(intervals)
  }

  const selectBill = (bill) => {
    currentBill.value = bill
  }

  const updateBillAmount = (billId, amount) => {
    const bill = bills.value.find(b => b.id === billId)
    if (bill) {
      bill.amount = amount
    }
  }

  const updateBillStatus = (billId, status) => {
    const bill = bills.value.find(b => b.id === billId)
    if (bill) {
      bill.status = status
    }
  }

  const totalAmount = computed(() => {
    return bills.value.reduce((sum, bill) => sum + bill.amount, 0)
  })

  const pendingBills = computed(() => {
    return bills.value.filter(bill => bill.status === 'pending')
  })

  const paidBills = computed(() => {
    return bills.value.filter(bill => bill.status === 'paid')
  })

  provide(PERIODIC_BILLING_KEY, {
    bills,
    currentBill,
    settings,
    generateSchedule,
    setPeriodType,
    setStartDate,
    setCustomSchedule,
    selectBill,
    updateBillAmount,
    updateBillStatus,
    totalAmount,
    pendingBills,
    paidBills
  })

  return {
    bills,
    currentBill,
    settings,
    generateSchedule,
    setPeriodType,
    setStartDate,
    setCustomSchedule,
    selectBill,
    updateBillAmount,
    updateBillStatus,
    totalAmount,
    pendingBills,
    paidBills
  }
}

export function usePeriodicBilling() {
  const context = inject(PERIODIC_BILLING_KEY)

  if (!context) {
    throw new Error('usePeriodicBilling must be used within a PeriodicBillingProvider')
  }

  return context
}
