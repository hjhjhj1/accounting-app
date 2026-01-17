<template>
  <div
    class="virtual-scroll-container"
    ref="containerRef"
    @scroll="handleScroll"
  >
    <div
      class="virtual-scroll-phantom"
      :style="{ height: totalHeight + 'px' }"
    ></div>
    <div
      class="virtual-scroll-content"
      :style="{ transform: `translateY(${offset}px)` }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="bill-item"
        :class="{ 'bill-item--active': selectedBill?.id === item.id }"
        @click="handleItemClick(item)"
      >
        <div class="bill-item__header">
          <span class="bill-item__period">第 {{ item.periodNumber }} 期</span>
          <span class="bill-item__date">{{ item.dateText }}</span>
        </div>
        <div class="bill-item__content">
          <div class="bill-item__amount">
            {{ formatAmount(item.amount) }}
          </div>
          <div class="bill-item__status" :class="`bill-item__status--${item.status}`">
            {{ getStatusText(item.status) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

export default {
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 100
    },
    overscan: {
      type: Number,
      default: 5
    },
    selectedBill: {
      type: Object,
      default: null
    }
  },
  emits: ['item-click'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const scrollTop = ref(0)

    const totalHeight = computed(() => {
      return props.items.length * props.itemHeight
    })

    const visibleCount = computed(() => {
      if (!containerRef.value) return 0
      return Math.ceil(containerRef.value.clientHeight / props.itemHeight) + props.overscan
    })

    const startIndex = computed(() => {
      return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
    })

    const endIndex = computed(() => {
      return Math.min(props.items.length, startIndex.value + visibleCount.value)
    })

    const offset = computed(() => {
      return startIndex.value * props.itemHeight
    })

    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value)
    })

    const handleScroll = () => {
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop
      }
    }

    const handleItemClick = (item) => {
      emit('item-click', item)
    }

    const formatAmount = (amount) => {
      if (amount === undefined || amount === null) return '-'
      return `¥${amount.toFixed(2)}`
    }

    const getStatusText = (status) => {
      const statusMap = {
        pending: '待支付',
        paid: '已支付',
        overdue: '已逾期'
      }
      return statusMap[status] || status
    }

    const scrollToItem = (index) => {
      if (containerRef.value) {
        containerRef.value.scrollTop = index * props.itemHeight
      }
    }

    watch(() => props.items.length, async () => {
      await nextTick()
      if (containerRef.value) {
        containerRef.value.scrollTop = 0
      }
    })

    onMounted(() => {
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop
      }
    })

    return {
      containerRef,
      totalHeight,
      visibleCount,
      startIndex,
      endIndex,
      offset,
      visibleItems,
      handleScroll,
      handleItemClick,
      formatAmount,
      getStatusText,
      scrollToItem
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  height: 100%;
  overflow-y: auto;
  position: relative;
  background: #f9fafb;
  border-radius: 8px;
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
  height: 100px;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.bill-item:hover {
  background: #f3f4f6;
}

.bill-item--active {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.bill-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.bill-item__period {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
}

.bill-item__date {
  color: #6b7280;
  font-size: 14px;
}

.bill-item__content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bill-item__amount {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
}

.bill-item__status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.bill-item__status--pending {
  background: #fef3c7;
  color: #d97706;
}

.bill-item__status--paid {
  background: #d1fae5;
  color: #065f46;
}

.bill-item__status--overdue {
  background: #fee2e2;
  color: #991b1b;
}
</style>
