<template>
  <ion-page>
    <!-- Modern Navigation Bar -->
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <div class="toolbar-inner">
          <div class="toolbar-left">
            <div class="header-title">
              <ion-icon :icon="mapOutline" />
              <span>Accueil</span>
            </div>
            <div class="header-subtitle" v-if="reportsCount > 0">
              {{ reportsCount }} signalement{{ reportsCount > 1 ? 's' : '' }}
            </div>
          </div>
          <div class="toolbar-right">
            <button class="icon-btn notif-btn" @click="goToNotifications">
              <ion-icon :icon="notificationsOutline" />
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <button class="icon-btn logout-btn" @click="onLogout" :disabled="loading">
              <ion-icon :icon="logOutOutline" />
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="map" ref="mapEl" />

      <!-- Locate FAB with pulse animation -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="fab-locate">
        <ion-fab-button @click="locateMe" :disabled="loading" :color="isTracking ? 'success' : 'primary'">
          <ion-icon :icon="isTracking ? navigateOutline : locationOutline" />
        </ion-fab-button>
      </ion-fab>

      <!-- Futuristic Overlay Panel -->
      <div class="overlay-container">
        <div class="overlay-card">
          <!-- User info -->
          <div class="user-info" v-if="userEmail">
            <div class="user-icon">
              <ion-icon :icon="personCircleOutline" />
            </div>
            <div class="user-details">
              <span class="user-label">Connecté en tant que</span>
              <span class="user-email">{{ userEmail }}</span>
            </div>
          </div>

          <!-- Filter toggle -->
          <ion-item lines="none" class="toggle-item">
            <ion-icon :icon="filterOutline" slot="start" color="primary" />
            <ion-label>Mes signalements uniquement</ion-label>
            <ion-toggle v-model="mineOnlyProxy" slot="end" />
          </ion-item>

          <ion-text color="danger" v-if="error" class="error-text">
            <p>{{ error }}</p>
          </ion-text>
        </div>
      </div>

      <!-- Create Report Modal -->
      <ion-modal :is-open="isCreateOpen" @didDismiss="isCreateOpen = false" :initial-breakpoint="0.65" :breakpoints="[0, 0.65, 0.9]">
        <div class="modal-content ion-padding">
          <div class="modal-header">
            <div class="modal-handle"></div>
            <h2>Nouveau Signalement</h2>
            <p class="modal-coords" v-if="createLatLng">📍 {{ createLatLng.lat.toFixed(5) }}, {{ createLatLng.lng.toFixed(5) }}</p>
          </div>

          <div class="form-scroll-area">
            <div class="field-group">
              <label class="field-label">Titre</label>
              <div class="modal-input-wrapper">
                <ion-icon :icon="createOutline" class="input-icon" />
                <ion-input v-model="newReportTitle" placeholder="Ex: Nid-de-poule RN7" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Description</label>
              <div class="modal-input-wrapper textarea-wrapper">
                <ion-icon :icon="documentTextOutline" class="input-icon" />
                <ion-textarea v-model="newReportDescription" placeholder="Décrivez le problème..." :rows="3" />
              </div>
            </div>

            <!-- Image upload (Preserved from target) -->
            <div class="field-group">
              <label class="field-label">Photos</label>
              <input type="file" @change="onFileChange" accept="image/*" ref="fileInput" style="display: none" multiple />
              <button class="upload-btn" @click="triggerFileInput">
                <ion-icon :icon="cameraIcon" />
                <span>Ajouter des photos</span>
              </button>
              <div v-if="newReportImagePreviews.length > 0" class="previews-row">
                <div v-for="(preview, index) in newReportImagePreviews" :key="index" class="preview-thumb">
                  <img :src="preview" />
                  <button class="remove-thumb" @click="removeImage(index)">
                    <ion-icon :icon="closeIcon" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <ion-button expand="block" fill="clear" color="medium" @click="isCreateOpen = false">
              Annuler
            </ion-button>
            <ion-button expand="block" color="primary" :disabled="loading || !newReportTitle.trim()" @click="handleCreateReport">
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonToggle,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSpinner,
  onIonViewDidEnter,
} from '@ionic/vue'
import {
  logOutOutline,
  locationOutline,
  personCircleOutline,
  mapOutline,
  filterOutline,
  createOutline,
  documentTextOutline,
  navigateOutline,
  notificationsOutline,
  calendarOutline,
  cubeOutline,
  walletOutline,
  businessOutline,
  camera as cameraIcon,
  closeCircleOutline as closeIcon,
} from 'ionicons/icons'
import { Geolocation } from '@capacitor/geolocation'
import { useAuth } from '@/composables/useAuth'
import { useReports, type ReportDoc } from '@/composables/useReports'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { currentUser, getCurrentUser, logout } = useAuth()
const { createReport, subscribeReports } = useReports()
const { unreadCount } = useNotifications()

const goToNotifications = () => {
  router.push('/notifications')
}

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

const mineOnly = ref(false)
const reports = ref<ReportDoc[]>([])
const isCreateOpen = ref(false)
const createLatLng = ref<L.LatLng | null>(null)
const newReportTitle = ref('')
const newReportDescription = ref('')
const newReportFiles = ref<File[]>([])
const newReportImagePreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const userEmail = computed(() => currentUser.value?.email ?? null)
const reportsCount = computed(() => reports.value.length)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const filesArray = Array.from(target.files)
    newReportFiles.value.push(...filesArray)

    try {
      const promises = filesArray.map(file => imageToBase64(file))
      const base64Strings = await Promise.all(promises)
      newReportImagePreviews.value.push(...base64Strings.filter(s => s !== null) as string[])
    } catch (e) {
      console.error('Error generating image previews:', e)
      error.value = 'Erreur lors de la génération des aperçus.'
    }
  }
}

const removeImage = (index: number) => {
  newReportFiles.value.splice(index, 1)
  newReportImagePreviews.value.splice(index, 1)
}

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
      surfaceM2: 0,
      budget: 0,
      imageUrls: newReportImagePreviews.value,
    })
    isCreateOpen.value = false
  } catch (e) {
    console.error('Erreur lors de la création:', e)
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(isCreateOpen, (isOpen) => {
  if (!isOpen) {
    newReportTitle.value = ''
    newReportDescription.value = ''
    newReportFiles.value = []
    newReportImagePreviews.value = []
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
})

const imageToBase64 = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.src = reader.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 800
        const MAX_HEIGHT = 800
        let { width, height } = img
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Could not get canvas context'))
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}

onMounted(() => {
  if (!mapEl.value) return
  const antananarivoBounds = L.latLngBounds(L.latLng(-19.1, 47.3), L.latLng(-18.7, 47.7))
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
    maxBounds: antananarivoBounds,
    maxBoundsViscosity: 1.0,
    minZoom: 12,
  }).setView([-18.8792, 47.5079], 13)

  L.tileLayer(tileUrl, {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

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
    
    // Formatting data for popup
    const dateStr = r.createdAt && (r.createdAt as any).toDate 
      ? (r.createdAt as any).toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Date inconnue'
    
    const currentStatus = r.status || 'NOUVEAU'
    const statusLabel = {
      'NOUVEAU': 'Nouveau',
      'EN_COURS': 'En cours',
      'TERMINE': 'Terminé'
    }[currentStatus] || currentStatus

    const surface = (r as any).surfaceM2 || 0
    const budget = (r as any).budget || 0
    const entreprise = (r as any).entreprise || 'Non assignée'
    const hasPhotos = r.imageUrls && r.imageUrls.length > 0

    const popupHtml = `
      <div class="custom-popup">
        <div class="popup-header">
          <div class="header-content">
            <strong>${escapeHtml(r.titre || 'Signalement')}</strong>
            <span class="status-badge status-${currentStatus.toLowerCase()}">${statusLabel}</span>
          </div>
        </div>
        <div class="popup-body">
          <div class="info-section">
            <div class="info-row">
              <div class="icon-wrapper">
                <ion-icon icon="${calendarOutline}" class="popup-icon"></ion-icon>
              </div>
              <div class="info-text">
                <span class="label">Date</span>
                <span class="value">${dateStr}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="icon-wrapper">
                <ion-icon icon="${cubeOutline}" class="popup-icon"></ion-icon>
              </div>
              <div class="info-text">
                <span class="label">Surface</span>
                <span class="value">${surface} m²</span>
              </div>
            </div>
          </div>
          <div class="info-section">
            <div class="info-row">
              <div class="icon-wrapper">
                <ion-icon icon="${walletOutline}" class="popup-icon"></ion-icon>
              </div>
              <div class="info-text">
                <span class="label">Budget</span>
                <span class="value">${budget.toLocaleString()} Ar</span>
              </div>
            </div>
            <div class="info-row">
              <div class="icon-wrapper">
                <ion-icon icon="${businessOutline}" class="popup-icon"></ion-icon>
              </div>
              <div class="info-text">
                <span class="label">Entreprise</span>
                <span class="value">${escapeHtml(entreprise)}</span>
              </div>
            </div>
          </div>
          ${r.description ? `
          <div class="description-section">
            <span class="label">Description</span>
            <p class="description-text">${escapeHtml(r.description)}</p>
          </div>
          ` : ''}
        </div>
        ${hasPhotos ? `
        <div class="popup-footer">
          <button class="view-photos-btn" onclick="window.dispatchEvent(new CustomEvent('view-photos', { detail: '${r.id}' }))">
            <ion-icon icon="${cameraIcon}"></ion-icon>
            Voir les photos (${r.imageUrls?.length})
          </button>
        </div>
        ` : ''}
      </div>
    `

    m.bindPopup(popupHtml, {
      className: 'modern-popup',
      maxWidth: 280,
      autoPan: false
    })

    // Interaction behavior: Open on hover, close on mouseout
    m.on('mouseover', function () {
      this.openPopup()
    })
    m.on('mouseout', function () {
      this.closePopup()
    })
    
    m.addTo(reportLayer as L.LayerGroup)
  })
}

// Add a listener for the custom event to view photos if needed
onMounted(() => {
  window.addEventListener('view-report-photos', ((e: CustomEvent) => {
    const reportId = e.detail
    const report = reports.value.find(r => r.id === reportId)
    if (report && report.imageUrls && report.imageUrls.length > 0) {
      // Logic to show photos could be added here (e.g., opening another modal or gallery)
      console.log('Viewing photos for report:', reportId)
    }
  }) as EventListener)
})

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
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    updateMyLocation(pos.coords.latitude, pos.coords.longitude)
    isTracking.value = true
    watchId.value = await Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 5000 },
      (pos) => {
        if (pos) updateMyLocation(pos.coords.latitude, pos.coords.longitude, false)
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
  if (map && centerMap) map.setView(latlng, Math.max(map.getZoom(), 16))
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
  setTimeout(() => { map?.invalidateSize() }, 50)
  if (reports.value.length === 0 && currentUser.value) {
    resubscribeReports()
  } else {
    renderReportMarkers()
  }
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
  --padding-top: 4px;
  --padding-bottom: 4px;
}

.toolbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.toolbar-left {
  display: flex;
  flex-direction: column;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #1e40af;
  font-size: 1.1rem;
}

.header-title ion-icon {
  font-size: 20px;
  color: #2563eb;
}

.header-subtitle {
  font-size: 0.65rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  background: rgba(37, 99, 235, 0.1);
  color: #1e40af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.icon-btn:active {
  background: rgba(37, 99, 235, 0.2);
  transform: scale(0.95);
}

.notif-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
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
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.user-email {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
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
  color: #334155;
}

ion-toggle {
  --handle-background: white;
  --handle-background-checked: white;
  --background: #cbd5e1;
  --background-checked: #3b82f6;
}

/* Stats Grid Preserved from target but styled for new UI */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.stat-card.accent {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.2);
}

.stat-number {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e40af;
}

.stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.fab-locate {
  bottom: 220px;
  right: 16px;
}

ion-fab-button {
  --background: #3b82f6;
  --box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

ion-fab-button[color="success"] {
  --background: #10b981;
  --box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
  animation: pulse-fab 2s infinite;
}

@keyframes pulse-fab {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Modern Popup Styling */
:deep(.modern-popup .leaflet-popup-content-wrapper) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.3);
}

:deep(.modern-popup .leaflet-popup-content) {
  margin: 0;
  width: 220px !important;
}

:deep(.modern-popup .leaflet-popup-tip) {
  background: rgba(255, 255, 255, 0.9);
}

.custom-popup {
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 12px 15px;
  background: rgba(37, 99, 235, 0.05);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header strong {
  color: #1e293b;
  font-size: 0.95rem;
}

.status-badge {
  font-size: 0.65rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-nouveau { background: #dcfce7; color: #166534; }
.status-en_cours { background: #fef9c3; color: #854d0e; }
.status-termine { background: #dbeafe; color: #1e40af; }

.popup-body {
  padding: 12px 15px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.8rem;
  color: #475569;
}

.popup-icon {
  font-size: 16px;
  color: #3b82f6;
  min-width: 16px;
}

.footer-icon {
  font-size: 16px;
  color: #2563eb;
}

.info-row span {
  color: #1e293b;
  font-weight: 500;
}

.popup-footer {
  padding: 10px 15px;
  border-top: 1px solid rgba(0,0,0,0.05);
  background: rgba(37, 99, 235, 0.02);
}

.view-photos-link {
  text-decoration: none;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.view-photos-link:hover {
    text-decoration: underline;
  }

  .error-text {
    font-size: 0.8rem;
    text-align: center;
  }

  /* Custom Marker Styles (From source) */
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

  :deep(.radar-ping.second) { animation-delay: 1s; }
  :deep(.radar-ping.third) { animation-delay: 2s; }

  @keyframes radar-ping {
    0% { transform: scale(0.2); opacity: 0.9; }
    100% { transform: scale(2); opacity: 0; }
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

  :deep(.marker-inner) { color: white; display: flex; align-items: center; justify-content: center; }

  :deep(.megaphone-icon) {
    width: 26px;
    height: 26px;
    background: currentColor;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L1 21h22L12 2zm0 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-4V8h2v5h-2z'/%3E%3C/svg%3E") no-repeat center;
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2L1 21h22L12 2zm0 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-4V8h2v5h-2z'/%3E%3C/svg%3E") no-repeat center;
  }

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
    0% { transform: scale(0.3); opacity: 0.8; }
    100% { transform: scale(1.2); opacity: 0; }
  }

  /* Modal Styles */
  .modal-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 90vh;
    overflow: hidden;
    background: white;
  }

  .form-scroll-area {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;
  }

  .modal-header {
    text-align: center;
    padding-bottom: 16px;
    flex-shrink: 0;
  }

  .modal-handle {
    width: 40px;
    height: 5px;
    background: #e2e8f0;
    border-radius: 10px;
    margin: 0 auto 15px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
  }

  .modal-coords {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 5px;
  }

  .field-group { margin-bottom: 16px; }
  .field-label {
    display: block;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .modal-input-wrapper {
    display: flex;
    align-items: center;
    background: #f8fafc;
    border-radius: 12px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
  }

  .modal-input-wrapper.textarea-wrapper { align-items: flex-start; padding-top: 8px; }

  .input-icon { font-size: 20px; color: #64748b; margin-right: 8px; }

  ion-input, ion-textarea {
    --padding-start: 0;
    font-size: 0.95rem;
    color: #0f172a;
  }

  .field-row { display: flex; gap: 12px; }
  .field-group.half { flex: 1; }

  .upload-btn {
    width: 100%; height: 48px; border-radius: 12px;
    border: 2px dashed #cbd5e1; background: #f8fafc;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    color: #64748b; font-weight: 600; cursor: pointer;
  }

  .previews-row {
    display: flex; gap: 8px; overflow-x: auto; margin-top: 10px; padding-bottom: 4px;
  }

  .preview-thumb {
    position: relative; width: 80px; height: 80px; flex-shrink: 0;
  }

  .preview-thumb img {
    width: 100%; height: 100%; object-fit: cover; border-radius: 10px;
  }

  .remove-thumb {
    position: absolute; top: -4px; right: -4px;
    background: white; color: #ef4444; border-radius: 50%;
    padding: 0; border: none; font-size: 20px; display: flex;
  }

  .modal-actions {
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
  }

  .modal-actions ion-button {
    margin-top: 8px;
    --border-radius: 12px;
    height: 52px;
    font-weight: 700;
  }

/* Modern Popup Styling */
:deep(.modern-popup .leaflet-popup-content-wrapper) {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

:deep(.modern-popup .leaflet-popup-content) {
  margin: 0;
  width: 280px !important;
}

:deep(.modern-popup .leaflet-popup-tip) {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
}

.custom-popup {
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.header-content strong {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 700;
  line-height: 1.2;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-nouveau { background: #dcfce7; color: #166534; }
.status-en_cours { background: #fef9c3; color: #854d0e; }
.status-termine { background: #dbeafe; color: #1e40af; }

.popup-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.popup-icon {
  font-size: 18px;
  color: #3b82f6;
}

.info-text {
  display: flex;
  flex-direction: column;
}

.info-text .label {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

.info-text .value {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 600;
}

.description-section {
  background: rgba(0, 0, 0, 0.03);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.description-section .label {
  display: block;
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.description-text {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

.popup-footer {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.03);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.view-photos-btn {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.view-photos-btn:active {
  transform: scale(0.98);
  background: #2563eb;
}
</style>
