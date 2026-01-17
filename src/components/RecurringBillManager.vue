<template>
  <div class="recurring-bill-manager">
    <h2>周期账单管理</h2>

    <div class="bill-form">
      <h3>创建周期账单</h3>
      <div class="form-group">
        <label>账单名称</label>
        <input v-model="billForm.name" type="text" placeholder="例如：房租、水电费" />
      </div>

      <div class="form-group">
        <label>金额</label>
        <input v-model.number="billForm.amount" type="number" placeholder="0.00" step="0.01" />
      </div>

      <div class="form-group">
        <label>类型</label>
        <select v-model="billForm.type">
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
      </div>

      <BillPeriodSettings v-model="billForm.period" />

      <div class="form-group">
        <label>开始日期</label>
        <input v-model="billForm.startDate" type="date" />
      </div>

      <div class="form-group">
        <label>备注</label>
        <textarea v-model="billForm.note" placeholder="可选备注信息"></textarea>
      </div>

      <button @click="createBill" class="btn-primary">创建账单</button>
    </div>

    <div class="bill-list">
      <h3>已创建的周期账单</h3>
      <div v-if="bills.length === 0" class="empty-state">
        暂无周期账单
      </div>
      <div v-for="bill in bills" :key="bill.id" class="bill-item">
        <div class="bill-info">
          <h4>{{ bill.name }}</h4>
          <p class="amount" :class="bill.type">
            {{ bill.type === 'income' ? '+' : '-' }}¥{{ bill.amount.toFixed(2) }}
          </p>
          <p class="period">{{ getPeriodText(bill.period) }}</p>
          <p class="start-date">开始日期: {{ formatDate(bill.startDate) }}</p>
        </div>
        <div class="bill-actions">
          <button @click="previewSchedule(bill)" class="btn-secondary">预览计划</button>
          <button @click="deleteBill(bill.id)" class="btn-danger">删除</button>
        </div>
      </div>
    </div>

    <BillSchedulePreview
      v-if="showPreview"
      :bill="selectedBill"
      @close="showPreview = false"
    />

    <BillExport
      v-if="showExport"
      :bills="bills"
      @close="showExport = false"
    />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import BillPeriodSettings from './BillPeriodSettings.vue'
import BillSchedulePreview from './BillSchedulePreview.vue'
import BillExport from './BillExport.vue'

const bills = ref([])
const showPreview = ref(false)
const showExport = ref(false)
const selectedBill = ref(null)

const billForm = ref({
  name: '',
  amount: 0,
  type: 'expense',
  period: {
    type: 'monthly',
    day: 1,
    months: [],
    quarters: [],
    years: [],
    customDays: []
  },
  startDate: new Date().toISOString().split('T')[0],
  note: ''
})

function loadBills() {
  try {
    const saved = localStorage.getItem('recurring-bills')
    if (saved) {
      bills.value = JSON.parse(saved)
    }
  } catch (err) {
    console.error('加载账单失败:', err)
  }
}

function saveBills() {
  try {
    localStorage.setItem('recurring-bills', JSON.stringify(bills.value))
  } catch (err) {
    console.error('保存账单失败:', err)
  }
}

function createBill() {
  if (!billForm.value.name || !billForm.value.amount) {
    alert('请填写账单名称和金额')
    return
  }

  const bill = {
    id: Date.now(),
    ...JSON.parse(JSON.stringify(billForm.value)),
    createdAt: new Date().toISOString()
  }

  bills.value.push(bill)
  saveBills()

  billForm.value = {
    name: '',
    amount: 0,
    type: 'expense',
    period: {
      type: 'monthly',
      day: 1,
      months: [],
      quarters: [],
      years: [],
      customDays: []
    },
    startDate: new Date().toISOString().split('T')[0],
    note: ''
  }

  alert('账单创建成功！')
}

function deleteBill(id) {
  if (confirm('确定要删除这个账单吗？')) {
    bills.value = bills.value.filter(b => b.id !== id)
    saveBills()
  }
}

function previewSchedule(bill) {
  selectedBill.value = bill
  showPreview.value = true
}

function exportBills() {
  showExport.value = true
}

provide('billManager', {
  bills,
  createBill,
  deleteBill,
  previewSchedule,
  exportBills
})

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

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadBills()
})
</script>

<style scoped>
.recurring-bill-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2, h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.bill-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #34495e;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger:hover {
  background: #c0392b;
}

.bill-list {
  margin-top: 30px;
}

.empty-state {
  text-align: center;
  color: #95a5a6;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: box-shadow 0.3s;
}

.bill-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.bill-info h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.bill-info .amount {
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
}

.bill-info .amount.income {
  color: #27ae60;
}

.bill-info .amount.expense {
  color: #e74c3c;
}

.bill-info .period,
.bill-info .start-date {
  color: #7f8c8d;
  font-size: 14px;
  margin: 5px 0;
}

.bill-actions {
  display: flex;
  gap: 10px;
}

@media print {
  .bill-actions {
    display: none;
  }
}
</style>
