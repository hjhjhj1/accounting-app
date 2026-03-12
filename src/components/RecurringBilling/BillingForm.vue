<template>
  <div class="billing-form">
    <h3>{{ editingBill ? '编辑周期账单' : '创建周期账单' }}</h3>
    
    <div class="form-group">
      <label>账单名称</label>
      <input v-model="form.name" type="text" placeholder="输入账单名称" />
    </div>

    <div class="form-group">
      <label>账单类型</label>
      <select v-model="form.type">
        <option :value="BILLING_TYPES.EXPENSE">支出</option>
        <option :value="BILLING_TYPES.INCOME">收入</option>
      </select>
    </div>

    <div class="form-group">
      <label>金额</label>
      <input v-model.number="form.amount" type="number" step="0.01" min="0" placeholder="输入金额" />
    </div>

    <div class="form-group">
      <label>周期类型</label>
      <select v-model="form.cycle">
        <option value="monthly">月度</option>
        <option value="quarterly">季度</option>
        <option value="yearly">年度</option>
        <option value="irregular">不规则周期</option>
      </select>
    </div>

    <div class="form-group">
      <label>开始日期</label>
      <input v-model="form.startDate" type="date" />
    </div>

    <div v-if="form.cycle === 'irregular'" class="irregular-options">
      <div class="form-group">
        <label>自定义间隔天数</label>
        <input v-model.number="form.irregularInterval" type="number" min="1" placeholder="输入间隔天数" />
      </div>
      
      <div class="form-group">
        <label>自定义日期（可选）</label>
        <div class="custom-dates">
          <input 
            v-for="(date, index) in form.customDates" 
            :key="index"
            v-model="form.customDates[index]" 
            type="date" 
          />
          <button type="button" @click="addCustomDate" class="btn-add">+ 添加日期</button>
          <button 
            v-if="form.customDates.length > 0" 
            type="button" 
            @click="removeCustomDate" 
            class="btn-remove"
          >
            - 移除
          </button>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>描述（可选）</label>
      <textarea v-model="form.description" placeholder="输入账单描述"></textarea>
    </div>

    <div class="form-actions">
      <button @click="handlePreview" class="btn-preview">预览</button>
      <button @click="handleSubmit" class="btn-submit">
        {{ editingBill ? '更新账单' : '保存账单' }}
      </button>
      <button v-if="editingBill" @click="handleCancel" class="btn-cancel">取消</button>
      <button @click="handleReset" class="btn-reset">重置</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRecurringBilling } from '@/composables/useRecurringBilling'
import { BILLING_TYPES } from '@/composables/useRecurringBilling'

const props = defineProps({
  editingBill: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['cancel-edit'])

const { currentBill, regeneratePreview, addBill, updateBill } = useRecurringBilling()

const form = ref({
  name: '',
  amount: 0,
  type: BILLING_TYPES.EXPENSE,
  cycle: 'monthly',
  startDate: new Date().toISOString().split('T')[0],
  irregularInterval: 30,
  customDates: [],
  description: ''
})

const addCustomDate = () => {
  form.value.customDates.push(new Date().toISOString().split('T')[0])
}

const removeCustomDate = () => {
  form.value.customDates.pop()
}

const handlePreview = () => {
  Object.assign(currentBill.value, form.value)
  regeneratePreview()
}

const handleSubmit = () => {
  if (!form.value.name || form.value.amount <= 0) {
    alert('请填写账单名称和金额')
    return
  }
  if (props.editingBill) {
    updateBill(props.editingBill.id, { ...form.value })
    emit('cancel-edit')
  } else {
    addBill({ ...form.value })
  }
  handleReset()
}

const handleCancel = () => {
  emit('cancel-edit')
  handleReset()
}

const handleReset = () => {
  form.value = {
    name: '',
    amount: 0,
    type: BILLING_TYPES.EXPENSE,
    cycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    irregularInterval: 30,
    customDates: [],
    description: ''
  }
}

watch(() => props.editingBill, (newVal) => {
  if (newVal) {
    form.value = { ...newVal }
  } else {
    handleReset()
  }
}, { immediate: true })

watch(() => form.value, () => {
  Object.assign(currentBill.value, form.value)
}, { deep: true })
</script>

<style scoped>
.billing-form {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.billing-form h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.irregular-options {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-top: 8px;
}

.custom-dates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-dates input {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  flex-wrap: wrap;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-preview {
  background: #3498db;
  color: white;
}

.btn-preview:hover {
  background: #2980b9;
}

.btn-submit {
  background: #2ecc71;
  color: white;
}

.btn-submit:hover {
  background: #27ae60;
}

.btn-reset {
  background: #95a5a6;
  color: white;
}

.btn-reset:hover {
  background: #7f8c8d;
}

.btn-cancel {
  background: #e74c3c;
  color: white;
}

.btn-cancel:hover {
  background: #c0392b;
}

.btn-add {
  background: #3498db;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  padding: 6px 12px;
  font-size: 12px;
}
</style>
