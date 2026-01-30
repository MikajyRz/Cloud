<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Signalements à Tana</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="locateMe" :disabled="loading || !map">
            <ion-icon slot="icon-only" :icon="locateOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-no-padding">
      <!-- Carte Leaflet -->
      <div class="map-container" ref="mapEl">
        <div v-if="loading" class="map-overlay-loading">
          <ion-spinner name="crescent" color="primary" />
          <p>Chargement...</p>
        </div>
      </div>

      <!-- Contrôles flottants -->
      <div class="floating-controls">
        <!-- FAB principal : Nouveau signalement -->
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button color="primary" @click="openCreateAtMyLocation">
            <ion-icon :icon="addOutline" />
          </ion-fab-button>
        </ion-fab>

        <!-- FAB photo rapide -->
        <ion-fab vertical="bottom" horizontal="start" slot="fixed">
          <ion-fab-button color="light" @click="takePhotoAndCreate">
            <ion-icon :icon="cameraOutline" />
          </ion-fab-button>
        </ion-fab>

        <!-- Panneau de filtres (plus élégant) -->
        <ion-card class="filter-card">
          <ion-card-header>
            <ion-toolbar color="light">
              <ion-title size="small">Filtres</ion-title>
              <ion-buttons slot="end">
                <ion-button fill="clear" @click="panelExpanded = !panelExpanded">
                  <ion-icon :icon="panelExpanded ? chevronUpOutline : chevronDownOutline" />
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-card-header>

          <ion-card-content v-if="panelExpanded">
            <ion-list inset lines="none">
              <ion-item>
                <ion-toggle
                  v-model="mineOnlyProxy"
                  justify="space-between"
                  color="primary"
                  @ionChange="subscribeToReports()"
                >
                  Mes signalements seulement
                </ion-toggle>
              </ion-item>

              <ion-item>
                <ion-label>
                  <strong>{{ reportsCount }}</strong> signalement{{ reportsCount !== 1 ? 's' : '' }}
                </ion-label>
              </ion-item>

              <ion-item v-if="userEmail">
                <ion-label class="ion-text-wrap">
                  <small>Connecté : {{ userEmail }}</small>
                </ion-label>
              </ion-item>
            </ion-list>

            <div class="ion-padding-top">
              <ion-button
                expand="block"
                fill="outline"
                color="danger"
                size="small"
                @click="onLogout"
              >
                <ion-icon slot="start" :icon="logOutOutline" />
                Déconnexion
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Alert création signalement -->
      <ion-alert
        :is-open="isCreateOpen"
        header="Nouveau signalement"
        :sub-header="createMessage"
        :inputs="createInputs"
        :buttons="createButtons"
        @didDismiss="resetFormAndPhoto"
      />

      <!-- Toast erreurs -->
      <ion-toast
        :is-open="!!error"
        :message="error"
        color="danger"
        position="top"
        :duration="4000"
        @didDismiss="error = null"
      />

      <!-- Modal aperçu photo prise -->
      <ion-modal :is-open="!!photoPreviewUrl" @didDismiss="photoPreviewUrl = null">
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Aperçu photo</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="photoPreviewUrl = null">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <img v-if="photoPreviewUrl" :src="photoPreviewUrl" alt="Aperçu" class="preview-img" />
        </ion-content>
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonToggle, IonAlert, IonToast, IonCard, IonCardHeader, IonCardContent,
  IonList, IonItem, IonLabel, IonFab, IonFabButton, IonButtons, IonModal,
  IonSpinner
} from '@ionic/vue'
import {
  locateOutline, addOutline, cameraOutline, logOutOutline,
  chevronUpOutline, chevronDownOutline
} from 'ionicons/icons'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Geolocation } from '@capacitor/geolocation'
import { useReports } from '@/composables/useReports'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { createReport, subscribeReports } = useReports()

const mapEl = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let myMarker: L.Marker | null = null
let reportLayer: L.LayerGroup | null = null
let unsubReports: (() => void) | null = null

// États
const loading = ref(false)
const error = ref<string | null>(null)
const mineOnly = ref(false)
const reports = ref<any[]>([])
const panelExpanded = ref(true) // ouvert par défaut
const isCreateOpen = ref(false)
const createLatLng = ref<{ lat: number; lng: number } | null>(null)
const selectedPhotoBlob = ref<Blob | null>(null)
const selectedPhotoName = ref<string>('')
const photoPreviewUrl = ref<string | null>(null)

// Computed
const userEmail = computed(() => currentUser.value?.email ?? null)
const reportsCount = computed(() => reports.value.length)

const mineOnlyProxy = computed({
  get: () => mineOnly.value,
  set: (val: boolean) => {
    mineOnly.value = val
    subscribeToReports() // Recharge immédiatement quand on toggle
  }
})

// Initialisation de la carte
const initMap = () => {
  if (!mapEl.value || map) return

  map = L.map(mapEl.value, {
    zoomControl: false,
    attributionControl: false,
  }).setView([-18.8792, 47.5079], 13)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap & CartoDB',
  }).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  reportLayer = L.layerGroup().addTo(map)

  map.on('click', (e: L.LeafletMouseEvent) => {
    createLatLng.value = { lat: e.latlng.lat, lng: e.latlng.lng }
    isCreateOpen.value = true
  })

  subscribeToReports()
}

// Abonnement aux signalements (appelé au mount + sur toggle)
const subscribeToReports = () => {
  unsubReports?.()
  loading.value = true

  unsubReports = subscribeReports(
    { mineOnly: mineOnly.value },
    (rows) => {
      reports.value = rows
      updateMarkers()
      loading.value = false
    }
  )
}

// Mise à jour des marqueurs sur la carte
const updateMarkers = () => {
  if (!reportLayer || !map) return
  reportLayer.clearLayers()

  reports.value.forEach((report) => {
    const marker = L.marker([report.latitude, report.longitude], {
      icon: L.divIcon({
        html: '<div class="marker-pin"></div>',
        className: 'custom-marker',
        iconSize: [32, 44],
        iconAnchor: [16, 44],
      }),
    })

    const popup = `
      <div class="popup-content">
        <div class="popup-title">${escapeHtml(report.titre || 'Signalement')}</div>
        ${report.description ? `<div class="popup-desc">${escapeHtml(report.description)}</div>` : ''}
        ${report.userEmail ? `<div class="popup-user">Par ${escapeHtml(report.userEmail)}</div>` : ''}
        ${report.photoUrl ? `<img src="${report.photoUrl}" class="popup-photo" alt="Photo du signalement">` : ''}
        <div class="popup-coords">${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}</div>
      </div>
    `

    marker.bindPopup(popup, { maxWidth: 320, className: 'custom-popup' })
    marker.addTo(reportLayer)
  })
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

// Localisation actuelle
const locateMe = async () => {
  loading.value = true
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 })
    const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)

    map?.setView(latlng, 16, { animate: true })

    if (myMarker) myMarker.setLatLng(latlng)
    else {
      myMarker = L.marker(latlng, {
        icon: L.divIcon({
          html: '<div class="my-location-marker"><div class="pulse"></div><div class="dot"></div></div>',
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).addTo(map!).bindPopup('Vous êtes ici')
    }
  } catch (err: any) {
    error.value = 'Impossible de localiser. Vérifiez les permissions GPS.'
  } finally {
    loading.value = false
  }
}

// Ouvrir formulaire à position actuelle
const openCreateAtMyLocation = async () => {
  try {
    const pos = await Geolocation.getCurrentPosition({ timeout: 6000 })
    createLatLng.value = { lat: pos.coords.latitude, lng: pos.coords.longitude }
    isCreateOpen.value = true
  } catch {
    error.value = 'Localisation requise pour créer un signalement'
  }
}

// Prendre photo et créer signalement
const takePhotoAndCreate = async () => {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    })

    if (photo.webPath) {
      photoPreviewUrl.value = photo.webPath
      const response = await fetch(photo.webPath)
      selectedPhotoBlob.value = await response.blob()
      selectedPhotoName.value = `photo-${Date.now()}.jpg`
    }

    await openCreateAtMyLocation()
  } catch (err) {
    error.value = 'Échec de la prise de photo'
  }
}

// Reset après création
const resetFormAndPhoto = () => {
  isCreateOpen.value = false
  createLatLng.value = null
  selectedPhotoBlob.value = null
  selectedPhotoName.value = ''
  photoPreviewUrl.value = null
}

// Alert config
const createMessage = computed(() => {
  return createLatLng.value
    ? `Position : ${createLatLng.value.lat.toFixed(6)}, ${createLatLng.value.lng.toFixed(6)}`
    : ''
})

const createInputs = ref([
  {
    name: 'titre',
    type: 'text',
    placeholder: 'Titre du signalement',
    attributes: { required: true, maxlength: 80 }
  },
  {
    name: 'description',
    type: 'textarea',
    placeholder: 'Décrivez le problème...',
    attributes: { maxlength: 800, rows: 4 }
  },
  {
    name: 'categorie',
    type: 'select',
    placeholder: 'Catégorie',
    options: [
      { text: 'Déchets / Propreté', value: 'dechets' },
      { text: 'Route / Trottoir', value: 'route' },
      { text: 'Éclairage public', value: 'eclairage' },
      { text: 'Sécurité / Incivilité', value: 'securite' },
      { text: 'Eau / Assainissement', value: 'eau' },
      { text: 'Autres', value: 'autres' }
    ]
  },
  {
    name: 'urgence',
    type: 'select',
    placeholder: 'Niveau d\'urgence',
    options: [
      { text: 'Faible', value: 'faible' },
      { text: 'Moyen', value: 'moyen' },
      { text: 'Élevé', value: 'eleve' },
      { text: 'Très urgent', value: 'urgent' }
    ]
  },
  {
    name: 'adresse',
    type: 'text',
    placeholder: 'Adresse ou lieu précis (optionnel)'
  },
  {
    name: 'anonyme',
    type: 'toggle',
    label: 'Signaler anonymement'
  }
]);

const createButtons = computed(() => [
  { text: 'Annuler', role: 'cancel' },
  {
    text: 'Publier',
    handler: async (data) => {
      if (!data.titre?.trim()) {
        error.value = 'Le titre est obligatoire';
        return false;
      }

      try {
        await createReport({
          titre: data.titre.trim(),
          description: data.description?.trim() || '',
          categorie: data.categorie || 'autres',
          urgence: data.urgence || 'moyen',
          adresse: data.adresse?.trim() || null,
          anonyme: !!data.anonyme,
          latitude: createLatLng.value.lat,
          longitude: createLatLng.value.lng,
          photo: selectedPhotoBlob.value ?? undefined,
          photoName: selectedPhotoName.value || undefined,
        });
      } catch (err: any) {
        error.value = err.message || 'Erreur lors de l’enregistrement';
        return false;
      }
      return true;
    }
  }
]);

// Déconnexion
const onLogout = async () => {
  try {
    await logout()
    router.replace('/login')
  } catch {
    error.value = 'Erreur de déconnexion'
  }
}

// Cycle de vie
onMounted(() => {
  setTimeout(initMap, 300)
})

onBeforeUnmount(() => {
  unsubReports?.()
  map?.remove()
})
</script>

<style scoped>
.map-container {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.map-overlay-loading {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #3880ff;
}

.floating-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 100;
  pointer-events: none;
}

.filter-card {
  pointer-events: auto;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.preview-img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
</style>

<style>
/* Styles globaux pour marqueurs et popups */
.custom-marker .marker-pin {
  width: 32px;
  height: 32px;
  background: #3880ff;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.popup-content {
  padding: 12px;
  font-size: 14px;
}

.popup-title {
  font-weight: bold;
  color: #3880ff;
  margin-bottom: 8px;
}

.popup-desc {
  color: #444;
  margin-bottom: 8px;
}

.popup-user {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 6px;
}

.popup-photo {
  max-width: 100%;
  border-radius: 8px;
  margin-top: 8px;
}

.popup-coords {
  font-size: 0.8em;
  color: #888;
  margin-top: 8px;
}
</style>