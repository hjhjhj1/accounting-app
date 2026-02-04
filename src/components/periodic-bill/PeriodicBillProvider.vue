<template>
  <slot />
</template>

<script setup>
import { provide, ref, computed } from 'vue'
import { PeriodType, PeriodTypeLabels, PeriodTypeMonths } from './constants.js'

// 导出常量供其他组件使用
provide('PeriodType', PeriodType)
provide('PeriodTypeLabels', PeriodTypeLabels)
provide('PeriodTypeMonths', PeriodTypeMonths)

// 创建周期账单的工厂函数
const createPeriodicBill = (data = {}) => ({
  id: data.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
  name: data.name || '',
  amount: data.amount || 0,
  type: data.type || 'expense',
  periodType: data.periodType || PeriodType.MONTHLY,
  customMonths: data.customMonths || 1,
  startDate: data.startDate || new Date().toISOString().split('T')[0],
  endDate: data.endDate || null,
  category: data.category || '',
  description: data.description || '',
  isActive: data.isActive !== undefined ? data.isActive : true,
  createdAt: data.createdAt || new Date().toISOString(),
  updatedAt: data.updatedAt || new Date().toISOString()
})

// 生成未来账单实例
const generateBillInstances = (periodicBill, count = 36) => {
  const instances = []
  const startDate = new Date(periodicBill.startDate)
  const endDate = periodicBill.endDate ? new Date(periodicBill.endDate) : null

  let currentDate = new Date(startDate)
  let periodIndex = 0

  while (instances.length < count) {
    if (endDate && currentDate > endDate) break

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (currentDate >= today) {
      instances.push({
        id: `${periodicBill.id}_${periodIndex}`,
        periodicBillId: periodicBill.id,
        name: periodicBill.name,
        amount: periodicBill.amount,
        type: periodicBill.type,
        category: periodicBill.category,
        description: periodicBill.description,
        dueDate: currentDate.toISOString().split('T')[0],
        periodIndex: periodIndex + 1,
        isPaid: false,
        isProjected: true
      })
    }

    const monthsToAdd = periodicBill.periodType === PeriodType.CUSTOM
      ? periodicBill.customMonths
      : PeriodTypeMonths[periodicBill.periodType]

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthsToAdd, currentDate.getDate())
    periodIndex++
  }

  return instances
}

// 状态定义
const periodicBills = ref([])
const selectedBill = ref(null)
const previewCount = ref(36)

// 从本地存储加载数据
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('periodic-bills')
    if (saved) {
      periodicBills.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('加载周期账单数据失败:', err)
  }
}

// 保存到本地存储
const saveToStorage = () => {
  try {
    localStorage.setItem('periodic-bills', JSON.stringify(periodicBills.value))
  } catch (err) {
    console.error('保存周期账单数据失败:', err)
  }
}

// 计算属性：所有生成的账单实例
const allBillInstances = computed(() => {
  const allInstances = []
  periodicBills.value
    .filter(bill => bill.isActive)
    .forEach(bill => {
      const instances = generateBillInstances(bill, previewCount.value)
      allInstances.push(...instances)
    })

  return allInstances.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
})

// 计算属性：统计信息
const statistics = computed(() => {
  const activeBills = periodicBills.value.filter(b => b.isActive)
  const monthlyTotal = activeBills
    .filter(b => b.periodType === PeriodType.MONTHLY)
    .reduce((sum, b) => sum + (b.type === 'expense' ? -b.amount : b.amount), 0)
  const quarterlyTotal = activeBills
    .filter(b => b.periodType === PeriodType.QUARTERLY)
    .reduce((sum, b) => sum + (b.type === 'expense' ? -b.amount : b.amount), 0)
  const yearlyTotal = activeBills
    .filter(b => b.periodType === PeriodType.YEARLY)
    .reduce((sum, b) => sum + (b.type === 'expense' ? -b.amount : b.amount), 0)

  return {
    totalBills: activeBills.length,
    monthlyTotal,
    quarterlyTotal,
    yearlyTotal,
    annualEstimate: monthlyTotal * 12 + quarterlyTotal * 4 + yearlyTotal
  }
})

// 方法：添加周期账单
const addPeriodicBill = (data) => {
  const bill = createPeriodicBill(data)
  periodicBills.value.push(bill)
  saveToStorage()
  return bill
}

// 方法：更新周期账单
const updatePeriodicBill = (id, data) => {
  const index = periodicBills.value.findIndex(b => b.id === id)
  if (index !== -1) {
    periodicBills.value[index] = {
      ...periodicBills.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    saveToStorage()
    return periodicBills.value[index]
  }
  return null
}

// 方法：删除周期账单
const deletePeriodicBill = (id) => {
  const index = periodicBills.value.findIndex(b => b.id === id)
  if (index !== -1) {
    periodicBills.value.splice(index, 1)
    saveToStorage()
    return true
  }
  return false
}

// 方法：切换账单激活状态
const toggleBillStatus = (id) => {
  const bill = periodicBills.value.find(b => b.id === id)
  if (bill) {
    bill.isActive = !bill.isActive
    bill.updatedAt = new Date().toISOString()
    saveToStorage()
    return bill.isActive
  }
  return null
}

// 方法：选择账单
const selectBill = (bill) => {
  selectedBill.value = bill
}

// 方法：设置预览数量
const setPreviewCount = (count) => {
  previewCount.value = count
}

// 初始化加载
loadFromStorage()

// 提供状态和方法
provide('periodicBillState', {
  periodicBills,
  allBillInstances,
  selectedBill,
  statistics,
  previewCount,
  PeriodType,
  PeriodTypeLabels,
  PeriodTypeMonths
})

provide('periodicBillActions', {
  addPeriodicBill,
  updatePeriodicBill,
  deletePeriodicBill,
  toggleBillStatus,
  selectBill,
  setPreviewCount,
  generateBillInstances
})
</script>
