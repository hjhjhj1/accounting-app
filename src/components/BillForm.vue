<template>
  <div class="bill-form-overlay" v-if="visible" @click.self="close">
    <div class="bill-form">
      <div class="form-header">
        <h3>{{ isEdit ? '编辑账单' : '添加周期账单' }}</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <form @submit.prevent="submitForm">
        <div class="form-row">
          <div class="form-group">
            <label>账单名称 *</label>
            <input v-model="formData.name" type="text" placeholder="例如：房租" required />
          </div>
          <div class="form-group">
            <label>金额 (元) *</label>
            <input v-model.number="formData.amount" type="number" min="0" step="0.01" placeholder="0.00" required />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>周期类型 *</label>
            <select v-model="formData.periodType" required>
              <option v-for="(label, key) in PERIOD_LABELS" :key="key" :value="key">
                {{ label }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="formData.periodType !== PERIOD_TYPES.IRREGULAR">
            <label>间隔周期</label>
            <select v-model.number="formData.interval">
              <option v-for="n in 12" :key="n" :value="n">每{{ getIntervalLabel(n) }}</option>
            </select>
          </div>
        </div>
        
        <div class="form-row" v-if="formData.periodType !== PERIOD_TYPES.IRREGULAR">
          <div class="form-group">
            <label>开始日期 *</label>
            <input v-model="formData.startDate" type="date" required />
          </div>
          <div class="form-group">
            <label>账单日</label>
            <select v-model.number="formData.dayOfMonth">
              <option v-for="n in 28" :key="n" :value="n">{{ n }}日</option>
              <option value="29">29日 (月底)</option>
              <option value="30">30日 (月底)</option>
              <option value="31">31日 (月底)</option>
            </select>
          </div>
        </div>
        
        <div class="form-group" v-if="formData.periodType === PERIOD_TYPES.IRREGULAR">
          <label>不规则日期 (每行一个日期)</label>
          <textarea
            v-model="irregularDatesText"
            placeholder="格式：YYYY-MM-DD，每行一个日期&#10;例如：&#10;2026-03-15&#10;2026-06-20&#10;2026-09-10"
            rows="5"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>分类</label>
            <select v-model="formData.category">
              <option value="住房">住房</option>
              <option value="餐饮">餐饮</option>
              <option value="交通">交通</option>
              <option value="通信">通信</option>
              <option value="娱乐">娱乐</option>
              <option value="运动">运动</option>
              <option value="教育">教育</option>
              <option value="医疗">医疗</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>备注</label>
            <input v-model="formData.description" type="text" placeholder="可选备注" />
          </div>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="close">取消</button>
          <button type="submit" class="btn btn-primary">{{ isEdit ? '保存修改' : '添加账单' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { PERIOD_TYPES, PERIOD_LABELS } from '../composables/useRecurringBills'

const props = defineProps({
  visible: Boolean,
  bill: Object
})

const emit = defineEmits(['close', 'submit'])

const defaultForm = {
  name: '',
  amount: null,
  periodType: PERIOD_TYPES.MONTHLY,
  startDate: new Date().toISOString().split('T')[0],
  dayOfMonth: 1,
  category: '其他',
  description: '',
  interval: 1,
  irregularDates: []
}

const formData = ref({ ...defaultForm })
const irregularDatesText = ref('')

const isEdit = computed(() => !!props.bill)

watch(() => props.visible, (val) => {
  if (val) {
    if (props.bill) {
      formData.value = { ...props.bill }
      if (props.bill.irregularDates?.length) {
        irregularDatesText.value = props.bill.irregularDates.join('\n')
      }
    } else {
      formData.value = { ...defaultForm }
      irregularDatesText.value = ''
    }
  }
})

function getIntervalLabel(n) {
  const type = formData.value.periodType
  if (type === PERIOD_TYPES.MONTHLY) {
    return n === 1 ? '月' : `${n}个月`
  } else if (type === PERIOD_TYPES.QUARTERLY) {
    return n === 1 ? '季度' : `${n}个季度`
  } else {
    return n === 1 ? '年' : `${n}年`
  }
}

function close() {
  emit('close')
}

function submitForm() {
  const data = { ...formData.value }
  
  if (data.periodType === PERIOD_TYPES.IRREGULAR) {
    data.irregularDates = irregularDatesText.value
      .split('\n')
      .map(d => d.trim())
      .filter(d => /^\d{4}-\d{1,2}-\d{1,2}$/.test(d))
  }
  
  emit('submit', data)
  close()
}
</script>

<style scoped>
.bill-form-overlay {
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

.bill-form {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

form {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
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
  font-family: monospace;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

@media print {
  .bill-form-overlay {
    display: none;
  }
}
</style>
