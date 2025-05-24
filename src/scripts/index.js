import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';
import App from './pages/app';
import routes from './routes/routes';
import { getActiveRoute } from './routes/url-parser';
import { checkAuthState, getAuthToken } from './utils/auth';
import { registerServiceWorker, subscribeToPushNotification } from './utils/notification';
import { initIndexedDB, createOfflineIndicator } from './utils/index.js';

const app = new App({
  navigationDrawer: document.getElementById('navigation-drawer'),
  drawerButton: document.getElementById('drawer-button'),
  content: document.getElementById('main-content'),
});

async function initializePushNotification() {
  const token = getAuthToken();
  if (token) {
    const hasSubscribed = localStorage.getItem('push_subscription_active');
    if (!hasSubscribed) {
      setTimeout(async () => {
        try {
          await subscribeToPushNotification();
        } catch (error) {
          console.error('Auto-subscribe push notification gagal:', error);
        }
      }, 2000); 
    }
  }
}

window.addEventListener('hashchange', () => {
  checkAuthState();
  app.renderPage();
});

window.addEventListener('load', async () => {
  checkAuthState();
  app.renderPage();
  
  await initializePushNotification();
});

window.addEventListener('online', () => {
  console.log('Aplikasi kembali online');
  initializePushNotification();
});

window.addEventListener('offline', () => {
  console.log('Aplikasi sedang offline');
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      console.log('Notification clicked:', event.data);

      if (event.data.storyId) {
        window.location.hash = `#/story-detail/${event.data.storyId}`;
      } else if (event.data.url) {
        window.location.hash = event.data.url;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  import('./utils/notification-toggle.js').then(({ initNotificationToggle }) => {
    setTimeout(() => {
      initNotificationToggle();
    }, 100);
  }).catch(error => {
    console.error('Error loading notification toggle:', error);
  });
});

initIndexedDB();
createOfflineIndicator();