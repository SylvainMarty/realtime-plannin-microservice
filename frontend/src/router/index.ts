import { createRouter, createWebHistory } from 'vue-router'
import PlanningView from '../views/PlanningView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: PlanningView
    },
  ]
})

export default router
