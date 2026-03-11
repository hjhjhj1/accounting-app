<template>
  <div class="billing-preview">
    <div class="preview-header">
      <h3>未来账单预览（{{ previewCount }}期）</h3>
      <div class="preview-controls">
        <label>显示期数：</label>
        <select v-model.number="previewCount" @change="updatePreviewCount">
          <option :value="12">12期</option>
          <option :value="24">24期</option>
          <option :value="36">36期</option>
          <option :value="60">60期</option>
        </select>
      </div>
    </div>
    
    <div class="preview-stats" v-if="previewBills.length > 0">
      <div class="stat-item">
        <span class="stat-label">总期数：</span>
        <span class="stat-value">{{ previewBills.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总支出：</span>
        <span class="stat-value stat-expense">¥{{ totalExpense.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总收入：</span>
        <span class="stat-value stat-income">¥{{ totalIncome.toFixed(2) }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">净收支：</span>
        <span class="stat-value" :class="totalIncome - totalExpense >= 0 ? 'stat-income' : 'stat-expense'">
          {{ totalIncome - totalExpense >= 0 ? '+' : '' }}¥{{ (totalIncome - totalExpense).toFixed(2) }}
        </span>
      </div>
      <div class="stat-item">
        <span class="stat-label">开始日期：</span>
        <span class="stat-value">{{ previewBills[0]?.dueDate }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">结束日期：</span>
        <span class="stat-value">{{ previewBills[previewBills.length - 1]?.dueDate }}</span>
      </div>
    </div>

    <div class="preview-list" ref="previewRef">
      <div class="list-header">
        <span class="header-period">期数</span>
        <span class="header-info">账单信息</span>
        <span class="header-amount">金额</span>
        <span class="header-cycle">周期</span>
      </div>
      <VirtualScrollList 
        :items="previewBills" 
        :item-height="70" 
        :container-height="500"
      />
    </div>

    <!-- Hidden full list for PDF export -->
    <div ref="pdfExportRef" class="pdf-export-container">
      <h1>周期账单计划</h1>
      <div class="pdf-stats">
        <div class="pdf-stat">
          <span class="pdf-stat-label">总期数：</span>
          <span class="pdf-stat-value">{{ previewBills.length }}</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">总支出：</span>
          <span class="pdf-stat-value pdf-stat-expense">¥{{ totalExpense.toFixed(2) }}</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">总收入：</span>
          <span class="pdf-stat-value pdf-stat-income">¥{{ totalIncome.toFixed(2) }}</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">净收支：</span>
          <span class="pdf-stat-value" :class="totalIncome - totalExpense >= 0 ? 'pdf-stat-income' : 'pdf-stat-expense'">
            {{ totalIncome - totalExpense >= 0 ? '+' : '' }}¥{{ (totalIncome - totalExpense).toFixed(2) }}
          </span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">开始日期：</span>
          <span class="pdf-stat-value">{{ previewBills[0]?.dueDate || '-' }}</span>
        </div>
        <div class="pdf-stat">
          <span class="pdf-stat-label">结束日期：</span>
          <span class="pdf-stat-value">{{ previewBills[previewBills.length - 1]?.dueDate || '-' }}</span>
        </div>
      </div>
      <div class="pdf-list-header">
        <span class="pdf-header-period">期数</span>
        <span class="pdf-header-info">账单信息</span>
        <span class="pdf-header-amount">金额</span>
        <span class="pdf-header-cycle">周期</span>
        <span class="pdf-header-type">类型</span>
      </div>
      <div 
        v-for="bill in previewBills" 
        :key="bill.id" 
        class="pdf-bill-item"
      >
        <div class="pdf-bill-period">第{{ bill.period }}期</div>
        <div class="pdf-bill-info">
          <div class="pdf-bill-name">{{ bill.name }}</div>
          <div class="pdf-bill-date">{{ bill.dueDate }}</div>
        </div>
        <div class="pdf-bill-amount" :class="getTypeClass(bill.type)">¥{{ bill.amount.toFixed(2) }}</div>
        <div class="pdf-bill-type" :class="getTypeClass(bill.type)">
          {{ bill.type === 'expense' ? '支出' : '收入' }}
        </div>
        <div class="pdf-bill-cycle">{{ getCycleLabel(bill.cycle) }}</div>
      </div>
    </div>

    <div class="export-actions" v-if="previewBills.length > 0">
      <button @click="handleExportPDF" class="btn-export-pdf">
        📄 导出PDF
      </button>
      <button @click="handlePrint" class="btn-print">
        🖨️ 打印
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import html2pdf from 'html2pdf.js'
import { useRecurringBilling, BILLING_TYPES } from '@/composables/useRecurringBilling'
import VirtualScrollList from './VirtualScrollList.vue'

const { previewBills, previewCount, totalExpense, totalIncome, regeneratePreview } = useRecurringBilling()

const getTypeClass = (type) => {
  return type === BILLING_TYPES.EXPENSE ? 'type-expense' : 'type-income'
}

const previewRef = ref(null)
const pdfExportRef = ref(null)

const updatePreviewCount = () => {
  regeneratePreview()
}

const handleExportPDF = async () => {
  const element = pdfExportRef.value
  if (!element) return

  const opt = {
    margin: 10,
    filename: `周期账单_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  try {
    await html2pdf().set(opt).from(element).save()
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert('PDF导出失败，请重试')
  }
}

const getCycleLabelText = (cycle) => {
  const labels = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则'
  }
  return labels[cycle] || cycle
}

const handlePrint = () => {
  const printWindow = window.open('', '_blank')
  const netAmount = totalIncome.value - totalExpense.value
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>周期账单打印</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Microsoft YaHei', Arial, sans-serif; 
          padding: 20px;
          color: #2c3e50;
        }
        h1 { 
          text-align: center; 
          margin-bottom: 20px;
          color: #3498db;
        }
        .stats { 
          display: flex; 
          justify-content: space-around; 
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .stat { text-align: center; min-width: 100px; }
        .stat-label { font-size: 12px; color: #7f8c8d; }
        .stat-value { font-size: 16px; font-weight: bold; }
        .stat-expense { color: #e74c3c; }
        .stat-income { color: #27ae60; }
        .bill-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        .bill-period { width: 80px; font-weight: bold; color: #3498db; }
        .bill-info { flex: 1; }
        .bill-name { font-weight: 500; }
        .bill-date { font-size: 12px; color: #7f8c8d; }
        .bill-amount { 
          width: 120px; 
          text-align: right; 
          font-weight: bold; 
        }
        .bill-amount.expense { color: #e74c3c; }
        .bill-amount.income { color: #27ae60; }
        .bill-cycle { 
          width: 60px; 
          text-align: center;
          font-size: 12px;
          background: #ecf0f1;
          padding: 2px 6px;
          border-radius: 10px;
          margin-right: 8px;
        }
        .bill-type {
          width: 50px;
          text-align: center;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
        }
        .bill-type.expense { background: #fdecea; color: #e74c3c; }
        .bill-type.income { background: #e8f5e9; color: #27ae60; }
        .header {
          display: flex;
          padding: 12px;
          background: #3498db;
          color: white;
          font-weight: bold;
        }
        .header-period { width: 80px; }
        .header-info { flex: 1; }
        .header-amount { width: 120px; text-align: right; }
        .header-cycle { width: 60px; text-align: center; margin-right: 8px; }
        .header-type { width: 50px; text-align: center; }
      </style>
    </head>
    <body>
      <h1>周期账单计划</h1>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">总期数</div>
          <div class="stat-value">${previewBills.value.length}</div>
        </div>
        <div class="stat">
          <div class="stat-label">总支出</div>
          <div class="stat-value stat-expense">¥${totalExpense.value.toFixed(2)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">总收入</div>
          <div class="stat-value stat-income">¥${totalIncome.value.toFixed(2)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">净收支</div>
          <div class="stat-value ${netAmount >= 0 ? 'stat-income' : 'stat-expense'}">${netAmount >= 0 ? '+' : ''}¥${netAmount.toFixed(2)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">开始日期</div>
          <div class="stat-value">${previewBills.value[0]?.dueDate || '-'}</div>
        </div>
        <div class="stat">
          <div class="stat-label">结束日期</div>
          <div class="stat-value">${previewBills.value[previewBills.value.length - 1]?.dueDate || '-'}</div>
        </div>
      </div>
      <div class="header">
        <span class="header-period">期数</span>
        <span class="header-info">账单信息</span>
        <span class="header-amount">金额</span>
        <span class="header-cycle">周期</span>
        <span class="header-type">类型</span>
      </div>
      ${previewBills.value.map(bill => `
        <div class="bill-item">
          <div class="bill-period">第${bill.period}期</div>
          <div class="bill-info">
            <div class="bill-name">${bill.name}</div>
            <div class="bill-date">${bill.dueDate}</div>
          </div>
          <div class="bill-amount ${bill.type}">¥${bill.amount.toFixed(2)}</div>
          <div class="bill-cycle">${getCycleLabelText(bill.cycle)}</div>
          <div class="bill-type ${bill.type}">${bill.type === 'expense' ? '支出' : '收入'}</div>
        </div>
      `).join('')}
    </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

const getCycleLabel = (cycle) => {
  const labels = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则'
  }
  return labels[cycle] || cycle
}

defineExpose({
  getCycleLabel,
  getTypeClass
})
</script>

<style scoped>
.billing-preview {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-controls label {
  font-size: 14px;
  color: #7f8c8d;
}

.preview-controls select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-expense {
  color: #e74c3c !important;
}

.stat-income {
  color: #27ae60 !important;
}

.preview-list {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  padding: 12px 16px;
  background: #3498db;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.header-period {
  width: 60px;
}

.header-info {
  flex: 1;
  padding: 0 16px;
}

.header-amount {
  width: 100px;
  text-align: right;
}

.header-cycle {
  width: 80px;
  text-align: center;
}

.export-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
}

button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-export-pdf {
  background: #e74c3c;
  color: white;
}

.btn-export-pdf:hover {
  background: #c0392b;
}

.btn-print {
  background: #3498db;
  color: white;
}

.btn-print:hover {
  background: #2980b9;
}

/* Print styles */
.pdf-export-container {
  position: absolute;
  left: -9999px;
  top: 0;
  width: 210mm;
  padding: 20px;
  background: white;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

.pdf-export-container h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 24px;
}

.pdf-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.pdf-stat {
  text-align: center;
}

.pdf-stat-label {
  font-size: 12px;
  color: #7f8c8d;
  display: block;
}

.pdf-stat-value {
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

.pdf-list-header {
  display: flex;
  padding: 12px;
  background: #3498db;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.pdf-header-period {
  width: 60px;
}

.pdf-header-info {
  flex: 1;
  padding: 0 16px;
}

.pdf-header-amount {
  width: 100px;
  text-align: right;
}

.pdf-header-cycle {
  width: 80px;
  text-align: center;
}

.pdf-header-type {
  width: 60px;
  text-align: center;
}

.pdf-bill-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.pdf-bill-period {
  width: 60px;
  font-weight: bold;
  color: #3498db;
}

.pdf-bill-info {
  flex: 1;
  padding: 0 16px;
}

.pdf-bill-name {
  font-weight: 500;
}

.pdf-bill-date {
  font-size: 12px;
  color: #7f8c8d;
}

.pdf-bill-amount {
  width: 100px;
  text-align: right;
  font-weight: bold;
  color: #e74c3c;
}

.pdf-bill-cycle {
  width: 80px;
  text-align: center;
  font-size: 12px;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 10px;
}

.pdf-bill-type {
  width: 50px;
  text-align: center;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.pdf-stat-expense {
  color: #e74c3c;
}

.pdf-stat-income {
  color: #27ae60;
}

.type-expense {
  color: #e74c3c;
  background: #fdecea;
}

.type-income {
  color: #27ae60;
  background: #e8f5e9;
}

@media print {
  .billing-preview {
    box-shadow: none;
  }
  
  .preview-controls,
  .export-actions {
    display: none !important;
  }
  
  .preview-list {
    border: none;
  }
  
  .pdf-export-container {
    display: none;
  }
}
</style>
