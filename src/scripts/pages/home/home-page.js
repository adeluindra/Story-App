import { createHomeTemplate, createLoadingTemplate } from '../../templates';
import HomePresenter from './home-presenter';
import indexedDBHandler from '../../data/indexeddb';

const HomePage = {
  render() {
    return `
      ${createHomeTemplate()}
      ${createLoadingTemplate()}
    `;
  },

  async afterRender() {
    const storiesContainer = document.getElementById('stories');
    const loadingContainer = document.getElementById('loading');

    // Update favorites count
    await this._updateFavoritesCount();

    HomePresenter.init({
      storiesContainer,
      loadingContainer,
      callbacks: {
        navigateToLogin: () => {
          window.location.hash = '#/login';
        },
        showErrorMessage: (message) => {
          this._showErrorToast(message);
        },
        displayStories: async (stories) => {
          await this._displayStories(stories, storiesContainer);
        },
        showLoading: () => {
          this._showLoading(loadingContainer);
        },
        hideLoading: () => {
          this._hideLoading(loadingContainer);
        }
      }
    });
  },

  async _displayStories(stories, container) {
    container.innerHTML = '';

    if (stories.length === 0) {
      container.innerHTML = '<p class="empty-message">No stories found</p>';
      return;
    }

    // Check favorite status for each story
    for (const story of stories) {
      if (!story.photoUrl) {
        story.photoUrl = './images/logo.png';
      }
      
      // Check if story is in favorites
      const isFavorite = await this._checkFavoriteStatus(story.id);
      
      const storyElement = document.createElement('div');
      storyElement.innerHTML = this._createStoryItemTemplate(story, isFavorite);
      
      const actualStoryElement = storyElement.firstElementChild;
      container.appendChild(actualStoryElement);

      // Add favorite button event listener
      const favoriteBtn = actualStoryElement.querySelector('.favorite-btn');
      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._toggleFavorite(story, favoriteBtn);
        });
      }

      // Initialize map if location exists
      if (story.lat && story.lon) {
        setTimeout(() => {
          const mapElement = document.getElementById(`map-${story.id}`);
          if (mapElement) {
            this._initMapForStory(`map-${story.id}`, story.lat, story.lon);
          }
        }, 100);
      }
    }
  },

  _createStoryItemTemplate(story, isFavorite) {
    const { createStoryItemTemplate } = require('../../templates');
    return createStoryItemTemplate(story, isFavorite);
  },

  async _checkFavoriteStatus(storyId) {
    try {
      return await indexedDBHandler.isFavorite(storyId);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    }
  },

  async _toggleFavorite(story, buttonElement) {
    try {
      const isCurrentlyFavorite = buttonElement.classList.contains('favorited');
      
      if (isCurrentlyFavorite) {
        // Remove from favorites
        await indexedDBHandler.removeFromFavorites(story.id);
        buttonElement.classList.remove('favorited');
        buttonElement.querySelector('.favorite-icon').textContent = '🤍';
        buttonElement.title = 'Add to favorites';
        buttonElement.setAttribute('aria-label', 'Add to favorites');
        this._showToast('Removed from favorites', 'success');
      } else {
        // Add to favorites
        await indexedDBHandler.addToFavorites(story);
        buttonElement.classList.add('favorited');
        buttonElement.querySelector('.favorite-icon').textContent = '❤️';
        buttonElement.title = 'Remove from favorites';
        buttonElement.setAttribute('aria-label', 'Remove from favorites');
        this._showToast('Added to favorites', 'success');
      }

      // Update favorites count
      await this._updateFavoritesCount();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this._showToast('Error updating favorites', 'error');
    }
  },

  async _updateFavoritesCount() {
    try {
      const count = await indexedDBHandler.getFavoritesCount();
      const countElement = document.getElementById('favorites-count');
      if (countElement) {
        countElement.textContent = count;
        countElement.style.display = count > 0 ? 'inline' : 'none';
      }
    } catch (error) {
      console.error('Error updating favorites count:', error);
    }
  },

  _initMapForStory(elementId, lat, lon) {
    const { initMapForStory } = require('../../utils/map');
    initMapForStory(elementId, lat, lon);
  },

  _showLoading(container) {
    if (container) {
      container.style.display = 'flex';
      container.innerHTML = '<div class="loading-spinner"></div>';
    }
  },

  _hideLoading(container) {
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  },

  _showErrorToast(message) {
    this._showToast(message, 'error');
  },

  _showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }, 100);
  }
};

export default HomePage;