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
                  <ion-input
                    v-model="newReportTitle"
                    placeholder="Titre du signalement"
                    label-placement="stacked"
                  />
                </ion-item>
              </div>

              <div class="modal-input-wrapper textarea-wrapper">
                <ion-icon :icon="documentTextOutline" class="input-icon" />
                <ion-item>
                  <ion-textarea
                    v-model="newReportDescription"
                    placeholder="Description détaillée..."
                    :rows="4"
                  />
                </ion-item>
              </div>

              <div class="modal-input-wrapper image-upload-wrapper">
                <input type="file" @change="onFileChange" accept="image/*" ref="fileInput" style="display: none" multiple />
                <ion-button fill="clear" @click="triggerFileInput">
                  <ion-icon slot="start" :icon="cameraIcon" />
                  Ajouter une image
                </ion-button>
                <div v-if="newReportImagePreviews.length > 0" class="image-previews-container">
                  <div v-for="(preview, index) in newReportImagePreviews" :key="index" class="image-preview">
                    <img :src="preview" />
                    <ion-button fill="clear" color="danger" @click="removeImage(index)" class="remove-image-btn">
                      <ion-icon slot="icon-only" :icon="closeIcon" />
                    </ion-button>
                  </div>
                </div>
              </div>
            </ion-list>
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
  IonInput,
  IonTextarea,
  IonSpinner,
  IonList,
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
  navigateOutline,
  camera as cameraIcon,
  closeCircleOutline as closeIcon,
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
    try {
      const promises = Array.from(target.files).map(file => imageToBase64(file));
      const base64Strings = await Promise.all(promises);
      newReportImagePreviews.value.push(...base64Strings.filter(s => s !== null) as string[]);
    } catch (e) {
      console.error('Error converting images to Base64:', e)
      error.value = 'Erreur lors du traitement des images.'
    }
  }
}

const removeImage = (index: number) => {
  newReportImagePreviews.value.splice(index, 1)
}

const handleCreateReport = async () => {
  if (!createLatLng.value) return

  console.log('Données du signalement:', {
    titre: newReportTitle.value,
    description: newReportDescription.value,
    lat: createLatLng.value.lat,
    lng: createLatLng.value.lng,
  })

  error.value = null
  loading.value = true
  try {
    await createReport({
      titre: newReportTitle.value.trim(),
      description: newReportDescription.value.trim(),
      latitude: createLatLng.value.lat,
      longitude: createLatLng.value.lng,
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
        if (!ctx) {
          return reject(new Error('Could not get canvas context'))
        }
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
  console.log('Initialisation de la carte...')
  
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
}

.overlay-container {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  padding: 0 16px;
  z-index: 1000;
  pointer-events: none;
}

.overlay-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  pointer-events: auto;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.user-icon {
  font-size: 40px;
  margin-right: 12px;
  color: var(--ion-color-primary);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.user-email {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.toggle-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: 8px;
}

.error-text {
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
}

.fab-locate {
  margin-bottom: 80px;
  margin-right: 16px;
}

.modal-content {
  border-radius: 16px 16px 0 0;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-handle {
  width: 40px;
  height: 4px;
  background: #ddd;
  border-radius: 2px;
  margin: 0 auto 16px;
}

.modal-coords {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.form-scroll-area {
  max-height: 60vh;
  overflow-y: auto;
}

.form-list {
  background: transparent;
}

.modal-input-wrapper {
  position: relative;
  margin-bottom: 16px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: var(--ion-color-primary);
}

.modal-input-wrapper ion-item {
  --padding-start: 48px;
  --background: #f8f9fa;
  border-radius: 8px;
}

.textarea-wrapper .input-icon {
  top: 24px;
  transform: none;
}

.textarea-wrapper ion-item {
  --padding-start: 48px;
  --padding-top: 12px;
}

.image-upload-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-previews-container {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  margin-top: 16px;
  padding-bottom: 8px; /* For scrollbar */
}

.image-preview {
  position: relative;
  flex-shrink: 0; /* Prevent images from shrinking */
}

.image-preview img {
  width: 150px; /* Fixed width for consistency */
  height: 150px; /* Fixed height for consistency */
  object-fit: cover; /* Crop image to fit */
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute;
  top: -10px;
  right: -10px;
}

.modal-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}

.modal-actions ion-button {
  flex: 1;
  margin: 0;
}

:deep(.report-marker-icon) {
  background: transparent;
  border: none;
}

:deep(.radar-container) {
  position: relative;
  width: 70px;
  height: 70px;
}

:deep(.radar-ping) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0;
  height: 0;
  border-radius: 50%;
  border: 2px solid var(--ion-color-primary);
  animation: ping 2s infinite linear;
}

:deep(.radar-ping.second) {
  animation-delay: 0.66s;
}

:deep(.radar-ping.third) {
  animation-delay: 1.33s;
}

:deep(.megaphone-marker) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(var(--ion-color-primary-rgb), 0.3);
}

:deep(.marker-inner) {
  width: 30px;
  height: 30px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.megaphone-icon) {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: var(--ion-color-primary);
  clip-path: polygon(0% 20%, 40% 20%, 40% 0%, 100% 50%, 40% 100%, 40% 80%, 0% 80%);
}

:deep(.location-marker-icon) {
  background: transparent;
  border: none;
}

:deep(.location-pulse) {
  position: relative;
  width: 60px;
  height: 60px;
}

:deep(.pulse-ring) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  animation: pulse 1.5s infinite;
}

:deep(.location-dot) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: var(--ion-color-primary);
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

@keyframes ping {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 70px;
    height: 70px;
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}
</style>