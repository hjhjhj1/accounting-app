import { createStore } from 'vuex'

// 从本地存储加载数据
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('accounting-state')
    if (serializedState === null) {
      // 如果没有数据，返回初始空数组
      return []
    }
    return JSON.parse(serializedState)
  } catch (err) {
    // 如果有错误，也返回空数组
    return []
  }
}

// 保存数据到本地存储
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state.records)
    localStorage.setItem('accounting-state', serializedState)
  } catch (err) {
    // 忽略保存错误
  }
}

export default createStore({
  state: {
    records: loadState() // 从本地存储加载初始数据
  },
  getters: {
    getRecords: (state) => state.records,
    getTotalIncome: (state) => {
      return state.records
        .filter(record => record.type === 'income')
        .reduce((total, record) => total + record.amount, 0)
    },
    getTotalExpense: (state) => {
      return state.records
        .filter(record => record.type === 'expense')
        .reduce((total, record) => total + record.amount, 0)
    },
    getBalance: (state, getters) => {
      return getters.getTotalIncome - getters.getTotalExpense
    }
  },
  mutations: {
    ADD_RECORD(state, record) {
      state.records.unshift({
        ...record,
        id: Date.now()
      })
      saveState(state) // 保存到本地存储
    },
    DELETE_RECORD(state, id) {
      state.records = state.records.filter(record => record.id !== id)
      saveState(state) // 保存到本地存储
    }
  },
  actions: {
    addRecord({ commit }, record) {
      commit('ADD_RECORD', record)
    },
    deleteRecord({ commit }, id) {
      commit('DELETE_RECORD', id)
    }
  }
})