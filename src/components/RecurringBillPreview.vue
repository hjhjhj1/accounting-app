<template>
  <div class="recurring-bill-preview">
    <div class="preview-header">
      <h3>账单预览（未来{{ previewCount }}期）</h3>
      <div class="preview-stats">
        <span class="stat-item">
          总金额：<strong :class="totalAmountClass">¥{{ formatNumber(totalAmount) }}</strong>
        </span>
        <span class="stat-item">
          平均每期：¥{{ formatNumber(averageAmount) }}
        </span>
      </div>
    </div>

    <div class="preview-actions">
      <button class="btn-export" @click="exportToPDF">
        <span class="icon">📄</span> 导出PDF
      </button>
      <button class="btn-print" @click="printPreview">
        <span class="icon">🖨️</span> 打印
      </button>
    </div>

    <div ref="previewContainer" class="preview-container">
      <div class="virtual-scroll-container" @scroll="handleScroll">
        <div 
          class="virtual-scroll-content"
          :style="{ height: totalHeight + 'px' }"
        >
          <div 
            class="visible-items"
            :style="{ transform: `translateY(${offsetY}px)` }"
          >
            <div 
              v-for="bill in visibleBills" 
              :key="bill.id"
              class="bill-item"
              :class="{ 
                'income': bill.type === 'income',
                'expense': bill.type === 'expense'
              }"
            >
              <div class="bill-number">第 {{ bill.periodNumber }} 期</div>
              <div class="bill-date" :title="formatDate(bill.date, false)">
                <span class="date-icon">📅</span>
                {{ formatDate(bill.date, true) }}
              </div>
              <div class="bill-amount" :class="bill.type">
                {{ bill.type === 'income' ? '+' : '-' }}¥{{ formatNumber(bill.amount) }}
              </div>
              <div class="bill-status">
                <span class="status-badge" :class="bill.status">
                  {{ getStatusLabel(bill.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="preview-footer">
      <span>显示 {{ visibleRange.start + 1 }} - {{ visibleRange.end }} 期，共 {{ previewCount }} 期</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default {
  name: 'RecurringBillPreview',
  props: {
    bills: {
      type: Array,
      required: true
    },
    previewCount: {
      type: Number,
      default: 36
    },
    billName: {
      type: String,
      default: '周期账单'
    }
  },
  setup(props) {
    const previewContainer = ref(null)
    const itemHeight = 60
    const containerHeight = 400
    const bufferSize = 5
    const scrollTop = ref(0)

    const totalHeight = computed(() => props.bills.length * itemHeight)
    
    const visibleRange = computed(() => {
      const start = Math.floor(scrollTop.value / itemHeight)
      const visibleCount = Math.ceil(containerHeight / itemHeight)
      const end = Math.min(start + visibleCount + bufferSize, props.bills.length)
      return {
        start: Math.max(0, start - bufferSize),
        end: end
      }
    })

    const visibleBills = computed(() => {
      return props.bills.slice(visibleRange.value.start, visibleRange.value.end)
    })

    const offsetY = computed(() => visibleRange.value.start * itemHeight)

    const totalAmount = computed(() => {
      return props.bills.reduce((sum, bill) => sum + bill.amount, 0)
    })

    const averageAmount = computed(() => {
      return props.bills.length > 0 ? totalAmount.value / props.bills.length : 0
    })

    const totalAmountClass = computed(() => {
      if (props.bills.length === 0) return ''
      const firstBill = props.bills[0]
      return firstBill.type === 'income' ? 'income-text' : 'expense-text'
    })

    const handleScroll = (e) => {
      scrollTop.value = e.target.scrollTop
    }

    const formatNumber = (num) => {
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const formatDate = (dateStr, compact = true) => {
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const weekdays = ['日', '一', '二', '三', '四', '五', '六']
      const weekday = weekdays[date.getDay()]
      if (compact) {
        return `${year}/${month}/${day} 周${weekday}`
      }
      return `${year}年${month}月${day}日 周${weekday}`
    }

    const getStatusLabel = (status) => {
      const labels = {
        pending: '待处理',
        paid: '已支付',
        overdue: '已逾期',
        cancelled: '已取消'
      }
      return labels[status] || status
    }

    const exportToPDF = async () => {
      const element = previewContainer.value
      if (!element) return

      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        
        const imgX = (pdfWidth - imgWidth * ratio) / 2
        const imgY = 20

        pdf.setFontSize(16)
        pdf.text(`${props.billName} - 预览报告`, pdfWidth / 2, 10, { align: 'center' })
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
        
        pdf.setFontSize(10)
        pdf.text(`生成时间：${new Date().toLocaleString('zh-CN')}`, 10, pdfHeight - 10)
        
        pdf.save(`${props.billName}_预览_${new Date().toISOString().split('T')[0]}.pdf`)
      } catch (error) {
        console.error('PDF导出失败:', error)
        alert('PDF导出失败，请重试')
      }
    }

    const printPreview = () => {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('请允许弹出窗口以进行打印')
        return
      }

      const billsHTML = props.bills.map(bill => `
        <tr class="${bill.type}">
          <td>第 ${bill.periodNumber} 期</td>
          <td>${formatDate(bill.date, false)}</td>
          <td class="amount ${bill.type}">
            ${bill.type === 'income' ? '+' : '-'}¥${formatNumber(bill.amount)}
          </td>
          <td>${getStatusLabel(bill.status)}</td>
        </tr>
      `).join('')

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${props.billName} - 打印预览</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #2c3e50; }
            .summary { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #3498db; color: white; }
            tr:hover { background: #f5f5f5; }
            .amount { font-weight: bold; }
            .income { color: #27ae60; }
            .expense { color: #e74c3c; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${props.billName} - 账单预览</h1>
          <div class="summary">
            <strong>统计信息：</strong>
            共 ${props.bills.length} 期 | 
            总金额：¥${formatNumber(totalAmount.value)} | 
            平均每期：¥${formatNumber(averageAmount.value)}
          </div>
          <table>
            <thead>
              <tr>
                <th>期数</th>
                <th>日期</th>
                <th>金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              ${billsHTML}
            </tbody>
          </table>
          <div class="footer">
            生成时间：${new Date().toLocaleString('zh-CN')}
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
              打印
            </button>
          </div>
        </body>
        </html>
      `)
      
      printWindow.document.close()
    }

    watch(() => props.bills, () => {
      scrollTop.value = 0
      nextTick(() => {
        const container = document.querySelector('.virtual-scroll-container')
        if (container) {
          container.scrollTop = 0
        }
      })
    }, { deep: true })

    return {
      previewContainer,
      visibleBills,
      totalHeight,
      offsetY,
      visibleRange,
      totalAmount,
      averageAmount,
      totalAmountClass,
      handleScroll,
      formatNumber,
      formatDate,
      getStatusLabel,
      exportToPDF,
      printPreview
    }
  }
}
</script>

<style scoped>
.recurring-bill-preview {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.preview-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.preview-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.stat-item strong {
  font-size: 16px;
}

.income-text {
  color: #27ae60;
}

.expense-text {
  color: #e74c3c;
}

.preview-actions {
  padding: 12px 24px;
  background: #f8f9fa;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid #eee;
}

.btn-export,
.btn-print {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-export:hover,
.btn-print:hover {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.icon {
  font-size: 14px;
}

.preview-container {
  height: 400px;
  position: relative;
}

.virtual-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-scroll-content {
  position: relative;
}

.visible-items {
  position: absolute;
  width: 100%;
}

.bill-item {
  display: grid;
  grid-template-columns: 65px 1fr 110px 65px;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  height: 60px;
  box-sizing: border-box;
  transition: background 0.2s;
  gap: 8px;
}

.bill-item:hover {
  background: #f8f9fa;
}

.bill-number {
  font-weight: 600;
  color: #666;
  font-size: 13px;
  white-space: nowrap;
}

.bill-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  min-width: 0;
}

.date-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.bill-amount {
  font-weight: 600;
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bill-amount.income {
  color: #27ae60;
}

.bill-amount.expense {
  color: #e74c3c;
}

.bill-status {
  text-align: right;
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.paid {
  background: #d4edda;
  color: #155724;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.cancelled {
  background: #e2e3e5;
  color: #383d41;
}

.preview-footer {
  padding: 12px 24px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  font-size: 13px;
  color: #666;
  text-align: center;
}

@media (max-width: 600px) {
  .bill-item {
    grid-template-columns: 60px 1fr 100px;
    grid-template-rows: auto auto;
    height: auto;
    padding: 12px 16px;
    gap: 8px;
  }
  
  .bill-status {
    display: none;
  }
  
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .preview-stats {
    flex-direction: column;
    gap: 8px;
  }
}

@media print {
  .preview-actions,
  .preview-footer {
    display: none;
  }
  
  .preview-container {
    height: auto;
    overflow: visible;
  }
  
  .virtual-scroll-container {
    overflow: visible;
  }
  
  .bill-item {
    break-inside: avoid;
  }
}
</style>
