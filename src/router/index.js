import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecordView from '../views/RecordView.vue'
import StatisticsView from '../views/StatisticsView.vue'
import RecurringBillingView from '../views/RecurringBillingView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/add',
    name: 'add-record',
    component: RecordView
  },
  {
    path: '/stats',
    name: 'statistics',
    component: StatisticsView
  },
  {
    path: '/recurring',
    name: 'recurring-billing',
    component: RecurringBillingView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router