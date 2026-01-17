<template>
  <div class="periodic-billing-manager">
    <div class="periodic-billing-manager__header">
      <h1 class="periodic-billing-manager__title">周期账单管理</h1>
      <div class="periodic-billing-manager__actions">
        <button
          class="action-btn action-btn--primary"
          @click="handleExportPDF"
        >
          📄 导出PDF
        </button>
        <button
          class="action-btn action-btn--secondary"
          @click="handlePrint"
        >
          🖨️ 打印
        </button>
      </div>
    </div>

    <div class="periodic-billing-manager__content">
      <div class="periodic-billing-manager__sidebar">
        <PeriodSelector
          v-model="localSettings.periodType"
          @custom-schedule="handleCustomSchedule"
        />

        <PeriodicBillForm
          v-model="localSettings"
          @generate="handleGenerate"
        />

        <div class="summary-card">
          <h3 class="summary-card__title">概览</h3>
          <div class="summary-card__items">
            <div class="summary-item">
              <div class="summary-item__label">总金额</div>
              <div class="summary-item__value total-amount">¥{{ totalAmount.toFixed(2) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__label">已生成</div>
              <div class="summary-item__value">{{ bills.length }} 期</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__label">已支付</div>
              <div class="summary-item__value paid-count">{{ paidBills.length }} 期</div>
            </div>
            <div class="summary-item">
              <div class="summary-item__label">待支付</div>
              <div class="summary-item__value pending-count">{{ pendingBills.length }} 期</div>
            </div>
          </div>
        </div>
      </div>

      <div class="periodic-billing-manager__main">
        <div class="bills-list-container">
          <div class="bills-list-header">
            <h2 class="bills-list-title">账单计划预览</h2>
            <div class="bills-list-info">
              共 {{ bills.length }} 期账单
            </div>
          </div>

          <div v-if="bills.length === 0" class="empty-state">
            <div class="empty-state__icon">📅</div>
            <h3 class="empty-state__title">暂无账单</h3>
            <p class="empty-state__desc">请设置周期并点击"生成账单计划"按钮</p>
          </div>

          <div v-else ref="scrollContainerRef" class="virtual-scroll-wrapper">
            <VirtualScrollList
              :items="bills"
              :item-height="100"
              :overscan="5"
              :selected-bill="currentBill"
              @item-click="handleBillClick"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { usePeriodicBillingProvider } from '../../composables/usePeriodicBilling'
import { exportToPDF, generateBillPDFContent } from '../../utils/exportUtils'
import PeriodSelector from './PeriodSelector.vue'
import PeriodicBillForm from './PeriodicBillForm.vue'
import VirtualScrollList from './VirtualScrollList.vue'
import { PeriodType } from '../../utils/periodCalculator'

export default {
  name: 'PeriodicBillingManager',
  components: {
    PeriodSelector,
    PeriodicBillForm,
    VirtualScrollList
  },
  setup() {
    const {
      bills,
      currentBill,
      settings,
      generateSchedule,
      setPeriodType,
      setStartDate,
      setCustomSchedule,
      selectBill,
      updateBillAmount,
      totalAmount,
      pendingBills,
      paidBills
    } = usePeriodicBillingProvider()

    const scrollContainerRef = ref(null)
    const localSettings = reactive({
      periodType: PeriodType.MONTHLY,
      startDate: new Date(),
      totalPeriods: 36,
      customSchedule: null,
      amount: 0,
      description: ''
    })

    const handleGenerate = () => {
      settings.periodType = localSettings.periodType
      settings.startDate = localSettings.startDate
      settings.totalPeriods = localSettings.totalPeriods
      settings.amount = localSettings.amount
      settings.description = localSettings.description
      settings.customSchedule = localSettings.customSchedule

      generateSchedule()

      if (localSettings.amount > 0) {
        bills.value.forEach(bill => {
          updateBillAmount(bill.id, localSettings.amount)
        })
      }
    }

    const handleCustomSchedule = (intervals) => {
      localSettings.customSchedule = intervals
      setCustomSchedule(intervals)
    }

    const handlePeriodTypeChange = (type) => {
      localSettings.periodType = type
      setPeriodType(type)
    }

    const handleStartDateChange = (date) => {
      localSettings.startDate = date
      setStartDate(date)
    }

    const handleBillClick = (bill) => {
      selectBill(bill)
    }

    const handleExportPDF = () => {
      if (bills.value.length === 0) {
        alert('请先生成账单计划')
        return
      }

      const content = generateBillPDFContent(bills.value, settings, totalAmount.value)
      exportToPDF(content, 'periodic-bills.pdf')
    }

    const handlePrint = () => {
      if (bills.value.length === 0) {
        alert('请先生成账单计划')
        return
      }

      window.print()
    }

    onMounted(() => {
      const today = new Date()
      localSettings.startDate = today
      settings.startDate = today
    })

    return {
      bills,
      currentBill,
      settings,
      localSettings,
      totalAmount,
      pendingBills,
      paidBills,
      scrollContainerRef,
      handleGenerate,
      handleCustomSchedule,
      handlePeriodTypeChange,
      handleStartDateChange,
      handleBillClick,
      handleExportPDF,
      handlePrint
    }
  }
}
</script>

<style scoped>
.periodic-billing-manager {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 24px;
}

.periodic-billing-manager__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.periodic-billing-manager__title {
  margin: 0;
  font-size: 28px;
  color: #1f2937;
  font-weight: 700;
}

.periodic-billing-manager__actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn--primary {
  background: #3b82f6;
  color: white;
}

.action-btn--primary:hover {
  background: #2563eb;
}

.action-btn--secondary {
  background: #6b7280;
  color: white;
}

.action-btn--secondary:hover {
  background: #4b5563;
}

.periodic-billing-manager__content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 24px;
}

.periodic-billing-manager__sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.periodic-billing-manager__main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.summary-card {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.summary-card__title {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #1f2937;
  font-weight: 600;
}

.summary-card__items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.summary-item__label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.summary-item__value {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.summary-item__value.total-amount {
  color: #3b82f6;
}

.summary-item__value.paid-count {
  color: #065f46;
}

.summary-item__value.pending-count {
  color: #d97706;
}

.bills-list-container {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.bills-list-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.bills-list-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #1f2937;
  font-weight: 600;
}

.bills-list-info {
  font-size: 14px;
  color: #6b7280;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-state__icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state__title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #374151;
  font-weight: 600;
}

.empty-state__desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.virtual-scroll-wrapper {
  flex: 1;
  overflow: hidden;
}

@media print {
  .periodic-billing-manager {
    background: white;
    padding: 0;
  }

  .periodic-billing-manager__header {
    box-shadow: none;
    border-bottom: 2px solid #3b82f6;
  }

  .periodic-billing-manager__actions {
    display: none;
  }

  .periodic-billing-manager__content {
    grid-template-columns: 1fr;
  }

  .periodic-billing-manager__sidebar {
    display: none;
  }

  .bills-list-container {
    height: auto;
  }

  .virtual-scroll-wrapper {
    overflow: visible;
  }
}
</style>
