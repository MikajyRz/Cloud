<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Connexion</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-list inset>
        <ion-item>
          <ion-input v-model="email" type="email" label="Email" label-placement="stacked" autocomplete="email" />
        </ion-item>
        <ion-item>
          <ion-input v-model="password" type="password" label="Mot de passe" label-placement="stacked" autocomplete="current-password" />
        </ion-item>
      </ion-list>

      <ion-button expand="block" :disabled="loading" @click="onLogin">Se connecter</ion-button>
      <ion-button expand="block" fill="clear" router-link="/register">Créer un compte</ion-button>

      <ion-text color="danger" v-if="error">
        <p>{{ error }}</p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
} from '@ionic/vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const onLogin = async () => {
  error.value = null
  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    await router.replace('/home')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>
