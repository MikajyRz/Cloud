<template>
  <ion-page>
    <ion-header class="ion-no-border transparent-header">
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
      <div class="content-overlay">
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
/* ── Header Moderne ─────────────────────────── */
.transparent-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.transparent-header ion-toolbar {
  --background: rgba(255, 255, 255, 0.7);
  --border-width: 0;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  padding: 12px 0;
}

.toolbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.back-btn, .mark-all-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: none;
  background: white;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.back-btn:active, .mark-all-btn:active {
  transform: scale(0.9);
}

.mark-all-btn:disabled {
  opacity: 0.4;
  box-shadow: none;
}

.toolbar-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.toolbar-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.5px;
}

.toolbar-badge {
  font-size: 0.7rem;
  color: #3b82f6;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 2px;
}

/* ── Content avec Background dégradé ────────── */
.notif-content {
  --background: #f1f5f9;
  --padding-top: 80px;
}

.content-overlay {
  min-height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(255, 255, 255, 0) 100%);
  padding: 85px 0 20px;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  padding: 0 40px;
}

.state-text {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 16px;
}

.empty-circle {
  width: 100px;
  height: 100px;
  border-radius: 35px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  color: #cbd5e1;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  transform: rotate(-5deg);
}

.empty-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 10px;
}

.empty-desc {
  font-size: 0.95rem;
  color: #64748b;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ── Notification Cards Moderne ─────────────── */
.notif-list {
  padding: 0 20px;
}

.notif-card {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 18px;
  margin-bottom: 14px;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notif-card.unread {
  background: white;
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.08);
}

.notif-card:active {
  transform: scale(0.97);
}

.notif-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  flex-shrink: 0;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #94a3b8;
  transition: all 0.3s;
}

.notif-card.unread .notif-icon-wrap {
  background: #eff6ff;
  color: #3b82f6;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 4px;
}

.notif-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
}

.notif-card.unread .notif-title {
  font-weight: 800;
  color: #0f172a;
}

.notif-time {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

.notif-message {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.unread-indicator {
  position: absolute;
  top: 18px;
  right: 18px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}
</style>
