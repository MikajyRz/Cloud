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
  micOutline,
  navigateOutline,
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
      <div class="dictaphone-marker">
        <div class="marker-inner">
          <i class="mic-icon"></i>
        </div>
      </div>
    </div>
  `,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
})

const locationIcon = L.divIcon({
  className: 'location-marker-icon',
  html: `
    <div class="location-pulse">
      <div class="pulse-ring"></div>
      <div class="location-dot"></div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
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
.ion-content {
  position: relative;
}

.map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  right: 0;
  bottom: 0;
}

.overlay-container {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  z-index: 999;
  pointer-events: none;
}

.overlay-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.1rem;
}

.header-subtitle {
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.9;
  margin-top: -2px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.user-icon {
  font-size: 32px;
  color: var(--ion-color-primary);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #000;
  font-weight: 600;
}

.user-email {
  font-size: 0.9rem;
  font-weight: 700;
  color: #000;
}

.toggle-item {
  --background: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
  --color: #000;
  margin-bottom: 4px;
}

.toggle-item ion-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #000;
}

.fab-locate {
  margin-bottom: 110px; /* Espace pour ne pas chevaucher la carte overlay */
  margin-right: 8px;
}

.error-text {
  font-size: 0.85rem;
  margin-top: 8px;
  text-align: center;
}

/* Custom Marker Styles */
:deep(.radar-container) {
  position: relative;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.radar-ping) {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid #ff4757;
  border-radius: 50%;
  opacity: 0;
  animation: radar-ping 2s ease-out infinite;
}

:deep(.radar-ping.second) {
  animation-delay: 1s;
}

@keyframes radar-ping {
  0% {
    transform: scale(0.3);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

:deep(.dictaphone-marker) {
  width: 32px;
  height: 32px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 5;
  animation: vibrate 0.5s linear infinite;
}

@keyframes vibrate {
  0% { transform: translate(0); }
  20% { transform: translate(-1px, 1px); }
  40% { transform: translate(-1px, -1px); }
  60% { transform: translate(1px, 1px); }
  80% { transform: translate(1px, -1px); }
  100% { transform: translate(0); }
}

:deep(.marker-inner) {
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.mic-icon) {
  width: 16px;
  height: 16px;
  background: currentColor;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M192 352h128c17.67 0 32-14.33 32-32V128c0-17.67-14.33-32-32-32H192c-17.67 0-32 14.33-32 32v192c0 17.67 14.33 32 32 32z'/%3E%3Cpath d='M384 192v128c0 70.69-57.31 128-128 128s-128-57.31-128-128V192h-32v128c0 82.5 62.33 150.77 144 159.1V512h32v-32.9c81.67-8.33 144-76.6 144-159.1V192h-32z'/%3E%3C/svg%3E") no-repeat center;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M192 352h128c17.67 0 32-14.33 32-32V128c0-17.67-14.33-32-32-32H192c-17.67 0-32 14.33-32 32v192c0 17.67 14.33 32 32 32z'/%3E%3Cpath d='M384 192v128c0 70.69-57.31 128-128 128s-128-57.31-128-128V192h-32v128c0 82.5 62.33 150.77 144 159.1V512h32v-32.9c81.67-8.33 144-76.6 144-159.1V192h-32z'/%3E%3C/svg%3E") no-repeat center;
}

/* Location Marker */
:deep(.location-pulse) {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.location-dot) {
  width: 14px;
  height: 14px;
  background: #3b82f6;
  border: 2.5px solid white;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
  z-index: 2;
}

:deep(.pulse-ring) {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #3b82f6;
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
  color: #000;
}

.modal-coords {
  font-size: 0.8rem;
  color: #333;
  font-weight: 600;
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
  --color: #000;
  width: 100%;
}

.modal-input-wrapper ion-input,
.modal-input-wrapper ion-textarea {
  --color: #000;
  --placeholder-color: #666;
  --placeholder-opacity: 1ding-end: 0;
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
