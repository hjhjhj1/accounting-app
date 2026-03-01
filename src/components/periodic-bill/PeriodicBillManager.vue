<template>
  <div class="periodic-bill-manager">
    <div class="manager-header">
      <h2>周期账单管理</h2>
      <div class="header-actions">
        <PdfExport />
        <button
          class="add-btn"
          @click="showForm = !showForm"
        >
          {{ showForm ? '取消' : '添加周期账单' }}
        </button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="statistics-overview">
      <div class="stat-card">
        <span class="stat-label">活跃账单</span>
        <span class="stat-value">{{ statistics.totalBills }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">月度净额</span>
        <span :class="['stat-value', statistics.monthlyTotal >= 0 ? 'positive' : 'negative']">
          {{ statistics.monthlyTotal >= 0 ? '+' : '' }}¥{{ formatNumber(statistics.monthlyTotal) }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">季度净额</span>
        <span :class="['stat-value', statistics.quarterlyTotal >= 0 ? 'positive' : 'negative']">
          {{ statistics.quarterlyTotal >= 0 ? '+' : '' }}¥{{ formatNumber(statistics.quarterlyTotal) }}
        </span>
      </div>
      <div class="stat-card">
        <span class="stat-label">年度预估</span>
        <span :class="['stat-value', statistics.annualEstimate >= 0 ? 'positive' : 'negative']">
          {{ statistics.annualEstimate >= 0 ? '+' : '' }}¥{{ formatNumber(statistics.annualEstimate) }}
        </span>
      </div>
    </div>

    <!-- 添加/编辑表单 -->
    <PeriodicBillForm
      v-if="showForm"
      :edit-data="editingBill"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />

    <div class="manager-content">
      <!-- 左侧：周期账单列表 -->
      <div class="content-left">
        <div class="section-tabs">
          <button
            :class="['tab-btn', { active: activeTab === 'list' }]"
            @click="activeTab = 'list'"
          >
            账单列表
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'preview' }]"
            @click="activeTab = 'preview'"
          >
            未来预览
          </button>
        </div>

        <div v-show="activeTab === 'list'" class="tab-content">
          <div class="filter-bar">
            <button
              :class="['filter-btn', { active: listFilter === 'all' }]"
              @click="listFilter = 'all'"
            >
              全部
            </button>
            <button
              :class="['filter-btn', { active: listFilter === 'active' }]"
              @click="listFilter = 'active'"
            >
              启用中
            </button>
            <button
              :class="['filter-btn', { active: listFilter === 'inactive' }]"
              @click="listFilter = 'inactive'"
            >
              已停用
            </button>
          </div>
          <PeriodicBillList
            :filter="listFilter"
            @edit="handleEdit"
          />
        </div>

        <div v-show="activeTab === 'preview'" class="tab-content">
          <VirtualBillList />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import PeriodicBillForm from './PeriodicBillForm.vue'
import PeriodicBillList from './PeriodicBillList.vue'
import VirtualBillList from './VirtualBillList.vue'
import PdfExport from './PdfExport.vue'

const { statistics } = inject('periodicBillState')
const { addPeriodicBill, updatePeriodicBill } = inject('periodicBillActions')

const showForm = ref(false)
const editingBill = ref(null)
const activeTab = ref('list')
const listFilter = ref('all')

const formatNumber = (num) => {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const handleSubmit = (data) => {
  if (editingBill.value) {
    updatePeriodicBill(editingBill.value.id, data)
    editingBill.value = null
  } else {
    addPeriodicBill(data)
  }
  showForm.value = false
}

const handleCancel = () => {
  showForm.value = false
  editingBill.value = null
}

const handleEdit = (bill) => {
  editingBill.value = bill
  showForm.value = true
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}
</script>

<style scoped>
.periodic-bill-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 15px;
}

.manager-header h2 {
  margin: 0;
  font-size: 24px;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.add-btn {
  padding: 10px 24px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.add-btn:hover {
  background: #229954;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.statistics-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-value.positive {
  color: #27ae60;
}

.stat-value.negative {
  color: #e74c3c;
}

.manager-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.content-left {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.section-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-btn.active {
  color: #3498db;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #3498db;
}

.tab-content {
  padding: 0;
}

.filter-bar {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.filter-btn {
  padding: 6px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.filter-btn.active {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

@media (max-width: 768px) {
  .periodic-bill-manager {
    padding: 15px;
  }

  .manager-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: space-between;
  }

  .statistics-overview {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 15px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>
