import CONFIG from '../config';
import StoryApi from '../data/api';
import { getAuthToken } from './auth';

export function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast error';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

export function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Browser tidak mendukung push notification');
    return false;
  }

  let permission = Notification.permission;
  
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission === 'granted') {
    console.log('Permission untuk notifikasi diberikan');
    return true;
  } else {
    console.warn('Permission untuk notifikasi ditolak');
    showErrorToast('Permission untuk notifikasi diperlukan untuk mendapatkan update terbaru');
    return false;
  }
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker tidak didukung browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('Service Worker berhasil didaftarkan:', registration);
    return registration;
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
    return null;
  }
}

export async function subscribeToPushNotification() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('User belum login, tidak bisa subscribe push notification');
      return false;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      showErrorToast('Gagal mendaftarkan Service Worker');
      return false;
    }

    await navigator.serviceWorker.ready;

    const vapidPublicKey = urlB64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });

    console.log('Push subscription berhasil:', subscription);

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      }
    };

    await StoryApi.subscribePushNotification(subscriptionData, token);
    
    showSuccessToast('Berhasil mengaktifkan push notification');

    localStorage.setItem('push_subscription_active', 'true');
    
    return true;
  } catch (error) {
    console.error('Error subscribing to push notification:', error);
    showErrorToast('Gagal mengaktifkan push notification: ' + error.message);
    return false;
  }
}

export async function unsubscribeFromPushNotification() {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('User belum login');
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('Service Worker tidak ditemukan');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      console.warn('Tidak ada subscription aktif');
      return false;
    }

    await subscription.unsubscribe();

    await StoryApi.unsubscribePushNotification({
      endpoint: subscription.endpoint
    }, token);

    showSuccessToast('Berhasil menonaktifkan push notification');

    localStorage.removeItem('push_subscription_active');
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notification:', error);
    showErrorToast('Gagal menonaktifkan push notification: ' + error.message);
    return false;
  }
}

export function isPushNotificationActive() {
  return localStorage.getItem('push_subscription_active') === 'true';
}

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}