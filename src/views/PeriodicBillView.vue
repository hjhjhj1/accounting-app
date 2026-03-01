<template>
  <PeriodicBillProvider>
    <div class="periodic-bill-page">
      <h1>周期账单管理</h1>
      <p class="page-description">
        设置和管理您的周期性收支，预览未来账单计划
      </p>
      <PeriodicBillManager />
    </div>
  </PeriodicBillProvider>
</template>

<script setup>
import PeriodicBillProvider from '@/components/periodic-bill/PeriodicBillProvider.vue'
import PeriodicBillManager from '@/components/periodic-bill/PeriodicBillManager.vue'
</script>

<style scoped>
.periodic-bill-page {
  padding: 20px 0;
}

.periodic-bill-page h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #2c3e50;
}

.page-description {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}
</style>
