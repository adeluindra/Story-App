import { 
  subscribeToPushNotification, 
  unsubscribeFromPushNotification, 
  isPushNotificationActive 
} from './notification';

export function createNotificationToggle() {
  const isActive = isPushNotificationActive();
  
  return `
    <div class="notification-toggle">
      <button 
        id="notification-toggle-btn" 
        class="notification-btn ${isActive ? 'active' : ''}" 
        title="${isActive ? 'Nonaktifkan Notifikasi' : 'Aktifkan Notifikasi'}"
        aria-label="Toggle Push Notification"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${isActive ? 
            `<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
             <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>` :
            `<path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
             <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
             <path d="M6.37 13A17.89 17.89 0 0 0 6 8a6 6 0 0 1 10.44-4.16"></path>
             <line x1="1" y1="1" x2="23" y2="23"></line>`
          }
        </svg>
        <span class="notification-status">${isActive ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  `;
}

export function initNotificationToggle() {
  const toggleBtn = document.getElementById('notification-toggle-btn');
  
  if (!toggleBtn) {
    console.warn('Notification toggle button not found');
    return;
  }

  const newToggleBtn = toggleBtn.cloneNode(true);
  toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);

  newToggleBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    
    newToggleBtn.disabled = true;
    newToggleBtn.classList.add('loading');
    
    try {
      const isCurrentlyActive = isPushNotificationActive();
      
      if (isCurrentlyActive) {
        const success = await unsubscribeFromPushNotification();
        if (success) {
          updateToggleUI(false);
        }
      } else {
        const success = await subscribeToPushNotification();
        if (success) {
          updateToggleUI(true);
        }
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
    } finally {
      newToggleBtn.disabled = false;
      newToggleBtn.classList.remove('loading');
    }
  });
}

function updateToggleUI(isActive) {
  const toggleBtn = document.getElementById('notification-toggle-btn');
  if (!toggleBtn) return;
  
  const statusSpan = toggleBtn.querySelector('.notification-status');
  const svg = toggleBtn.querySelector('svg');
  
  if (isActive) {
    toggleBtn.classList.add('active');
    toggleBtn.title = 'Nonaktifkan Notifikasi';
    if (statusSpan) statusSpan.textContent = 'ON';
    
    if (svg) {
      svg.innerHTML = `
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      `;
    }
  } else {
    toggleBtn.classList.remove('active');
    toggleBtn.title = 'Aktifkan Notifikasi';
    if (statusSpan) statusSpan.textContent = 'OFF';
    
    if (svg) {
      svg.innerHTML = `
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        <path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path>
        <path d="M6.37 13A17.89 17.89 0 0 0 6 8a6 6 0 0 1 10.44-4.16"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    }
  }
}