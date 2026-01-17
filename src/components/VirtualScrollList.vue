<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <div class="virtual-scroll-spacer" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-scroll-items" :style="{ transform: `translateY(${scrollTop}px)` }">
      <div 
        v-for="item in visibleItems" 
        :key="item.key || item.id || Math.random()"
        class="virtual-scroll-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export default {
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    itemHeight: {
      type: Number,
      default: 50
    },
    containerHeight: {
      type: Number,
      default: 400
    },
    buffer: {
      type: Number,
      default: 5
    }
  },
  setup(props) {
    const containerRef = ref(null)
    const scrollTop = ref(0)
    const startIndex = ref(0)
    const endIndex = ref(0)

    const totalHeight = computed(() => {
      return props.items.length * props.itemHeight
    })

    const visibleCount = computed(() => {
      return Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2
    })

    const visibleItems = computed(() => {
      return props.items.slice(startIndex.value, endIndex.value + 1)
    })

    const updateVisibleRange = () => {
      if (!containerRef.value) return
      
      const scrollPosition = containerRef.value.scrollTop
      scrollTop.value = scrollPosition
      
      startIndex.value = Math.max(0, Math.floor(scrollPosition / props.itemHeight) - props.buffer)
      endIndex.value = Math.min(
        props.items.length - 1,
        startIndex.value + visibleCount.value
      )
    }

    const handleScroll = () => {
      requestAnimationFrame(updateVisibleRange)
    }

    watch(() => props.items, () => {
      updateVisibleRange()
    }, { deep: true })

    onMounted(() => {
      updateVisibleRange()
    })

    onUnmounted(() => {
      containerRef.value = null
    })

    return {
      containerRef,
      totalHeight,
      visibleItems,
      scrollTop,
      handleScroll
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
}

.virtual-scroll-spacer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}

.virtual-scroll-items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

.virtual-scroll-item {
  display: flex;
  align-items: center;
  padding: 0 15px;
  box-sizing: border-box;
}
</style>