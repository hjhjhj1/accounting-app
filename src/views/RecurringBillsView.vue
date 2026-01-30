<template>
  <div class="recurring-bills-view">
    <RecurringBillManager />
  </div>
</template>

<script>
import { useRecurringBillsProvider } from '../composables/useRecurringBills'
import RecurringBillManager from '../components/RecurringBillManager.vue'

export default {
  name: 'RecurringBillsView',
  components: {
    RecurringBillManager
  },
  setup() {
    useRecurringBillsProvider()
  }
}
</script>

<style scoped>
.recurring-bills-view {
  padding: 20px 0;
}
</style>
