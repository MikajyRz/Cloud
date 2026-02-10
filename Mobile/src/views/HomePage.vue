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

            <!-- Image upload -->
            <div class="field-group">
              <label class="field-label">Photos</label>
              <div class="upload-buttons">
                <button class="upload-btn" @click="takePhoto">
                  <ion-icon :icon="cameraIcon" />
                  <span>Prendre une photo</span>
                </button>
                <button class="upload-btn" @click="selectPhoto">
                  <ion-icon :icon="images" />
                  <span>Sélectionner depuis la galerie</span>
                </button>
              </div>
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
  images,
} from 'ionicons/icons'
import { Geolocation } from '@capacitor/geolocation'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
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
    <div class="sparkle-container">
      <div class="sparkle-ping"></div>
      <div class="sparkle-ping second"></div>
      <div class="sparkle-ping third"></div>
      <div class="location-pin-marker">
        <div class="pin-inner">
          <div class="pin-dot"></div>
        </div>
      </div>
    </div>
  `,
  iconSize: [70, 70],
  iconAnchor: [35, 70],
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

const takePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    })
    if (image.base64String) {
      const base64 = `data:${image.format};base64,${image.base64String}`
      newReportImagePreviews.value.push(base64)
    }
  } catch (e) {
    console.error('Error taking photo:', e)
    error.value = 'Erreur lors de la prise de photo.'
  }
}

const selectPhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    })
    if (image.base64String) {
      const base64 = `data:${image.format};base64,${image.base64String}`
      newReportImagePreviews.value.push(base64)
    }
  } catch (e) {
    console.error('Error selecting photo:', e)
    error.value = 'Erreur lors de la sélection de photo.'
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
      imageUrls: newReportImagePreviews.value,  // Images en base64
    })
    isCreateOpen.value = false
  } catch (e) {
    console.error('Erreur lors de la création:', e)
    /* --- Modern Signalement App Design --- */
  } finally {
    loading.value = false
  }
}

watch(isCreateOpen, (isOpen) => {
  if (!isOpen) {
    newReportTitle.value = ''
    newReportDescription.value = ''
    newReportImagePreviews.value = []
    // Si tu veux reset l'input file, ajoute une ref sur l'input et déclare fileInput
    // Sinon, supprime cette ligne
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
    const surface = r.surfaceM2 != null ? `<div><b>Surface :</b> ${r.surfaceM2} m²</div>` : ''
    const budget = r.budget != null ? `<div><b>Budget :</b> ${r.budget} €</div>` : ''
    const entreprise = r.entreprise ? `<div><b>Entreprise :</b> ${escapeHtml(r.entreprise)}</div>` : ''
    const status = `<div><b>Statut :</b> ${escapeHtml(r.status)}</div>`
    let photosHtml = ''
    if (r.imageUrls && r.imageUrls.length > 0) {
      photosHtml = '<div style="margin-top:8px">'
        + r.imageUrls.map((url, idx) => `<a href='${url}' target='_blank' style='display:inline-block;margin-right:6px'><img src='${url}' alt='photo${idx+1}' style='width:48px;height:48px;border-radius:6px;border:1px solid #ccc;object-fit:cover'/></a>`).join('')
        + '</div>'
    }
    m.bindPopup(`${title}${desc}${surface}${budget}${entreprise}${status}${photosHtml}`)
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
  --background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  --border-width: 0;
  padding: 12px 0;
  box-shadow: 0 2px 16px rgba(0,0,0,0.1);
}
.toolbar-inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
}
.toolbar-left { display: flex; align-items: center; gap: 12px; }
.toolbar-logo {
  width: 42px; height: 42px; border-radius: 14px;
  background: linear-gradient(135deg, #ff5252, #ff7043);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 20px; font-weight: 800;
  box-shadow: 0 4px 12px rgba(255,82,82,0.3);
}
.toolbar-text { display: flex; flex-direction: column; }
.toolbar-title { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
.toolbar-sub { font-size: 12px; color: #cbd5e1; font-weight: 500; }
.toolbar-right { display: flex; align-items: center; gap: 6px; }

.icon-btn {
  width: 40px; height: 40px; border-radius: 12px; border: none;
  background: rgba(255,255,255,0.15); color: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer; position: relative;
  transition: all 0.2s; backdrop-filter: blur(8px);
}
.icon-btn:active { background: rgba(255,255,255,0.25); transform: scale(0.95); }

.notif-badge {
  position: absolute; top: -2px; right: -2px;
  background: #ff5252; color: white; font-size: 10px; font-weight: 800;
  min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px; border: 2px solid #1e293b;
}

/* ── Map ───────────────────────────────── */
.map { width: 100%; height: 100%; }

/* ── FAB ───────────────────────────────── */
.fab-locate { margin-bottom: 80px; margin-right: 16px; }
.fab-locate ion-fab-button {
  --background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  --color: #4f46e5; --border-radius: 16px;
  --box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 4px 12px rgba(79,70,229,0.1);
  width: 56px; height: 56px; border: 1px solid rgba(255,255,255,0.2);
  transition: all 0.3s ease;
}
.fab-locate ion-fab-button:active {
  --box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 2px 8px rgba(79,70,229,0.15);
  transform: scale(0.95);
}
.fab-locate ion-fab-button.tracking {
  --background: linear-gradient(135deg, #ff5252 0%, #ff7043 100%);
  --color: white;
}

.overlay-panel {
  position: absolute; top: 16px; left: 0; right: 0;
  padding: 0 16px; z-index: 1000; pointer-events: none;
}
.panel-card {
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-radius: 20px; padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  pointer-events: auto;
}

.user-row {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px; padding-bottom: 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.avatar-circle {
  width: 44px; height: 44px; border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 22px;
  box-shadow: 0 4px 12px rgba(79,70,229,0.25);
}
.user-meta { display: flex; flex-direction: column; }
.user-name { font-size: 14px; font-weight: 700; color: #1e293b; }
.user-role { font-size: 12px; color: #64748b; font-weight: 500; }

.filter-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.filter-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #475569; font-weight: 600;
}
.filter-label ion-icon { color: #4f46e5; font-size: 20px; }

.error-text {
  font-size: 14px; text-align: center; margin: 12px 0;
  padding: 12px; border-radius: 12px; background: rgba(239,68,68,0.1);
  color: #dc2626; font-weight: 500;
}

/* ── Stats Grid ────────────────────────── */
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 12px;
  padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.05);
}
.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px; padding: 16px 12px;
  text-align: center; border: 1px solid rgba(255,255,255,0.8);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-2px); }
.stat-card.accent {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid rgba(252,211,77,0.3);
}
.stat-number {
  display: block; font-size: 24px; font-weight: 900; color: #1e293b;
  margin-bottom: 4px; line-height: 1;
}
.stat-card.accent .stat-number { color: #92400e; }
.stat-label {
  display: block; font-size: 11px; color: #64748b; margin-top: 2px;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}

/* ── Modal Sheet ───────────────────────── */
.modal-sheet {
  padding: 24px 24px 28px;
  background: rgba(255,255,255,0.98); backdrop-filter: blur(24px);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -8px 32px rgba(0,0,0,0.15);
}
.sheet-handle {
  width: 48px; height: 6px; background: #e2e8f0; border-radius: 3px;
  margin: 0 auto 20px; opacity: 0.6;
}
.sheet-title {
  font-size: 22px; font-weight: 800; color: #1e293b;
  margin: 0 0 6px; text-align: center; letter-spacing: -0.5px;
}
.sheet-coords {
  font-size: 14px; color: #64748b; text-align: center;
  margin: 0 0 24px; font-weight: 500;
  padding: 8px 16px; background: rgba(79,70,229,0.05);
  border-radius: 12px; border: 1px solid rgba(79,70,229,0.1);
}

.form-scroll-area {
  max-height: calc(60vh - 80px); /* leave space for sticky actions */
  overflow-y: auto;
  padding: 0 4px;
}

.field-group { margin-bottom: 20px; }
.field-label {
  display: block; font-size: 14px; font-weight: 700; color: #374151;
  margin-bottom: 8px; letter-spacing: -0.2px;
}
.field-input {
  display: flex; align-items: center; gap: 12px;
  background: #f8fafc; border-radius: 16px; padding: 0 16px; height: 52px;
  border: 2px solid transparent; transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.field-input:focus-within {
  background: #ffffff; border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79,70,229,0.1), 0 4px 12px rgba(79,70,229,0.15);
}
.field-input.textarea {
  height: auto; padding: 12px 16px; align-items: flex-start;
  min-height: 80px;
}
.fi-icon {
  font-size: 20px; color: #9ca3af; flex-shrink: 0;
  transition: color 0.2s;
}
.field-input:focus-within .fi-icon { color: #4f46e5; }
.field-input ion-input, .field-input ion-textarea {
  --padding-start: 0; --padding-end: 0; --background: transparent;
  font-size: 16px; flex: 1; --color: #1e293b; --placeholder-color: #9ca3af;
  font-weight: 500;
}

.upload-buttons {
  display: flex; flex-direction: column; gap: 14px; width: 100%; margin-bottom: 16px;
}
.upload-btn {
  display: flex; align-items: center; gap: 12px; width: 100%;
  padding: 18px 20px; border-radius: 16px;
  border: 2px dashed #d1d5db; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  color: #4f46e5; font-size: 16px; font-weight: 700; cursor: pointer;
  transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-style: dashed;
}
.upload-btn:hover {
  border-color: #4f46e5; background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  transform: translateY(-1px); box-shadow: 0 4px 16px rgba(79,70,229,0.15);
}
.upload-btn:active { transform: translateY(0); }
.upload-btn ion-icon { font-size: 24px; }

.previews-row {
  display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;
}
.preview-thumb {
  position: relative; width: 80px; height: 80px; border-radius: 12px;
  overflow: hidden; border: 2px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.preview-thumb img {
  width: 100%; height: 100%; object-fit: cover;
}
.remove-thumb {
  position: absolute; top: -8px; right: -8px;
  width: 28px; height: 28px; border-radius: 50%;
  background: #ef4444; color: white; border: 2px solid white;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: all 0.2s;
}
.remove-thumb:active { transform: scale(0.9); }

.sheet-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.05);
  position: sticky;
  bottom: 0;
  left: 0;
  background: rgba(255,255,255,0.98);
  z-index: 10;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.04);
}
.sheet-actions ion-button {
  flex: 1;
  --border-radius: 16px;
  font-weight: 700;
  --padding-top: 14px;
  --padding-bottom: 14px;
  font-size: 16px;
  letter-spacing: -0.2px;
}

/* ── Map Markers (deep) ────────────────── */
:deep(.report-marker-icon) { background: transparent; border: none; }
:deep(.sparkle-container) { position: relative; width: 70px; height: 70px; }
:deep(.sparkle-ping) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 0; height: 0; border-radius: 50%;
  border: 2px solid #ff5252; animation: blink 1s infinite alternate, ping 2s infinite linear;
  box-shadow: 0 0 12px 4px #ff5252;
}

@keyframes blink {
  0% { opacity: 1; box-shadow: 0 0 12px 4px #ff5252; }
  100% { opacity: 0.3; box-shadow: 0 0 24px 8px #ff5252; }
}

:deep(.sparkle-ping.second) { animation-delay: 0.66s; }
:deep(.sparkle-ping.third) { animation-delay: 1.33s; }
:deep(.location-pin-marker) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 32px; height: 32px; background: #ffffff; border-radius: 50% 50% 50% 0;
  border: 3px solid #ff5252; transform: translate(-50%,-50%) rotate(-45deg);
  box-shadow: 0 2px 8px rgba(255,82,82,0.35);
}
:deep(.pin-inner) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(45deg);
  width: 20px; height: 20px; background: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
:deep(.pin-dot) {
  width: 8px; height: 8px; background: #ff5252; border-radius: 50%;
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