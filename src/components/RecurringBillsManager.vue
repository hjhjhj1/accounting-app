<template>
  <div class="recurring-bills-manager" ref="printAreaRef">
    <div class="print-header">
      <h1>周期账单管理</h1>
      <p class="print-date">打印时间：{{ currentDateTime }}</p>
    </div>
    
    <div class="manager-header no-print">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">账单数量</div>
          <div class="summary-value">{{ store.billsCount.value }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">月度预估</div>
          <div class="summary-value highlight">¥{{ formatNumber(store.totalMonthlyAmount.value) }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">年度预估</div>
          <div class="summary-value highlight">¥{{ formatNumber(store.totalYearlyAmount.value) }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-primary" @click="showAddForm">
          <span class="icon">+</span> 添加账单
        </button>
        <button class="btn btn-secondary" @click="exportPDF">
          <span class="icon">📄</span> 导出PDF
        </button>
        <button class="btn btn-secondary" @click="printBills">
          <span class="icon">⎙</span> 打印
        </button>
      </div>
    </div>
    
    <div class="manager-content">
      <div class="bills-list-section no-print">
        <h2>账单模板</h2>
        <div class="bills-grid">
          <div class="bill-card" v-for="bill in store.bills.value" :key="bill.id">
            <div class="bill-header">
              <span class="bill-name">{{ bill.name }}</span>
              <span class="period-badge" :class="bill.periodType">
                {{ PERIOD_LABELS[bill.periodType] }}
              </span>
            </div>
            <div class="bill-amount">¥{{ formatNumber(bill.amount) }}</div>
            <div class="bill-info">
              <div class="info-item">
                <span class="label">分类：</span>{{ bill.category }}
              </div>
              <div class="info-item">
                <span class="label">开始：</span>{{ bill.startDate }}
              </div>
              <div v-if="bill.description" class="info-item">
                <span class="label">备注：</span>{{ bill.description }}
              </div>
            </div>
            <div class="bill-actions">
              <button class="action-btn edit" @click="editBill(bill)">编辑</button>
              <button class="action-btn delete" @click="deleteBill(bill.id)">删除</button>
            </div>
          </div>
        </div>
        <div v-if="store.bills.value.length === 0" class="empty-state">
          <p>暂无周期账单，点击上方按钮添加</p>
        </div>
      </div>
      
      <div class="schedule-section">
        <div class="section-header">
          <h2 class="no-print">未来账单计划 ({{ displayCount }}期)</h2>
          <h2 class="only-print">未来账单计划</h2>
          <div class="filter-controls no-print">
            <label>
              <input type="checkbox" v-model="showMonthly" /> 月度
            </label>
            <label>
              <input type="checkbox" v-model="showQuarterly" /> 季度
            </label>
            <label>
              <input type="checkbox" v-model="showYearly" /> 年度
            </label>
            <label>
              <input type="checkbox" v-model="showIrregular" /> 不规则
            </label>
          </div>
        </div>
        
        <div class="only-print">
          <table class="print-table">
            <thead>
              <tr>
                <th>期数</th>
                <th>账单名称</th>
                <th>到期日期</th>
                <th>周期类型</th>
                <th>分类</th>
                <th class="amount-col">金额</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredGeneratedBills.slice(0, 72)" :key="item.instanceId">
                <td>{{ index + 1 }}</td>
                <td>{{ item.billName }}</td>
                <td>{{ item.formattedDate }}</td>
                <td>{{ PERIOD_LABELS[item.periodType] }}</td>
                <td>{{ item.category }}</td>
                <td class="amount-col">¥{{ formatNumber(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="no-print">
          <VirtualScrollList
            v-if="filteredGeneratedBills.length > 0"
            :items="filteredGeneratedBills"
            :item-height="70"
            :container-height="500"
            :buffer="3"
            @load-more="loadMore"
          >
            <template #default="{ item, index }">
              <div class="schedule-item">
                <div class="item-index">{{ index + 1 }}</div>
                <div class="item-info">
                  <div class="item-name">{{ item.billName }}</div>
                  <div class="item-meta">
                    <span class="period-tag" :class="item.periodType">
                      {{ PERIOD_LABELS[item.periodType] }}
                    </span>
                    <span class="category-tag">{{ item.category }}</span>
                  </div>
                </div>
                <div class="item-date">
                  <div class="date-text">{{ item.formattedDate }}</div>
                  <div class="days-away" :class="getDaysAwayClass(item.dueDate)">
                    {{ getDaysAwayText(item.dueDate) }}
                  </div>
                </div>
                <div class="item-amount">¥{{ formatNumber(item.amount) }}</div>
              </div>
            </template>
          </VirtualScrollList>
          
          <div v-else class="empty-state">
            <p>暂无账单计划</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="print-footer">
      <p class="total-sum">打印合计：共 {{ filteredGeneratedBills.length }} 条账单记录</p>
    </div>
    
    <BillForm
      :visible="formVisible"
      :bill="editingBill"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VirtualScrollList from './VirtualScrollList.vue'
import BillForm from './BillForm.vue'
import { 
  provideRecurringBills, 
  PERIOD_LABELS,
  PERIOD_TYPES 
} from '../composables/useRecurringBills'

const store = provideRecurringBills()

const formVisible = ref(false)
const editingBill = ref(null)
const displayCount = ref(36)
const showMonthly = ref(true)
const showQuarterly = ref(true)
const showYearly = ref(true)
const showIrregular = ref(true)

const currentDateTime = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})

const filteredGeneratedBills = computed(() => {
  return store.generatedBills.value.filter(bill => {
    if (bill.periodType === PERIOD_TYPES.MONTHLY && !showMonthly.value) return false
    if (bill.periodType === PERIOD_TYPES.QUARTERLY && !showQuarterly.value) return false
    if (bill.periodType === PERIOD_TYPES.YEARLY && !showYearly.value) return false
    if (bill.periodType === PERIOD_TYPES.IRREGULAR && !showIrregular.value) return false
    return true
  })
})

function formatNumber(num) {
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function showAddForm() {
  editingBill.value = null
  formVisible.value = true
}

function editBill(bill) {
  editingBill.value = bill
  formVisible.value = true
}

function closeForm() {
  formVisible.value = false
  editingBill.value = null
}

function handleFormSubmit(data) {
  if (editingBill.value) {
    store.updateBill(editingBill.value.id, data)
  } else {
    store.addBill(data)
  }
}

function deleteBill(id) {
  if (confirm('确定要删除这个账单吗？')) {
    store.deleteBill(id)
  }
}

function loadMore() {
  displayCount.value += 12
}

function getDaysAway(dueDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
}

function getDaysAwayText(dueDate) {
  const days = getDaysAway(dueDate)
  if (days < 0) return `${Math.abs(days)}天前`
  if (days === 0) return '今天'
  if (days === 1) return '明天'
  return `${days}天后`
}

function getDaysAwayClass(dueDate) {
  const days = getDaysAway(dueDate)
  if (days < 0) return 'past'
  if (days <= 7) return 'urgent'
  if (days <= 30) return 'soon'
  return 'normal'
}

function printBills() {
  window.print()
}

function exportPDF() {
  if (window.jsPDF) {
    generatePDF()
  } else {
    alert('正在使用打印功能导出PDF，请选择"另存为PDF"作为打印机')
    printBills()
  }
}

function generatePDF() {
  alert('PDF导出功能需要安装jsPDF库，当前使用打印功能')
  printBills()
}

const printAreaRef = ref(null)
</script>

<style scoped>
.recurring-bills-manager {
  max-width: 1200px;
  margin: 0 auto;
}

.print-header {
  display: none;
}

.manager-header {
  margin-bottom: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  color: white;
}

.summary-card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.summary-card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.summary-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
}

.summary-value.highlight {
  font-size: 24px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

.btn .icon {
  font-size: 16px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.manager-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

h2 {
  font-size: 18px;
  color: #333;
  margin-bottom: 16px;
}

.bills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.bill-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.bill-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.bill-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.period-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.period-badge.monthly {
  background: #e3f2fd;
  color: #1976d2;
}

.period-badge.quarterly {
  background: #fff3e0;
  color: #f57c00;
}

.period-badge.yearly {
  background: #e8f5e9;
  color: #388e3c;
}

.period-badge.irregular {
  background: #f3e5f5;
  color: #7b1fa2;
}

.bill-amount {
  font-size: 24px;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 12px;
}

.bill-info {
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.info-item {
  margin-bottom: 4px;
}

.info-item .label {
  color: #999;
}

.bill-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.action-btn.edit {
  background: #e3f2fd;
  color: #1976d2;
}

.action-btn.delete {
  background: #ffebee;
  color: #c62828;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-controls {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.filter-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.item-index {
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.item-meta {
  display: flex;
  gap: 8px;
}

.period-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.period-tag.monthly { background: #e3f2fd; color: #1976d2; }
.period-tag.quarterly { background: #fff3e0; color: #f57c00; }
.period-tag.yearly { background: #e8f5e9; color: #388e3c; }
.period-tag.irregular { background: #f3e5f5; color: #7b1fa2; }

.category-tag {
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.item-date {
  text-align: right;
}

.date-text {
  font-size: 14px;
  color: #333;
}

.days-away {
  font-size: 12px;
  margin-top: 2px;
}

.days-away.past { color: #9e9e9e; }
.days-away.urgent { color: #f44336; }
.days-away.soon { color: #ff9800; }
.days-away.normal { color: #4caf50; }

.item-amount {
  font-size: 18px;
  font-weight: 600;
  color: #e74c3c;
  min-width: 100px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.print-footer {
  display: none;
}

.only-print {
  display: none;
}


@media print {
  .no-print {
    display: none !important;
  }
  
  .only-print {
    display: block !important;
  }
  
  .print-header {
    display: block;
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #333;
  }
  
  .print-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
  }
  
  .print-date {
    font-size: 12px;
    color: #666;
  }
  
  .print-footer {
    display: block;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #ccc;
  }
  
  .total-sum {
    text-align: right;
    font-size: 12px;
    color: #666;
  }
  
  .print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  
  .print-table th,
  .print-table td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }
  
  .print-table th {
    background: #f5f5f5;
    font-weight: 600;
  }
  
  .print-table tr:nth-child(even) {
    background: #fafafa;
  }
  
  .amount-col {
    text-align: right;
    font-weight: 500;
  }
  
  .recurring-bills-manager {
    max-width: none;
  }
}
</style>
