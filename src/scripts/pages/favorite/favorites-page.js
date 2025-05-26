import { createFavoritesTemplate, createLoadingTemplate } from '../../templates';
import indexedDBHandler from '../../data/indexeddb';

const FavoritesPage = {
  render() {
    return `
      ${createFavoritesTemplate()}
      ${createLoadingTemplate()}
    `;
  },

  async afterRender() {
    const storiesContainer = document.getElementById('favorite-stories');
    const loadingContainer = document.getElementById('loading');
    const emptyContainer = document.getElementById('empty-favorites');

    await this._loadFavoriteStories(storiesContainer, loadingContainer, emptyContainer);
  },

  async _loadFavoriteStories(storiesContainer, loadingContainer, emptyContainer) {
    try {
      this._showLoading(loadingContainer);
      
      const favoriteStories = await indexedDBHandler.getAllFavorites();
      
      this._hideLoading(loadingContainer);
      
      if (favoriteStories.length === 0) {
        this._showEmptyState(emptyContainer);
        return;
      }

      await this._displayFavoriteStories(favoriteStories, storiesContainer);
    } catch (error) {
      console.error('Error loading favorite stories:', error);
      this._hideLoading(loadingContainer);
      this._showErrorMessage(storiesContainer, 'Failed to load favorite stories');
    }
  },

  async _displayFavoriteStories(stories, container) {
    container.innerHTML = '';

    for (const story of stories) {
      if (!story.photoUrl) {
        story.photoUrl = './images/logo.png';
      }
      
      const storyElement = document.createElement('div');
      storyElement.innerHTML = this._createStoryItemTemplate(story, true); // Always true for favorites page
      
      const actualStoryElement = storyElement.firstElementChild;
      container.appendChild(actualStoryElement);

      // Add favorite button event listener
      const favoriteBtn = actualStoryElement.querySelector('.favorite-btn');
      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._removeFavorite(story, actualStoryElement);
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

  async _removeFavorite(story, storyElement) {
    try {
      await indexedDBHandler.removeFromFavorites(story.id);
      
      // Animate removal
      storyElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      storyElement.style.opacity = '0';
      storyElement.style.transform = 'translateX(-100px)';
      
      setTimeout(() => {
        storyElement.remove();
        
        // Check if container is now empty
        const container = document.getElementById('favorite-stories');
        if (container.children.length === 0) {
          const emptyContainer = document.getElementById('empty-favorites');
          this._showEmptyState(emptyContainer);
        }
      }, 300);
      
      this._showToast('Removed from favorites', 'success');
    } catch (error) {
      console.error('Error removing favorite:', error);
      this._showToast('Error removing favorite', 'error');
    }
  },

  _createStoryItemTemplate(story, isFavorite) {
    const { createStoryItemTemplate } = require('../../templates');
    return createStoryItemTemplate(story, isFavorite);
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

  _showEmptyState(container) {
    if (container) {
      container.style.display = 'block';
    }
  },

  _showErrorMessage(container, message) {
    container.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
        <button onclick="location.reload()" class="button">Try Again</button>
      </div>
    `;
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

export default FavoritesPage;