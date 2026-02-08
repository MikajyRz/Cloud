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
    component: () => import('@/views/LoginPage.vue'),
    meta: { transition: 'slide-left' }
  },
  {
    path: '/home',
    component: () => import('@/views/HomePage.vue'),
    meta: { 
      requiresAuth: true,
      transition: 'slide-right'
    }
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

// Animation de transition pour mobile
router.beforeEach((to, from) => {
  const toDepth = to.meta.transition
  const fromDepth = from.meta.transition
  
  if (toDepth && fromDepth) {
    to.meta.transitionName = 'slide'
  }
})

router.beforeEach(async (to: RouteLocationNormalized) => {
  const { getCurrentUser } = useAuth()
  const u = await getCurrentUser()

  if (to.path === '/login' && u) {
    return { path: '/home' }
  }

  if (to.matched.some((r) => r.meta?.requiresAuth) && !u) {
    return { path: '/login' }
  }

  return true
})

export default router