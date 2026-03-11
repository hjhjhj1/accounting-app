<template>
  <div class="recurring-billing-form">
    <h3 class="form-title">{{ currentBill ? '编辑周期账单' : '创建周期账单' }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label class="form-label">账单名称</label>
        <input
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="请输入账单名称"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label">金额</label>
        <input
          v-model="form.amount"
          type="number"
          class="form-input"
          placeholder="请输入金额"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div class="form-group">
        <label class="form-label">周期类型</label>
        <select v-model="form.cycleType" class="form-select" @change="onCycleTypeChange">
          <option v-for="(label, value) in cycleLabels" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">开始日期</label>
          <input
            v-model="form.startDate"
            type="date"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">结束日期 (可选)</label>
          <input
            v-model="form.endDate"
            type="date"
            class="form-input"
          />
        </div>
      </div>

      <div v-if="form.cycleType === 'irregular'" class="form-group">
        <label class="form-label">不规则周期日期</label>
        <div class="irregular-dates">
          <div v-for="(date, index) in form.cycleConfig.dates" :key="index" class="date-item">
            <input
              v-model="form.cycleConfig.dates[index]"
              type="date"
              class="form-input"
            />
            <button type="button" class="btn-remove" @click="removeIrregularDate(index)">
              ×
            </button>
          </div>
          <button type="button" class="btn-add-date" @click="addIrregularDate">
            + 添加日期
          </button>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">描述 (可选)</label>
        <textarea
          v-model="form.description"
          class="form-textarea"
          placeholder="请输入描述"
          rows="3"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="resetForm">
          重置
        </button>
        <button type="submit" class="btn btn-primary">
          {{ currentBill ? '更新' : '创建' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue'
import { useRecurringBilling } from '../composables/useRecurringBilling'

const { currentBill, cycleLabels, addBill, updateBill, setCurrentBill } = useRecurringBilling()

const form = reactive({
  name: '',
  amount: '',
  cycleType: 'monthly',
  startDate: '',
  endDate: '',
  description: '',
  cycleConfig: {
    dates: []
  }
})

const resetForm = () => {
  form.name = ''
  form.amount = ''
  form.cycleType = 'monthly'
  form.startDate = new Date().toISOString().split('T')[0]
  form.endDate = ''
  form.description = ''
  form.cycleConfig = { dates: [] }
  setCurrentBill(null)
}

const handleSubmit = () => {
  const billData = {
    name: form.name,
    amount: parseFloat(form.amount),
    cycleType: form.cycleType,
    startDate: form.startDate,
    endDate: form.endDate || null,
    description: form.description,
    cycleConfig: form.cycleType === 'irregular' ? form.cycleConfig : {}
  }

  if (currentBill.value) {
    updateBill(currentBill.value.id, billData)
  } else {
    addBill(billData)
  }
  resetForm()
}

const onCycleTypeChange = () => {
  if (form.cycleType === 'irregular' && form.cycleConfig.dates.length === 0) {
    form.cycleConfig.dates.push(new Date().toISOString().split('T')[0])
  }
}

const addIrregularDate = () => {
  form.cycleConfig.dates.push('')
}

const removeIrregularDate = (index) => {
  form.cycleConfig.dates.splice(index, 1)
}

watch(currentBill, (newVal) => {
  if (newVal) {
    form.name = newVal.name
    form.amount = newVal.amount.toString()
    form.cycleType = newVal.cycleType
    form.startDate = newVal.startDate
    form.endDate = newVal.endDate || ''
    form.description = newVal.description || ''
    form.cycleConfig = newVal.cycleConfig || { dates: [] }
  }
}, { immediate: true })

onMounted(() => {
  if (!form.startDate) {
    form.startDate = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.recurring-billing-form {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.form-textarea {
  resize: vertical;
}

.irregular-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.date-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-item .form-input {
  flex: 1;
}

.btn-remove {
  width: 32px;
  height: 32px;
  border: none;
  background: #ff4d4f;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-add-date {
  padding: 8px 16px;
  border: 1px dashed #d9d9d9;
  background: #fafafa;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-date:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 24px;
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
</style>
