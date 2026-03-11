<template>
  <div class="billing-list">
    <h3>已保存的周期账单</h3>
    
    <div v-if="bills.length === 0" class="empty-list">
      <p>暂无保存的周期账单</p>
      <p class="empty-hint">请在上方表单创建新的周期账单</p>
    </div>
    
    <div v-else class="bill-cards">
      <div v-for="bill in bills" :key="bill.id" class="bill-card">
        <div class="card-header">
          <span class="bill-name">{{ bill.name }}</span>
          <div class="badges">
            <span class="bill-type-badge" :class="getTypeClass(bill.type)">{{ getTypeLabel(bill.type) }}</span>
            <span class="bill-cycle-badge">{{ getCycleLabel(bill.cycle) }}</span>
          </div>
        </div>
        <div class="card-body">
          <div class="bill-amount-large" :class="getTypeClass(bill.type)">¥{{ bill.amount.toFixed(2) }}</div>
          <div class="bill-info-row">
            <span class="info-label">开始日期：</span>
            <span>{{ bill.startDate }}</span>
          </div>
          <div v-if="bill.cycle === 'irregular'" class="bill-info-row">
            <span class="info-label">间隔：</span>
            <span>{{ bill.irregularInterval }}天</span>
          </div>
          <div v-if="bill.description" class="bill-info-row">
            <span class="info-label">描述：</span>
            <span>{{ bill.description }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button @click="viewPreview(bill)" class="btn-view">预览</button>
          <button @click="editBill(bill)" class="btn-edit">编辑</button>
          <button @click="deleteBill(bill.id)" class="btn-delete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRecurringBilling, BILLING_TYPES } from '@/composables/useRecurringBilling'

const emit = defineEmits(['edit'])

const { bills, removeBill, currentBill, regeneratePreview } = useRecurringBilling()

const getCycleLabel = (cycle) => {
  const labels = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则'
  }
  return labels[cycle] || cycle
}

const getTypeLabel = (type) => {
  return type === BILLING_TYPES.EXPENSE ? '支出' : '收入'
}

const getTypeClass = (type) => {
  return type === BILLING_TYPES.EXPENSE ? 'type-expense' : 'type-income'
}

const viewPreview = (bill) => {
  Object.assign(currentBill.value, bill)
  regeneratePreview()
}

const editBill = (bill) => {
  emit('edit', bill)
}

const deleteBill = (billId) => {
  if (confirm('确定要删除这个周期账单吗？')) {
    removeBill(billId)
  }
}
</script>

<style scoped>
.billing-list {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.billing-list h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.empty-list {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
}

.empty-list p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 12px;
}

.bill-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.bill-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
}

.bill-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.badges {
  display: flex;
  gap: 6px;
}

.bill-name {
  font-weight: 600;
  color: #2c3e50;
}

.bill-type-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
}

.bill-type-badge.type-expense {
  background: #e74c3c;
}

.bill-type-badge.type-income {
  background: #27ae60;
}

.bill-cycle-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: #3498db;
  color: white;
  border-radius: 10px;
}

.card-body {
  padding: 16px;
}

.bill-amount-large {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 12px;
}

.bill-amount-large.type-expense {
  color: #e74c3c;
}

.bill-amount-large.type-income {
  color: #27ae60;
}

.bill-info-row {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 6px;
}

.info-label {
  color: #95a5a6;
}

.card-actions {
  display: flex;
  border-top: 1px solid #e0e0e0;
}

.card-actions button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.2s;
  border-right: 1px solid #e0e0e0;
}

.card-actions button:last-child {
  border-right: none;
}

.btn-view {
  color: #3498db;
}

.btn-view:hover {
  background: #ebf5fb;
}

.btn-edit {
  color: #f39c12;
}

.btn-edit:hover {
  background: #fef9e7;
}

.btn-delete {
  color: #e74c3c;
}

.btn-delete:hover {
  background: #fdecea;
}

@media print {
  .billing-list {
    box-shadow: none;
  }
  
  .card-actions {
    display: none;
  }
}
</style>
