const CACHE_NAME = 'StoryApp-V1';
const STATIC_CACHE = 'StoryApp-Static-V1';
const DYNAMIC_CACHE = 'StoryApp-Dynamic-V1';

const staticUrlsToCache = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/scripts/index.js',
  '/scripts/pages/app.js',
  '/scripts/routes/routes.js',
  '/scripts/routes/url-parser.js',
  '/scripts/utils/index.js',
  '/scripts/utils/auth.js',
  '/scripts/config.js',
  '/scripts/templates.js',
  '/public/images/logo.png',
  '/public/favicon.png',
  '/public/images/jumbotron.jpg',
  '/public/manifest.json',

  '/scripts/pages/home/home-page.js',
  '/scripts/pages/home/home-presenter.js',
  '/scripts/pages/auth/login/login-page.js',
  '/scripts/pages/auth/login/login-presenter.js',
  '/scripts/pages/auth/register/register-page.js',
  '/scripts/pages/auth/register/register-presenter.js',
  '/scripts/pages/new/new-page.js',
  '/scripts/pages/new/new-presenter.js',
  '/scripts/pages/story-detail/story-detail-page.js',
  '/scripts/pages/story-detail/story-detail-presenter.js',
  '/scripts/pages/about/about-page.js',
  '/scripts/utils/camera.js',
  '/scripts/utils/map.js',
  '/scripts/utils/notification.js',
  '/scripts/utils/notification-toggle.js',
  '/scripts/data/api.js',
  '/scripts/data/api-mapper.js'
];

const dynamicUrlsPattern = [
  /^https:\/\/story-api\.dicoding\.dev\/v1\/stories/,
  /^https:\/\/story-api\.dicoding\.dev\/v1\/users/,
  /\.(?:png|gif|jpg|jpeg|svg|webp)$/,
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files (Application Shell)');
        return cache.addAll(staticUrlsToCache);
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Dynamic cache initialized');
        return cache;
      })
    ]).then(() => {
      console.log('Service Worker: Installed successfully');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('Service Worker: Installation failed', error);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    }).catch((error) => {
      console.error('Service Worker: Activation failed', error);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== location.origin && !url.origin.includes('story-api.dicoding.dev')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        console.log('Service Worker: Serving from cache', request.url);
        return response;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();

        let cacheToUse = DYNAMIC_CACHE;

        if (staticUrlsToCache.includes(url.pathname)) {
          cacheToUse = STATIC_CACHE;
        }

        const shouldCache = dynamicUrlsPattern.some(pattern => {
          if (pattern instanceof RegExp) {
            return pattern.test(request.url);
          }
          return request.url.includes(pattern);
        });

        if (shouldCache || staticUrlsToCache.includes(url.pathname)) {
          caches.open(cacheToUse).then((cache) => {
            console.log('Service Worker: Caching new resource', request.url);
            cache.put(request, responseToCache);
          });
        }

        return response;
      }).catch((error) => {
        console.log('Service Worker: Fetch failed, serving offline content', error);

        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        // Return offline image for image requests
        if (request.destination === 'image') {
          return caches.match('/public/images/logo.png');
        }

        return caches.match(request);
      });
    })
  );
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  let notificationData = {
    title: 'Story App',
    body: 'Ada update baru untuk Anda!',
    icon: '/public/images/logo.png',
    badge: '/public/favicon.png',
    tag: 'story-notification',
    data: {
      url: '/',
      storyId: null
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      
      notificationData = {
        title: payload.title || 'Story App',
        body: payload.body || 'Ada update baru untuk Anda!',
        icon: payload.icon || '/public/images/logo.png',
        badge: payload.badge || '/public/favicon.png',
        tag: payload.tag || 'story-notification',
        data: {
          url: payload.url || '/',
          storyId: payload.storyId || null,
          action: payload.action || 'open'
        },
        actions: payload.actions || [
          {
            action: 'open',
            title: 'Buka',
            icon: '/public/images/logo.png'
          },
          {
            action: 'close',
            title: 'Tutup'
          }
        ],
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        vibrate: payload.vibrate || [200, 100, 200]
      };
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent,
      vibrate: notificationData.vibrate
    }
  );

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();

  const clickAction = event.action;
  const notificationData = event.notification.data;
  
  if (clickAction === 'close') {
    return; 
  }

  let urlToOpen = '/';
  
  if (notificationData && notificationData.storyId) {
    urlToOpen = `/#/story-detail/${notificationData.storyId}`;
  } else if (notificationData && notificationData.url) {
    urlToOpen = notificationData.url;
  }

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.postMessage({
          type: 'NOTIFICATION_CLICKED',
          url: urlToOpen,
          storyId: notificationData ? notificationData.storyId : null
        });
        return client.focus();
      }
    }

    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});

self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      console.log('Background sync completed')
    );
  }
});

self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});