import { ref, computed, provide, inject } from 'vue'

const RECURRING_BILLS_KEY = 'recurring-bills'

export function useRecurringBillsProvider() {
  const bills = ref([
    {
      id: 1,
      name: '房租',
      amount: 3500,
      type: 'expense',
      cycleType: 'monthly',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      dayOfMonth: 1,
      customDays: [],
      category: '住房',
      description: '每月房租'
    },
    {
      id: 2,
      name: '工资',
      amount: 15000,
      type: 'income',
      cycleType: 'monthly',
      startDate: '2025-01-01',
      endDate: '',
      dayOfMonth: 15,
      customDays: [],
      category: '工资',
      description: '每月工资'
    },
    {
      id: 3,
      name: '物业费',
      amount: 800,
      type: 'expense',
      cycleType: 'quarterly',
      startDate: '2025-01-01',
      endDate: '2026-12-31',
      dayOfMonth: 5,
      customDays: [],
      category: '住房',
      description: '每季度物业费'
    },
    {
      id: 4,
      name: '健身会员',
      amount: 3600,
      type: 'expense',
      cycleType: 'yearly',
      startDate: '2025-02-15',
      endDate: '2028-02-15',
      dayOfMonth: 15,
      customDays: [],
      category: '娱乐',
      description: '年度健身会员费'
    },
    {
      id: 5,
      name: '信用卡还款',
      amount: 0,
      type: 'expense',
      cycleType: 'irregular',
      startDate: '2025-01-01',
      endDate: '',
      dayOfMonth: 1,
      customDays: [5, 15, 25],
      category: '金融',
      description: '每月5、15、25日还款'
    }
  ])

  const nextBillId = ref(6)

  const addBill = (bill) => {
    bills.value.push({
      ...bill,
      id: nextBillId.value++
    })
  }

  const updateBill = (id, updatedBill) => {
    const index = bills.value.findIndex(b => b.id === id)
    if (index !== -1) {
      bills.value[index] = { ...bills.value[index], ...updatedBill }
    }
  }

  const deleteBill = (id) => {
    bills.value = bills.value.filter(b => b.id !== id)
  }

  const generateBillSchedule = (bill, periods = 36) => {
    const schedule = []
    const startDate = new Date(bill.startDate)
    const endDate = bill.endDate ? new Date(bill.endDate) : null

    for (let i = 0; i < periods; i++) {
      let nextDate

      switch (bill.cycleType) {
        case 'monthly':
          nextDate = new Date(startDate)
          nextDate.setMonth(startDate.getMonth() + i)
          nextDate.setDate(bill.dayOfMonth || 1)
          break
        case 'quarterly':
          nextDate = new Date(startDate)
          nextDate.setMonth(startDate.getMonth() + i * 3)
          nextDate.setDate(bill.dayOfMonth || 1)
          break
        case 'yearly':
          nextDate = new Date(startDate)
          nextDate.setFullYear(startDate.getFullYear() + i)
          break
        case 'irregular': {
          const baseMonth = Math.floor(i / bill.customDays.length)
          const dayIndex = i % bill.customDays.length
          nextDate = new Date(startDate)
          nextDate.setMonth(startDate.getMonth() + baseMonth)
          nextDate.setDate(bill.customDays[dayIndex])
          break
        }
        default:
          nextDate = new Date(startDate)
      }

      if (endDate && nextDate > endDate) {
        break
      }

      schedule.push({
        ...bill,
        scheduleId: `${bill.id}-${i}`,
        billDate: nextDate.toISOString().split('T')[0],
        period: i + 1,
        status: nextDate < new Date() ? 'paid' : 'pending'
      })
    }

    return schedule
  }

  const getAllScheduledBills = (periods = 36) => {
    const allSchedules = []
    bills.value.forEach(bill => {
      allSchedules.push(...generateBillSchedule(bill, periods))
    })
    return allSchedules.sort((a, b) => new Date(a.billDate) - new Date(b.billDate))
  }

  const getMonthlySummary = computed(() => {
    const summary = {}
    const now = new Date()

    for (let i = 0; i < 36; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const monthKey = month.toISOString().slice(0, 7)

      summary[monthKey] = {
        income: 0,
        expense: 0,
        balance: 0,
        bills: []
      }
    }

    bills.value.forEach(bill => {
      const schedule = generateBillSchedule(bill, 36)
      schedule.forEach(scheduled => {
        const monthKey = scheduled.billDate.slice(0, 7)
        if (summary[monthKey]) {
          if (scheduled.type === 'income') {
            summary[monthKey].income += scheduled.amount
          } else {
            summary[monthKey].expense += scheduled.amount
          }
          summary[monthKey].balance = summary[monthKey].income - summary[monthKey].expense
          summary[monthKey].bills.push(scheduled)
        }
      })
    })

    return summary
  })

  const context = {
    bills,
    addBill,
    updateBill,
    deleteBill,
    generateBillSchedule,
    getAllScheduledBills,
    getMonthlySummary
  }

  provide(RECURRING_BILLS_KEY, context)
  return context
}

export function useRecurringBills() {
  const context = inject(RECURRING_BILLS_KEY)
  if (!context) {
    throw new Error('useRecurringBills must be used within a RecurringBillsProvider')
  }
  return context
}
