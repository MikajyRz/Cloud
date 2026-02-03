<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>
          <div class="header-title">
            <ion-icon :icon="mapOutline" />
            <span>Accueil</span>
          </div>
          <div class="header-subtitle" v-if="reportsCount > 0">
            {{ reportsCount }} signalement{{ reportsCount > 1 ? 's' : '' }} affiché{{ reportsCount > 1 ? 's' : '' }}
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="onLogout" :disabled="loading">
            <ion-icon slot="icon-only" :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="map" ref="mapEl" />

      <!-- Bouton flottant pour la localisation -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="fab-locate">
        <ion-fab-button @click="locateMe" :disabled="loading" :color="isTracking ? 'primary' : 'light'">
          <ion-icon :icon="isTracking ? navigateOutline : locationOutline" />
        </ion-fab-button>
      </ion-fab>

      <div class="overlay-container">
        <div class="overlay-card">
          <div class="user-info" v-if="userEmail">
            <ion-icon :icon="personCircleOutline" class="user-icon" />
            <div class="user-details">
              <span class="user-label">Connecté en tant que</span>
              <span class="user-email">{{ userEmail }}</span>
            </div>
          </div>

          <ion-item lines="none" class="toggle-item">
            <ion-icon :icon="listOutline" slot="start" color="primary" />
            <ion-label>Mes signalements</ion-label>
            <ion-toggle v-model="mineOnlyProxy" slot="end" />
          </ion-item>

          <ion-text color="danger" v-if="error" class="error-text">
            <p>{{ error }}</p>
          </ion-text>
        </div>
      </div>

      <ion-modal :is-open="isCreateOpen" @didDismiss="isCreateOpen = false" :initial-breakpoint="0.5" :breakpoints="[0, 0.5, 0.8]">
        <div class="modal-content ion-padding">
          <div class="modal-header">
            <div class="modal-handle"></div>
            <h2>Nouveau Signalement</h2>
            <p class="modal-coords" v-if="createLatLng">Lat: {{ createLatLng.lat.toFixed(6) }} | Lng: {{ createLatLng.lng.toFixed(6) }}</p>
          </div>

          <div class="form-scroll-area">
            <ion-list lines="none" class="form-list">
              <div class="modal-input-wrapper">
                <ion-icon :icon="createOutline" class="input-icon" />
                <ion-item>
                  <ion-input v-model="newReportTitle" placeholder="Titre du signalement" label-placement="stacked" />
                </ion-item>
              </div>

              <div class="modal-input-wrapper textarea-wrapper">
                <ion-icon :icon="documentTextOutline" class="input-icon" />
                <ion-item>
                  <ion-textarea v-model="newReportDescription" placeholder="Description détaillée..." :rows="4" />
                </ion-item>
              </div>
            </ion-list>
          </div>

          <div class="modal-actions">
            <ion-button expand="block" fill="clear" color="medium" @click="isCreateOpen = false">
              Annuler
            </ion-button>
            <ion-button expand="block" color="primary" :disabled="loading" @click="handleCreateReport">
              <ion-spinner v-if="loading" name="crescent" />
              <span v-else>Enregistrer le signalement</span>
            </ion-button>
          </div>
        </div>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonToggle,
  IonFab,
  IonFabButton,
  IonModal,
  IonTextarea,
  IonSpinner,
  IonAlert,
  onIonViewDidEnter,
} from '@ionic/vue'
import {
  logOutOutline,
  locationOutline,
  personCircleOutline,
  mapOutline,
  listOutline,
  createOutline,
  documentTextOutline,
  megaphoneOutline,
  navigateOutline,
  notificationsOutline,
} from 'ionicons/icons'
import { Geolocation } from '@capacitor/geolocation'
import { useAuth } from '@/composables/useAuth'
import { useReports, type ReportDoc } from '@/composables/useReports'

const router = useRouter()
const { currentUser, getCurrentUser, logout } = useAuth()
const { createReport, subscribeReports } = useReports()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let myMarker: L.Marker | null = null
let reportLayer: L.LayerGroup | null = null
let unsubReports: (() => void) | null = null

const reportIcon = L.divIcon({
  className: 'report-marker-icon',
  html: `
    <div class="radar-container">
      <div class="radar-ping"></div>
      <div class="radar-ping second"></div>
      <div class="radar-ping third"></div>
      <div class="megaphone-marker">
        <div class="marker-inner">
          <i class="megaphone-icon"></i>
        </div>
      </div>
    </div>
  `,
  iconSize: [70, 70],
  iconAnchor: [35, 35],
})

const locationIcon = L.divIcon({
  className: 'location-marker-icon',
  html: `
    <div class="location-pulse">
      <div class="pulse-ring"></div>
      <div class="location-dot"></div>
    </div>
  `,
  iconSize: [60, 60],
  iconAnchor: [30, 30],
})

const loading = ref(false)
const error = ref<string | null>(null)
const watchId = ref<string | null>(null)
const isTracking = ref(false)

const mineOnly = ref(true)
const reports = ref<ReportDoc[]>([])

const isCreateOpen = ref(false)
const createLatLng = ref<L.LatLng | null>(null)
const newReportTitle = ref('')
const newReportDescription = ref('')

const userEmail = computed(() => currentUser.value?.email ?? null)
const reportsCount = computed(() => reports.value.length)

const handleCreateReport = async () => {
  if (!createLatLng.value) return
  error.value = null
  loading.value = true
  try {
    await createReport({
      titre: newReportTitle.value.trim(),
      description: newReportDescription.value.trim(),
      latitude: createLatLng.value.lat,
      longitude: createLatLng.value.lng,
    })
    isCreateOpen.value = false
    newReportTitle.value = ''
    newReportDescription.value = ''
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('Initialisation de la carte...')
  console.log('mapEl.value:', mapEl.value)
  
  if (!mapEl.value) {
    console.error('Erreur: mapEl est null')
    return
  }
  
  if (map) {
    console.log('La carte est déjà initialisée')
    return
  }

  const antananarivoBounds = L.latLngBounds(L.latLng(-19.1, 47.3), L.latLng(-18.7, 47.7))

  const tileUrl =
    (import.meta.env.VITE_MOBILE_TILE_URL as string | undefined) ??
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    maxBounds: antananarivoBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 12,
  }).setView([-18.8792, 47.5079], 13)

  const tileLayer = L.tileLayer(tileUrl, {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==',
  })
  
  tileLayer.on('tileerror', (e) => {
    console.error('Erreur de chargement de la tuile:', e)
  })
  
  tileLayer.addTo(map)

  reportLayer = L.layerGroup().addTo(map)

  map.on('click', (evt: L.LeafletMouseEvent) => {
    createLatLng.value = evt.latlng
    isCreateOpen.value = true
  })

  ;(async () => {
    await getCurrentUser()
    unsubReports = subscribeReports(
      { mineOnly: mineOnly.value },
      (rows) => {
        reports.value = rows
        renderReportMarkers()
      },
      (e) => {
        error.value = e instanceof Error ? e.message : String(e)
      },
    )
  })()
})

const renderReportMarkers = () => {
  if (!reportLayer) return
  reportLayer.clearLayers()

  reports.value.forEach((r) => {
    const m = L.marker([r.latitude, r.longitude], { icon: reportIcon })
    const title = r.titre ? `<strong>${escapeHtml(r.titre)}</strong>` : '<strong>Signalement</strong>'
    const desc = r.description ? `<div>${escapeHtml(r.description)}</div>` : ''
    m.bindPopup(`${title}${desc}`)
    m.addTo(reportLayer as L.LayerGroup)
  })
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const resubscribeReports = () => {
  unsubReports?.()
  unsubReports = subscribeReports(
    { mineOnly: mineOnly.value },
    (rows) => {
      reports.value = rows
      renderReportMarkers()
    },
    (e) => {
      error.value = e instanceof Error ? e.message : String(e)
    },
  )
}

const locateMe = async () => {
  if (isTracking.value) {
    stopTracking()
    return
  }

  error.value = null
  loading.value = true
  try {
    // Premier positionnement immédiat
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    updateMyLocation(pos.coords.latitude, pos.coords.longitude)

    // Démarrer le suivi en temps réel (comme Google Maps)
    isTracking.value = true
    watchId.value = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 5000 },
      (pos) => {
        if (pos) {
          updateMyLocation(pos.coords.latitude, pos.coords.longitude, false)
        }
      }
    )
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    isTracking.value = false
  } finally {
    loading.value = false
  }
}

const stopTracking = () => {
  if (watchId.value) {
    Geolocation.clearWatch({ id: watchId.value })
    watchId.value = null
  }
  isTracking.value = false
}

const updateMyLocation = (lat: number, lng: number, centerMap = true) => {
  const latlng = L.latLng(lat, lng)
  const antananarivoBounds = L.latLngBounds(L.latLng(-19.1, 47.3), L.latLng(-18.7, 47.7))

  if (!antananarivoBounds.contains(latlng)) {
    if (centerMap) error.value = 'Localisation hors Antananarivo'
    return
  }

  if (map && centerMap) {
    map.setView(latlng, Math.max(map.getZoom(), 16))
  }

  if (myMarker) {
    myMarker.setLatLng(latlng)
  } else if (map) {
    myMarker = L.marker(latlng, { icon: locationIcon })
    myMarker.addTo(map)
    myMarker.bindPopup('Ma position')
  }
}

onIonViewDidEnter(() => {
  if (!map) return
  setTimeout(() => {
    map?.invalidateSize()
  }, 50)
})

onBeforeUnmount(() => {
  stopTracking()
  unsubReports?.()
  unsubReports = null
  map?.remove()
  map = null
})

const onLogout = async () => {
  error.value = null
  loading.value = true
  try {
    await logout()
    await router.replace('/login')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// re-subscribe when filter changes
const mineOnlyProxy = computed({
  get: () => mineOnly.value,
  set: (v: boolean) => {
    mineOnly.value = v
    resubscribeReports()
  },
})
</script>

<style scoped>
.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Futuristic Header */
ion-header {
  background: transparent;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 10;
  padding: 10px 16px;
}

ion-toolbar {
  --background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  --color: #0f172a;
  overflow: hidden;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #1e40af;
}

.header-title ion-icon {
  font-size: 24px;
  color: #2563eb;
}

.header-subtitle {
  font-size: 0.7rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

ion-buttons[slot="end"] ion-button {
  --color: #1e40af;
}

/* Futuristic Bottom Section */
.overlay-container {
  position: absolute;
  bottom: 24px;
  left: 16px;
  right: 16px;
  z-index: 10;
  pointer-events: none;
}

.overlay-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(25px) saturate(200%);
  -webkit-backdrop-filter: blur(25px) saturate(200%);
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  pointer-events: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.user-details {
  flex: 1;
}

.user-label {
  display: block;
  font-size: 0.65rem;
  color: #888;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.user-email {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-item {
  background: rgba(0, 0, 0, 0.03);
  --background: transparent;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.02);
  margin: 0;
}

.toggle-item ion-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #444;
}

ion-toggle {
  --handle-background: white;
  --handle-background-checked: white;
  --background: #ddd;
  --background-checked: #3b82f6;
}

.fab-locate {
  bottom: 180px;
  right: 16px;
}

ion-fab-button {
  --background: #3b82f6;
  --box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

ion-fab-button[color="primary"] {
  --background: #10b981;
  --box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
  animation: pulse-fab 2s infinite;
}

@keyframes pulse-fab {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.error-text {
  font-size: 0.85rem;
  margin-top: 8px;
  text-align: center;
}

/* Custom Marker Styles */
:deep(.radar-container) {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.radar-ping) {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid #ff4757;
  border-radius: 50%;
  opacity: 0;
  animation: radar-ping 3s ease-out infinite;
}

:deep(.radar-ping.second) {
  animation-delay: 1s;
}

:deep(.radar-ping.third) {
  animation-delay: 2s;
}

@keyframes radar-ping {
  0% {
    transform: scale(0.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

:deep(.megaphone-marker) {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2.5px solid white;
  box-shadow: 0 0 15px rgba(255, 71, 87, 0.5);
  z-index: 5;
  animation: vibrate-large 0.4s linear infinite;
}

@keyframes vibrate-large {
  0% { transform: translate(0) scale(1); }
  25% { transform: translate(-2px, 2px) scale(1.05); }
  50% { transform: translate(2px, -2px) scale(1); }
  75% { transform: translate(-2px, -2px) scale(1.05); }
  100% { transform: translate(0) scale(1); }
}

:deep(.marker-inner) {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.megaphone-icon) {
  width: 26px;
  height: 26px;
  background: currentColor;
  /* Nouveau logo plus pro : Triangle d'alerte moderne */
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L1 21h22L12 2zm0 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-4V8h2v5h-2z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L1 21h22L12 2zm0 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-4V8h2v5h-2z'/%3E%3C/svg%3E") no-repeat center;
}

/* Location Marker */
:deep(.location-pulse) {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.location-dot) {
  width: 22px;
  height: 22px;
  background: #3b82f6;
  border: 3.5px solid white;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.7);
  z-index: 2;
}

:deep(.pulse-ring) {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 6px solid #3b82f6;
  border-radius: 50%;
  opacity: 0;
  animation: pulse 2s ease-out infinite;
  z-index: 1;
}

@keyframes pulse {
  0% {
    transform: scale(0.3);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

/* Modal Styles */
.modal-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh; /* Limite la hauteur pour éviter qu'il dépasse */
  overflow: hidden;
  background: white;
}

.form-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.modal-header {
  text-align: center;
  padding-bottom: 16px;
  flex-shrink: 0;
}

.modal-handle {
  width: 40px;
  height: 5px;
  background: #ddd;
  border-radius: 10px;
  margin: 0 auto 15px;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #222;
}

.modal-coords {
  font-size: 0.8rem;
  color: #888;
  margin-top: 5px;
}

.form-list {
  background: transparent;
  padding: 0;
}

.modal-input-wrapper {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 15px;
  margin-bottom: 15px;
  padding: 0 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.modal-input-wrapper.textarea-wrapper {
  align-items: flex-start;
  padding-top: 12px;
}

.modal-input-wrapper ion-item {
  --background: transparent;
  --padding-start: 10px;
  --inner-padding-end: 0;
  width: 100%;
}

.modal-actions {
  padding-top: 16px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  background: white;
}

.modal-actions ion-button {
  margin-top: 10px;
  --border-radius: 12px;
  height: 50px;
  font-weight: 600;
}

:deep(.leaflet-popup-content-wrapper) {
  border-radius: 12px;
  padding: 4px;
}

:deep(.leaflet-popup-tip) {
  background: white;
}
</style>
