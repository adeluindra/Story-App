import StoryApi from '../../data/api';
import { getAuthToken, checkAuthState } from '../../utils/auth';

const HomePresenter = {
  init({ storiesContainer, loadingContainer, callbacks }) {
    this._storiesContainer = storiesContainer;
    this._loadingContainer = loadingContainer;
    this._callbacks = callbacks;
    this._token = getAuthToken();

    this._callbacks.showLoading();
    checkAuthState();
    this._fetchStories();
    this._initOfflineControls();
  },

  async _fetchStories(forceOffline = false) {
    try {
      let stories = [];
      
      if (this._token) {
        stories = await StoryApi.getAllStories({
          token: this._token,
          location: 1,
          useOffline: forceOffline
        });
      } else {
        this._callbacks.navigateToLogin();
        this._callbacks.hideLoading();
        return;
      }

      const storiesWithOfflineInfo = stories.map(story => ({
        ...story,
        isFromOffline: story.isOffline || forceOffline || !navigator.onLine
      }));

      this._callbacks.displayStories(storiesWithOfflineInfo);

      this._updateOfflineStatus(storiesWithOfflineInfo);
      
    } catch (error) {
      this._callbacks.showErrorMessage(error.message);

      if (error.message.toLowerCase().includes('unauthorized') || 
          error.message.toLowerCase().includes('token')) {
        this._callbacks.navigateToLogin();
      }
    } finally {
      this._callbacks.hideLoading();
    }
  },

  _initOfflineControls() {
    this._addOfflineControls();
  },

  _addOfflineControls() {
    if (this._callbacks.addOfflineControls) {
      this._callbacks.addOfflineControls({
        onRefreshOnline: () => this._fetchStories(false),
        onViewOffline: () => this._fetchStories(true),
        onClearOfflineData: () => this._clearOfflineData(),
        onDeleteOfflineStory: (id) => this._deleteOfflineStory(id)
      });
    }
  },

  async _updateOfflineStatus(stories) {
    try {
      const offlineCount = await StoryApi.getOfflineStoriesCount();
      const onlineCount = stories.filter(story => !story.isFromOffline).length;
      
      if (this._callbacks.updateOfflineStatus) {
        this._callbacks.updateOfflineStatus({
          offlineCount,
          onlineCount,
          totalCount: stories.length,
          isOnline: navigator.onLine
        });
      }
    } catch (error) {
      console.error('Failed to update offline status:', error);
    }
  },

  async _clearOfflineData() {
    try {
      if (this._callbacks.showLoading) {
        this._callbacks.showLoading();
      }

      await StoryApi.clearOfflineStories();
      
      if (this._callbacks.showSuccessMessage) {
        this._callbacks.showSuccessMessage('Offline data cleared successfully');
      }
      
      this._fetchStories(false);
      
    } catch (error) {
      if (this._callbacks.showErrorMessage) {
        this._callbacks.showErrorMessage(`Failed to clear offline data: ${error.message}`);
      }
    } finally {
      if (this._callbacks.hideLoading) {
        this._callbacks.hideLoading();
      }
    }
  },

  async _deleteOfflineStory(storyId) {
    try {
      if (!storyId) {
        throw new Error('Story ID is required');
      }

      const confirmDelete = confirm('Are you sure you want to delete this offline story?');
      if (!confirmDelete) {
        return;
      }

      if (this._callbacks.showLoading) {
        this._callbacks.showLoading();
      }

      await StoryApi.deleteOfflineStory(storyId);
      
      if (this._callbacks.showSuccessMessage) {
        this._callbacks.showSuccessMessage('Story deleted from offline storage');
      }
      
      this._fetchStories(true);
      
    } catch (error) {
      if (this._callbacks.showErrorMessage) {
        this._callbacks.showErrorMessage(`Failed to delete story: ${error.message}`);
      }
    } finally {
      if (this._callbacks.hideLoading) {
        this._callbacks.hideLoading();
      }
    }
  },

  async searchOfflineStories(query) {
    try {
      if (!query || query.trim() === '') {
        this._fetchStories(true);
        return;
      }

      if (this._callbacks.showLoading) {
        this._callbacks.showLoading();
      }

      const searchResults = await StoryApi.searchOfflineStories(query.trim());
      const storiesWithOfflineInfo = searchResults.map(story => ({
        ...story,
        isFromOffline: true
      }));

      if (this._callbacks.displayStories) {
        this._callbacks.displayStories(storiesWithOfflineInfo);
      }

      if (this._callbacks.showSuccessMessage && searchResults.length === 0) {
        this._callbacks.showSuccessMessage(`No offline stories found for "${query}"`);
      }
      
    } catch (error) {
      if (this._callbacks.showErrorMessage) {
        this._callbacks.showErrorMessage(`Search failed: ${error.message}`);
      }
    } finally {
      if (this._callbacks.hideLoading) {
        this._callbacks.hideLoading();
      }
    }
  },

  onOnline() {
    console.log('📡 Back online - refreshing stories');
    if (this._callbacks.showSuccessMessage) {
      this._callbacks.showSuccessMessage('Connection restored - refreshing stories');
    }
    this._fetchStories(false);
  },

  onOffline() {
    console.log('📱 Gone offline - switching to offline mode');
    if (this._callbacks.showErrorMessage) {
      this._callbacks.showErrorMessage('You are offline - showing cached stories');
    }
    this._fetchStories(true);
  },

  destroy() {
    window.removeEventListener('online', this.onOnline.bind(this));
    window.removeEventListener('offline', this.onOffline.bind(this));
  }
};

export default HomePresenter;