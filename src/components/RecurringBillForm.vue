<template>
  <div class="recurring-bill-form">
    <h3>{{ editMode ? '编辑周期账单' : '添加周期账单' }}</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>账单名称</label>
        <input type="text" v-model="form.name" placeholder="如：房租、订阅服务" required>
      </div>

      <div class="form-group">
        <label>类型</label>
        <div class="radio-group">
          <label><input type="radio" v-model="form.type" value="expense"> 支出</label>
          <label><input type="radio" v-model="form.type" value="income"> 收入</label>
        </div>
      </div>

      <div class="form-group">
        <label>金额</label>
        <input type="number" v-model.number="form.amount" placeholder="输入金额" min="0" step="0.01" required>
      </div>

      <div class="form-group">
        <label>开始日期</label>
        <input type="date" v-model="form.startDate" required>
      </div>

      <div class="form-group">
        <label>周期类型</label>
        <select v-model="form.cycleType">
          <option value="monthly">月度</option>
          <option value="quarterly">季度</option>
          <option value="yearly">年度</option>
          <option value="custom">自定义天数</option>
          <option value="irregular">不规则周期</option>
        </select>
      </div>

      <div class="form-group" v-if="form.cycleType !== 'irregular'">
        <label>{{ cycleLabel }}</label>
        <input type="number" v-model.number="form.cycleValue" min="1" :max="cycleMax">
      </div>

      <div class="irregular-pattern" v-if="form.cycleType === 'irregular'">
        <label>不规则周期设置</label>
        <div class="pattern-list">
          <div v-for="(pattern, index) in form.irregularPattern" :key="index" class="pattern-item">
            <span>第{{ index + 1 }}期间隔：</span>
            <select v-model="pattern.type">
              <option value="days">天</option>
              <option value="months">月</option>
            </select>
            <input type="number" v-model.number="pattern.value" min="1" max="365">
            <button type="button" class="btn-remove" @click="removePattern(index)">×</button>
          </div>
          <button type="button" class="btn-add-pattern" @click="addPattern">+ 添加周期</button>
        </div>
      </div>

      <div class="form-group">
        <label>分类</label>
        <select v-model="form.category">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>备注</label>
        <textarea v-model="form.note" placeholder="可选备注"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-primary">{{ editMode ? '更新' : '添加' }}</button>
        <button type="button" class="btn-secondary" @click="$emit('cancel')">取消</button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, watch, inject } from 'vue'
import { recurringBillKey } from '../composables/useRecurringBill'

export default {
  name: 'RecurringBillForm',
  props: {
    bill: {
      type: Object,
      default: null
    }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const { addBill, updateBill } = inject(recurringBillKey)
    
    const editMode = computed(() => !!props.bill)
    
    const defaultForm = () => ({
      name: '',
      type: 'expense',
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      cycleType: 'monthly',
      cycleValue: 1,
      irregularPattern: [],
      category: '住房',
      note: ''
    })
    
    const form = ref(defaultForm())
    
    const categories = ref([
      '餐饮', '购物', '交通', '住房', '娱乐', '医疗', '教育', '工资', '奖金', '投资收益', '订阅服务', '其他'
    ])
    
    const cycleLabel = computed(() => {
      const labels = {
        monthly: '间隔月数',
        quarterly: '间隔季度数',
        yearly: '间隔年数',
        custom: '间隔天数'
      }
      return labels[form.value.cycleType] || '间隔'
    })
    
    const cycleMax = computed(() => {
      const maxs = {
        monthly: 12,
        quarterly: 4,
        yearly: 10,
        custom: 365
      }
      return maxs[form.value.cycleType] || 12
    })
    
    const addPattern = () => {
      form.value.irregularPattern.push({ type: 'days', value: 30 })
    }
    
    const removePattern = (index) => {
      form.value.irregularPattern.splice(index, 1)
    }
    
    watch(() => props.bill, (newBill) => {
      if (newBill) {
        form.value = { ...defaultForm(), ...newBill }
      } else {
        form.value = defaultForm()
      }
    }, { immediate: true })
    
    const handleSubmit = () => {
      const billData = { ...form.value }
      
      if (!billData.name || billData.amount <= 0) {
        alert('请填写完整信息')
        return
      }
      
      if (editMode.value) {
        updateBill(props.bill.id, billData)
      } else {
        addBill(billData)
      }
      
      emit('submit', billData)
      form.value = defaultForm()
    }
    
    return {
      form,
      editMode,
      categories,
      cycleLabel,
      cycleMax,
      addPattern,
      removePattern,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.recurring-bill-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-group input {
  width: auto;
  margin-right: 5px;
}

.irregular-pattern {
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.pattern-list {
  margin-top: 10px;
}

.pattern-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.pattern-item select {
  width: 80px;
}

.pattern-item input {
  width: 80px;
}

.btn-remove {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.btn-add-pattern {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
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
</style>
