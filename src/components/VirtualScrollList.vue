<template>
  <div class="virtual-scroll-container" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }">
      <div class="virtual-scroll-content" :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="item.key"
          class="virtual-scroll-item"
          :style="{ height: itemHeight + 'px' }"
        >
          <slot :item="item.data" :index="item.index"></slot>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="loading-indicator">
      <span>加载中...</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      required: true
    },
    itemHeight: {
      type: Number,
      default: 80
    },
    buffer: {
      type: Number,
      default: 5
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['load-more'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const scrollTop = ref(0)
    const containerHeight = ref(0)

    const totalHeight = computed(() => {
      return props.items.length * props.itemHeight
    })

    const startIndex = computed(() => {
      return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer)
    })

    const endIndex = computed(() => {
      const visibleCount = Math.ceil(containerHeight.value / props.itemHeight) + 2 * props.buffer
      return Math.min(props.items.length, startIndex.value + visibleCount)
    })

    const offsetY = computed(() => {
      return startIndex.value * props.itemHeight
    })

    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
        data: item,
        index: startIndex.value + index,
        key: `${startIndex.value + index}-${JSON.stringify(item)}`
      }))
    })

    const isLoading = computed(() => props.loading)

    const handleScroll = () => {
      if (containerRef.value) {
        scrollTop.value = containerRef.value.scrollTop
        
        const scrollHeight = containerRef.value.scrollHeight
        const clientHeight = containerRef.value.clientHeight
        const scrollPosition = scrollTop.value + clientHeight
        
        if (scrollPosition >= scrollHeight - 100 && !props.loading) {
          emit('load-more')
        }
      }
    }

    const updateContainerHeight = () => {
      if (containerRef.value) {
        containerHeight.value = containerRef.value.clientHeight
      }
    }

    onMounted(() => {
      updateContainerHeight()
      window.addEventListener('resize', updateContainerHeight)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', updateContainerHeight)
    })

    return {
      containerRef,
      totalHeight,
      offsetY,
      visibleItems,
      isLoading,
      handleScroll
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  height: 500px;
  overflow-y: auto;
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.virtual-scroll-spacer {
  position: relative;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-scroll-item {
  box-sizing: border-box;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.virtual-scroll-item:last-child {
  border-bottom: none;
}

.loading-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  text-align: center;
  background: linear-gradient(transparent, rgba(255, 255, 255, 0.9));
  color: #666;
}

@media print {
  .virtual-scroll-container {
    height: auto;
    overflow: visible;
    border: none;
  }
  
  .virtual-scroll-spacer,
  .virtual-scroll-content {
    position: static;
  }
  
  .loading-indicator {
    display: none;
  }
}
</style>
