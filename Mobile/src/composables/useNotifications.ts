import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from './useAuth'

const { currentUser } = useAuth()

export function useNotifications() {
  const isRegistered = ref(false)

  const register = async () => {
    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('Push notifications not available')
      return
    }

    let permStatus = await PushNotifications.checkPermissions()

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('User denied permissions!')
    }

    await PushNotifications.register()
    isRegistered.value = true
  }

  const addListeners = () => {
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Registration token: ', token.value)
      if (currentUser.value) {
        const tokenRef = doc(db, 'fcm_tokens', currentUser.value.uid)
        await setDoc(tokenRef, {
          token: token.value,
          createdAt: serverTimestamp(),
        })
      }
    })

    PushNotifications.addListener('registrationError', (err: any) => {
      console.error('Registration error: ', err.error)
    })

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification)
        // Here you can handle the notification, e.g., show an alert
      },
    )

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification.actionId, notification.inputValue)
        // Here you can handle the action, e.g., navigate to a specific page
      },
    )
  }

  const init = async () => {
    if (Capacitor.getPlatform() === 'web') return
    await register()
    addListeners()
  }

  return {
    init,
    isRegistered,
  }
}
