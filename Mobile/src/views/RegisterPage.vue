<template>
  <ion-page>
    <ion-content :fullscreen="true" class="register-page-content">
      <div class="background-decor">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <div class="register-container">
        <div class="register-card">
          <div class="register-header">
            <div class="logo-circle">
              <ion-icon :icon="mapOutline" />
            </div>
            <h1>Créer un compte</h1>
            <p>Rejoignez-nous pour signaler des incidents</p>
          </div>

          <div class="register-form">
            <div class="input-wrapper">
              <ion-icon :icon="mailOutline" class="input-icon" />
              <ion-item lines="none">
                <ion-input v-model="email" type="email" placeholder="Email" autocomplete="email" />
              </ion-item>
            </div>

            <div class="input-wrapper">
              <ion-icon :icon="lockClosedOutline" class="input-icon" />
              <ion-item lines="none">
                <ion-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mot de passe"
                  autocomplete="new-password"
                />
                <ion-button slot="end" fill="clear" @click="showPassword = !showPassword" class="eye-button">
                  <ion-icon slot="icon-only" :icon="showPassword ? eyeOffOutline : eyeOutline" />
                </ion-button>
              </ion-item>
            </div>

            <ion-button expand="block" class="register-btn" :disabled="loading" @click="onRegister">
              <ion-spinner v-if="loading" name="crescent" />
              <span v-else>S'inscrire</span>
            </ion-button>

            <div class="login-link">
              Déjà un compte ? <router-link to="/login">Se connecter</router-link>
            </div>
          </div>
        </div>
      </div>

      <ion-alert
        :is-open="!!error"
        header="Erreur"
        :message="error || ''"
        :buttons="['OK']"
        @didDismiss="error = null"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  IonAlert,
} from '@ionic/vue'
import {
    mailOutline,
    lockClosedOutline,
    mapOutline,
    eyeOutline,
    eyeOffOutline,
  } from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { register } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const onRegister = async () => {
  if (!email.value || !password.value) {
    error.value = "Veuillez remplir tous les champs"
    return
  }
  error.value = null
  loading.value = true
  try {
    await register(email.value.trim(), password.value)
    await router.replace('/home')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page-content {
  --background: #f4f7f6;
  position: relative;
}

.background-decor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background: #3b82f6;
  top: -100px;
  right: -50px;
}

.circle-2 {
  width: 250px;
  height: 250px;
  background: #60a5fa;
  bottom: -50px;
  left: -50px;
}

.register-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
}

.register-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-circle {
  width: 64px;
  height: 64px;
  background: #3b82f6;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  font-size: 32px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.register-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.input-wrapper {
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  background: white;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-icon {
  font-size: 20px;
  color: #999;
}

ion-item {
  --background: transparent;
  --padding-start: 12px;
  --inner-padding-end: 0;
  width: 100%;
}

ion-input {
  --padding-start: 0;
  font-size: 15px;
}

.eye-button {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
  color: #999;
}

.register-btn {
  --border-radius: 12px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  margin-top: 24px;
  margin-bottom: 24px;
  font-weight: 600;
  font-size: 16px;
}

.login-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.login-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}
</style>
