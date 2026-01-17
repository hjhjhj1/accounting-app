<template>
  <div class="recurring-bills-container">
    <div class="header">
      <h2>{{ $t('recurringBills.title') }}</h2>
      <div class="actions">
        <button @click="addBill" class="btn btn-primary">
          {{ $t('recurringBills.addBill') }}
        </button>
        <button @click="exportToPDF" class="btn btn-secondary">
          {{ $t('recurringBills.exportPDF') }}
        </button>
        <button @click="printBills" class="btn btn-secondary">
          {{ $t('recurringBills.print') }}
        </button>
      </div>
    </div>

    <div class="content">
      <div class="bill-form" v-if="showForm">
        <form @submit.prevent="saveBill">
          <div class="form-group">
            <label>{{ $t('recurringBills.name') }}</label>
            <input v-model="formData.name" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ $t('recurringBills.amount') }}</label>
            <input v-model.number="formData.amount" type="number" required step="0.01" />
          </div>
          <div class="form-group">
            <label>{{ $t('recurringBills.frequency') }}</label>
            <select v-model="formData.frequency">
              <option value="monthly">{{ $t('recurringBills.monthly') }}</option>
              <option value="quarterly">{{ $t('recurringBills.quarterly') }}</option>
              <option value="yearly">{{ $t('recurringBills.yearly') }}</option>
              <option value="irregular">{{ $t('recurringBills.irregular') }}</option>
            </select>
          </div>
          <div class="form-group" v-if="formData.frequency === 'irregular'">
            <label>{{ $t('recurringBills.irregularDates') }}</label>
            <input v-model="formData.irregularDates" type="text" placeholder="YYYY-MM-DD, YYYY-MM-DD" />
          </div>
          <div class="form-group">
            <label>{{ $t('recurringBills.startDate') }}</label>
            <input v-model="formData.startDate" type="date" required />
          </div>
          <div class="form-group">
            <label>{{ $t('recurringBills.periods') }}</label>
            <input v-model.number="formData.periods" type="number" min="1" max="36" value="12" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">{{ $t('recurringBills.save') }}</button>
            <button type="button" @click="showForm = false" class="btn btn-secondary">{{ $t('recurringBills.cancel') }}</button>
          </div>
        </form>
      </div>

      <div class="bills-list" v-else>
        <div class="bill-item" v-for="bill in state.bills" :key="bill.id">
          <div class="bill-info">
            <h3>{{ bill.name }}</h3>
            <p>{{ $t('recurringBills.amount') }}: {{ formatAmount(bill.amount) }}</p>
            <p>{{ $t('recurringBills.frequency') }}: {{ $t(`recurringBills.${bill.frequency}`) }}</p>
          </div>
          <div class="bill-actions">
            <button @click="previewBill(bill)" class="btn btn-sm btn-primary">{{ $t('recurringBills.preview') }}</button>
            <button @click="editBill(bill)" class="btn btn-sm btn-secondary">{{ $t('recurringBills.edit') }}</button>
            <button @click="deleteBill(bill.id)" class="btn btn-sm btn-danger">{{ $t('recurringBills.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="preview-modal" v-if="showPreview">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ $t('recurringBills.previewTitle', { name: currentBill?.name }) }}</h3>
          <button @click="showPreview = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <VirtualScrollList
            :items="generatedBills"
            :itemHeight="60"
            :containerHeight="400"
          >
            <template #default="{ item }">
              <div class="preview-item">
                <span class="period">{{ item.period }}</span>
                <span class="date">{{ item.date }}</span>
                <span class="amount">{{ formatAmount(item.amount) }}</span>
              </div>
            </template>
          </VirtualScrollList>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject } from 'vue'
import { jsPDF } from 'jspdf'
import VirtualScrollList from './VirtualScrollList.vue'

export default {
  name: 'RecurringBills',
  components: {
    VirtualScrollList
  },
  setup() {
    const { state, addBill: addBillStore, updateBill, deleteBill: deleteBillStore } = inject('recurringBillsStore')

    const showForm = ref(false)
    const showPreview = ref(false)
    const currentBill = ref(null)
    const generatedBills = ref([])
    const formData = ref({
      id: null,
      name: '',
      amount: 0,
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      periods: 12,
      irregularDates: ''
    })

    const addBill = () => {
      formData.value = {
        id: null,
        name: '',
        amount: 0,
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        periods: 12,
        irregularDates: ''
      }
      showForm.value = true
    }

    const editBill = (bill) => {
      formData.value = { ...bill }
      showForm.value = true
    }

    const saveBill = () => {
      if (formData.value.id) {
        updateBill(formData.value)
      } else {
        addBillStore(formData.value)
      }
      showForm.value = false
    }

    const deleteBill = (id) => {
      if (confirm('确定要删除这个周期账单吗？')) {
        deleteBillStore(id)
      }
    }

    const previewBill = (bill) => {
      currentBill.value = bill
      generatedBills.value = generateBills(bill)
      showPreview.value = true
    }

    const generateBills = (bill) => {
      const bills = []
      let currentDate = new Date(bill.startDate)

      if (bill.frequency === 'irregular') {
        const dates = bill.irregularDates.split(',').map(d => d.trim())
        dates.forEach((dateStr, index) => {
          bills.push({
            period: `第${index + 1}期`,
            date: dateStr,
            amount: bill.amount
          })
        })
      } else {
        for (let i = 0; i < bill.periods; i++) {
          bills.push({
            period: `第${i + 1}期`,
            date: currentDate.toISOString().split('T')[0],
            amount: bill.amount
          })

          switch (bill.frequency) {
            case 'monthly':
              currentDate.setMonth(currentDate.getMonth() + 1)
              break
            case 'quarterly':
              currentDate.setMonth(currentDate.getMonth() + 3)
              break
            case 'yearly':
              currentDate.setFullYear(currentDate.getFullYear() + 1)
              break
          }
        }
      }

      return bills
    }

    const formatAmount = (amount) => {
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount)
    }

    const exportToPDF = () => {
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text('周期账单计划', 14, 20)

      let yPosition = 30
      state.bills.forEach((bill, index) => {
        doc.setFontSize(14)
        doc.text(`${index + 1}. ${bill.name}`, 14, yPosition)
        doc.text(`金额: ${formatAmount(bill.amount)}`, 14, yPosition + 10)
        doc.text(`频率: ${bill.frequency}`, 14, yPosition + 20)
        yPosition += 30
      })

      doc.save('recurring-bills.pdf')
    }

    const printBills = () => {
      window.print()
    }

    return {
      state,
      showForm,
      showPreview,
      currentBill,
      generatedBills,
      formData,
      addBill,
      editBill,
      saveBill,
      deleteBill,
      previewBill,
      formatAmount,
      exportToPDF,
      printBills
    }
  }
}
</script>

<style scoped>
.recurring-bills-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #409eff;
  color: white;
}

.btn-primary:hover {
  background-color: #66b1ff;
}

.btn-secondary {
  background-color: #909399;
  color: white;
}

.btn-secondary:hover {
  background-color: #a6a9ad;
}

.btn-danger {
  background-color: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background-color: #f78989;
}

.btn-sm {
  padding: 5px 10px;
  font-size: 12px;
}

.content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.bill-form {
  max-width: 600px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: box-shadow 0.3s;
}

.bill-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.bill-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.bill-info p {
  margin: 5px 0;
  color: #606266;
  font-size: 14px;
}

.bill-actions {
  display: flex;
  gap: 10px;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.modal-body {
  padding: 20px;
  max-height: calc(80vh - 80px);
  overflow: hidden;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
}

.preview-item .period {
  font-weight: 500;
  color: #303133;
}

.preview-item .date {
  color: #606266;
}

.preview-item .amount {
  font-weight: 600;
  color: #409eff;
}

@media print {
  .recurring-bills-container {
    padding: 0;
  }

  .header {
    margin-bottom: 10px;
  }

  .actions {
    display: none;
  }

  .bill-actions {
    display: none;
  }
}
</style>