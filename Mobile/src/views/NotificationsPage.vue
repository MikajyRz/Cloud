<template>
  <ion-page>
    <ion-header class="ion-no-border notif-header">
      <ion-toolbar>
        <div class="toolbar-inner">
          <button class="back-btn" @click="$router.back()">
            <ion-icon :icon="arrowBackOutline" />
          </button>
          <div class="toolbar-center">
            <span class="toolbar-title">Notifications</span>
            <span v-if="unreadCount > 0" class="toolbar-badge">{{ unreadCount }} non lue{{ unreadCount > 1 ? 's' : '' }}</span>
          </div>
          <button class="mark-all-btn" @click="handleMarkAllRead" :disabled="unreadCount === 0">
            <ion-icon :icon="checkmarkDoneOutline" />
          </button>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="notif-content">
      <!-- Loading -->
      <div v-if="loading" class="state-container">
        <ion-spinner name="crescent" color="primary" />
        <p class="state-text">Chargement…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="notifications.length === 0" class="state-container">
        <div class="empty-circle">
          <ion-icon :icon="notificationsOffOutline" />
        </div>
        <h3 class="empty-title">Aucune notification</h3>
        <p class="empty-desc">Les notifications apparaîtront ici lorsqu'un manager modifiera le statut d'un signalement.</p>
      </div>

      <!-- List -->
      <div v-else class="notif-list">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notif-card"
          :class="{ unread: !notif.lu }"
          @click="handleNotifClick(notif)"
        >
          <div class="notif-icon-wrap" :class="{ active: !notif.lu }">
            <ion-icon :icon="alertCircleOutline" />
          </div>
          <div class="notif-body">
            <div class="notif-top">
              <span class="notif-title">{{ notif.titre }}</span>
              <span class="notif-time">{{ formatDate(notif.dateCreation) }}</span>
            </div>
            <p class="notif-message">{{ notif.message }}</p>
          </div>
          <div v-if="!notif.lu" class="unread-indicator"></div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonIcon, IonSpinner,
} from '@ionic/vue'
import {
  arrowBackOutline, notificationsOffOutline, checkmarkDoneOutline,
  alertCircleOutline,
} from 'ionicons/icons'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const {
  notifications, unreadCount, loading,
  markAsRead, markAllAsRead, formatDate
} = useNotifications()

const handleNotifClick = (notif: any) => {
  if (!notif.lu) markAsRead(notif.id)
}

const handleMarkAllRead = () => {
  markAllAsRead()
}
</script>

<style scoped>
/* ── Header ─────────────────────────── */
.notif-header ion-toolbar {
  --background: #0f172a; --border-width: 0; padding: 8px 0;
}
.toolbar-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px;
}
.back-btn, .mark-all-btn {
  width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.1); color: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer;
}
.mark-all-btn:disabled { opacity: 0.3; }
.toolbar-center { display: flex; flex-direction: column; align-items: center; }
.toolbar-title { font-size: 17px; font-weight: 700; color: #f8fafc; }
.toolbar-badge { font-size: 11px; color: #818cf8; font-weight: 500; }

/* ── Content ────────────────────────── */
.notif-content { --background: #f8fafc; }

.state-container {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 65%; padding: 0 32px;
}
.state-text { color: #94a3b8; font-size: 14px; margin-top: 12px; }

.empty-circle {
  width: 80px; height: 80px; border-radius: 50%;
  background: #eef2ff; display: flex; align-items: center; justify-content: center;
  font-size: 36px; color: #a5b4fc; margin-bottom: 20px;
}
.empty-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
.empty-desc { font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0; }

/* ── Notification Cards ─────────────── */
.notif-list { padding: 12px 16px; }

.notif-card {
  display: flex; align-items: flex-start; gap: 12px;
  background: white; border-radius: 14px; padding: 14px 16px;
  margin-bottom: 10px; position: relative;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.2s;
}
.notif-card.unread {
  background: #eef2ff;
  box-shadow: 0 2px 8px rgba(79,70,229,0.08);
}
.notif-card:active { transform: scale(0.98); }

.notif-icon-wrap {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  font-size: 20px; color: #94a3b8;
}
.notif-icon-wrap.active { background: #4f46e5; color: white; }

.notif-body { flex: 1; min-width: 0; }
.notif-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.notif-title { font-size: 14px; font-weight: 600; color: #0f172a; }
.notif-card.unread .notif-title { font-weight: 700; }
.notif-time { font-size: 11px; color: #94a3b8; white-space: nowrap; flex-shrink: 0; }
.notif-message { font-size: 13px; color: #64748b; line-height: 1.4; margin: 4px 0 0; }

.unread-indicator {
  position: absolute; top: 14px; right: 14px;
  width: 8px; height: 8px; border-radius: 50%;
  background: #4f46e5;
}
</style>
