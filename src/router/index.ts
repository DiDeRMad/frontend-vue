import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import ContactDemo from '../views/ContactDemo.vue'
import WizardDemo from '../views/WizardDemo.vue'
import DynamicDemo from '../views/DynamicDemo.vue'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/contact' },
  { path: '/contact', name: 'ContactDemo', component: ContactDemo },
  { path: '/wizard', name: 'WizardDemo', component: WizardDemo },
  { path: '/dynamic', name: 'DynamicDemo', component: DynamicDemo },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router 