<template>
  <div class="home">
    <div class="summary">
      <div class="card income">
        <p>总收入</p>
        <p class="amount">¥{{ totalIncome }}</p>
      </div>
      <div class="card expense">
        <p>总支出</p>
        <p class="amount">¥{{ totalExpense }}</p>
      </div>
      <div class="card balance">
        <p>余额</p>
        <p class="amount" :class="{ 'negative': balance < 0 }">¥{{ balance }}</p>
      </div>
    </div>

    <div class="records">
      <h2>最近记录</h2>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>类型</th>
            <th>分类</th>
            <th>金额</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.date }}</td>
            <td><span :class="record.type">{{ record.type === 'income' ? '收入' : '支出' }}</span></td>
            <td>{{ record.category }}</td>
            <td :class="record.type === 'income' ? 'income-amount' : 'expense-amount'">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount }}
            </td>
            <td>{{ record.note }}</td>
            <td>
              <button @click="deleteRecord(record.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'HomeView',
  setup() {
    const store = useStore()
    const records = computed(() => store.getters.getRecords)
    const totalIncome = computed(() => store.getters.getTotalIncome)
    const totalExpense = computed(() => store.getters.getTotalExpense)
    const balance = computed(() => store.getters.getBalance)

    const deleteRecord = (id) => {
      if (confirm('确定要删除这条记录吗？')) {
        store.dispatch('deleteRecord', id)
      }
    }

    return {
      records,
      totalIncome,
      totalExpense,
      balance,
      deleteRecord
    }
  }
}
</script>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.income {
  border-left: 4px solid #2ecc71;
}

.expense {
  border-left: 4px solid #e74c3c;
}

.balance {
  border-left: 4px solid #3498db;
}

.amount {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 10px;
}

.negative {
  color: #e74c3c;
}

.records {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f2f2f2;
}

.income-amount {
  color: #2ecc71;
}

.expense-amount {
  color: #e74c3c;
}

button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #c0392b;
}

.income, .expense {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
}

.income {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.expense {
  background-color: #ffebee;
  color: #c62828;
}
</style>
    