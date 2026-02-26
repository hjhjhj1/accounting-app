<template>
  <div class="virtual-scroll-container" ref="containerRef">
    <div class="scroll-content" :style="{ height: totalHeight + 'px' }">
      <div 
        class="scroll-viewport" 
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div 
          v-for="item in visibleItems" 
          :key="item.index"
          class="bill-item"
          :class="{ 'item-overdue': item.status === 'overdue' }"
          :style="{ height: itemHeight + 'px' }"
        >
          <div class="item-index">#{{ item.index }}</div>
          <div class="item-date">{{ item.formatted }}</div>
          <div class="item-amount" :class="billType">
            {{ billType === 'expense' ? '-' : '+' }}¥{{ item.amount.toFixed(2) }}
          </div>
          <div class="item-status" :class="item.status">
            {{ statusText(item.status) }}
          </div>
        </div>
      </div>
    </div>
    <div class="scroll-info">
      显示 {{ visibleItems.length }} / {{ totalCount }} 期
    </div>
    <div v-if="loading" class="loading-indicator">
      加载中...
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { recurringBillKey } from '../composables/useRecurringBill'

export default {
  name: 'VirtualScrollList',
  props: {
    bill: {
      type: Object,
      required: true
    },
    totalCount: {
      type: Number,
      default: 36
    }
  },
  setup(props) {
    const { generateBillDates } = inject(recurringBillKey)
    
    const containerRef = ref(null)
    const itemHeight = 50
    const bufferSize = 5
    const scrollTop = ref(0)
    const loading = ref(false)
    const loadedCount = ref(20)
    
    const allItems = ref([])
    
    const containerHeight = computed(() => {
      return Math.min(500, props.totalCount * itemHeight)
    })
    
    const totalHeight = computed(() => props.totalCount * itemHeight)
    
    const billType = computed(() => props.bill?.type || 'expense')
    
    const visibleCount = computed(() => {
      return Math.ceil(containerHeight.value / itemHeight) + bufferSize * 2
    })
    
    const startIndex = computed(() => {
      return Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize)
    })
    
    const endIndex = computed(() => {
      return Math.min(props.totalCount, startIndex.value + visibleCount.value)
    })
    
    const offsetY = computed(() => startIndex.value * itemHeight)
    
    const visibleItems = computed(() => {
      return allItems.value.slice(startIndex.value, endIndex.value)
    })
    
    const statusText = (status) => {
      const texts = {
        overdue: '已过期',
        pending: '待执行',
        paid: '已支付'
      }
      return texts[status] || status
    }
    
    const loadItems = () => {
      if (allItems.value.length >= props.totalCount) return
      
      loading.value = true
      
      setTimeout(() => {
        const dates = generateBillDates(props.bill, props.totalCount)
        allItems.value = dates
        loading.value = false
      }, 100)
    }
    
    const handleScroll = (e) => {
      scrollTop.value = e.target.scrollTop
      
      if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 100) {
        if (loadedCount.value < props.totalCount) {
          loadedCount.value = Math.min(loadedCount.value + 10, props.totalCount)
        }
      }
    }
    
    watch(() => props.bill, () => {
      allItems.value = []
      loadItems()
    }, { immediate: true, deep: true })
    
    onMounted(() => {
      if (containerRef.value) {
        containerRef.value.addEventListener('scroll', handleScroll)
      }
      loadItems()
    })
    
    onUnmounted(() => {
      if (containerRef.value) {
        containerRef.value.removeEventListener('scroll', handleScroll)
      }
    })
    
    return {
      containerRef,
      itemHeight,
      scrollTop,
      loading,
      totalHeight,
      offsetY,
      visibleItems,
      billType,
      statusText
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  position: relative;
}

.scroll-content {
  position: relative;
}

.scroll-viewport {
  position: absolute;
  width: 100%;
}

.bill-item {
  display: flex;
  align-items: center;
  padding: 0 15px;
  background: white;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
}

.bill-item:hover {
  background: #f5f5f5;
}

.item-overdue {
  background: #fff5f5;
}

.item-index {
  width: 60px;
  font-weight: 600;
  color: #666;
}

.item-date {
  flex: 1;
  color: #333;
}

.item-amount {
  width: 120px;
  text-align: right;
  font-weight: 600;
  font-size: 15px;
}

.item-amount.expense {
  color: #27ae60;
}

.item-amount.income {
  color: #e74c3c;
}

.item-status {
  width: 70px;
  text-align: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 15px;
}

.item-status.overdue {
  background: #fee;
  color: #e74c3c;
}

.item-status.pending {
  background: #fff3cd;
  color: #856404;
}

.item-status.paid {
  background: #d4edda;
  color: #155724;
}

.scroll-info {
  position: sticky;
  bottom: 0;
  background: rgba(52, 152, 219, 0.9);
  color: white;
  padding: 8px;
  text-align: center;
  font-size: 13px;
}

.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}
</style>
