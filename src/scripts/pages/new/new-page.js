import { createNewStoryTemplate } from '../../templates';
import NewPresenter from './new-presenter';

class NewView {
  constructor() {
    this.storyForm = null;
    this.camera = null;
    this.canvas = null;
    this.cameraSelect = null;
    this.takePhotoButton = null;
    this.retakePhotoButton = null;
    this.getLocationButton = null;
    this.toggleCameraButton = null;
    this.mapContainer = null;
    this.photoInput = null;
    this.latInput = null;
    this.lonInput = null;
    this.map = null;
    this.marker = null;
    this.presenter = null;
    this.isCameraActive = false; 
  }

  init() {
    console.log('Initializing NewView...');

    this.storyForm = document.getElementById('storyForm');
    this.camera = document.getElementById('camera');
    this.canvas = document.getElementById('canvas');
    this.cameraSelect = document.getElementById('cameraSelect');
    this.takePhotoButton = document.getElementById('takePhoto');
    this.retakePhotoButton = document.getElementById('retakePhoto');
    this.getLocationButton = document.getElementById('getLocation');
    this.toggleCameraButton = document.getElementById('toggleCamera');
    this.mapContainer = document.getElementById('map');

    this.photoInput = document.getElementById('photoInput');
    console.log('photoInput element:', this.photoInput);
    
    this.latInput = document.getElementById('lat');
    this.lonInput = document.getElementById('lon');

    this.presenter = new NewPresenter(this);
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');

    if (this.cameraSelect) {
      this.cameraSelect.addEventListener('change', () => {
        const cameraId = this.cameraSelect.value;
        this.presenter.onCameraChange(cameraId);
      });
    }

    if (this.toggleCameraButton) {
      console.log('Toggle camera button found');
      this.toggleCameraButton.addEventListener('click', () => {
        if (this.isCameraActive) {
          this.presenter.disableCamera();
        } else {
          this.presenter.enableCamera();
        }
      });
    } else {
      console.warn('Toggle camera button not found');
    }

    if (this.takePhotoButton) {
      this.takePhotoButton.addEventListener('click', () => {
        this.presenter.onTakePhoto();
      });
    }

    if (this.retakePhotoButton) {
      this.retakePhotoButton.addEventListener('click', () => {
        this.presenter.onRetakePhoto();
      });
    }

    if (this.getLocationButton) {
      this.getLocationButton.addEventListener('click', () => {
        this.showLocationLoading();
        this.presenter.onGetLocation();
      });
    }

    if (this.storyForm) {
      this.storyForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Form submitted');

        const description = this.storyForm.querySelector('#description')?.value || '';

        let photo = this.presenter.getPhotoFile();
        
        try {
          if (!photo) {
            console.log('No photo from camera, checking file input');
            if (this.photoInput) {
              console.log('photoInput files:', this.photoInput.files);
              if (this.photoInput.files && this.photoInput.files.length > 0) {
                photo = this.photoInput.files[0];
                console.log('Using file from input:', photo);
              }
            } else {
              console.warn('photoInput element is null');
            }
          }
        } catch (error) {
          console.error('Error accessing file input:', error);
        }
        
        const lat = this.latInput?.value || null;
        const lon = this.lonInput?.value || null;

        console.log('Submitting story with data:', { description, photo: !!photo, lat, lon });
        this.presenter.onSubmitStory({ description, photo, lat, lon });
      });
    }

    if (!this.photoInput) {
      console.warn('photoInput not found on initial load, trying again');
      this.photoInput = document.getElementById('photoInput');
    }
    
    if (this.photoInput) {
      console.log('Adding change event listener to photoInput');
      this.photoInput.addEventListener('change', (event) => {
        console.log('Photo input changed:', event);
        try {
          if (this.photoInput.files && this.photoInput.files.length > 0) {
            console.log('File selected:', this.photoInput.files[0]);
            this.presenter.onPhotoInputChange();
          }
        } catch (error) {
          console.error('Error in photoInput change event:', error);
        }
      });
    } else {
      console.error('PhotoInput element still not found with ID "photoInput"');
    }
  }

  showPhoto(show) {
    if (!this.canvas || !this.camera || !this.takePhotoButton || !this.retakePhotoButton) return;
    
    this.canvas.style.display = show ? 'block' : 'none';
    this.camera.style.display = show ? 'none' : 'block';
    this.takePhotoButton.style.display = show ? 'none' : 'block';
    this.retakePhotoButton.style.display = show ? 'block' : 'none';

    if (this.cameraSelect) {
      this.cameraSelect.parentElement.style.display = show ? 'none' : 'block';
    }
  }

  updateCameraUI(isActive) {
    this.isCameraActive = isActive;
    
    if (this.toggleCameraButton) {
      this.toggleCameraButton.textContent = isActive ? 'Tutup Kamera' : 'Buka Kamera';
    }
    
    if (this.camera) {
      this.camera.style.display = isActive ? 'block' : 'none';
    }
    
    if (this.takePhotoButton) {
      this.takePhotoButton.style.display = isActive ? 'block' : 'none';
    }
    
    if (this.cameraSelect && this.cameraSelect.parentElement) {
      this.cameraSelect.parentElement.style.display = isActive ? 'block' : 'none';
    }
  }

  initializeMap() {
    try {
      if (!this.mapContainer) {
        console.error('Map container element is not defined');
        return null;
      }

      if (typeof L === 'undefined') {
        console.error('Leaflet library is not defined');
        this.mapContainer.innerHTML = '<p class="map-error">Map could not be loaded. Please refresh the page or try again later.</p>';
        return null;
      }

      this.map = L.map(this.mapContainer.id).setView([0, 0], 2);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      this.map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.updateLocationInputs(lat, lng);
        this.setMapMarker(lat, lng, 'Story location');
      });

      return this.map;
    } catch (error) {
      console.error('Error initializing map:', error);
      if (this.mapContainer) {
        this.mapContainer.innerHTML = '<p class="map-error">Map could not be loaded. Please try again later.</p>';
      }
      return null;
    }
  }

  setMapMarker(lat, lng, popupText = 'Location') {
    if (!this.map) return;

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker([lat, lng]).addTo(this.map)
      .bindPopup(popupText)
      .openPopup();

    this.map.setView([lat, lng], 15);
  }

  updateLocationInputs(lat, lng) {
    if (this.latInput) this.latInput.value = lat;
    if (this.lonInput) this.lonInput.value = lng;
  }

  showCameraLoading(isLoading) {
    if (this.takePhotoButton) {
      this.takePhotoButton.disabled = isLoading;
      this.takePhotoButton.textContent = isLoading ? 'Switching camera...' : 'Take Photo';
    }
    
    if (this.cameraSelect) {
      this.cameraSelect.disabled = isLoading;
    }
  }

  showLocationLoading() {
    if (!this.getLocationButton) return;
    
    this.getLocationButton.disabled = true;
    this.getLocationButton.textContent = 'Getting location...';
  }

  hideLocationLoading() {
    if (!this.getLocationButton) return;
    
    this.getLocationButton.disabled = false;
    this.getLocationButton.textContent = 'Use Current Location';
  }

  showSubmitLoading(isLoading) {
    if (!this.storyForm) return;
    
    const submitButton = this.storyForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = isLoading;
      submitButton.textContent = isLoading ? 'Submitting...' : 'Submit Story';
    }
  }

  showCameraFallbackMessage() {
    if (!this.camera) return;
    
    if (this.camera) this.camera.style.display = 'none';
    if (this.takePhotoButton) this.takePhotoButton.style.display = 'none';
    if (this.retakePhotoButton) this.retakePhotoButton.style.display = 'none';

    if (this.cameraSelect && this.cameraSelect.parentElement) {
      this.cameraSelect.parentElement.style.display = 'none';
    }

    if (this.toggleCameraButton) {
      this.toggleCameraButton.style.display = 'none';
    }

    if (this.photoInput) {
      this.photoInput.style.display = 'block';
    }
    
    const fallbackMsg = document.createElement('p');
    fallbackMsg.textContent = 'Camera not available. Please upload a photo instead.';
    fallbackMsg.className = 'camera-fallback-message';
    
    if (this.camera.parentNode) {
      this.camera.parentNode.insertBefore(fallbackMsg, this.camera);
    }
  }

  updateCameraSelect(cameras) {
    if (!this.cameraSelect || !this.cameraSelect.parentElement) return;

    if (cameras && cameras.length > 0) {
      if (cameras.length === 1) {
        this.cameraSelect.parentElement.style.display = 'none';
      } else {
        this.cameraSelect.parentElement.style.display = 'block';
      }
    } else {
      this.cameraSelect.parentElement.style.display = 'none';
    }
  }
  
  destroy() {
    if (this.presenter) {
      this.presenter.destroy();
      this.presenter = null;
    }
  }
}

const NewPage = {
  render() {
    return createNewStoryTemplate();
  },

  afterRender() {
    console.log('NewPage afterRender called');
    const view = new NewView();
    view.init();
    
    if (!window._viewInstances) window._viewInstances = {};
    
    if (window._viewInstances.newView) {
      window._viewInstances.newView.destroy();
    }
    
    window._viewInstances.newView = view;
    
    const handleNavigation = () => {
      if (window._viewInstances.newView) {
        console.log('Cleaning up NewView instance');
        window._viewInstances.newView.destroy();
      }
      
      window.removeEventListener('hashchange', handleNavigation);
      
      document.dispatchEvent(new CustomEvent('page:change'));
    };
    
    window.addEventListener('hashchange', handleNavigation);
    
    setTimeout(() => {
      const photoInput = document.getElementById('photoInput');
      console.log('photoInput check after timeout:', photoInput);
    }, 100);
  },
  
  beforeLeave() {
    if (window._viewInstances && window._viewInstances.newView) {
      console.log('Executing beforeLeave cleanup for NewPage');
      window._viewInstances.newView.destroy();
      window._viewInstances.newView = null;
    }
  }
};

export default NewPage;