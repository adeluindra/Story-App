import indexedDBHandler from '../data/indexeddb';

export function showFormattedDate(date, locale = 'en-US', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function initIndexedDB() {
  try {
    await indexedDBHandler.init();
    console.log('✅ IndexedDB initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    return false;
  }
}

export async function getOfflineStoriesInfo() {
  try {
    const info = await indexedDBHandler.getDBInfo();
    return {
      ...info,
      isSupported: indexedDBHandler.constructor.isSupported(),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get offline stories info:', error);
    return {
      name: 'StoryAppDB',
      version: 1,
      storiesCount: 0,
      isConnected: false,
      isSupported: indexedDBHandler.constructor.isSupported(),
      error: error.message
    };
  }
}

export function formatStorageSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getNetworkStatus() {
  return {
    isOnline: navigator.onLine,
    effectiveType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 0,
    rtt: navigator.connection?.rtt || 0
  };
}

export function showOfflineIndicator(isOffline = false) {
  const indicator = document.getElementById('offline-indicator');
  if (indicator) {
    indicator.style.display = isOffline || !navigator.onLine ? 'block' : 'none';
    indicator.textContent = isOffline ? '📱 Offline Mode' : '🌐 Online';
  }
}

export function createOfflineIndicator() {
  let indicator = document.getElementById('offline-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'offline-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 1000;
      display: none;
    `;
    document.body.appendChild(indicator);
  }
  
  showOfflineIndicator(!navigator.onLine);
  
  window.addEventListener('online', () => showOfflineIndicator(false));
  window.addEventListener('offline', () => showOfflineIndicator(true));
  
  return indicator;
}

export async function exportOfflineData() {
  try {
    const stories = await indexedDBHandler.getAllStories();
    const info = await getOfflineStoriesInfo();
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalStories: stories.length,
        dbInfo: info
      },
      stories: stories
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-app-offline-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export offline data:', error);
    throw error;
  }
}

export function validateStoryData(story) {
  const requiredFields = ['id', 'name', 'description'];
  const missingFields = requiredFields.filter(field => !story[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return true;
}

export function sanitizeStoryData(story) {
  return {
    id: String(story.id || ''),
    name: String(story.name || ''),
    description: String(story.description || ''),
    photoUrl: String(story.photoUrl || story.photo || ''),
    createdAt: story.createdAt || new Date().toISOString(),
    lat: story.lat ? Number(story.lat) : null,
    lon: story.lon ? Number(story.lon) : null,
  };
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export async function checkIndexedDBQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = (estimate.usage / (1024 * 1024)).toFixed(2);
      const totalMB = (estimate.quota / (1024 * 1024)).toFixed(2);
      const usedPercent = ((estimate.usage / estimate.quota) * 100).toFixed(2);
      
      return {
        used: estimate.usage,
        total: estimate.quota,
        usedMB: parseFloat(usedMB),
        totalMB: parseFloat(totalMB),
        usedPercent: parseFloat(usedPercent),
        available: estimate.quota - estimate.usage
      };
    } catch (error) {
      console.error('Failed to check storage quota:', error);
      return null;
    }
  }
  return null;
}

export function onNetworkChange(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  start(operation) {
    this.metrics[operation] = {
      startTime: performance.now(),
      operation
    };
  }
  
  end(operation) {
    if (this.metrics[operation]) {
      const endTime = performance.now();
      const duration = endTime - this.metrics[operation].startTime;
      
      console.log(`📊 ${operation} completed in ${duration.toFixed(2)}ms`);
      
      this.metrics[operation].endTime = endTime;
      this.metrics[operation].duration = duration;
      
      return duration;
    }
    return null;
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  clear() {
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();