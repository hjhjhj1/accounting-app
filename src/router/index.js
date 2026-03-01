import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RecordView from '../views/RecordView.vue'
import StatisticsView from '../views/StatisticsView.vue'
import PeriodicBillView from '../views/PeriodicBillView.vue'

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
    path: '/periodic',
    name: 'periodic-bills',
    component: PeriodicBillView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router