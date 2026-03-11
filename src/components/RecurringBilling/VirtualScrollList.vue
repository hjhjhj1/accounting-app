<template>
  <div class="virtual-scroll-container" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-scroll-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-scroll-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div 
        v-for="bill in visibleBills" 
        :key="bill.id" 
        class="bill-item"
        :class="[{ 'bill-item-odd': bill.period % 2 === 1 }, getTypeClass(bill.type)]"
      >
        <div class="bill-period">第{{ bill.period }}期</div>
        <div class="bill-type-tag" :class="getTypeClass(bill.type)">
          {{ bill.type === 'expense' ? '支' : '收' }}
        </div>
        <div class="bill-info">
          <div class="bill-name">{{ bill.name }}</div>
          <div class="bill-date">{{ bill.dueDate }}</div>
        </div>
        <div class="bill-amount" :class="getTypeClass(bill.type)">¥{{ bill.amount.toFixed(2) }}</div>
        <div class="bill-cycle">{{ getCycleLabel(bill.cycle) }}</div>
      </div>
    </div>
    
    <div v-if="visibleBills.length === 0" class="empty-state">
      <p>暂无账单预览</p>
      <p class="empty-hint">请填写账单信息并点击预览按钮</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BILLING_TYPES } from '@/composables/useRecurringBilling'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  itemHeight: {
    type: Number,
    default: 70
  },
  containerHeight: {
    type: Number,
    default: 500
  }
})

const getTypeClass = (type) => {
  return type === BILLING_TYPES.EXPENSE ? 'type-expense' : 'type-income'
}

const containerRef = ref(null)
const scrollTop = ref(0)

const totalHeight = computed(() => {
  return props.items.length * props.itemHeight
})

const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - 3)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(props.containerHeight / props.itemHeight)
  return Math.min(props.items.length, startIndex.value + visibleCount + 6)
})

const visibleBills = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value)
})

const offsetY = computed(() => {
  return startIndex.value * props.itemHeight
})

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop
}

const getCycleLabel = (cycle) => {
  const labels = {
    monthly: '月度',
    quarterly: '季度',
    yearly: '年度',
    irregular: '不规则'
  }
  return labels[cycle] || cycle
}

const handleResize = () => {
  if (containerRef.value) {
    containerRef.value.style.height = props.containerHeight + 'px'
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.virtual-scroll-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-scroll-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.bill-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  height: 70px;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.bill-item:hover {
  background-color: #f8f9fa;
}

.bill-item-odd {
  background-color: #fafbfc;
}

.bill-item-odd:hover {
  background-color: #f0f2f5;
}

.bill-period {
  width: 60px;
  font-weight: 600;
  color: #3498db;
  font-size: 13px;
}

.bill-type-tag {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  margin-right: 12px;
}

.bill-type-tag.type-expense {
  background: #e74c3c;
}

.bill-type-tag.type-income {
  background: #27ae60;
}

.bill-info {
  flex: 1;
  margin: 0 16px;
}

.bill-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.bill-date {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
}

.bill-amount {
  font-weight: 700;
  font-size: 16px;
  min-width: 100px;
  text-align: right;
}

.bill-amount.type-expense {
  color: #e74c3c;
}

.bill-amount.type-income {
  color: #27ae60;
}

.bill-cycle {
  width: 60px;
  text-align: center;
  font-size: 12px;
  color: #95a5a6;
  background: #ecf0f1;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #95a5a6;
}

.empty-state p {
  margin: 4px 0;
}

.empty-hint {
  font-size: 12px;
}

/* Print styles */
@media print {
  .virtual-scroll-container {
    overflow: visible !important;
    height: auto !important;
  }
  
  .virtual-scroll-phantom {
    display: none;
  }
  
  .virtual-scroll-content {
    position: static !important;
    transform: none !important;
  }
  
  .bill-item {
    page-break-inside: avoid;
  }
}
</style>
