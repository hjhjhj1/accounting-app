<template>
  <div class="periodic-bill-list">
    <div class="list-header">
      <h3>周期账单列表</h3>
      <span class="count">共 {{ bills.length }} 个</span>
    </div>

    <div v-if="bills.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>暂无周期账单</p>
      <p class="hint">点击"添加周期账单"创建您的第一个周期账单</p>
    </div>

    <div v-else class="bill-cards">
      <div
        v-for="bill in bills"
        :key="bill.id"
        class="bill-card"
        :class="{ 'inactive': !bill.isActive }"
      >
        <div class="card-header">
          <div class="bill-title">
            <span class="bill-name">{{ bill.name }}</span>
            <span
              class="status-badge"
              :class="bill.isActive ? 'active' : 'inactive'"
            >
              {{ bill.isActive ? '启用' : '停用' }}
            </span>
          </div>
          <div class="card-actions">
            <button
              class="action-btn"
              @click="handleEdit(bill)"
              title="编辑"
            >
              ✏️
            </button>
            <button
              class="action-btn"
              @click="handleToggle(bill)"
              :title="bill.isActive ? '停用' : '启用'"
            >
              {{ bill.isActive ? '🛑' : '▶️' }}
            </button>
            <button
              class="action-btn delete"
              @click="handleDelete(bill)"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="amount-row">
            <span class="amount" :class="bill.type">
              {{ bill.type === 'income' ? '+' : '-' }}¥{{ formatNumber(bill.amount) }}
            </span>
            <span class="period-type">
              {{ PeriodTypeLabels[bill.periodType] }}
              <span v-if="bill.periodType === PeriodType.CUSTOM" class="custom-months">
                ({{ bill.customMonths }}个月)
              </span>
            </span>
          </div>

          <div class="info-row">
            <span class="info-item" v-if="bill.category">
              <i>🏷️</i> {{ bill.category }}
            </span>
            <span class="info-item">
              <i>📅</i> 开始: {{ formatDate(bill.startDate) }}
            </span>
            <span class="info-item" v-if="bill.endDate">
              <i>🏁</i> 结束: {{ formatDate(bill.endDate) }}
            </span>
          </div>

          <p v-if="bill.description" class="description">
            {{ bill.description }}
          </p>
        </div>

        <div class="card-footer">
          <span class="update-time">
            更新于 {{ formatDateTime(bill.updatedAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
  filter: {
    type: String,
    default: 'all'
  }
})

const emit = defineEmits(['edit'])

const { periodicBills, PeriodType, PeriodTypeLabels } = inject('periodicBillState')
const { toggleBillStatus, deletePeriodicBill } = inject('periodicBillActions')

const bills = computed(() => {
  let list = periodicBills.value

  if (props.filter === 'active') {
    list = list.filter(b => b.isActive)
  } else if (props.filter === 'inactive') {
    list = list.filter(b => !b.isActive)
  }

  return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
})

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleEdit = (bill) => {
  emit('edit', bill)
}

const handleToggle = async (bill) => {
  await toggleBillStatus(bill.id)
}

const handleDelete = async (bill) => {
  if (confirm(`确定要删除周期账单"${bill.name}"吗？\n此操作不可恢复。`)) {
    await deletePeriodicBill(bill.id)
  }
}
</script>

<style scoped>
.periodic-bill-list {
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

.count {
  font-size: 13px;
  color: #666;
  background: #e9ecef;
  padding: 4px 12px;
  border-radius: 12px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.empty-state .hint {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

.bill-cards {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bill-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s;
  border-left: 4px solid #3498db;
}

.bill-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.bill-card.inactive {
  opacity: 0.7;
  border-left-color: #95a5a6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bill-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bill-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.status-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background: #f8d7da;
  color: #721c24;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #f0f0f0;
}

.action-btn.delete:hover {
  background: #f8d7da;
}

.card-body {
  margin-bottom: 12px;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.amount {
  font-size: 20px;
  font-weight: bold;
}

.amount.income {
  color: #27ae60;
}

.amount.expense {
  color: #e74c3c;
}

.period-type {
  font-size: 13px;
  color: #666;
  background: #f0f0f0;
  padding: 4px 10px;
  border-radius: 4px;
}

.custom-months {
  color: #3498db;
  font-weight: 500;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
}

.info-item {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-item i {
  font-style: normal;
}

.description {
  font-size: 13px;
  color: #888;
  margin: 0;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.card-footer {
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.update-time {
  font-size: 12px;
  color: #999;
}
</style>
