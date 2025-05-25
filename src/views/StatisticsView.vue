<template>
  <div class="statistics">
    <h2>收支统计</h2>
    
    <div class="stats-cards">
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

    <div class="charts">
      <div class="chart">
        <h3>支出分类统计</h3>
        <div class="pie-chart">
          <svg :width="chartSize" :height="chartSize" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#f0f0f0" />
            <path 
              v-for="(item, index) in expenseCategories" 
              :key="index"
              :d="item.path" 
              :fill="item.color" 
              :stroke="item.color" 
              stroke-width="2"
            />
          </svg>
          <div class="legend">
            <div v-for="(item, index) in expenseCategories" :key="index" class="legend-item">
              <span :style="{ backgroundColor: item.color }"></span>
              <span>{{ item.category }}: {{ item.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'StatisticsView',
  setup() {
    const store = useStore()
    const chartSize = ref(300)
    const expenseCategories = ref([])
    
    const records = computed(() => store.getters.getRecords)
    const totalIncome = computed(() => store.getters.getTotalIncome)
    const totalExpense = computed(() => store.getters.getTotalExpense)
    const balance = computed(() => store.getters.getBalance)
    
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12',
      '#1abc9c', '#d35400', '#27ae60', '#8e44ad', '#2980b9'
    ]
    
    onMounted(() => {
      updateExpenseChart()
    })
    
    const updateExpenseChart = () => {
      const expenseRecords = records.value.filter(record => record.type === 'expense')
      if (expenseRecords.length === 0) return
      
      // 按分类汇总金额
      const categoryMap = {}
      expenseRecords.forEach(record => {
        if (!categoryMap[record.category]) {
          categoryMap[record.category] = 0
        }
        categoryMap[record.category] += record.amount
      })
      
      // 转换为数组并排序
      const categoryList = Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExpense.value) * 100)
      })).sort((a, b) => b.amount - a.amount)
      
      // 生成饼图路径
      let startAngle = 0
      const pieData = categoryList.map((item, index) => {
        const sliceAngle = (item.percentage / 100) * 360
        const endAngle = startAngle + sliceAngle
        
        const startRadian = (startAngle - 90) * (Math.PI / 180)
        const endRadian = (endAngle - 90) * (Math.PI / 180)
        
        const startX = 50 + 45 * Math.cos(startRadian)
        const startY = 50 + 45 * Math.sin(startRadian)
        const endX = 50 + 45 * Math.cos(endRadian)
        const endY = 50 + 45 * Math.sin(endRadian)
        
        const largeArcFlag = sliceAngle > 180 ? 1 : 0
        
        const path = `M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
        
        startAngle = endAngle
        
        return {
          ...item,
          path,
          color: colors[index % colors.length]
        }
      })
      
      expenseCategories.value = pieData
    }
    
    return {
      chartSize,
      expenseCategories,
      records,
      totalIncome,
      totalExpense,
      balance
    }
  }
}
</script>

<style scoped>
.statistics {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats-cards {
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

.charts {
  margin-top: 30px;
}

.chart {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.legend {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-item span:first-child {
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-right: 8px;
  border-radius: 3px;
}
</style>
    