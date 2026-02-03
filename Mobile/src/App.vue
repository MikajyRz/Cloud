<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { useNotifications } from '@/composables/useNotifications';

onMounted(() => {
  const { init } = useNotifications();
  init();
});
</script>
