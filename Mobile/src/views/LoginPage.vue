<template>
  <ion-page>
    <ion-content :fullscreen="true" class="login-content">
      <!-- Gradient background -->
      <div class="bg-gradient">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
        <div class="bg-shape bg-shape-3"></div>
      </div>

      <div class="login-wrapper">
        <!-- Logo + Branding -->
        <div class="brand-section">
          <div class="logo-container">
            <div class="logo-icon">
              <ion-icon :icon="constructOutline" />
            </div>
          </div>
          <h1 class="brand-title">Cloud S5</h1>
          <p class="brand-subtitle">Gestion des routes — Antananarivo</p>
        </div>

        <!-- Login Card -->
        <div class="login-card">
          <h2 class="card-title">Connexion</h2>
          <p class="card-desc">Entrez vos identifiants pour continuer</p>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-field" :class="{ focused: emailFocused }">
              <ion-icon :icon="mailOutline" class="field-icon" />
              <ion-input
                v-model="email"
                type="email"
                placeholder="votre@email.com"
                autocomplete="email"
                @ionFocus="emailFocused = true"
                @ionBlur="emailFocused = false"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mot de passe</label>
            <div class="input-field" :class="{ focused: passwordFocused }">
              <ion-icon :icon="lockClosedOutline" class="field-icon" />
              <ion-input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                @ionFocus="passwordFocused = true"
                @ionBlur="passwordFocused = false"
              />
              <button class="toggle-pw" @click="showPassword = !showPassword">
                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" />
              </button>
            </div>
          </div>

          <ion-button expand="block" class="login-btn" :disabled="loading" @click="onLogin">
            <ion-spinner v-if="loading" name="crescent" />
            <span v-else>Se connecter</span>
          </ion-button>

          <p class="help-text">
            Contactez votre manager pour obtenir un compte.
          </p>
        </div>

        <p class="footer-text">Cloud S5 © 2026 — Projet Madagascar</p>
      </div>

      <ion-alert
        :is-open="!!error"
        header="Erreur de connexion"
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
  IonPage, IonContent, IonInput, IonButton, IonIcon, IonSpinner, IonAlert,
} from '@ionic/vue'
import {
  mailOutline, lockClosedOutline, constructOutline, eyeOutline, eyeOffOutline,
} from 'ionicons/icons'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)
const emailFocused = ref(false)
const passwordFocused = ref(false)

const onLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs'
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
.login-content {
  --background: #0f172a;
}

.bg-gradient {
  position: absolute; inset: 0; overflow: hidden; z-index: 0;
}

.bg-shape {
  position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35;
}
.bg-shape-1 { width: 350px; height: 350px; background: #4f46e5; top: -80px; right: -60px; }
.bg-shape-2 { width: 280px; height: 280px; background: #0d9488; bottom: 10%; left: -60px; }
.bg-shape-3 { width: 200px; height: 200px; background: #6366f1; top: 40%; left: 50%; }

.login-wrapper {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100%; padding: 24px 20px;
}

/* Brand */
.brand-section { text-align: center; margin-bottom: 32px; }

.logo-container { margin-bottom: 16px; }
.logo-icon {
  width: 72px; height: 72px; margin: 0 auto;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  border-radius: 20px; display: flex; align-items: center; justify-content: center;
  font-size: 36px; color: white;
  box-shadow: 0 8px 32px rgba(79, 70, 229, 0.4);
}

.brand-title {
  font-size: 28px; font-weight: 800; color: #f8fafc; margin: 0 0 4px;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 14px; color: #94a3b8; margin: 0; font-weight: 400;
}

/* Card */
.login-card {
  width: 100%; max-width: 400px;
  background: rgba(255, 255, 255, 0.97); backdrop-filter: blur(20px);
  padding: 32px 24px; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.card-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
.card-desc { font-size: 14px; color: #64748b; margin: 0 0 28px; }

/* Form */
.form-group { margin-bottom: 20px; }
.form-label {
  display: block; font-size: 13px; font-weight: 600; color: #334155;
  margin-bottom: 8px; letter-spacing: 0.02em;
}

.input-field {
  display: flex; align-items: center; gap: 10px;
  background: #f1f5f9; border: 2px solid transparent; border-radius: 12px;
  padding: 0 16px; height: 52px; transition: all 0.25s ease;
}
.input-field.focused {
  background: #fff; border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.field-icon { font-size: 20px; color: #94a3b8; flex-shrink: 0; }
.input-field.focused .field-icon { color: #4f46e5; }

.input-field ion-input {
  --padding-start: 0; --padding-end: 0; --background: transparent;
  font-size: 15px; flex: 1; --color: #0f172a;
}

.toggle-pw {
  background: none; border: none; padding: 4px; cursor: pointer;
  color: #94a3b8; font-size: 20px; display: flex; align-items: center;
}

/* Button */
.login-btn {
  --background: #4f46e5; --background-hover: #4338ca;
  --border-radius: 12px; --padding-top: 16px; --padding-bottom: 16px;
  margin-top: 28px; font-weight: 700; font-size: 16px;
  --box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.help-text {
  text-align: center; font-size: 13px; color: #94a3b8; margin: 20px 0 0;
}

.footer-text {
  text-align: center; font-size: 12px; color: #475569; margin-top: 32px;
}
</style>
