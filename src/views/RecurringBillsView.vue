<template>
  <div class="recurring-bills-view">
    <h1>周期账单管理</h1>
    
    <div class="view-layout">
      <!-- 左侧：账单列表和表单 -->
      <div class="left-panel">
        <div class="panel-header">
          <h2>我的周期账单</h2>
          <button class="btn-add" @click="showForm = true" v-if="!showForm">
            <span class="icon">+</span> 新建账单
          </button>
        </div>

        <!-- 账单列表 -->
        <div v-if="!showForm" class="bills-list">
          <div v-if="recurringBills.length === 0" class="empty-state">
            <div class="empty-icon">📋</div>
            <p>暂无周期账单</p>
            <button class="btn-add-empty" @click="showForm = true">
              创建第一个周期账单
            </button>
          </div>
          
          <div 
            v-for="bill in recurringBills" 
            :key="bill.id"
            class="bill-card"
            :class="{ active: selectedBill?.id === bill.id }"
            @click="selectBill(bill)"
          >
            <div class="bill-header">
              <h4>{{ bill.name }}</h4>
              <span class="bill-type" :class="bill.type">
                {{ bill.type === 'income' ? '收入' : '支出' }}
              </span>
            </div>
            <div class="bill-info">
              <span class="bill-amount" :class="bill.type">
                {{ bill.type === 'income' ? '+' : '-' }}¥{{ formatNumber(bill.amount) }}
              </span>
              <span class="bill-period">
                {{ getPeriodLabel(bill.periodType) }}
                <template v-if="bill.periodType === PeriodType.CUSTOM && bill.customMonths">
                  ({{ bill.customMonths.sort((a, b) => a - b).join('、') }}月)
                </template>
              </span>
            </div>
            <div class="bill-meta">
              <span>开始：{{ bill.startDate }}</span>
              <span v-if="bill.endDate">结束：{{ bill.endDate }}</span>
            </div>
            <div class="bill-actions">
              <button class="btn-edit" @click.stop="editBill(bill)">编辑</button>
              <button class="btn-delete" @click.stop="confirmDelete(bill)">删除</button>
            </div>
          </div>
        </div>

        <!-- 表单 -->
        <RecurringBillForm 
          v-else
          :initial-data="editingBill"
          @submit="handleSubmit"
          @cancel="cancelForm"
        />
      </div>

      <!-- 右侧：预览 -->
      <div class="right-panel">
        <div v-if="selectedBill" class="preview-section">
          <div class="preview-bill-info">
            <h3>{{ selectedBill.name }}</h3>
            <p class="bill-description" v-if="selectedBill.description">
              {{ selectedBill.description }}
            </p>
          </div>
          <RecurringBillPreview 
            :bills="previewBills"
            :preview-count="36"
            :bill-name="selectedBill.name"
          />
        </div>
        <div v-else class="preview-placeholder">
          <div class="placeholder-icon">📊</div>
          <p>选择或创建一个周期账单以查看预览</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import RecurringBillForm from '@/components/RecurringBillForm.vue'
import RecurringBillPreview from '@/components/RecurringBillPreview.vue'
import { 
  useRecurringBillsDirect,
  PeriodType 
} from '@/composables/useRecurringBills'

export default {
  name: 'RecurringBillsView',
  components: {
    RecurringBillForm,
    RecurringBillPreview
  },
  setup() {
    // 直接使用状态管理，不依赖 provide/inject
    const state = useRecurringBillsDirect()
    
    const {
      recurringBills,
      previewBills,
      generatePreviewBills,
      addRecurringBill,
      updateRecurringBill,
      deleteRecurringBill,
      getPeriodLabel
    } = state

    const showForm = ref(false)
    const selectedBill = ref(null)
    const editingBill = ref(null)

    const selectBill = (bill) => {
      selectedBill.value = bill
      generatePreviewBills(bill, 36)
    }

    const editBill = (bill) => {
      editingBill.value = { ...bill }
      showForm.value = true
    }

    const cancelForm = () => {
      showForm.value = false
      editingBill.value = null
    }

    const handleSubmit = (formData) => {
      if (editingBill.value) {
        updateRecurringBill(editingBill.value.id, formData)
        if (selectedBill.value?.id === editingBill.value.id) {
          selectedBill.value = { ...selectedBill.value, ...formData }
          generatePreviewBills(selectedBill.value, 36)
        }
      } else {
        const newBill = addRecurringBill(formData)
        selectBill(newBill)
      }
      showForm.value = false
      editingBill.value = null
    }

    const confirmDelete = (bill) => {
      if (confirm(`确定要删除"${bill.name}"吗？此操作不可恢复。`)) {
        deleteRecurringBill(bill.id)
        if (selectedBill.value?.id === bill.id) {
          selectedBill.value = null
          state.previewBills.value = []
        }
      }
    }

    const formatNumber = (num) => {
      return parseFloat(num).toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    }

    // 如果有账单，默认选中第一个
    watch(recurringBills, (newBills) => {
      if (newBills.length > 0 && !selectedBill.value) {
        selectBill(newBills[0])
      }
    }, { immediate: true })

    return {
      recurringBills,
      previewBills,
      showForm,
      selectedBill,
      editingBill,
      PeriodType,
      selectBill,
      editBill,
      cancelForm,
      handleSubmit,
      confirmDelete,
      getPeriodLabel,
      formatNumber
    }
  }
}
</script>

<style scoped>
.recurring-bills-view {
  max-width: 1400px;
  margin: 0 auto;
}

.recurring-bills-view h1 {
  margin: 0 0 24px 0;
  color: #2c3e50;
  font-size: 24px;
}

.view-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
  align-items: start;
}

.left-panel,
.right-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.panel-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  color: #2c3e50;
}

.btn-add {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #2980b9;
}

.icon {
  font-size: 16px;
  font-weight: bold;
}

.bills-list {
  max-height: 600px;
  overflow-y: auto;
}

.empty-state {
  padding: 60px 24px;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 20px 0;
  font-size: 14px;
}

.btn-add-empty {
  padding: 10px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.btn-add-empty:hover {
  background: #2980b9;
}

.bill-card {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.bill-card:hover {
  background: #f8f9fa;
}

.bill-card.active {
  background: #e3f2fd;
  border-left: 4px solid #3498db;
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bill-header h4 {
  margin: 0;
  font-size: 15px;
  color: #2c3e50;
}

.bill-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.bill-type.income {
  background: #d4edda;
  color: #155724;
}

.bill-type.expense {
  background: #f8d7da;
  color: #721c24;
}

.bill-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bill-amount {
  font-size: 18px;
  font-weight: 600;
}

.bill-amount.income {
  color: #27ae60;
}

.bill-amount.expense {
  color: #e74c3c;
}

.bill-period {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.bill-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.bill-actions {
  display: flex;
  gap: 8px;
}

.bill-actions button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-delete:hover {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.right-panel {
  min-height: 600px;
}

.preview-section {
  height: 100%;
}

.preview-bill-info {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.preview-bill-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.bill-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.preview-placeholder {
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px;
}

.placeholder-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.preview-placeholder p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 900px) {
  .view-layout {
    grid-template-columns: 1fr;
  }
  
  .right-panel {
    min-height: auto;
  }
}

@media (max-width: 600px) {
  .panel-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .btn-add {
    justify-content: center;
  }
  
  .bill-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
