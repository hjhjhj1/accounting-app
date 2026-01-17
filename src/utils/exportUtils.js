export function exportToPDF(content, filename = 'bills.pdf') {
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('请允许弹窗以导出PDF')
    return
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }
        
        .header h1 {
          color: #3b82f6;
          margin: 0 0 10px 0;
        }
        
        .header .subtitle {
          color: #666;
          font-size: 14px;
        }
        
        .summary {
          display: flex;
          justify-content: space-around;
          margin-bottom: 30px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-item .label {
          font-size: 12px;
          color: #666;
        }
        
        .summary-item .value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        th {
          background: #f3f4f6;
          font-weight: 600;
          color: #1f2937;
        }
        
        tr:hover {
          background: #f9fafb;
        }
        
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .status.pending {
          background: #fef3c7;
          color: #d97706;
        }
        
        .status.paid {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status.overdue {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
          }
          
          .header {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}

export function generateBillPDFContent(bills, settings, totalAmount) {
  const periodNames = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则'
  }
  
  const startDate = new Date(settings.startDate)
  const formattedStartDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
  
  const paidCount = bills.filter(b => b.status === 'paid').length
  const pendingCount = bills.filter(b => b.status === 'pending').length
  
  return `
    <div class="header">
      <h1>周期账单计划</h1>
      <div class="subtitle">
        周期类型：${periodNames[settings.periodType]} | 总期数：${settings.totalPeriods}期 | 开始日期：${formattedStartDate}
      </div>
    </div>
    
    <div class="summary">
      <div class="summary-item">
        <div class="label">总金额</div>
        <div class="value">¥${totalAmount.toFixed(2)}</div>
      </div>
      <div class="summary-item">
        <div class="label">已支付</div>
        <div class="value">${paidCount} 期</div>
      </div>
      <div class="summary-item">
        <div class="label">待支付</div>
        <div class="value">${pendingCount} 期</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>期数</th>
          <th>账单日期</th>
          <th>金额</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        ${bills.map(bill => `
          <tr>
            <td>第 ${bill.periodNumber} 期</td>
            <td>${bill.dateText}</td>
            <td>¥${bill.amount.toFixed(2)}</td>
            <td>
              <span class="status ${bill.status}">
                ${bill.status === 'paid' ? '已支付' : bill.status === 'pending' ? '待支付' : '已逾期'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      生成时间：${new Date().toLocaleString('zh-CN')} | 周期账单管理系统
    </div>
  `
}

export function printBills(bills, settings, totalAmount) {
  const content = generateBillPDFContent(bills, settings, totalAmount)
  exportToPDF(content, 'bills.pdf')
}
