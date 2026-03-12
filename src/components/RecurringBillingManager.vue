<template>
  <div class="recurring-billing-manager">
    <div class="manager-header">
      <h2 class="manager-title">周期账单管理</h2>
      <BillingExportTools />
    </div>

    <div class="manager-content">
      <div class="form-section">
        <RecurringBillingForm />
      </div>
      <div class="preview-section">
        <BillingPreviewList />
      </div>
    </div>

    <div class="bills-list-section" v-if="bills.length > 0">
      <h3 class="section-title">已创建的周期账单</h3>
      <div class="bills-grid">
        <div v-for="bill in bills" :key="bill.id" class="bill-card">
          <div class="bill-card-header">
            <h4 class="bill-card-title">{{ bill.name }}</h4>
            <div class="bill-card-actions">
              <button class="action-btn edit-btn" @click="editBill(bill)">
                ✏️
              </button>
              <button class="action-btn delete-btn" @click="confirmDelete(bill.id)">
                🗑️
              </button>
            </div>
          </div>
          <div class="bill-card-body">
            <div class="bill-card-item">
              <span class="label">金额:</span>
              <span class="value amount">¥{{ parseFloat(bill.amount).toFixed(2) }}</span>
            </div>
            <div class="bill-card-item">
              <span class="label">周期:</span>
              <span class="value">{{ getCycleLabel(bill.cycleType) }}</span>
            </div>
            <div class="bill-card-item">
              <span class="label">开始日期:</span>
              <span class="value">{{ formatDate(bill.startDate) }}</span>
            </div>
            <div v-if="bill.endDate" class="bill-card-item">
              <span class="label">结束日期:</span>
              <span class="value">{{ formatDate(bill.endDate) }}</span>
            </div>
            <div v-if="bill.description" class="bill-card-item">
              <span class="label">描述:</span>
              <span class="value">{{ bill.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createRecurringBillingStore } from '../composables/useRecurringBilling'
import RecurringBillingForm from './RecurringBillingForm.vue'
import BillingPreviewList from './BillingPreviewList.vue'
import BillingExportTools from './BillingExportTools.vue'

const { 
  bills, 
  cycleLabels, 
  setCurrentBill, 
  deleteBill,
  generateBills 
} = createRecurringBillingStore()

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const getCycleLabel = (cycleType) => {
  return cycleLabels[cycleType] || cycleType
}

const editBill = (bill) => {
  setCurrentBill(bill)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const confirmDelete = (id) => {
  if (confirm('确定要删除这个周期账单吗？')) {
    deleteBill(id)
  }
}



generateBills()
</script>

<style scoped>
.recurring-billing-manager {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.manager-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.manager-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.form-section,
.preview-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bills-list-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.bills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.bill-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.bill-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.bill-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.bill-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.bill-card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.edit-btn {
  background: #e6f7ff;
  color: #1890ff;
}

.edit-btn:hover {
  background: #bae7ff;
}

.delete-btn {
  background: #fff2f0;
  color: #ff4d4f;
}

.delete-btn:hover {
  background: #ffccc7;
}

.bill-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bill-card-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.bill-card-item .label {
  font-size: 13px;
  color: #999;
}

.bill-card-item .value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.bill-card-item .amount {
  color: #1890ff;
  font-size: 16px;
}

@media (max-width: 1024px) {
  .manager-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .recurring-billing-manager {
    padding: 16px;
  }

  .manager-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .bills-grid {
    grid-template-columns: 1fr;
  }
}
</style>
