import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecordView from '../views/RecordView.vue'
import StatisticsView from '../views/StatisticsView.vue'
import PeriodicBillingManager from '../components/periodic-billing/PeriodicBillingManager.vue'

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
    path: '/periodic-billing',
    name: 'periodic-billing',
    component: PeriodicBillingManager
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router