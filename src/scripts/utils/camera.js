/**
 * Gets all available cameras
 * @returns {Promise<MediaDeviceInfo[]>} 
 */
export const getCameras = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    throw new Error('Browser API navigator.mediaDevices.enumerateDevices not available');
  }

  try {
    await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    const devices = await navigator.mediaDevices.enumerateDevices();
    
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Error getting camera devices:', error);
    throw new Error('Could not access camera devices: ' + error.message);
  }
};

/**
 * Populates a select element with available cameras
 * @param {HTMLSelectElement} selectElement
 * @returns {Promise<void>} 
 */
export const populateCameraSelect = async (selectElement) => {
  try {
    const cameras = await getCameras();
    
    selectElement.innerHTML = '';
    
    if (cameras.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No cameras found';
      selectElement.appendChild(option);
      selectElement.disabled = true;
      return;
    }
    
    cameras.forEach((camera, index) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      
      if (camera.label) {
        if (camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') || 
            camera.label.toLowerCase().includes('environment')) {
          option.textContent = 'Back Camera';
        } else if (camera.label.toLowerCase().includes('front') || 
                  camera.label.toLowerCase().includes('face') || 
                  camera.label.toLowerCase().includes('user')) {
          option.textContent = 'Front Camera';
        } else {
          option.textContent = camera.label;
        }
      } else {
        option.textContent = `Camera ${index + 1}`;
      }
      
      selectElement.appendChild(option);
    });

    selectElement.disabled = false;
    
    return cameras;
  } catch (error) {
    console.error('Error populating camera select:', error);
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Error loading cameras';
    selectElement.innerHTML = '';
    selectElement.appendChild(option);
    selectElement.disabled = true;
  }
};

/**
 * Sets up camera access for the given video element
 * @param {HTMLVideoElement} videoElement
 * @param {string} [cameraId] 
 * @returns {Promise} 
 */
export const setupCamera = async (videoElement, cameraId = null) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Browser API navigator.mediaDevices.getUserMedia not available');
  }

  try {
    if (videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    
    const constraints = {
      video: cameraId 
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' },
      audio: false,
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    videoElement.srcObject = stream;
    
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve(stream);
      };
    });
  } catch (error) {
    throw new Error('Could not access the camera: ' + error.message);
  }
};

/**
 * Takes a photo from the video feed and returns it as a Blob
 * @param {HTMLVideoElement} videoElement
 * @param {HTMLCanvasElement} canvasElement 
 * @returns {Promise<File|null>} 
 */
export const takePhoto = (videoElement, canvasElement) => {
  try {
    if (videoElement.paused || videoElement.ended || !videoElement.srcObject) {
      console.error('Video is not playing, cannot take photo');
      return null;
    }
    
    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    canvasElement.width = width;
    canvasElement.height = height;
    
    const context = canvasElement.getContext('2d');
    context.drawImage(videoElement, 0, 0, width, height);
    
    return new Promise((resolve) => {
      canvasElement.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          resolve(null);
          return;
        }
        
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.95); 
    });
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

/**
 * Stops the camera stream
 * @param {HTMLVideoElement} videoElement 
 */
export const stopCamera = (videoElement) => {
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    tracks.forEach((track) => {
      try {
        track.stop();
      } catch (error) {
        console.error('Error stopping track:', error);
      }
    });
    videoElement.srcObject = null;
    console.log('Camera stream stopped and cleared');
  }
};