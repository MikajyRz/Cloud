import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw, type RouteLocationNormalized } from 'vue-router';
import { useAuth } from '@/composables/useAuth'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue')
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue')
  },
  {
    path: '/home',
    component: () => import('@/views/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const { getCurrentUser } = useAuth()
  const u = await getCurrentUser()

  if ((to.path === '/login' || to.path === '/register') && u) {
    return { path: '/home' }
  }

  if (to.matched.some((r) => r.meta?.requiresAuth) && !u) {
    return { path: '/login' }
  }

  return true
})

export default router
