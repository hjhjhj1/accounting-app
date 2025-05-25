<template>
  <div class="record-form">
    <h2>添加记账记录</h2>
    <form @submit.prevent="submitRecord">
      <div class="form-group">
        <label>类型</label>
        <div class="radio-group">
          <label>
            <input type="radio" v-model="record.type" value="income">
            收入
          </label>
          <label>
            <input type="radio" v-model="record.type" value="expense">
            支出
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>分类</label>
        <select v-model="record.category">
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>金额</label>
        <input type="number" v-model.number="record.amount" placeholder="输入金额">
      </div>

      <div class="form-group">
        <label>日期</label>
        <input type="date" v-model="record.date">
      </div>

      <div class="form-group">
        <label>备注</label>
        <textarea v-model="record.note" placeholder="添加备注（可选）"></textarea>
      </div>

      <button type="submit">保存记录</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'RecordView',
  setup() {
    const store = useStore()
    
    const record = ref({
      type: 'expense',
      category: '餐饮',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: ''
    })

    const categories = ref([
      '餐饮', '购物', '交通', '住房', '娱乐', '医疗', '教育', '工资', '奖金', '投资收益'
    ])

    const submitRecord = () => {
      if (!record.value.amount || record.value.amount <= 0) {
        alert('请输入有效的金额')
        return
      }

      store.dispatch('addRecord', { ...record.value })
      alert('记录已保存！')
      
      // 重置表单
      record.value = {
        type: 'expense',
        category: '餐饮',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        note: ''
      }
    }

    return {
      record,
      categories,
      submitRecord
    }
  }
}
</script>

<style scoped>
.record-form {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
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
  margin-right: 5px;
  width: auto;
}

textarea {
  height: 100px;
  resize: vertical;
}

button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  width: 100%;
}

button:hover {
  background-color: #2980b9;
}
</style>
    