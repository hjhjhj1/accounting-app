<template>
  <div class="bill-schedule-preview">
    <div class="preview-content">
      <div class="preview-header">
        <h3>账单计划预览 - {{ bill.name }}</h3>
        <button @click="$emit('close')" class="btn-close">关闭</button>
      </div>

      <div class="preview-info">
        <p><strong>金额:</strong> {{ bill.type === 'income' ? '+' : '-' }}¥{{ bill.amount.toFixed(2) }}</p>
        <p><strong>周期:</strong> {{ getPeriodText(bill.period) }}</p>
        <p><strong>开始日期:</strong> {{ formatDate(bill.startDate) }}</p>
      </div>

      <div class="schedule-container">
        <div class="schedule-header">
          <div class="header-cell">期数</div>
          <div class="header-cell">日期</div>
          <div class="header-cell">金额</div>
          <div class="header-cell">状态</div>
        </div>

        <div
          ref="scrollContainer"
          class="schedule-list"
          @scroll="handleScroll"
        >
          <div
            class="scroll-spacer-top"
            :style="{ height: `${spacerHeight}px` }"
          ></div>

          <div
            v-for="item in visibleItems"
            :key="item.index"
            class="schedule-item"
            :class="{
              'past': isPast(item.date),
              'current': isCurrent(item.date),
              'future': isFuture(item.date)
            }"
          >
            <div class="cell index">{{ item.index + 1 }}</div>
            <div class="cell date">{{ formatDate(item.date) }}</div>
            <div class="cell amount" :class="bill.type">
              {{ bill.type === 'income' ? '+' : '-' }}¥{{ bill.amount.toFixed(2) }}
            </div>
            <div class="cell status">
              <span v-if="isPast(item.date)" class="status-past">已过期</span>
              <span v-else-if="isCurrent(item.date)" class="status-current">当前</span>
              <span v-else class="status-future">待生成</span>
            </div>
          </div>

          <div
            class="scroll-spacer-bottom"
            :style="{ height: `${spacerHeight}px` }"
          ></div>
        </div>
      </div>

      <div class="preview-actions">
        <button @click="exportSchedule" class="btn-export">导出计划</button>
        <button @click="printSchedule" class="btn-print">打印</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  bill: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const scrollContainer = ref(null)
const scrollTop = ref(0)
const ITEM_HEIGHT = 50
const VISIBLE_ITEMS = 15
const TOTAL_PERIODS = 36

const schedule = computed(() => {
  return generateSchedule(props.bill, TOTAL_PERIODS)
})

const spacerHeight = computed(() => {
  return (TOTAL_PERIODS - VISIBLE_ITEMS) * ITEM_HEIGHT / 2
})

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - VISIBLE_ITEMS / 2)
})

const visibleItems = computed(() => {
  const items = []
  const end = Math.min(TOTAL_PERIODS, startIndex.value + VISIBLE_ITEMS)

  for (let i = startIndex.value; i < end; i++) {
    items.push({
      index: i,
      date: schedule.value[i]
    })
  }

  return items
})

function generateSchedule(bill, periods) {
  const result = []
  const startDate = new Date(bill.startDate)
  const { period } = bill

  if (period.type === 'monthly') {
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      date.setDate(period.day)
      result.push(date.toISOString().split('T')[0])
    }
  } else if (period.type === 'quarterly') {
    let currentDate = new Date(startDate)
    let count = 0

    while (count < periods) {
      const month = currentDate.getMonth() + 1
      if (period.quarters.includes(month)) {
        result.push(currentDate.toISOString().split('T')[0])
        count++
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  } else if (period.type === 'yearly') {
    let currentDate = new Date(startDate)
    let count = 0

    while (count < periods) {
      const month = currentDate.getMonth() + 1
      if (period.months.includes(month)) {
        result.push(currentDate.toISOString().split('T')[0])
        count++
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  } else if (period.type === 'irregular') {
    const sortedDays = [...period.customDays].sort()
    for (let i = 0; i < periods && i < sortedDays.length; i++) {
      result.push(sortedDays[i])
    }

    let lastDate = new Date(sortedDays[sortedDays.length - 1] || startDate)
    while (result.length < periods) {
      lastDate.setMonth(lastDate.getMonth() + 1)
      result.push(lastDate.toISOString().split('T')[0])
    }
  }

  return result
}

function handleScroll(event) {
  scrollTop.value = event.target.scrollTop
}

function isPast(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function isCurrent(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date >= today && date < tomorrow
}

function isFuture(dateStr) {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date >= tomorrow
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function getPeriodText(period) {
  const typeMap = {
    monthly: '每月',
    quarterly: '每季度',
    yearly: '每年',
    irregular: '自定义周期'
  }

  let text = typeMap[period.type]

  if (period.type === 'monthly') {
    text += ` ${period.day}日`
  } else if (period.type === 'quarterly') {
    text += ` ${period.quarters.join(', ')}月`
  } else if (period.type === 'yearly') {
    text += ` ${period.months.join(', ')}月`
  } else if (period.type === 'irregular') {
    text += ` (${period.customDays.length}个日期)`
  }

  return text
}

function exportSchedule() {
  const data = schedule.value.map((date, index) => ({
    期数: index + 1,
    日期: date,
    金额: props.bill.amount,
    类型: props.bill.type === 'income' ? '收入' : '支出',
    状态: isPast(date) ? '已过期' : isCurrent(date) ? '当前' : '待生成'
  }))

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header]).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${props.bill.name}_账单计划.csv`
  link.click()
}

function printSchedule() {
  window.print()
}

onMounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
})
</script>

<style scoped>
.bill-schedule-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.preview-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 900px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.preview-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-close:hover {
  background: #c0392b;
}

.preview-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.preview-info p {
  margin: 8px 0;
  color: #34495e;
}

.schedule-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.schedule-header {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px;
  background: #34495e;
  color: white;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-cell {
  padding: 12px;
  text-align: center;
  border-right: 1px solid #2c3e50;
}

.header-cell:last-child {
  border-right: none;
}

.schedule-list {
  max-height: 400px;
  overflow-y: auto;
  position: relative;
}

.scroll-spacer-top,
.scroll-spacer-bottom {
  width: 100%;
}

.schedule-item {
  display: grid;
  grid-template-columns: 80px 1fr 120px 100px;
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.schedule-item:hover {
  background: #f8f9fa;
}

.schedule-item.past {
  background: #ffebee;
}

.schedule-item.current {
  background: #fff3e0;
  font-weight: bold;
}

.schedule-item.future {
  background: white;
}

.cell {
  padding: 12px;
  text-align: center;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell:last-child {
  border-right: none;
}

.cell.amount {
  font-weight: bold;
}

.cell.amount.income {
  color: #27ae60;
}

.cell.amount.expense {
  color: #e74c3c;
}

.status-past {
  color: #e74c3c;
  font-weight: bold;
}

.status-current {
  color: #f39c12;
  font-weight: bold;
}

.status-future {
  color: #3498db;
}

.preview-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-export,
.btn-print {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  color: white;
}

.btn-export {
  background: #27ae60;
}

.btn-export:hover {
  background: #229954;
}

.btn-print {
  background: #3498db;
}

.btn-print:hover {
  background: #2980b9;
}

@media print {
  .bill-schedule-preview {
    position: static;
    background: white;
    display: block;
  }

  .preview-header {
    display: none;
  }

  .schedule-list {
    max-height: none;
    overflow: visible;
  }

  .preview-actions {
    display: none;
  }

  .scroll-spacer-top,
  .scroll-spacer-bottom {
    display: none;
  }

  .schedule-item {
    page-break-inside: avoid;
  }
}
</style>
