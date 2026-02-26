<template>
  <div class="recurring-bill-form">
    <h3>{{ isEditing ? '编辑周期账单' : '新建周期账单' }}</h3>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>账单名称</label>
        <input 
          v-model="form.name" 
          type="text" 
          placeholder="例如：房租、水电费"
          required
        />
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
          <label>金额</label>
          <input 
            v-model="form.amount" 
            type="number" 
            step="0.01" 
            min="0"
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label>分类</label>
        <select v-model="form.category" required>
          <option value="">请选择分类</option>
          <optgroup v-if="form.type === 'expense'" label="支出分类">
            <option value="housing">住房</option>
            <option value="food">餐饮</option>
            <option value="transport">交通</option>
            <option value="utilities">水电煤</option>
            <option value="entertainment">娱乐</option>
            <option value="shopping">购物</option>
            <option value="medical">医疗</option>
            <option value="education">教育</option>
            <option value="other">其他</option>
          </optgroup>
          <optgroup v-else label="收入分类">
            <option value="salary">工资</option>
            <option value="bonus">奖金</option>
            <option value="investment">投资收益</option>
            <option value="parttime">兼职</option>
            <option value="other">其他</option>
          </optgroup>
        </select>
      </div>

      <div class="form-group">
        <label>周期类型</label>
        <div class="period-options">
          <label 
            v-for="option in periodOptions" 
            :key="option.value"
            class="period-option"
            :class="{ active: form.periodType === option.value }"
          >
            <input 
              type="radio" 
              :value="option.value" 
              v-model="form.periodType"
            />
            {{ option.label }}
          </label>
        </div>
      </div>

      <!-- 自定义周期设置 -->
      <div v-if="form.periodType === PeriodType.CUSTOM" class="custom-period">
        <label>选择月份（可多选）</label>
        <div class="month-selector">
          <label 
            v-for="month in 12" 
            :key="month"
            class="month-option"
            :class="{ active: form.customMonths.includes(month) }"
          >
            <input 
              type="checkbox" 
              :value="month" 
              v-model="form.customMonths"
            />
            {{ month }}月
          </label>
        </div>
        <p v-if="form.customMonths.length > 0" class="selected-months">
          已选择：{{ form.customMonths.sort((a, b) => a - b).join('月、') }}月
        </p>
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

      <div class="form-group">
        <label>备注</label>
        <textarea 
          v-model="form.description" 
          rows="2"
          placeholder="添加备注信息..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="$emit('cancel')">
          取消
        </button>
        <button type="submit" class="btn-primary">
          {{ isEditing ? '保存修改' : '创建账单' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { reactive, watch, computed } from 'vue'
import { PeriodType, periodOptions } from '@/composables/useRecurringBills'

export default {
  name: 'RecurringBillForm',
  props: {
    initialData: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const isEditing = computed(() => !!props.initialData)

    const defaultForm = {
      name: '',
      type: 'expense',
      amount: '',
      category: '',
      periodType: PeriodType.MONTHLY,
      customMonths: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: ''
    }

    const form = reactive({ ...defaultForm })

    watch(() => props.initialData, (newData) => {
      if (newData) {
        Object.assign(form, {
          ...defaultForm,
          ...newData,
          customMonths: newData.customMonths || []
        })
      } else {
        Object.assign(form, defaultForm)
      }
    }, { immediate: true })

    const handleSubmit = () => {
      if (form.periodType === PeriodType.CUSTOM && form.customMonths.length === 0) {
        alert('请至少选择一个月份')
        return
      }

      const submitData = {
        ...form,
        amount: parseFloat(form.amount)
      }

      if (form.periodType !== PeriodType.CUSTOM) {
        delete submitData.customMonths
      }

      emit('submit', submitData)
    }

    return {
      form,
      isEditing,
      PeriodType,
      periodOptions,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.recurring-bill-form {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recurring-bill-form h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 18px;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
}

.period-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.period-option {
  padding: 8px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  background: white;
}

.period-option input {
  display: none;
}

.period-option.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.custom-period {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.month-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.month-option {
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  background: white;
}

.month-option input {
  display: none;
}

.month-option.active {
  border-color: #3498db;
  background: #3498db;
  color: white;
}

.selected-months {
  margin-top: 12px;
  font-size: 13px;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #ecf0f1;
  color: #666;
}

.btn-secondary:hover {
  background: #bdc3c7;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .month-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
