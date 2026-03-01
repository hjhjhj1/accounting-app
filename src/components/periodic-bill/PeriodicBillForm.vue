<template>
  <div class="periodic-bill-form">
    <h3>{{ isEditing ? '编辑周期账单' : '添加周期账单' }}</h3>

    <form @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="form-group">
          <label>账单名称</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="例如：房租、工资"
            required
          />
        </div>

        <div class="form-group">
          <label>金额</label>
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>类型</label>
          <select v-model="form.type" required>
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
        </div>

        <div class="form-group">
          <label>分类</label>
          <input
            v-model="form.category"
            type="text"
            placeholder="例如：住房、工资"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>周期类型</label>
          <select v-model="form.periodType" required>
            <option v-for="(label, type) in PeriodTypeLabels" :key="type" :value="type">
              {{ label }}
            </option>
          </select>
        </div>

        <div v-if="form.periodType === PeriodType.CUSTOM" class="form-group">
          <label>自定义周期（月）</label>
          <input
            v-model.number="form.customMonths"
            type="number"
            min="1"
            max="60"
            required
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>开始日期</label>
          <input
            v-model="form.startDate"
            type="date"
            required
          />
        </div>

        <div class="form-group">
          <label>结束日期（可选）</label>
          <input
            v-model="form.endDate"
            type="date"
          />
        </div>
      </div>

      <div class="form-group full-width">
        <label>备注</label>
        <textarea
          v-model="form.description"
          rows="2"
          placeholder="添加备注信息..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="handleCancel">
          取消
        </button>
        <button type="submit" class="btn-primary">
          {{ isEditing ? '保存修改' : '添加账单' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, inject } from 'vue'

const props = defineProps({
  editData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['submit', 'cancel'])

const { PeriodType, PeriodTypeLabels } = inject('periodicBillState')

const isEditing = computed(() => !!props.editData)

const defaultForm = {
  name: '',
  amount: '',
  type: 'expense',
  periodType: 'monthly',
  customMonths: 1,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  category: '',
  description: ''
}

const form = ref({ ...defaultForm })

watch(() => props.editData, (newVal) => {
  if (newVal) {
    form.value = {
      ...defaultForm,
      ...newVal,
      endDate: newVal.endDate || ''
    }
  } else {
    form.value = { ...defaultForm }
  }
}, { immediate: true })

const handleSubmit = () => {
  const data = {
    ...form.value,
    amount: parseFloat(form.value.amount) || 0,
    endDate: form.value.endDate || null
  }
  emit('submit', data)
  if (!isEditing.value) {
    form.value = { ...defaultForm }
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.periodic-bill-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.periodic-bill-form h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  width: 100%;
}

.form-group label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
