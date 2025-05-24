import CONFIG from '../config';
import { mapStory, mapStories } from './api-mapper';
import indexedDBHandler from './indexeddb';

const API_ENDPOINT = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

class StoryApi {
  static async register({ name, email, password }) {
    const response = await fetch(API_ENDPOINT.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async login({ email, password }) {
    const response = await fetch(API_ENDPOINT.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async getAllStories({ page = 1, size = 10, location = 0, token, useOffline = false }) {
    if (useOffline || !navigator.onLine) {
      try {
        console.log('📱 Loading stories from IndexedDB (offline mode)');
        const offlineStories = await indexedDBHandler.getAllStories();
        return offlineStories;
      } catch (error) {
        console.error('Failed to load stories from IndexedDB:', error);
        throw new Error('Unable to load stories offline');
      }
    }

    try {
      let endpoint = `${API_ENDPOINT.STORIES}?page=${page}&size=${size}&location=${location}`;
      let headers = {};
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        endpoint = `${API_ENDPOINT.STORIES_GUEST}?page=${page}&size=${size}&location=${location}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
      });

      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      const storiesList = responseJson.listStory || responseJson.stories || [];
      const mappedStories = mapStories(storiesList);

      try {
        await indexedDBHandler.saveStories(mappedStories);
        console.log('💾 Stories saved to IndexedDB for offline access');
      } catch (dbError) {
        console.warn('Failed to save stories to IndexedDB:', dbError);
      }

      return mappedStories;
    } catch (error) {
      console.warn('API request failed, trying IndexedDB fallback:', error.message);
      try {
        const offlineStories = await indexedDBHandler.getAllStories();
        if (offlineStories.length > 0) {
          console.log('📱 Loaded stories from IndexedDB as fallback');
          return offlineStories;
        }
      } catch (dbError) {
        console.error('IndexedDB fallback also failed:', dbError);
      }
      
      throw error;
    }
  }

  static async getStoryDetail(id, token, useOffline = false) {
    if (useOffline || !navigator.onLine) {
      try {
        console.log(`📱 Loading story ${id} from IndexedDB (offline mode)`);
        const offlineStory = await indexedDBHandler.getStoryById(id);
        if (!offlineStory) {
          throw new Error('Story not found in offline storage');
        }
        return offlineStory;
      } catch (error) {
        console.error('Failed to load story from IndexedDB:', error);
        throw new Error('Unable to load story offline');
      }
    }

    try {
      if (!token) {
        throw new Error('Authentication token is missing');
      }
      
      const response = await fetch(API_ENDPOINT.STORY_DETAIL(id), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseJson = await response.json();
      if (responseJson.error) {
        throw new Error(responseJson.message);
      }

      const storyData = responseJson.story || responseJson.data || {};
      const mappedStory = mapStory(storyData);

      try {
        await indexedDBHandler.saveStory(mappedStory);
        console.log(`💾 Story ${id} saved to IndexedDB for offline access`);
      } catch (dbError) {
        console.warn('Failed to save story to IndexedDB:', dbError);
      }

      return mappedStory;
    } catch (error) {
      console.warn('API request failed, trying IndexedDB fallback:', error.message);
      try {
        const offlineStory = await indexedDBHandler.getStoryById(id);
        if (offlineStory) {
          console.log(`📱 Loaded story ${id} from IndexedDB as fallback`);
          return offlineStory;
        }
      } catch (dbError) {
        console.error('IndexedDB fallback also failed:', dbError);
      }
      
      throw error;
    }
  }

  static async addNewStory({ description, photo, lat, lon }, token) {
    if (!token) {
      throw new Error('Authentication token is missing');
    }
    
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    const response = await fetch(API_ENDPOINT.STORIES, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async addNewStoryGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', photo);
    if (lat && lon) {
      formData.append('lat', lat);
      formData.append('lon', lon);
    }

    const response = await fetch(API_ENDPOINT.STORIES_GUEST, {
      method: 'POST',
      body: formData,
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async subscribePushNotification({ endpoint, keys }, token) {
    if (!token) {
      throw new Error('Authentication token is missing');
    }
    
    const response = await fetch(API_ENDPOINT.NOTIFICATION_SUBSCRIBE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
        keys,
      }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async unsubscribePushNotification({ endpoint }, token) {
    if (!token) {
      throw new Error('Authentication token is missing');
    }
    
    const response = await fetch(API_ENDPOINT.NOTIFICATION_SUBSCRIBE, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint,
      }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }

    return responseJson;
  }

  static async getOfflineStories() {
    try {
      return await indexedDBHandler.getAllStories();
    } catch (error) {
      console.error('Failed to get offline stories:', error);
      return [];
    }
  }

  static async deleteOfflineStory(id) {
    try {
      return await indexedDBHandler.deleteStory(id);
    } catch (error) {
      console.error('Failed to delete offline story:', error);
      throw error;
    }
  }

  static async clearOfflineStories() {
    try {
      return await indexedDBHandler.deleteAllStories();
    } catch (error) {
      console.error('Failed to clear offline stories:', error);
      throw error;
    }
  }

  static async getOfflineStoriesCount() {
    try {
      return await indexedDBHandler.getStoriesCount();
    } catch (error) {
      console.error('Failed to get offline stories count:', error);
      return 0;
    }
  }

  static async searchOfflineStories(query) {
    try {
      return await indexedDBHandler.searchStories(query);
    } catch (error) {
      console.error('Failed to search offline stories:', error);
      return [];
    }
  }
}

export default StoryApi;