<template>
  <div class="recurring-billing">
    <h2>周期账单管理</h2>
    <p class="subtitle">管理您的月度/季度/年度周期性账单</p>
    
    <div class="billing-content">
      <div class="billing-sidebar">
        <BillingForm :editing-bill="editingBill" @cancel-edit="handleCancelEdit" />
        <BillingList @edit="handleEditBill" />
      </div>
      
      <div class="billing-main">
        <BillingPreview />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { provideRecurringBilling } from '@/composables/useRecurringBilling'
import BillingForm from './BillingForm.vue'
import BillingList from './BillingList.vue'
import BillingPreview from './BillingPreview.vue'

const store = provideRecurringBilling()
const { currentBill, regeneratePreview } = store

const editingBill = ref(null)

const handleEditBill = (bill) => {
  editingBill.value = { ...bill }
  Object.assign(currentBill.value, bill)
  regeneratePreview()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleCancelEdit = () => {
  editingBill.value = null
}
</script>

<style scoped>
.recurring-billing {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.recurring-billing h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 28px;
}

.subtitle {
  color: #7f8c8d;
  margin: 0 0 24px 0;
  font-size: 14px;
}

.billing-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.billing-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.billing-main {
  min-width: 0;
}

@media (max-width: 1024px) {
  .billing-content {
    grid-template-columns: 1fr;
  }
}

/* Print styles */
@media print {
  .recurring-billing {
    max-width: 100%;
    padding: 0;
  }
  
  .billing-sidebar {
    display: none;
  }
  
  .billing-main {
    width: 100%;
  }
}
</style>
