<template>
  <div class="pdf-export">
    <button class="export-btn" @click="showModal = true">
      <span class="icon">📄</span>
      导出PDF
    </button>

    <!-- 导出设置弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>导出PDF设置</h3>
          <button class="close-btn" @click="showModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>导出范围</label>
            <select v-model="exportRange">
              <option value="all">全部账单</option>
              <option value="upcoming">即将到期（未来3个月）</option>
              <option value="custom">自定义范围</option>
            </select>
          </div>

          <div v-if="exportRange === 'custom'" class="form-row">
            <div class="form-group">
              <label>开始日期</label>
              <input v-model="customStartDate" type="date" />
            </div>
            <div class="form-group">
              <label>结束日期</label>
              <input v-model="customEndDate" type="date" />
            </div>
          </div>

          <div class="form-group">
            <label>包含内容</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input v-model="includeOptions.summary" type="checkbox" />
                汇总统计
              </label>
              <label class="checkbox-label">
                <input v-model="includeOptions.details" type="checkbox" />
                详细列表
              </label>
              <label class="checkbox-label">
                <input v-model="includeOptions.chart" type="checkbox" />
                图表
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>页面设置</label>
            <div class="radio-group">
              <label class="radio-label">
                <input v-model="pageOrientation" type="radio" value="portrait" />
                纵向
              </label>
              <label class="radio-label">
                <input v-model="pageOrientation" type="radio" value="landscape" />
                横向
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="handleExport" :disabled="exporting">
            {{ exporting ? '导出中...' : '确认导出' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 打印预览区域 -->
    <div v-show="false" ref="printArea" class="print-area">
      <div class="print-header">
        <h1>周期账单报表</h1>
        <p class="print-date">生成日期: {{ currentDate }}</p>
      </div>

      <div v-if="includeOptions.summary" class="print-summary">
        <h2>汇总统计</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <span class="label">总账单数</span>
            <span class="value">{{ statistics.totalBills }}</span>
          </div>
          <div class="summary-card">
            <span class="label">月度收支</span>
            <span :class="['value', statistics.monthlyTotal >= 0 ? 'income' : 'expense']">
              ¥{{ formatNumber(Math.abs(statistics.monthlyTotal)) }}
            </span>
          </div>
          <div class="summary-card">
            <span class="label">季度收支</span>
            <span :class="['value', statistics.quarterlyTotal >= 0 ? 'income' : 'expense']">
              ¥{{ formatNumber(Math.abs(statistics.quarterlyTotal)) }}
            </span>
          </div>
          <div class="summary-card">
            <span class="label">年度预估</span>
            <span :class="['value', statistics.annualEstimate >= 0 ? 'income' : 'expense']">
              ¥{{ formatNumber(Math.abs(statistics.annualEstimate)) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="includeOptions.details" class="print-details">
        <h2>账单明细</h2>
        <table class="print-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>名称</th>
              <th>分类</th>
              <th>类型</th>
              <th>金额</th>
              <th>期数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in exportData" :key="item.id">
              <td>{{ item.dueDate }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category || '-' }}</td>
              <td :class="item.type">{{ item.type === 'income' ? '收入' : '支出' }}</td>
              <td :class="item.type">
                {{ item.type === 'income' ? '+' : '-' }}¥{{ formatNumber(item.amount) }}
              </td>
              <td>第 {{ item.periodIndex }} 期</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-footer">
        <p>本报表由记账应用自动生成</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'

const { allBillInstances, statistics } = inject('periodicBillState')

const showModal = ref(false)
const exporting = ref(false)
const printArea = ref(null)

const exportRange = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')
const includeOptions = ref({
  summary: true,
  details: true,
  chart: false
})
const pageOrientation = ref('portrait')

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const exportData = computed(() => {
  let data = allBillInstances.value

  const today = new Date()

  switch (exportRange.value) {
    case 'upcoming': {
      const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      data = data.filter(item => new Date(item.dueDate) <= threeMonthsLater)
      break
    }
    case 'custom':
      if (customStartDate.value) {
        data = data.filter(item => new Date(item.dueDate) >= new Date(customStartDate.value))
      }
      if (customEndDate.value) {
        data = data.filter(item => new Date(item.dueDate) <= new Date(customEndDate.value))
      }
      break
  }

  return data
})

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const handleExport = async () => {
  exporting.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 100))

    const printStyles = `
      @page {
        size: A4 ${pageOrientation.value};
        margin: 15mm;
      }
      body {
        font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #333;
      }
      .print-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #3498db;
      }
      .print-header h1 {
        font-size: 24pt;
        color: #2c3e50;
        margin: 0 0 10px 0;
      }
      .print-date {
        color: #666;
        font-size: 11pt;
      }
      .print-summary {
        margin-bottom: 30px;
      }
      .print-summary h2,
      .print-details h2 {
        font-size: 16pt;
        color: #2c3e50;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      .summary-card {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 8px;
        text-align: center;
      }
      .summary-card .label {
        display: block;
        font-size: 10pt;
        color: #666;
        margin-bottom: 5px;
      }
      .summary-card .value {
        display: block;
        font-size: 18pt;
        font-weight: bold;
      }
      .summary-card .value.income {
        color: #27ae60;
      }
      .summary-card .value.expense {
        color: #e74c3c;
      }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      .print-table th,
      .print-table td {
        padding: 10px 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      .print-table th {
        background: #f8f9fa;
        font-weight: bold;
        color: #2c3e50;
      }
      .print-table td.income {
        color: #27ae60;
      }
      .print-table td.expense {
        color: #e74c3c;
      }
      .print-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        text-align: center;
        font-size: 10pt;
        color: #999;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>周期账单报表</title>
          <style>${printStyles}</style>
        </head>
        <body>
          ${printArea.value.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()

    printWindow.onload = () => {
      printWindow.print()
    }

    setTimeout(() => {
      printWindow.print()
    }, 500)

    showModal.value = false
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.pdf-export {
  display: inline-block;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.export-btn:hover {
  background: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.icon {
  font-size: 16px;
}

.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: 50vh;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.checkbox-group,
.radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
}

.checkbox-label input,
.radio-label input {
  width: auto;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.print-area {
  padding: 40px;
  background: white;
}
</style>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area,
  .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
