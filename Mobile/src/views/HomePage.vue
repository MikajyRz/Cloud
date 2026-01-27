<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="map" ref="mapEl" />

      <div class="overlay ion-padding">
        <ion-text v-if="userEmail">
          <p>Connecté en tant que: <strong>{{ userEmail }}</strong></p>
        </ion-text>

        <ion-item lines="none" class="overlay-item">
          <ion-toggle v-model="mineOnlyProxy">Mes signalements uniquement</ion-toggle>
        </ion-item>

        <ion-button expand="block" color="primary" :disabled="loading" @click="locateMe">
          Ma localisation
        </ion-button>

        <ion-text>
          <p>Signalements affichés: <strong>{{ reportsCount }}</strong></p>
        </ion-text>

        <ion-button expand="block" color="medium" :disabled="loading" @click="onLogout">
          Déconnexion
        </ion-button>

        <ion-text color="danger" v-if="error">
          <p>{{ error }}</p>
        </ion-text>
      </div>

      <ion-alert
        :is-open="isCreateOpen"
        header="Nouveau signalement"
        :message="createMessage"
        :inputs="createInputs"
        :buttons="createButtons"
        @didDismiss="isCreateOpen = false"
      />
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
  IonText,
  IonItem,
  IonToggle,
  IonAlert,
  onIonViewDidEnter,
} from '@ionic/vue'
import { Geolocation } from '@capacitor/geolocation'
import { useAuth } from '@/composables/useAuth'
import { useReports, type ReportDoc } from '@/composables/useReports'

const router = useRouter()
const { currentUser, logout } = useAuth()
const { createReport, subscribeReports } = useReports()

const mapEl = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let myMarker: L.Marker | null = null
let reportLayer: L.LayerGroup | null = null
let unsubReports: (() => void) | null = null

const loading = ref(false)
const error = ref<string | null>(null)

const mineOnly = ref(false)
const reports = ref<ReportDoc[]>([])

const isCreateOpen = ref(false)
const createLatLng = ref<L.LatLng | null>(null)

const userEmail = computed(() => currentUser.value?.email ?? null)
const reportsCount = computed(() => reports.value.length)

const createMessage = computed(() => {
  if (!createLatLng.value) return ''
  return `Lat: ${createLatLng.value.lat.toFixed(6)} | Lng: ${createLatLng.value.lng.toFixed(6)}`
})

const createInputs = computed(() => [
  {
    name: 'titre',
    type: 'text',
    placeholder: 'Titre',
  },
  {
    name: 'description',
    type: 'textarea',
    placeholder: 'Description',
  },
])

const createButtons = computed(() => [
  {
    text: 'Annuler',
    role: 'cancel',
  },
  {
    text: 'Enregistrer',
    role: 'confirm',
    handler: async (values: { titre?: string; description?: string }) => {
      if (!createLatLng.value) return
      error.value = null
      loading.value = true
      try {
        await createReport({
          titre: (values.titre ?? '').trim(),
          description: (values.description ?? '').trim(),
          latitude: createLatLng.value.lat,
          longitude: createLatLng.value.lng,
        })
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
      } finally {
        loading.value = false
        isCreateOpen.value = false
      }
    },
  },
])

onMounted(() => {
  if (!mapEl.value || map) return

  const tileUrl =
    (import.meta.env.VITE_MOBILE_TILE_URL as string | undefined) ??
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  map = L.map(mapEl.value, {
    zoomControl: true,
    attributionControl: true,
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

  unsubReports = subscribeReports({ mineOnly: mineOnly.value }, (rows) => {
    reports.value = rows
    renderReportMarkers()
  })
})

const renderReportMarkers = () => {
  if (!reportLayer) return
  reportLayer.clearLayers()

  reports.value.forEach((r) => {
    const m = L.marker([r.latitude, r.longitude])
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
  unsubReports = subscribeReports({ mineOnly: mineOnly.value }, (rows) => {
    reports.value = rows
    renderReportMarkers()
  })
}

const locateMe = async () => {
  error.value = null
  loading.value = true
  try {
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
    const latlng = L.latLng(pos.coords.latitude, pos.coords.longitude)

    if (map) {
      map.setView(latlng, Math.max(map.getZoom(), 15))
    }

    if (myMarker) {
      myMarker.setLatLng(latlng)
    } else if (map) {
      myMarker = L.marker(latlng)
      myMarker.addTo(map)
      myMarker.bindPopup('Ma position')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onIonViewDidEnter(() => {
  if (!map) return
  setTimeout(() => {
    map?.invalidateSize()
  }, 50)
})

onBeforeUnmount(() => {
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
  right: 0;
  bottom: 0;
}

.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
}

.overlay-item {
  --background: transparent;
  --color: #fff;
}
</style>
