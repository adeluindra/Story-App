import StoryApi from '../../data/api';
import { getAuthToken, checkAuthState } from '../../utils/auth';
import { setupCamera, takePhoto, stopCamera, populateCameraSelect } from '../../utils/camera';
import { getCurrentLocation } from '../../utils/map';
import { showErrorToast, showSuccessToast } from '../../utils/notification';

class NewPresenter {
  constructor(view) {
    this.view = view;
    this.token = getAuthToken();
    this.photoFile = null;
    this.activeCameraId = null;
    this.cameraStream = null;

    this.view.initializeMap();
    checkAuthState();

    this.prepareCameraButton();
    
    this._setupGlobalListeners();
  }
  
  _setupGlobalListeners() {
    this._hashChangeListener = () => this.disableCamera();
    this._beforeUnloadListener = () => this.disableCamera();
    
    window.addEventListener('hashchange', this._hashChangeListener);
    window.addEventListener('beforeunload', this._beforeUnloadListener);
    
    document.addEventListener('page:change', this._hashChangeListener);
  }
  
  destroy() {
    this.disableCamera();
    
    window.removeEventListener('hashchange', this._hashChangeListener);
    window.removeEventListener('beforeunload', this._beforeUnloadListener);
    document.removeEventListener('page:change', this._hashChangeListener);
    
    this._hashChangeListener = null;
    this._beforeUnloadListener = null;
  }

  async prepareCameraButton() {
    try {
      if (this.view.cameraSelect) {
        const cameras = await populateCameraSelect(this.view.cameraSelect);
        
        if (cameras && cameras.length > 0) {
          this.activeCameraId = cameras[0].deviceId;
          console.log('Available cameras:', cameras.length);
          this.view.updateCameraSelect(cameras);
        }
      }

      if (this.view.toggleCameraButton) {
        this.view.toggleCameraButton.style.display = 'block';
      }
    } catch (error) {
      console.error('Camera preparation error:', error);
      this.view.showCameraFallbackMessage();
    }
  }

  async enableCamera() {
    try {
      const stream = await setupCamera(this.view.camera, this.activeCameraId);
      this.cameraStream = stream;
      
      this.view.updateCameraUI(true);
      console.log('Camera enabled');
    } catch (error) {
      console.error('Camera enable error:', error);
      showErrorToast('Failed to enable camera: ' + error.message);
      this.view.showCameraFallbackMessage();
    }
  }

  disableCamera() {
    if (this.cameraStream) {
      const tracks = this.cameraStream.getTracks();
      tracks.forEach(track => track.stop());
      this.cameraStream = null;

      if (this.view.camera) {
        stopCamera(this.view.camera);
      }
      
      this.view.updateCameraUI(false);
      console.log('Camera disabled');
    }
  }

  async initCamera() {
    try {
      if (this.view.cameraSelect) {
        const cameras = await populateCameraSelect(this.view.cameraSelect);
        
        if (cameras && cameras.length > 0) {
          this.activeCameraId = cameras[0].deviceId;
          console.log('Available cameras:', cameras.length);
          this.view.updateCameraSelect(cameras);
        }
      }

      const stream = await setupCamera(this.view.camera, this.activeCameraId);
      this.cameraStream = stream;
      
      this.view.takePhotoButton.style.display = 'block';
      this.view.retakePhotoButton.style.display = 'none';

      this.view.updateCameraUI(true);
    } catch (error) {
      console.error('Camera error:', error);
      this.view.showCameraFallbackMessage();
    }
  }

  async onCameraChange(cameraId) {
    this.activeCameraId = cameraId;
    await this.switchCamera(cameraId);
  }

  async switchCamera(cameraId) {
    try {
      if (!cameraId) {
        console.warn('No camera ID provided, using default');
      }

      this.view.showCameraLoading(true);
      
      if (this.cameraStream) {
        const tracks = this.cameraStream.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      const stream = await setupCamera(this.view.camera, cameraId);
      this.cameraStream = stream;
      
      this.view.showCameraLoading(false);
      
      console.log('Switched to camera:', cameraId);
    } catch (error) {
      console.error('Error switching camera:', error);
      showErrorToast('Failed to switch camera: ' + error.message);
      
      this.view.showCameraLoading(false);
    }
  }

  async onTakePhoto() {
    try {
      const photoFile = await takePhoto(this.view.camera, this.view.canvas);
      
      if (photoFile) {
        this.photoFile = photoFile;
        this.view.showPhoto(true);
        console.log('Photo taken successfully:', this.photoFile);
      } else {
        showErrorToast('Failed to take photo. Please try again.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showErrorToast('Error taking photo: ' + error.message);
    }
  }

  onRetakePhoto() {
    this.view.showPhoto(false);
    this.photoFile = null;
  }

  async onGetLocation() {
    try {
      console.log('Getting current location...');
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      
      console.log('Position obtained:', latitude, longitude);
      
      this.view.updateLocationInputs(latitude, longitude);
      this.view.setMapMarker(latitude, longitude, 'Your current location');
      
      showSuccessToast('Location successfully obtained');
    } catch (error) {
      console.error('Geolocation error:', error);
      showErrorToast(error.message || 'Unable to get your location');
    } finally {
      this.view.hideLocationLoading();
    }
  }

  onPhotoInputChange() {
    this.photoFile = null;
    this.view.canvas.style.display = 'none';
  }

  async onSubmitStory({ description, photo, lat, lon }) {
    if (!description || description.trim() === '') {
      showErrorToast('Please enter a description');
      return;
    }
    
    if (!photo) {
      showErrorToast('Please take or upload a photo');
      return;
    }
    
    if (!(photo instanceof File || photo instanceof Blob)) {
      showErrorToast('Invalid photo format. Please try again.');
      console.error('Invalid photo format:', photo);
      return;
    }
    
    try {
      this.view.showSubmitLoading(true);
      
      console.log('Sending story with:', { description, photo, lat, lon });
      
      if (this.token) {
        await StoryApi.addNewStory({ description, photo, lat, lon }, this.token);
      } else {
        await StoryApi.addNewStoryGuest({ description, photo, lat, lon });
      }
      
      this.disableCamera();
      
      showSuccessToast('Story added successfully!');
      window.location.hash = '#/';
    } catch (error) {
      console.error('Error adding story:', error);
      showErrorToast(error.message || 'Failed to add story');
      this.view.showSubmitLoading(false);
    }
  }
  
  getPhotoFile() {
    return this.photoFile;
  }
}

export default NewPresenter;