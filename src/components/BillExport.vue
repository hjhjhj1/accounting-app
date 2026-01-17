<template>
  <div class="bill-export">
    <div class="export-content">
      <div class="export-header">
        <h3>导出账单</h3>
        <button @click="$emit('close')" class="btn-close">关闭</button>
      </div>

      <div class="export-options">
        <div class="form-group">
          <label>导出格式</label>
          <select v-model="exportFormat">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div class="form-group">
          <label>导出内容</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeBasic" />
              基本信息
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeSchedule" />
              账单计划
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="includeStatistics" />
              统计信息
            </label>
          </div>
        </div>

        <div v-if="includeSchedule" class="form-group">
          <label>计划期数</label>
          <select v-model.number="schedulePeriods">
            <option :value="12">12期</option>
            <option :value="24">24期</option>
            <option :value="36">36期</option>
          </select>
        </div>
      </div>

      <div class="export-preview">
        <h4>预览</h4>
        <div class="preview-content">
          <div v-if="includeBasic" class="preview-section">
            <h5>基本信息</h5>
            <div v-for="bill in bills" :key="bill.id" class="bill-summary">
              <p><strong>{{ bill.name }}</strong></p>
              <p>金额: {{ bill.type === 'income' ? '+' : '-' }}¥{{ bill.amount.toFixed(2) }}</p>
              <p>周期: {{ getPeriodText(bill.period) }}</p>
            </div>
          </div>

          <div v-if="includeStatistics" class="preview-section">
            <h5>统计信息</h5>
            <p>总账单数: {{ bills.length }}</p>
            <p>总收入: ¥{{ totalIncome.toFixed(2) }}</p>
            <p>总支出: ¥{{ totalExpense.toFixed(2) }}</p>
            <p>净额: ¥{{ (totalIncome - totalExpense).toFixed(2) }}</p>
          </div>
        </div>
      </div>

      <div class="export-actions">
        <button @click="exportData" class="btn-export">导出</button>
        <button @click="printData" class="btn-print">打印</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  bills: {
    type: Array,
    required: true
  }
})

defineEmits(['close'])

const exportFormat = ref('pdf')
const includeBasic = ref(true)
const includeSchedule = ref(true)
const includeStatistics = ref(true)
const schedulePeriods = ref(36)

const totalIncome = computed(() => {
  return props.bills
    .filter(bill => bill.type === 'income')
    .reduce((total, bill) => total + bill.amount, 0)
})

const totalExpense = computed(() => {
  return props.bills
    .filter(bill => bill.type === 'expense')
    .reduce((total, bill) => total + bill.amount, 0)
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

function generateSchedule(bill, periods) {
  const result = []
  const startDate = new Date(bill.startDate)
  const { period } = bill

  if (period.type === 'monthly') {
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      date.setDate(period.day)
      result.push(date.toISOString().split('T')[0])
    }
  } else if (period.type === 'quarterly') {
    let currentDate = new Date(startDate)
    let count = 0

    while (count < periods) {
      const month = currentDate.getMonth() + 1
      if (period.quarters.includes(month)) {
        result.push(currentDate.toISOString().split('T')[0])
        count++
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  } else if (period.type === 'yearly') {
    let currentDate = new Date(startDate)
    let count = 0

    while (count < periods) {
      const month = currentDate.getMonth() + 1
      if (period.months.includes(month)) {
        result.push(currentDate.toISOString().split('T')[0])
        count++
      }
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  } else if (period.type === 'irregular') {
    const sortedDays = [...period.customDays].sort()
    for (let i = 0; i < periods && i < sortedDays.length; i++) {
      result.push(sortedDays[i])
    }

    let lastDate = new Date(sortedDays[sortedDays.length - 1] || startDate)
    while (result.length < periods) {
      lastDate.setMonth(lastDate.getMonth() + 1)
      result.push(lastDate.toISOString().split('T')[0])
    }
  }

  return result
}

function exportData() {
  if (exportFormat.value === 'csv') {
    exportCSV()
  } else if (exportFormat.value === 'json') {
    exportJSON()
  } else if (exportFormat.value === 'pdf') {
    exportPDF()
  }
}

function exportCSV() {
  let csvContent = ''

  if (includeBasic.value) {
    csvContent += '基本信息\n'
    csvContent += '账单名称,金额,类型,周期,开始日期\n'
    props.bills.forEach(bill => {
      csvContent += `"${bill.name}",${bill.amount},${bill.type === 'income' ? '收入' : '支出'},"${getPeriodText(bill.period)}","${bill.startDate}"\n`
    })
    csvContent += '\n'
  }

  if (includeStatistics.value) {
    csvContent += '统计信息\n'
    csvContent += `总账单数,${props.bills.length}\n`
    csvContent += `总收入,${totalIncome.value}\n`
    csvContent += `总支出,${totalExpense.value}\n`
    csvContent += `净额,${totalIncome.value - totalExpense.value}\n`
    csvContent += '\n'
  }

  if (includeSchedule.value) {
    csvContent += '账单计划\n'
    csvContent += '账单名称,期数,日期,金额,类型\n'
    props.bills.forEach(bill => {
      const schedule = generateSchedule(bill, schedulePeriods.value)
      schedule.forEach((date, index) => {
        csvContent += `"${bill.name}",${index + 1},"${date}",${bill.amount},${bill.type === 'income' ? '收入' : '支出'}\n`
      })
    })
  }

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `周期账单_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
}

function exportJSON() {
  const data = {
    exportDate: new Date().toISOString(),
    bills: []
  }

  props.bills.forEach(bill => {
    const billData = {
      name: bill.name,
      amount: bill.amount,
      type: bill.type,
      period: bill.period,
      startDate: bill.startDate,
      note: bill.note
    }

    if (includeSchedule.value) {
      billData.schedule = generateSchedule(bill, schedulePeriods.value).map((date, index) => ({
        index: index + 1,
        date: date,
        amount: bill.amount,
        type: bill.type
      }))
    }

    data.bills.push(billData)
  })

  if (includeStatistics.value) {
    data.statistics = {
      totalBills: props.bills.length,
      totalIncome: totalIncome.value,
      totalExpense: totalExpense.value,
      netAmount: totalIncome.value - totalExpense.value
    }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `周期账单_${new Date().toLocaleDateString('zh-CN')}.json`
  link.click()
}

function exportPDF() {
  const printWindow = window.open('', '_blank')
  const content = generatePrintContent()

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>周期账单导出</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          margin-top: 30px;
        }
        .bill-summary {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #3498db;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #34495e;
          color: white;
        }
        .income {
          color: #27ae60;
        }
        .expense {
          color: #e74c3c;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}

function generatePrintContent() {
  let content = `<h1>周期账单导出</h1>`
  content += `<p>导出日期: ${new Date().toLocaleString('zh-CN')}</p>`

  if (includeBasic.value) {
    content += `<h2>基本信息</h2>`
    props.bills.forEach(bill => {
      content += `
        <div class="bill-summary">
          <h3>${bill.name}</h3>
          <p>金额: <span class="${bill.type}">${bill.type === 'income' ? '+' : '-'}¥${bill.amount.toFixed(2)}</span></p>
          <p>类型: ${bill.type === 'income' ? '收入' : '支出'}</p>
          <p>周期: ${getPeriodText(bill.period)}</p>
          <p>开始日期: ${bill.startDate}</p>
          ${bill.note ? `<p>备注: ${bill.note}</p>` : ''}
        </div>
      `
    })
  }

  if (includeStatistics.value) {
    content += `<h2>统计信息</h2>`
    content += `
      <table>
        <tr><th>项目</th><th>金额</th></tr>
        <tr><td>总账单数</td><td>${props.bills.length}</td></tr>
        <tr><td>总收入</td><td class="income">¥${totalIncome.value.toFixed(2)}</td></tr>
        <tr><td>总支出</td><td class="expense">¥${totalExpense.value.toFixed(2)}</td></tr>
        <tr><td>净额</td><td class="${totalIncome.value >= totalExpense.value ? 'income' : 'expense'}">¥${(totalIncome.value - totalExpense.value).toFixed(2)}</td></tr>
      </table>
    `
  }

  if (includeSchedule.value) {
    content += `<h2>账单计划 (${schedulePeriods.value}期)</h2>`
    props.bills.forEach(bill => {
      const schedule = generateSchedule(bill, schedulePeriods.value)
      content += `
        <h3>${bill.name}</h3>
        <table>
          <tr><th>期数</th><th>日期</th><th>金额</th><th>类型</th></tr>
          ${schedule.map((date, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${date}</td>
              <td class="${bill.type}">${bill.type === 'income' ? '+' : '-'}¥${bill.amount.toFixed(2)}</td>
              <td>${bill.type === 'income' ? '收入' : '支出'}</td>
            </tr>
          `).join('')}
        </table>
      `
    })
  }

  return content
}

function printData() {
  const printWindow = window.open('', '_blank')
  const content = generatePrintContent()

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>打印周期账单</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          margin-top: 30px;
        }
        .bill-summary {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #3498db;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #34495e;
          color: white;
        }
        .income {
          color: #27ae60;
        }
        .expense {
          color: #e74c3c;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `)

  printWindow.document.close()
  printWindow.focus()

  setTimeout(() => {
    printWindow.print()
  }, 500)
}
</script>

<style scoped>
.bill-export {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.export-content {
  background: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.export-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.export-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-close:hover {
  background: #c0392b;
}

.export-options {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #34495e;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
}

.export-preview {
  margin-bottom: 20px;
}

.export-preview h4 {
  color: #34495e;
  margin-bottom: 15px;
}

.preview-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-section h5 {
  color: #2c3e50;
  margin-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 5px;
}

.bill-summary {
  background: #f8f9fa;
  padding: 10px;
  margin: 8px 0;
  border-left: 3px solid #3498db;
  border-radius: 2px;
}

.bill-summary p {
  margin: 5px 0;
  color: #34495e;
}

.bill-summary strong {
  color: #2c3e50;
}

.export-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-export,
.btn-print {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  color: white;
}

.btn-export {
  background: #27ae60;
}

.btn-export:hover {
  background: #229954;
}

.btn-print {
  background: #3498db;
}

.btn-print:hover {
  background: #2980b9;
}

@media print {
  .bill-export {
    position: static;
    background: white;
    display: block;
  }

  .export-header,
  .export-options,
  .export-actions {
    display: none;
  }
}
</style>
