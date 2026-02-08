<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-page-content">
      <div class="background-decor">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo-circle">
              <ion-icon :icon="mapOutline" />
            </div>
            <h1>Welcome back</h1>
            <p>Please enter your details to sign in</p>
          </div>

          <div class="social-login-container">
            <div class="social-box">
              <ion-icon :icon="logoApple" />
            </div>
            <div class="social-box">
              <ion-icon :icon="logoGoogle" />
            </div>
            <div class="social-box">
              <ion-icon :icon="logoFacebook" />
            </div>
          </div>

          <div class="divider">
            <div class="line"></div>
            <span>or</span>
            <div class="line"></div>
          </div>

          <div class="login-form">
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
                  autocomplete="current-password"
                />
                <ion-button slot="end" fill="clear" @click="showPassword = !showPassword" class="eye-button">
                  <ion-icon slot="icon-only" :icon="showPassword ? eyeOffOutline : eyeOutline" />
                </ion-button>
              </ion-item>
            </div>

            <div class="options-row">
              <ion-item lines="none" class="remember-me">
                <ion-checkbox slot="start" v-model="rememberMe"></ion-checkbox>
                <ion-label>Remember me</ion-label>
              </ion-item>
              <ion-button fill="clear" size="small" class="forgot-btn">Forgot password?</ion-button>
            </div>

            <ion-button expand="block" class="login-btn" :disabled="loading" @click="onLogin">
              <ion-spinner v-if="loading" name="crescent" />
              <span v-else>Se connecter</span>
            </ion-button>

            <div class="register-link">
              Contactez votre manager pour obtenir un compte.
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
  IonCheckbox,
  IonLabel,
  IonAlert,
} from '@ionic/vue'
import {
    mailOutline,
    lockClosedOutline,
    mapOutline,
    logoApple,
  logoGoogle,
  logoFacebook,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)
const rememberMe = ref(false)

const onLogin = async () => {
  if (!email.value || !password.value) {
    error.value = "Veuillez remplir tous les champs"
    return
  }
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

<style scoped>
.login-page-content {
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

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 20px;
}

.login-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
}

.login-header {
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

.login-header p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.social-login-container {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.social-box {
  width: 50px;
  height: 50px;
  border: 1px solid #eee;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
  transition: all 0.2s;
}

.social-box:active {
  background: #f5f5f5;
  transform: scale(0.95);
}

.divider {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  color: #999;
  font-size: 14px;
}

.line {
  flex: 1;
  height: 1px;
  background: #eee;
}

.divider span {
  padding: 0 12px;
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

.options-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.remember-me {
  --padding-start: 0;
  font-size: 14px;
  color: #666;
}

.remember-me ion-checkbox {
  --size: 18px;
  --border-radius: 4px;
  margin-right: 8px;
}

.forgot-btn {
  --padding-start: 0;
  --padding-end: 0;
  font-size: 14px;
  color: #3b82f6;
  text-transform: none;
}

.login-btn {
  --border-radius: 12px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  margin-bottom: 24px;
  font-weight: 600;
  font-size: 16px;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #666;
}

.register-link a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}
</style>
