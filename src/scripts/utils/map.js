import CONFIG from '../config';

let mapInstance = null;

/**
 * Initializes the map
 * @param {string} containerId 
 * @returns {Object|null} 
 */
export function initMap(containerId) {
  if (!containerId) return null;

  try {
    if (typeof L === 'undefined') {
      console.error('Leaflet library is not loaded.');
      return null;
    }

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (!CONFIG.MAP_SERVICE_API_KEY || CONFIG.MAP_SERVICE_API_KEY === 'YOUR_MAPTILER_API_KEY_HERE') {
      console.error('MapTiler API key is missing. Please check your configuration.');

      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '<p>Map could not be loaded. MapTiler API key is missing.</p>';
      }
      
      return null;
    }

    const map = L.map(containerId).setView([0, 0], 2);
    mapInstance = map;

    L.tileLayer('https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=' + CONFIG.MAP_SERVICE_API_KEY, {
      attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      maxZoom: 18,
    }).addTo(map);

    return map;
  } catch (error) {
    console.error('Error initializing map:', error);
    
    if (error.message && error.message.includes('container')) {
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Map container with ID "${containerId}" not found.`);
      } else {
        container.innerHTML = '<p>Map could not be loaded. Please try again later.</p>';
      }
    }
    
    return null;
  }
}

/**
 * Initializes a map for a story with a marker at the specified location
 * @param {string} containerId 
 * @param {number} lat 
 * @param {number} lon 
 */
export function initMapForStory(containerId, lat, lon) {
  const map = initMap(containerId);
  if (map) {
    L.marker([lat, lon]).addTo(map)
      .bindPopup('Story location')
      .openPopup();
    map.setView([lat, lon], 15);
  }
}

/**
 * Gets the current location of the user
 * @returns {Promise} 
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    const success = (position) => {
      console.log('Location obtained:', position.coords.latitude, position.coords.longitude);
      resolve(position);
    };
    
    const error = (err) => {
      console.error('Geolocation error:', err);
      let errorMessage;
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable. Please try again.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          break;
        default:
          errorMessage = 'An unknown error occurred while getting location.';
          break;
      }
      
      reject(new Error(errorMessage));
    };
    
    navigator.geolocation.getCurrentPosition(success, error, options);
  });
}