<template>
  <div class="virtual-scroll-container" ref="containerRef" @scroll="handleScroll">
    <div class="virtual-scroll-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div class="virtual-scroll-content" :style="contentStyle">
      <div
        v-for="item in visibleItems"
        :key="item.instanceId"
        class="virtual-scroll-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot :item="item" :index="item._index"></slot>
      </div>
    </div>
    <div v-if="isLoading" class="virtual-scroll-loading">
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
const props = defineProps({
 items: {
 type: Array,
 required: true
 },
 itemHeight: {
 type: Number,
 default: 60
 },
 buffer: {
 type: Number,
 default: 5
 },
 containerHeight: {
 type: Number,
 default: 400
 }
});
const emit = defineEmits(['loadMore']);
const containerRef = ref(null);
const scrollTop = ref(0);
const isLoading = ref(false);
const totalHeight = computed(() => {
 return props.items.length * props.itemHeight;
});
const startIndex = computed(() => {
 return Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer);
});
const endIndex = computed(() => {
 const visibleCount = Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2;
 return Math.min(props.items.length, startIndex.value + visibleCount);
});
const visibleItems = computed(() => {
 return props.items.slice(startIndex.value, endIndex.value).map((item, index) => ({
 ...item,
 _index: startIndex.value + index
 }));
});
const contentStyle = computed(() => {
 return {
 transform: `translateY(${startIndex.value * props.itemHeight}px)`
 };
});
function handleScroll() {
 if (containerRef.value) {
 scrollTop.value = containerRef.value.scrollTop;
 checkLoadMore();
 }
}
function checkLoadMore() {
 if (isLoading.value)
 return;
 const scrollHeight = containerRef.value.scrollHeight;
 const clientHeight = containerRef.value.clientHeight;
 const scrollPos = scrollTop.value;
 if (scrollHeight - scrollPos - clientHeight < 100) {
 isLoading.value = true;
 emit('loadMore');
 setTimeout(() => {
 isLoading.value = false;
 }, 500);
 }
}
onMounted(() => {
 if (containerRef.value) {
 containerRef.value.style.height = props.containerHeight + 'px';
 }
});
watch(() => props.items, () => {
 isLoading.value = false;
});
defineExpose({
 scrollTo(index) {
 if (containerRef.value) {
 containerRef.value.scrollTop = index * props.itemHeight;
 }
 }
});
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.virtual-scroll-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
}

.virtual-scroll-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-scroll-item {
  box-sizing: border-box;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.virtual-scroll-item:last-child {
  border-bottom: none;
}

.virtual-scroll-loading {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  color: #999;
}

@media print {
  .virtual-scroll-container {
    overflow: visible;
    height: auto !important;
    border: none;
  }
  
  .virtual-scroll-phantom {
    display: none;
  }
  
  .virtual-scroll-content {
    position: static;
    transform: none !important;
  }
}
</style>
