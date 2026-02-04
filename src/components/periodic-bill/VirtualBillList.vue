<template>
  <div class="virtual-bill-list">
    <div class="list-header">
      <h3>未来账单预览（{{ filteredInstances.length }}条）</h3>
      <div class="filters">
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <select v-model="filterPeriod" class="filter-select">
          <option value="">全部周期</option>
          <option value="monthly">月度</option>
          <option value="quarterly">季度</option>
          <option value="yearly">年度</option>
          <option value="custom">自定义</option>
        </select>
      </div>
    </div>

    <div class="summary-bar">
      <div class="summary-item">
        <span class="label">即将支出:</span>
        <span class="value expense">¥{{ formatNumber(upcomingExpense) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">即将收入:</span>
        <span class="value income">¥{{ formatNumber(upcomingIncome) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">净额:</span>
        <span :class="['value', netAmount >= 0 ? 'income' : 'expense']">
          ¥{{ formatNumber(netAmount) }}
        </span>
      </div>
    </div>

    <div
      ref="containerRef"
      class="virtual-container"
      @scroll="handleScroll"
    >
      <div
        class="virtual-content"
        :style="{ height: totalHeight + 'px' }"
      >
        <div
          class="visible-items"
          :style="{ transform: `translateY(${offsetY}px)` }"
        >
          <div
            v-for="item in visibleItems"
            :key="item.id"
            class="bill-item"
            :class="[item.type, { 'projected': item.isProjected }]"
          >
            <div class="bill-main">
              <div class="bill-info">
                <span class="bill-name">{{ item.name }}</span>
                <span class="bill-category" v-if="item.category">{{ item.category }}</span>
              </div>
              <div class="bill-amount" :class="item.type">
                {{ item.type === 'income' ? '+' : '-' }}¥{{ formatNumber(item.amount) }}
              </div>
            </div>
            <div class="bill-meta">
              <span class="bill-date">
                <i class="date-icon">📅</i>
                {{ formatDate(item.dueDate) }}
              </span>
              <span class="bill-period">第 {{ item.periodIndex }} 期</span>
              <span class="bill-status" :class="{ 'paid': item.isPaid }">
                {{ item.isPaid ? '已支付' : '待支付' }}
              </span>
            </div>
            <div v-if="item.description" class="bill-description">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-more">
        <span class="loading-spinner"></span>
        加载中...
      </div>
    </div>

    <div class="list-footer">
      <button
        class="load-more-btn"
        @click="loadMore"
        :disabled="loading || allBillInstances.length >= maxInstances"
      >
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
      <span class="instance-count">
        显示 {{ filteredInstances.length }} / {{ allBillInstances.length }} 条
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const ITEM_HEIGHT = 80
const BUFFER_SIZE = 5
const LOAD_MORE_THRESHOLD = 100

const { allBillInstances } = inject('periodicBillState')

const containerRef = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(0)
const loading = ref(false)
const maxInstances = ref(36)
const filterType = ref('')
const filterPeriod = ref('')

const filteredInstances = computed(() => {
  let instances = allBillInstances.value

  if (filterType.value) {
    instances = instances.filter(item => item.type === filterType.value)
  }

  return instances.slice(0, maxInstances.value)
})

const upcomingExpense = computed(() => {
  return filteredInstances.value
    .filter(item => item.type === 'expense' && !item.isPaid)
    .reduce((sum, item) => sum + item.amount, 0)
})

const upcomingIncome = computed(() => {
  return filteredInstances.value
    .filter(item => item.type === 'income' && !item.isPaid)
    .reduce((sum, item) => sum + item.amount, 0)
})

const netAmount = computed(() => upcomingIncome.value - upcomingExpense.value)

const totalHeight = computed(() => filteredInstances.value.length * ITEM_HEIGHT)

const visibleCount = computed(() => {
  return Math.ceil(containerHeight.value / ITEM_HEIGHT) + BUFFER_SIZE * 2
})

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value
  return Math.min(filteredInstances.value.length, index)
})

const visibleItems = computed(() => {
  return filteredInstances.value.slice(startIndex.value, endIndex.value)
})

const offsetY = computed(() => startIndex.value * ITEM_HEIGHT)

const handleScroll = () => {
  if (!containerRef.value) return

  scrollTop.value = containerRef.value.scrollTop
  containerHeight.value = containerRef.value.clientHeight

  const scrollHeight = containerRef.value.scrollHeight
  const scrolled = scrollTop.value + containerHeight.value

  if (scrollHeight - scrolled < LOAD_MORE_THRESHOLD && !loading.value) {
    loadMore()
  }
}

const loadMore = async () => {
  if (loading.value || allBillInstances.value.length >= maxInstances.value) return

  loading.value = true

  await new Promise(resolve => setTimeout(resolve, 300))

  maxInstances.value += 12
  if (maxInstances.value > 100) maxInstances.value = 100

  loading.value = false
}

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天'
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }
}

watch(() => containerRef.value, (el) => {
  if (el) {
    containerHeight.value = el.clientHeight
  }
})
</script>

<style scoped>
.virtual-bill-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.list-header h3 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.filters {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: white;
}

.summary-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-item .label {
  font-size: 12px;
  color: #666;
}

.summary-item .value {
  font-size: 16px;
  font-weight: bold;
}

.summary-item .value.expense {
  color: #e74c3c;
}

.summary-item .value.income {
  color: #27ae60;
}

.virtual-container {
  height: 400px;
  overflow-y: auto;
  position: relative;
}

.virtual-content {
  position: relative;
}

.visible-items {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.bill-item {
  height: 80px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  transition: background-color 0.2s;
  box-sizing: border-box;
}

.bill-item:hover {
  background-color: #f8f9fa;
}

.bill-item.expense {
  border-left: 3px solid #e74c3c;
}

.bill-item.income {
  border-left: 3px solid #27ae60;
}

.bill-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.bill-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bill-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 15px;
}

.bill-category {
  font-size: 11px;
  padding: 2px 8px;
  background: #ecf0f1;
  border-radius: 10px;
  color: #666;
}

.bill-amount {
  font-size: 16px;
  font-weight: bold;
}

.bill-amount.expense {
  color: #e74c3c;
}

.bill-amount.income {
  color: #27ae60;
}

.bill-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.bill-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-icon {
  font-size: 12px;
}

.bill-status {
  padding: 1px 6px;
  border-radius: 3px;
  background: #fff3cd;
  color: #856404;
}

.bill-status.paid {
  background: #d4edda;
  color: #155724;
}

.bill-description {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-more {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.load-more-btn {
  padding: 8px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #2980b9;
}

.load-more-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.instance-count {
  font-size: 12px;
  color: #666;
}
</style>
