<template>
  <ion-page>
    <!-- Top bar -->
    <ion-header class="ion-no-border home-header">
      <ion-toolbar>
        <div class="toolbar-inner">
          <div class="toolbar-left">
            <div class="toolbar-logo">
              <ion-icon :icon="constructOutline" />
            </div>
            <div class="toolbar-text">
              <span class="toolbar-title">Cloud S5</span>
              <span class="toolbar-sub" v-if="reportsCount > 0">{{ reportsCount }} signalement{{ reportsCount > 1 ? 's' : '' }}</span>
            </div>
          </div>
          <div class="toolbar-right">
            <button class="icon-btn notif-btn" @click="goToNotifications">
              <ion-icon :icon="notificationsOutline" />
              <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <button class="icon-btn" @click="onLogout" :disabled="loading">
              <ion-icon :icon="logOutOutline" />
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="map" ref="mapEl" />

      <!-- Locate FAB -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" class="fab-locate">
        <ion-fab-button @click="locateMe" :disabled="loading" :class="{ tracking: isTracking }">
          <ion-icon :icon="isTracking ? navigateOutline : locationOutline" />
        </ion-fab-button>
      </ion-fab>

      <!-- Overlay Panel -->
      <div class="overlay-panel">
        <div class="panel-card">
          <!-- User row -->
          <div class="user-row" v-if="userEmail">
            <div class="avatar-circle">
              <ion-icon :icon="personCircleOutline" />
            </div>
            <div class="user-meta">
              <span class="user-name">{{ userEmail }}</span>
              <span class="user-role">Utilisateur</span>
            </div>
          </div>

          <!-- Filter toggle -->
          <div class="filter-row">
            <div class="filter-label">
              <ion-icon :icon="filterOutline" />
              <span>Mes signalements uniquement</span>
            </div>
            <ion-toggle v-model="mineOnlyProxy" />
          </div>

          <ion-text color="danger" v-if="error" class="error-text">
            <p>{{ error }}</p>
          </ion-text>

          <!-- Stats grid -->
          <div class="stats-grid" v-if="reports.length > 0">
            <div class="stat-card">
              <span class="stat-number">{{ reports.length }}</span>
              <span class="stat-label">Points</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ totalSurface.toFixed(0) }}</span>
              <span class="stat-label">m² total</span>
            </div>
            <div class="stat-card accent">
              <span class="stat-number">{{ avancementPct }}%</span>
              <span class="stat-label">Avancement</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ totalBudget.toFixed(0) }}</span>
              <span class="stat-label">€ budget</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Report Modal -->
      <ion-modal :is-open="isCreateOpen" @didDismiss="isCreateOpen = false" :initial-breakpoint="0.55" :breakpoints="[0, 0.55, 0.85]">
        <div class="modal-sheet">
          <div class="sheet-handle"></div>
          <h2 class="sheet-title">Nouveau signalement</h2>
          <p class="sheet-coords" v-if="createLatLng">📍 {{ createLatLng.lat.toFixed(5) }}, {{ createLatLng.lng.toFixed(5) }}</p>

          <div class="form-scroll-area">
            <div class="field-group">
              <label class="field-label">Titre</label>
              <div class="field-input">
                <ion-icon :icon="createOutline" class="fi-icon" />
                <ion-input v-model="newReportTitle" placeholder="Ex: Nid-de-poule RN7" />
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Description</label>
              <div class="field-input textarea">
                <ion-icon :icon="documentTextOutline" class="fi-icon" />
                <ion-textarea v-model="newReportDescription" placeholder="Décrivez le problème..." :rows="3" />
              </div>
            </div>

            <div class="field-row">
              <div class="field-group half">
                <label class="field-label">Surface (m²)</label>
                <div class="field-input">
                  <ion-icon :icon="cubeOutline" class="fi-icon" />
                  <ion-input v-model="newReportSurface" type="number" placeholder="0" />
                </div>
              </div>
              <div class="field-group half">
                <label class="field-label">Budget (€)</label>
                <div class="field-input">
                  <ion-icon :icon="walletOutline" class="fi-icon" />
                  <ion-input v-model="newReportBudget" type="number" placeholder="0" />
                </div>
              </div>
            </div>

            <!-- Image upload -->
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

          <div class="sheet-actions">
            <ion-button fill="outline" color="medium" @click="isCreateOpen = false">Annuler</ion-button>
            <ion-button color="primary" :disabled="loading || !newReportTitle.trim()" @click="handleCreateReport">
              <ion-spinner v-if="loading" name="crescent" />
              <span v-else>Enregistrer</span>
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
  IonToggle,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSpinner,
  onIonViewDidEnter,
  onIonViewWillLeave,
} from '@ionic/vue'
import {
  logOutOutline,
  locationOutline,
  personCircleOutline,
  constructOutline,
  filterOutline,
  createOutline,
  documentTextOutline,
  navigateOutline,
  notificationsOutline,
  camera as cameraIcon,
  closeCircleOutline as closeIcon,
  cubeOutline,
  walletOutline,
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

const mineOnly = ref(true)
const reports = ref<ReportDoc[]>([])
const isCreateOpen = ref(false)
const createLatLng = ref<L.LatLng | null>(null)
const newReportTitle = ref('')
const newReportDescription = ref('')
const newReportSurface = ref<number | null>(null)
const newReportBudget = ref<number | null>(null)
const newReportFiles = ref<File[]>([])
const newReportImagePreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

const userEmail = computed(() => currentUser.value?.email ?? null)
const reportsCount = computed(() => reports.value.length)

// Tableau récapitulatif
const totalSurface = computed(() => 
  reports.value.reduce((acc, r) => acc + (Number((r as any).surfaceM2) || 0), 0)
)
const totalBudget = computed(() => 
  reports.value.reduce((acc, r) => acc + (Number((r as any).budget) || 0), 0)
)
const avancementPct = computed(() => {
  const total = reports.value.length
  if (total === 0) return 0
  const score = reports.value.reduce((acc, r) => {
    const s = r.status ?? 'NOUVEAU'
    if (s === 'TERMINE') return acc + 100
    if (s === 'EN_COURS') return acc + 50
    return acc
  }, 0)
  return Math.round(score / total)
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const filesArray = Array.from(target.files)
    newReportFiles.value.push(...filesArray)

    // Generate previews
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

  console.log('Données du signalement:', {
    titre: newReportTitle.value,
    description: newReportDescription.value,
    lat: createLatLng.value.lat,
    lng: createLatLng.value.lng,
    surfaceM2: newReportSurface.value,
    budget: newReportBudget.value,
    imageUrls: newReportImagePreviews.value,
    imageUrlsLength: newReportImagePreviews.value.length,
  })

  error.value = null
  loading.value = true
  try {
    await createReport({
      titre: newReportTitle.value.trim(),
      description: newReportDescription.value.trim(),
      latitude: createLatLng.value.lat,
      longitude: createLatLng.value.lng,
      surfaceM2: newReportSurface.value,
      budget: newReportBudget.value,
      imageUrls: newReportImagePreviews.value,  // Images en base64
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
    newReportSurface.value = null
    newReportBudget.value = null
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

  // Tuiles OpenStreetMap en ligne
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

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
        console.log('📍 Signalements reçus:', rows.length, 'mineOnly:', mineOnly.value)
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
  
  console.log('🗺️ Rendering', reports.value.length, 'marqueurs sur la carte')

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

// Quand on revient sur la page (Ionic cache les pages)
onIonViewDidEnter(() => {
  console.log('🏠 HomePage - onIonViewDidEnter, reports:', reports.value.length, 'user:', currentUser.value?.email)
  
  if (!map) return
  
  // Rafraîchir la taille de la carte
  setTimeout(() => {
    map?.invalidateSize()
  }, 50)
  
  // Si on a perdu les signalements (0 marqueurs mais utilisateur connecté), réabonner
  if (reports.value.length === 0 && currentUser.value) {
    console.log('🔄 Réabonnement aux signalements car liste vide...')
    resubscribeReports()
  } else {
    // Re-render les marqueurs au cas où les données ont changé
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
/* ── Toolbar ───────────────────────────── */
.home-header ion-toolbar {
  --background: #0f172a;
  --border-width: 0;
  padding: 8px 0;
}
.toolbar-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px;
}
.toolbar-left { display: flex; align-items: center; gap: 10px; }
.toolbar-logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 18px;
}
.toolbar-text { display: flex; flex-direction: column; }
.toolbar-title { font-size: 17px; font-weight: 700; color: #f8fafc; }
.toolbar-sub { font-size: 11px; color: #94a3b8; }
.toolbar-right { display: flex; align-items: center; gap: 4px; }

.icon-btn {
  width: 38px; height: 38px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.1); color: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer; position: relative;
  transition: background 0.2s;
}
.icon-btn:active { background: rgba(255,255,255,0.2); }

.notif-badge {
  position: absolute; top: 2px; right: 2px;
  background: #ef4444; color: white; font-size: 9px; font-weight: 800;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2px solid #0f172a;
}

/* ── Map ───────────────────────────────── */
.map { width: 100%; height: 100%; }

/* ── FAB ───────────────────────────────── */
.fab-locate { margin-bottom: 80px; margin-right: 8px; }
.fab-locate ion-fab-button {
  --background: #ffffff; --color: #334155;
  --box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}
.fab-locate ion-fab-button.tracking {
  --background: #4f46e5; --color: white;
}

/* ── Overlay Panel ─────────────────────── */
.overlay-panel {
  position: absolute; top: 12px; left: 0; right: 0;
  padding: 0 12px; z-index: 1000; pointer-events: none;
}
.panel-card {
  background: rgba(255,255,255,0.96); backdrop-filter: blur(16px);
  border-radius: 16px; padding: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  pointer-events: auto;
}

.user-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px; padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}
.avatar-circle {
  width: 40px; height: 40px; border-radius: 12px;
  background: linear-gradient(135deg, #4f46e5, #818cf8);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 24px;
}
.user-meta { display: flex; flex-direction: column; }
.user-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.user-role { font-size: 11px; color: #94a3b8; }

.filter-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.filter-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #475569; font-weight: 500;
}
.filter-label ion-icon { color: #4f46e5; font-size: 18px; }

.error-text { font-size: 13px; text-align: center; margin: 8px 0; }

/* ── Stats Grid ────────────────────────── */
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  padding-top: 12px; border-top: 1px solid #f1f5f9;
}
.stat-card {
  background: #f8fafc; border-radius: 12px; padding: 12px 10px;
  text-align: center;
}
.stat-card.accent { background: #eef2ff; }
.stat-number { display: block; font-size: 20px; font-weight: 800; color: #0f172a; }
.stat-card.accent .stat-number { color: #4f46e5; }
.stat-label { display: block; font-size: 11px; color: #94a3b8; margin-top: 2px; }

/* ── Modal Sheet ───────────────────────── */
.modal-sheet { padding: 20px 20px 24px; }
.sheet-handle {
  width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px;
  margin: 0 auto 16px;
}
.sheet-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 4px; text-align: center; }
.sheet-coords { font-size: 12px; color: #94a3b8; text-align: center; margin: 0 0 20px; }

.form-scroll-area { max-height: 55vh; overflow-y: auto; }

.field-group { margin-bottom: 16px; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.field-input {
  display: flex; align-items: center; gap: 8px;
  background: #f1f5f9; border-radius: 12px; padding: 0 14px; height: 48px;
  border: 2px solid transparent; transition: all 0.2s;
}
.field-input:focus-within { background: #fff; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
.field-input.textarea { height: auto; padding: 10px 14px; align-items: flex-start; }
.fi-icon { font-size: 18px; color: #94a3b8; flex-shrink: 0; }
.field-input:focus-within .fi-icon { color: #4f46e5; }
.field-input ion-input, .field-input ion-textarea {
  --padding-start: 0; --padding-end: 0; --background: transparent;
  font-size: 14px; flex: 1; --color: #0f172a;
}
.field-row { display: flex; gap: 10px; }
.field-group.half { flex: 1; }

.upload-btn {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 12px 16px; border-radius: 12px; border: 2px dashed #cbd5e1;
  background: #f8fafc; color: #4f46e5; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.upload-btn:active { border-color: #4f46e5; background: #eef2ff; }
.upload-btn ion-icon { font-size: 20px; }

.previews-row { display: flex; gap: 8px; overflow-x: auto; margin-top: 10px; padding-bottom: 4px; }
.preview-thumb { position: relative; flex-shrink: 0; }
.preview-thumb img { width: 80px; height: 80px; object-fit: cover; border-radius: 10px; }
.remove-thumb {
  position: absolute; top: -6px; right: -6px;
  width: 22px; height: 22px; border-radius: 50%;
  background: #ef4444; color: white; border: 2px solid white;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; cursor: pointer;
}

.sheet-actions { display: flex; gap: 10px; margin-top: 20px; }
.sheet-actions ion-button { flex: 1; --border-radius: 12px; font-weight: 600; }

/* ── Map Markers (deep) ────────────────── */
:deep(.report-marker-icon) { background: transparent; border: none; }
:deep(.radar-container) { position: relative; width: 70px; height: 70px; }
:deep(.radar-ping) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 0; height: 0; border-radius: 50%;
  border: 2px solid #4f46e5; animation: ping 2s infinite linear;
}
:deep(.radar-ping.second) { animation-delay: 0.66s; }
:deep(.radar-ping.third) { animation-delay: 1.33s; }
:deep(.megaphone-marker) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 40px; height: 40px; background: #4f46e5; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(79,70,229,0.35);
}
:deep(.marker-inner) {
  width: 30px; height: 30px; background: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
:deep(.megaphone-icon) {
  display: inline-block; width: 16px; height: 16px; background: #4f46e5;
  clip-path: polygon(0% 20%, 40% 20%, 40% 0%, 100% 50%, 40% 100%, 40% 80%, 0% 80%);
}

:deep(.location-marker-icon) { background: transparent; border: none; }
:deep(.location-pulse) { position: relative; width: 60px; height: 60px; }
:deep(.pulse-ring) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(79,70,229,0.2); animation: pulse 1.5s infinite;
}
:deep(.location-dot) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 20px; height: 20px; background: #4f46e5; border-radius: 50%;
  border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

@keyframes ping {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 70px; height: 70px; opacity: 0; }
}
@keyframes pulse {
  0% { transform: translate(-50%,-50%) scale(0.8); opacity: 1; }
  100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
}
</style>