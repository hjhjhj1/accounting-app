<template>
  <div class="billing-preview-list">
    <div class="list-header">
      <h3 class="list-title">未来账单预览 (共 {{ generatedBills.length }} 期)</h3>
      <div class="list-stats">
        <span class="stat-item">待支付: {{ pendingBills.length }} 期</span>
        <span class="stat-item">总金额: ¥{{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>

    <div class="list-container" ref="listContainer">
      <VirtualScrollList
        :items="generatedBills"
        :item-height="72"
        :loading="loading"
        v-slot="{ item }"
      >
        <div class="bill-item" :class="item.status">
          <div class="bill-info">
            <div class="bill-name">{{ item.name }}</div>
            <div class="bill-meta">
              <span class="bill-date">{{ formatDate(item.date) }}</span>
              <span class="bill-cycle">{{ getCycleLabel(item.cycleType) }}</span>
            </div>
          </div>
          <div class="bill-amount">
            <span class="amount-value">¥{{ parseFloat(item.amount).toFixed(2) }}</span>
            <span class="status-badge" :class="item.status">
              {{ getStatusLabel(item.status) }}
            </span>
          </div>
        </div>
      </VirtualScrollList>
    </div>

    <div v-if="generatedBills.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty-text">暂无周期账单，请创建新的周期账单</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRecurringBilling } from '../composables/useRecurringBilling'
import VirtualScrollList from './VirtualScrollList.vue'

const { 
  generatedBills, 
  loading, 
  cycleLabels,
  pendingBills,
  totalAmount
} = useRecurringBilling()

const listContainer = ref(null)

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCycleLabel = (cycleType) => {
  return cycleLabels[cycleType] || cycleType
}

const getStatusLabel = (status) => {
  const statusMap = {
    pending: '待支付',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

onMounted(() => {
  if (listContainer.value) {
    listContainer.value.style.height = '500px'
  }
})
</script>

<style scoped>
.billing-preview-list {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.list-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 14px;
  color: #666;
}

.list-container {
  flex: 1;
  min-height: 0;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: auto;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.2s;
}

.bill-item:hover {
  background-color: #fafafa;
}

.bill-item:last-child {
  border-bottom: none;
}

.bill-item.pending {
  border-left: 3px solid #faad14;
}

.bill-item.completed {
  border-left: 3px solid #52c41a;
}

.bill-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bill-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.bill-meta {
  display: flex;
  gap: 12px;
}

.bill-date,
.bill-cycle {
  font-size: 13px;
  color: #999;
}

.bill-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount-value {
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.pending {
  background: #fff7e6;
  color: #fa8c16;
}

.status-badge.completed {
  background: #f6ffed;
  color: #52c41a;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}
</style>
