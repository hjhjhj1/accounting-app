<template>
  <div class="period-settings">
    <div class="form-group">
      <label>周期类型</label>
      <select v-model="period.type" @change="onTypeChange">
        <option value="monthly">每月</option>
        <option value="quarterly">每季度</option>
        <option value="yearly">每年</option>
        <option value="irregular">自定义周期</option>
      </select>
    </div>

    <div v-if="period.type === 'monthly'" class="monthly-settings">
      <div class="form-group">
        <label>每月日期</label>
        <select v-model.number="period.day">
          <option v-for="day in 31" :key="day" :value="day">
            {{ day }}日
          </option>
        </select>
      </div>
    </div>

    <div v-if="period.type === 'quarterly'" class="quarterly-settings">
      <div class="form-group">
        <label>选择季度月份</label>
        <div class="checkbox-group">
          <label v-for="month in quarterMonths" :key="month.value" class="checkbox-label">
            <input
              type="checkbox"
              :value="month.value"
              v-model="period.quarters"
            />
            {{ month.label }}
          </label>
        </div>
      </div>
    </div>

    <div v-if="period.type === 'yearly'" class="yearly-settings">
      <div class="form-group">
        <label>选择月份</label>
        <div class="checkbox-group">
          <label v-for="month in 12" :key="month" class="checkbox-label">
            <input
              type="checkbox"
              :value="month"
              v-model="period.months"
            />
            {{ month }}月
          </label>
        </div>
      </div>
    </div>

    <div v-if="period.type === 'irregular'" class="irregular-settings">
      <div class="form-group">
        <label>自定义日期</label>
        <div class="custom-days">
          <div v-for="(day, index) in period.customDays" :key="index" class="custom-day-item">
            <input
              type="date"
              v-model="period.customDays[index]"
              class="date-input"
            />
            <button @click="removeCustomDay(index)" class="btn-remove">×</button>
          </div>
          <button @click="addCustomDay" class="btn-add">+ 添加日期</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const period = ref({ ...props.modelValue })

const quarterMonths = [
  { value: 1, label: '1月 (Q1)' },
  { value: 2, label: '2月 (Q1)' },
  { value: 3, label: '3月 (Q1)' },
  { value: 4, label: '4月 (Q2)' },
  { value: 5, label: '5月 (Q2)' },
  { value: 6, label: '6月 (Q2)' },
  { value: 7, label: '7月 (Q3)' },
  { value: 8, label: '8月 (Q3)' },
  { value: 9, label: '9月 (Q3)' },
  { value: 10, label: '10月 (Q4)' },
  { value: 11, label: '11月 (Q4)' },
  { value: 12, label: '12月 (Q4)' }
]

let isUpdating = false

watch(period, (newVal) => {
  if (!isUpdating) {
    isUpdating = true
    emit('update:modelValue', newVal)
    nextTick(() => {
      isUpdating = false
    })
  }
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  if (!isUpdating) {
    isUpdating = true
    period.value = { ...newVal }
    nextTick(() => {
      isUpdating = false
    })
  }
}, { deep: true })

function onTypeChange() {
  if (period.value.type === 'monthly') {
    period.value.day = 1
    period.value.quarters = []
    period.value.months = []
    period.value.customDays = []
  } else if (period.value.type === 'quarterly') {
    period.value.day = 1
    period.value.quarters = [1, 4, 7, 10]
    period.value.months = []
    period.value.customDays = []
  } else if (period.value.type === 'yearly') {
    period.value.day = 1
    period.value.quarters = []
    period.value.months = [1]
    period.value.customDays = []
  } else if (period.value.type === 'irregular') {
    period.value.day = 1
    period.value.quarters = []
    period.value.months = []
    if (period.value.customDays.length === 0) {
      period.value.customDays = [new Date().toISOString().split('T')[0]]
    }
  }
}

function addCustomDay() {
  const today = new Date()
  today.setDate(today.getDate() + 30)
  period.value.customDays.push(today.toISOString().split('T')[0])
}

function removeCustomDay(index) {
  period.value.customDays.splice(index, 1)
}
</script>

<style scoped>
.period-settings {
  background: white;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  transition: background 0.3s;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.custom-days {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.custom-day-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.btn-remove:hover {
  background: #c0392b;
}

.btn-add {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-add:hover {
  background: #2980b9;
}

@media print {
  .period-settings {
    border: none;
    padding: 0;
  }
}
</style>
