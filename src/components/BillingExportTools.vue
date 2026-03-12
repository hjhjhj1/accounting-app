<template>
  <div class="billing-export-tools">
    <button class="export-btn btn-print" @click="handlePrint">
      <span class="btn-icon">🖨️</span>
      打印
    </button>
    <button class="export-btn btn-pdf" @click="handleExportPDF" :disabled="exporting">
      <span class="btn-icon">📄</span>
      {{ exporting ? '导出中...' : '导出PDF' }}
    </button>
  </div>

  <div v-if="showPrintModal" class="print-modal-overlay" @click.self="closePrintModal">
    <div class="print-modal">
      <div class="print-modal-header">
        <h3>打印预览</h3>
        <button class="close-btn" @click="closePrintModal">×</button>
      </div>
      <div class="print-modal-body" ref="printContent">
        <div class="print-header">
          <h2>周期账单计划</h2>
          <p class="print-date">生成日期: {{ currentDate }}</p>
        </div>
        <table class="print-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>账单名称</th>
              <th>日期</th>
              <th>周期类型</th>
              <th>金额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(bill, index) in generatedBills" :key="bill.id">
              <td>{{ index + 1 }}</td>
              <td>{{ bill.name }}</td>
              <td>{{ formatDate(bill.date) }}</td>
              <td>{{ getCycleLabel(bill.cycleType) }}</td>
              <td>¥{{ parseFloat(bill.amount).toFixed(2) }}</td>
              <td>{{ getStatusLabel(bill.status) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="print-summary">
          <p>总期数: {{ generatedBills.length }} 期</p>
          <p>总金额: ¥{{ totalAmount.toFixed(2) }}</p>
        </div>
      </div>
      <div class="print-modal-footer">
        <button class="btn btn-secondary" @click="closePrintModal">取消</button>
        <button class="btn btn-primary" @click="confirmPrint">确认打印</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecurringBilling } from '../composables/useRecurringBilling'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const { generatedBills, cycleLabels, totalAmount } = useRecurringBilling()

const showPrintModal = ref(false)
const exporting = ref(false)
const printContent = ref(null)

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

const handlePrint = () => {
  showPrintModal.value = true
}

const closePrintModal = () => {
  showPrintModal.value = false
}

const confirmPrint = () => {
  window.print()
  closePrintModal()
}

const handleExportPDF = async () => {
  if (generatedBills.length === 0) {
    alert('暂无账单数据可导出')
    return
  }

  exporting.value = true
  showPrintModal.value = true
  
  try {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const printContentEl = printContent.value
    
    if (!printContentEl) {
      throw new Error('无法获取打印内容元素')
    }
    
    const canvas = await html2canvas(printContentEl, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 10
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
    pdf.save(`周期账单计划_${currentDate.value}.pdf`)
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert('PDF导出失败，请重试')
  } finally {
    exporting.value = false
    showPrintModal.value = false
  }
}
</script>

<style scoped>
.billing-export-tools {
  display: flex;
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-print {
  background: #f0f0f0;
  color: #333;
}

.btn-print:hover {
  background: #e8e8e8;
}

.btn-pdf {
  background: #1890ff;
  color: #fff;
}

.btn-pdf:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-icon {
  font-size: 16px;
}

.print-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.print-modal {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.print-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.print-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.print-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.print-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: #fff;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

@media print {
  body * {
    visibility: hidden;
  }
  
  .print-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #fff;
    z-index: 9999;
  }
  
  .print-modal {
    max-width: none;
    max-height: none;
    box-shadow: none;
    border: none;
  }
  
  .print-modal-header,
  .print-modal-footer,
  .close-btn,
  .btn {
    display: none !important;
  }
  
  .print-modal-body {
    overflow: visible;
    padding: 20px;
  }
  
  .print-modal-body,
  .print-modal-body * {
    visibility: visible;
  }
  
  .print-header {
    border-bottom: 2px solid #333;
  }
  
  .print-table th {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .print-summary {
    background: #f0f0f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>

<style>
.print-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #1890ff;
}

.print-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.print-date {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 24px;
}

.print-table th,
.print-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.print-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.print-table tbody tr:hover {
  background: #fafafa;
}

.print-summary {
  display: flex;
  justify-content: flex-end;
  gap: 32px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.print-summary p {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}
</style>
