import { reactive, readonly } from 'vue'

const state = reactive({
  bills: [],
  nextId: 1
})

const addBill = (billData) => {
  const bill = {
    id: state.nextId++,
    ...billData
  }
  state.bills.push(bill)
}

const updateBill = (billData) => {
  const index = state.bills.findIndex(b => b.id === billData.id)
  if (index !== -1) {
    state.bills[index] = { ...state.bills[index], ...billData }
  }
}

const deleteBill = (id) => {
  const index = state.bills.findIndex(b => b.id === id)
  if (index !== -1) {
    state.bills.splice(index, 1)
  }
}

const getBill = (id) => {
  return state.bills.find(b => b.id === id)
}

export const recurringBillsStore = {
  state: readonly(state),
  addBill,
  updateBill,
  deleteBill,
  getBill
}
