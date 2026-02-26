<template>
  <div class="recurring-bill-view">
    <h2>周期账单管理</h2>
    
    <div class="bill-list-section">
      <div class="section-header">
        <h3>已设置的周期账单</h3>
        <button class="btn-add" @click="showForm = true">+ 添加周期账单</button>
      </div>
      
      <div v-if="bills.length === 0" class="empty-state">
        暂无周期账单，点击上方按钮添加
      </div>
      
      <div v-else class="bill-cards">
        <div 
          v-for="bill in bills" 
          :key="bill.id" 
          class="bill-card"
          :class="{ inactive: !bill.isActive }"
        >
          <div class="card-header">
            <span class="bill-name">{{ bill.name }}</span>
            <span class="bill-type" :class="bill.type">
              {{ bill.type === 'expense' ? '支出' : '收入' }}
            </span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">金额：</span>
              <span class="value amount" :class="bill.type">
                ¥{{ bill.amount.toFixed(2) }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">周期：</span>
              <span class="value">{{ cycleText(bill) }}</span>
            </div>
            <div class="info-row">
              <span class="label">开始日期：</span>
              <span class="value">{{ bill.startDate }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-preview" @click="previewBill(bill)">预览</button>
            <button class="btn-toggle" @click="toggleActive(bill.id)">
              {{ bill.isActive ? '暂停' : '启用' }}
            </button>
            <button class="btn-edit" @click="editBill(bill)">编辑</button>
            <button class="btn-delete" @click="deleteBill(bill.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedBill" class="preview-section">
      <div class="section-header">
        <h3>账单预览 - {{ selectedBill.name }}</h3>
        <div class="preview-actions">
          <button class="btn-export" @click="exportToPDF">导出PDF</button>
          <button class="btn-print" @click="printPreview">打印</button>
          <button class="btn-close" @click="selectedBill = null">关闭预览</button>
        </div>
      </div>
      <VirtualScrollList :bill="selectedBill" :totalCount="36" />
    </div>

    <div v-if="showForm" class="form-modal">
      <div class="modal-backdrop" @click="showForm = false"></div>
      <div class="modal-content">
        <RecurringBillForm 
          :bill="editingBill"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </div>
    </div>

    <div id="print-area" class="print-only">
      <h1>周期账单计划</h1>
      <div v-if="selectedBill" class="print-content">
        <div class="print-info">
          <p><strong>账单名称：</strong>{{ selectedBill.name }}</p>
          <p><strong>类型：</strong>{{ selectedBill.type === 'expense' ? '支出' : '收入' }}</p>
          <p><strong>金额：</strong>¥{{ selectedBill.amount.toFixed(2) }}</p>
          <p><strong>周期：</strong>{{ cycleText(selectedBill) }}</p>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th>期数</th>
              <th>日期</th>
              <th>金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in printItems" :key="item.index">
              <td>{{ item.index }}</td>
              <td>{{ item.formatted }}</td>
              <td :class="selectedBill.type">
                {{ selectedBill.type === 'expense' ? '-' : '+' }}¥{{ item.amount.toFixed(2) }}
              </td>
              <td>{{ statusText(item.status) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, provide } from 'vue'
import { recurringBillKey, useRecurringBill } from '../composables/useRecurringBill'
import RecurringBillForm from '../components/RecurringBillForm.vue'
import VirtualScrollList from '../components/VirtualScrollList.vue'

export default {
  name: 'RecurringBillView',
  components: {
    RecurringBillForm,
    VirtualScrollList
  },
  setup() {
    const recurringBillStore = useRecurringBill()
    provide(recurringBillKey, recurringBillStore)
    
    const { 
      bills, 
      deleteBill: removeBill, 
      toggleBillActive,
      generateBillDates 
    } = recurringBillStore
    
    const showForm = ref(false)
    const editingBill = ref(null)
    const selectedBill = ref(null)
    const printItems = ref([])
    
    const cycleText = (bill) => {
      const typeTexts = {
        monthly: '每月',
        quarterly: '每季度',
        yearly: '每年',
        custom: '自定义',
        irregular: '不规则'
      }
      
      if (bill.cycleType === 'irregular') {
        return '不规则周期'
      }
      
      const value = bill.cycleValue || 1
      const unit = {
        monthly: value === 1 ? '月' : `${value}个月`,
        quarterly: value === 1 ? '季度' : `${value}个季度`,
        yearly: value === 1 ? '年' : `${value}年`,
        custom: `${value}天`
      }
      
      return typeTexts[bill.cycleType] + (bill.cycleType !== 'custom' ? '' : `每${unit.custom}`)
    }
    
    const statusText = (status) => {
      const texts = {
        overdue: '已过期',
        pending: '待执行',
        paid: '已支付'
      }
      return texts[status] || status
    }
    
    const previewBill = (bill) => {
      selectedBill.value = bill
      printItems.value = generateBillDates(bill, 36)
    }
    
    const toggleActive = (id) => {
      toggleBillActive(id)
    }
    
    const editBill = (bill) => {
      editingBill.value = { ...bill }
      showForm.value = true
    }
    
    const deleteBill = (id) => {
      if (confirm('确定要删除这个周期账单吗？')) {
        removeBill(id)
        if (selectedBill.value?.id === id) {
          selectedBill.value = null
        }
      }
    }
    
    const handleFormSubmit = () => {
      closeForm()
    }
    
    const closeForm = () => {
      showForm.value = false
      editingBill.value = null
    }
    
    const exportToPDF = () => {
      printItems.value = generateBillDates(selectedBill.value, 36)
      
      const printContent = document.getElementById('print-area').innerHTML
      const printWindow = window.open('', '_blank')
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>周期账单计划 - ${selectedBill.value.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Microsoft YaHei', Arial, sans-serif; 
              padding: 20px;
              color: #333;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 20px;
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            .print-info {
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 4px;
            }
            .print-info p {
              margin: 8px 0;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .print-table th,
            .print-table td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: center;
            }
            .print-table th {
              background: #3498db;
              color: white;
            }
            .print-table tr:nth-child(even) {
              background: #f9f9f9;
            }
            .expense { color: #27ae60; }
            .income { color: #e74c3c; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `)
      
      printWindow.document.close()
      printWindow.print()
    }
    
    const printPreview = () => {
      printItems.value = generateBillDates(selectedBill.value, 36)
      window.print()
    }
    
    return {
      bills,
      showForm,
      editingBill,
      selectedBill,
      printItems,
      cycleText,
      statusText,
      previewBill,
      toggleActive,
      editBill,
      deleteBill,
      handleFormSubmit,
      closeForm,
      exportToPDF,
      printPreview
    }
  }
}
</script>

<style scoped>
.recurring-bill-view {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  margin: 0;
  color: #34495e;
}

.btn-add {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add:hover {
  background: #2980b9;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
  background: #f8f9fa;
  border-radius: 8px;
}

.bill-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.bill-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.bill-card:hover {
  transform: translateY(-2px);
}

.bill-card.inactive {
  opacity: 0.6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.bill-name {
  font-weight: 600;
  font-size: 16px;
}

.bill-type {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.bill-type.expense {
  background: #d4edda;
  color: #27ae60;
}

.bill-type.income {
  background: #fee;
  color: #e74c3c;
}

.card-body {
  padding: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row .label {
  color: #666;
  width: 80px;
}

.info-row .value {
  color: #333;
}

.info-row .amount.expense {
  color: #27ae60;
}

.info-row .amount.income {
  color: #e74c3c;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding: 10px 15px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.card-actions button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-preview {
  background: #17a2b8;
  color: white;
}

.btn-toggle {
  background: #ffc107;
  color: #333;
}

.btn-edit {
  background: #6c757d;
  color: white;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.preview-section {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.btn-export {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-print {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-close {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.form-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.print-only {
  display: none;
}

.print-content {
  width: 100%;
}

.print-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.print-info p {
  margin: 8px 0;
  font-size: 14px;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.print-table th,
.print-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.print-table th {
  background: #3498db;
  color: white;
}

.print-table tr:nth-child(even) {
  background: #f9f9f9;
}

.print-table .expense {
  color: #27ae60;
}

.print-table .income {
  color: #e74c3c;
}

@media print {
  body * {
    visibility: hidden;
  }
  
  #print-area,
  #print-area * {
    visibility: visible;
  }
  
  #print-area {
    display: block !important;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
  }
  
  .print-only {
    display: block;
  }
  
  .print-info {
    background: #f8f9fa !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .print-table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto;
  }
  
  .print-table th,
  .print-table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: center;
    font-size: 12px;
  }
  
  .print-table th {
    background: #3498db !important;
    color: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .print-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  
  .print-table .expense {
    color: #27ae60 !important;
  }
  
  .print-table .income {
    color: #e74c3c !important;
  }
}
</style>
