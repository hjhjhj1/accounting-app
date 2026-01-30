<template>
  <div class="recurring-bill-manager" ref="printContent">
    <div class="manager-header no-print">
      <h2>周期账单管理</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showAddForm = true">
          + 添加周期账单
        </button>
        <button class="btn btn-secondary" @click="exportToPDF">
          导出PDF
        </button>
        <button class="btn btn-secondary" @click="printSchedule">
          打印
        </button>
      </div>
    </div>

    <div v-if="showAddForm" class="form-modal no-print" @click.self="closeForm">
      <div class="form-container">
        <h3>{{ editingBill ? '编辑周期账单' : '添加周期账单' }}</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>账单名称</label>
            <input v-model="formData.name" type="text" required placeholder="例如：房租、工资" />
          </div>

          <div class="form-group">
            <label>金额</label>
            <input v-model.number="formData.amount" type="number" step="0.01" min="0" required placeholder="0.00" />
          </div>

          <div class="form-group">
            <label>类型</label>
            <select v-model="formData.type">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>

          <div class="form-group">
            <label>周期类型</label>
            <select v-model="formData.cycleType">
              <option value="monthly">月度</option>
              <option value="quarterly">季度</option>
              <option value="yearly">年度</option>
              <option value="irregular">不规则</option>
            </select>
          </div>

          <div class="form-group">
            <label>开始日期</label>
            <input v-model="formData.startDate" type="date" required />
          </div>

          <div class="form-group">
            <label>结束日期（可选）</label>
            <input v-model="formData.endDate" type="date" />
          </div>

          <div v-if="formData.cycleType !== 'irregular'" class="form-group">
            <label>{{ formData.cycleType === 'yearly' ? '月日' : '每月日期' }}</label>
            <input v-model.number="formData.dayOfMonth" type="number" min="1" :max="formData.cycleType === 'yearly' ? 31 : 31" />
          </div>

          <div v-if="formData.cycleType === 'irregular'" class="form-group">
            <label>每月固定日期（用逗号分隔，如：5,15,25）</label>
            <input v-model="customDaysInput" type="text" placeholder="5,15,25" />
          </div>

          <div class="form-group">
            <label>分类</label>
            <input v-model="formData.category" type="text" placeholder="例如：住房、餐饮、交通" />
          </div>

          <div class="form-group">
            <label>备注</label>
            <textarea v-model="formData.description" rows="2" placeholder="选填备注"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" @click="closeForm">取消</button>
            <button type="submit" class="btn btn-primary">
              {{ editingBill ? '保存修改' : '添加账单' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="tabs no-print">
      <button
        :class="['tab-btn', { active: activeTab === 'list' }]"
        @click="activeTab = 'list'"
      >
        账单列表
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'schedule' }]"
        @click="activeTab = 'schedule'"
      >
        36期预览
      </button>
      <button
        :class="['tab-btn', { active: activeTab === 'summary' }]"
        @click="activeTab = 'summary'"
      >
        月度汇总
      </button>
    </div>

    <div v-if="activeTab === 'list'" class="bill-list no-print">
      <div class="list-header">
        <span>账单名称</span>
        <span>金额</span>
        <span>周期</span>
        <span>类型</span>
        <span>操作</span>
      </div>
      <div v-for="bill in bills" :key="bill.id" class="list-item">
        <span class="bill-name">{{ bill.name }}</span>
        <span :class="['bill-amount', bill.type]">{{ formatAmount(bill.amount) }}</span>
        <span class="bill-cycle">{{ getCycleLabel(bill.cycleType) }}</span>
        <span :class="['bill-type', bill.type]">{{ bill.type === 'income' ? '收入' : '支出' }}</span>
        <span class="bill-actions">
          <button class="icon-btn" @click="editBill(bill)" title="编辑">
            ✏️
          </button>
          <button class="icon-btn" @click="deleteBill(bill.id)" title="删除">
            🗑️
          </button>
        </span>
      </div>
      <div v-if="bills.length === 0" class="empty-state">
        暂无周期账单，点击上方按钮添加
      </div>
    </div>

    <div v-if="activeTab === 'schedule'" class="schedule-preview">
      <div class="schedule-filters no-print">
        <label>
          <input type="checkbox" v-model="showIncome" /> 显示收入
        </label>
        <label>
          <input type="checkbox" v-model="showExpense" /> 显示支出
        </label>
        <label>
          显示期数：
          <select v-model.number="displayPeriods">
            <option :value="12">12期</option>
            <option :value="24">24期</option>
            <option :value="36">36期</option>
          </select>
        </label>
      </div>
      <div class="schedule-list">
        <VirtualScrollList
          :items="filteredSchedule"
          :item-height="90"
          :buffer="5"
          @load-more="loadMore"
        >
          <template v-slot="{ item }">
            <div :class="['schedule-item', item.type]">
              <div class="schedule-date">
                <div class="date-day">{{ getDay(item.billDate) }}</div>
                <div class="date-month">{{ getMonthYear(item.billDate) }}</div>
              </div>
              <div class="schedule-info">
                <div class="info-name">{{ item.name }}</div>
                <div class="info-meta">
                  <span class="period-badge">第{{ item.period }}期</span>
                  <span class="category-tag">{{ item.category }}</span>
                </div>
                <div v-if="item.description" class="info-desc">{{ item.description }}</div>
              </div>
              <div class="schedule-amount">
                <span :class="['amount', item.type]">
                  {{ item.type === 'income' ? '+' : '-' }}{{ formatAmount(item.amount) }}
                </span>
                <span :class="['status', item.status]">
                  {{ item.status === 'paid' ? '已支付' : '待支付' }}
                </span>
              </div>
            </div>
          </template>
        </VirtualScrollList>
      </div>
    </div>

    <div v-if="activeTab === 'summary'" class="monthly-summary">
      <div class="summary-legend no-print">
        <div class="legend-item">
          <span class="income-dot"></span> 收入
        </div>
        <div class="legend-item">
          <span class="expense-dot"></span> 支出
        </div>
        <div class="legend-item">
          <span class="balance-dot"></span> 结余
        </div>
      </div>
      <div class="summary-grid">
        <div v-for="(data, month) in getSummaryArray" :key="month" class="summary-card">
          <div class="card-header">
            <span class="month-title">{{ formatMonth(month) }}</span>
            <span :class="['balance', data.balance >= 0 ? 'positive' : 'negative']">
              {{ data.balance >= 0 ? '+' : '' }}{{ formatAmount(data.balance) }}
            </span>
          </div>
          <div class="card-body">
            <div class="row">
              <span class="label">收入</span>
              <span class="value income">{{ formatAmount(data.income) }}</span>
            </div>
            <div class="row">
              <span class="label">支出</span>
              <span class="value expense">{{ formatAmount(data.expense) }}</span>
            </div>
            <div class="row">
              <span class="label">账单数</span>
              <span class="value">{{ data.bills.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="print-only print-content">
      <div class="print-header">
        <h1>周期账单计划表</h1>
        <p>打印日期: {{ new Date().toLocaleDateString('zh-CN') }}</p>
      </div>
      <table class="print-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>账单名称</th>
            <th>分类</th>
            <th>类型</th>
            <th>金额</th>
            <th>期数</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in printScheduleData" :key="item.scheduleId">
            <td>{{ item.billDate }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.type === 'income' ? '收入' : '支出' }}</td>
            <td :class="item.type">{{ formatAmount(item.amount) }}</td>
            <td>第{{ item.period }}期</td>
          </tr>
        </tbody>
      </table>
      <div class="print-summary">
        <p>总收入: {{ formatAmount(printTotalIncome) }}</p>
        <p>总支出: {{ formatAmount(printTotalExpense) }}</p>
        <p :class="printTotalBalance >= 0 ? 'positive' : 'negative'">
          净结余: {{ printTotalBalance >= 0 ? '+' : '' }}{{ formatAmount(printTotalBalance) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRecurringBills } from '../composables/useRecurringBills'
import VirtualScrollList from './VirtualScrollList.vue'

export default {
  name: 'RecurringBillManager',
  components: {
    VirtualScrollList
  },
  setup() {
    const { bills, addBill, updateBill, deleteBill, getAllScheduledBills, getMonthlySummary } = useRecurringBills()

    const showAddForm = ref(false)
    const activeTab = ref('schedule')
    const editingBill = ref(null)
    const showIncome = ref(true)
    const showExpense = ref(true)
    const displayPeriods = ref(36)
    const isLoading = ref(false)
    const printContent = ref(null)

    const defaultFormData = {
      name: '',
      amount: 0,
      type: 'expense',
      cycleType: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      dayOfMonth: 1,
      customDays: [],
      category: '',
      description: ''
    }

    const formData = ref({ ...defaultFormData })
    const customDaysInput = ref('')

    const filteredSchedule = computed(() => {
      const schedule = getAllScheduledBills(displayPeriods.value)
      return schedule.filter(item => {
        if (item.type === 'income' && !showIncome.value) return false
        if (item.type === 'expense' && !showExpense.value) return false
        return true
      })
    })

    const getSummaryArray = computed(() => {
      return getMonthlySummary.value
    })

    const printSchedule = computed(() => {
      return getAllScheduledBills(36)
    })

    const printTotalIncome = computed(() => {
      return printSchedule.value
        .filter(item => item.type === 'income')
        .reduce((sum, item) => sum + item.amount, 0)
    })

    const printTotalExpense = computed(() => {
      return printSchedule.value
        .filter(item => item.type === 'expense')
        .reduce((sum, item) => sum + item.amount, 0)
    })

    const printTotalBalance = computed(() => {
      return printTotalIncome.value - printTotalExpense.value
    })

    const handleSubmit = () => {
      const billData = { ...formData.value }

      if (formData.value.cycleType === 'irregular' && customDaysInput.value) {
        billData.customDays = customDaysInput.value
          .split(',')
          .map(d => parseInt(d.trim()))
          .filter(d => !isNaN(d) && d > 0 && d <= 31)
      }

      if (editingBill.value) {
        updateBill(editingBill.value.id, billData)
      } else {
        addBill(billData)
      }

      closeForm()
    }

    const closeForm = () => {
      showAddForm.value = false
      editingBill.value = null
      formData.value = { ...defaultFormData }
      customDaysInput.value = ''
    }

    const editBill = (bill) => {
      editingBill.value = bill
      formData.value = { ...bill }
      if (bill.cycleType === 'irregular' && bill.customDays.length) {
        customDaysInput.value = bill.customDays.join(', ')
      }
      showAddForm.value = true
    }

    const loadMore = () => {
      if (displayPeriods.value < 36) {
        isLoading.value = true
        setTimeout(() => {
          displayPeriods.value = Math.min(36, displayPeriods.value + 12)
          isLoading.value = false
        }, 500)
      }
    }

    const exportToPDF = () => {
      window.print()
    }

    const handlePrint = () => {
      window.print()
    }

    const formatAmount = (amount) => {
      return '¥' + Number(amount).toFixed(2)
    }

    const getCycleLabel = (type) => {
      const labels = {
        monthly: '月度',
        quarterly: '季度',
        yearly: '年度',
        irregular: '不规则'
      }
      return labels[type] || type
    }

    const getDay = (dateStr) => {
      return new Date(dateStr).getDate()
    }

    const getMonthYear = (dateStr) => {
      const date = new Date(dateStr)
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    }

    const formatMonth = (monthKey) => {
      const [year, month] = monthKey.split('-')
      return `${year}年${parseInt(month)}月`
    }

    onMounted(() => {
      formData.value.startDate = new Date().toISOString().split('T')[0]
    })

    return {
      bills,
      showAddForm,
      activeTab,
      editingBill,
      formData,
      customDaysInput,
      showIncome,
      showExpense,
      displayPeriods,
      isLoading,
      printContent,
      filteredSchedule,
      getSummaryArray,
      printScheduleData: printSchedule,
      printTotalIncome,
      printTotalExpense,
      printTotalBalance,
      handleSubmit,
      closeForm,
      editBill,
      deleteBill,
      loadMore,
      exportToPDF,
      printSchedule: handlePrint,
      formatAmount,
      getCycleLabel,
      getDay,
      getMonthYear,
      formatMonth
    }
  }
}
</script>

<style scoped>
.recurring-bill-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.manager-header h2 {
  margin: 0;
  color: #1a1a1a;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.tab-btn {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
}

.tab-btn.active {
  border-bottom-color: #4f46e5;
  color: #4f46e5;
  font-weight: 500;
}

.form-modal {
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

.form-container {
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-container h3 {
  margin: 0 0 24px;
  color: #1a1a1a;
  font-size: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.bill-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.list-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
}

.list-item:last-child {
  border-bottom: none;
}

.bill-name {
  font-weight: 500;
  color: #1a1a1a;
}

.bill-amount {
  font-weight: 600;
}

.bill-amount.income {
  color: #059669;
}

.bill-amount.expense {
  color: #dc2626;
}

.bill-cycle {
  color: #6b7280;
}

.bill-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.bill-type.income {
  background: #d1fae5;
  color: #065f46;
}

.bill-type.expense {
  background: #fee2e2;
  color: #991b1b;
}

.bill-actions {
  display: flex;
  gap: 8px;
}

.icon-btn {
  padding: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.icon-btn:hover {
  opacity: 1;
}

.empty-state {
  padding: 48px;
  text-align: center;
  color: #6b7280;
}

.schedule-filters {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.schedule-filters label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
}

.schedule-filters select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.schedule-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-left: 4px solid transparent;
  transition: background 0.2s;
}

.schedule-item:hover {
  background: #f9fafb;
}

.schedule-item.income {
  border-left-color: #059669;
}

.schedule-item.expense {
  border-left-color: #dc2626;
}

.schedule-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.date-day {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.date-month {
  font-size: 12px;
  color: #6b7280;
}

.schedule-info {
  flex: 1;
}

.info-name {
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.info-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.period-badge {
  padding: 2px 8px;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 4px;
  font-size: 12px;
}

.category-tag {
  color: #6b7280;
  font-size: 12px;
}

.info-desc {
  font-size: 12px;
  color: #9ca3af;
}

.schedule-amount {
  text-align: right;
}

.schedule-amount .amount {
  display: block;
  font-size: 18px;
  font-weight: 600;
}

.schedule-amount .amount.income {
  color: #059669;
}

.schedule-amount .amount.expense {
  color: #dc2626;
}

.schedule-amount .status {
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.schedule-amount .status.paid {
  color: #6b7280;
}

.schedule-amount .status.pending {
  color: #f59e0b;
}

.monthly-summary {
  margin-top: 20px;
}

.summary-legend {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.legend-item span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.income-dot {
  background: #059669;
}

.expense-dot {
  background: #dc2626;
}

.balance-dot {
  background: #4f46e5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.month-title {
  font-weight: 600;
  color: #1a1a1a;
}

.balance {
  font-weight: 700;
  font-size: 18px;
}

.balance.positive {
  color: #059669;
}

.balance.negative {
  color: #dc2626;
}

.card-body .row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.card-body .label {
  color: #6b7280;
  font-size: 14px;
}

.card-body .value {
  font-weight: 500;
  color: #1a1a1a;
}

.card-body .value.income {
  color: #059669;
}

.card-body .value.expense {
  color: #dc2626;
}

.print-only {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }

  .print-only {
    display: block;
  }

  .recurring-bill-manager {
    max-width: none;
    padding: 0;
  }

  .print-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .print-header h1 {
    margin: 0 0 8px;
    color: #1a1a1a;
  }

  .print-header p {
    margin: 0;
    color: #6b7280;
  }

  .print-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }

  .print-table th,
  .print-table td {
    border: 1px solid #e5e7eb;
    padding: 12px;
    text-align: left;
    font-size: 12px;
  }

  .print-table th {
    background: #f9fafb;
    font-weight: 600;
  }

  .print-table td.income {
    color: #059669;
  }

  .print-table td.expense {
    color: #dc2626;
  }

  .print-summary {
    display: flex;
    justify-content: flex-end;
    gap: 32px;
    padding-top: 16px;
    border-top: 2px solid #e5e7eb;
  }

  .print-summary p {
    margin: 0;
    font-weight: 500;
  }

  .print-summary .positive {
    color: #059669;
  }

  .print-summary .negative {
    color: #dc2626;
  }
}
</style>
