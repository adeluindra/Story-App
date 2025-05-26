import { createLoadingTemplate } from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';
import indexedDBHandler from '../../data/indexeddb';

const StoryDetailPage = {
  render() {
    return `
      <div id="story-detail-container" class="story-detail-container"></div>
      ${createLoadingTemplate()}
    `;
  },

  afterRender() {
    const storyDetailView = {
      container: document.getElementById('story-detail-container'),
      loadingElement: document.querySelector('.loading'),
      
      showLoading() {
        this.loadingElement.style.display = 'flex';
      },
      
      hideLoading() {
        this.loadingElement.style.display = 'none';
      },
      
      async renderStory(story) {
        const isFavorite = await this._checkFavoriteStatus(story.id);
        
        const storyTemplate = this._createStoryDetailTemplate(story, isFavorite);
        this.container.innerHTML = storyTemplate;

        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
          favoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this._toggleFavorite(story, favoriteBtn);
          });
        }
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
            await indexedDBHandler.removeFromFavorites(story.id);
            buttonElement.classList.remove('favorited');
            buttonElement.querySelector('.favorite-icon').textContent = '🤍';
            buttonElement.querySelector('.favorite-text').textContent = 'Add to Favorites';
            buttonElement.title = 'Add to favorites';
            this._showToast('Removed from favorites', 'success');
          } else {
            await indexedDBHandler.addToFavorites(story);
            buttonElement.classList.add('favorited');
            buttonElement.querySelector('.favorite-icon').textContent = '❤️';
            buttonElement.querySelector('.favorite-text').textContent = 'Remove from Favorites';
            buttonElement.title = 'Remove from favorites';
            this._showToast('Added to favorites', 'success');
          }
        } catch (error) {
          console.error('Error toggling favorite:', error);
          this._showToast('Error updating favorites', 'error');
        }
      },

      _createStoryDetailTemplate(story, isFavorite) {
        const { createStoryDetailTemplate } = require('../../templates');
        return createStoryDetailTemplate(story, isFavorite);
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
      },
      
      initMap(story) {
        if (story.lat && story.lon) {
          setTimeout(() => {
            const mapElement = document.getElementById('map');
            if (mapElement) {
              const map = this._initMapElement(mapElement);
              if (map && window.L) {
                window.L.marker([story.lat, story.lon]).addTo(map)
                  .bindPopup('Story location')
                  .openPopup();
                map.setView([story.lat, story.lon], 15);
              }
            }
          }, 100);
        }
      },
      
      _initMapElement(mapElement) {
        const { initMap } = require('../../utils/map');
        return initMap(mapElement);
      },
      
      redirectToHome() {
        window.location.hash = '#/';
      }
    };
    
    StoryDetailPresenter.init({
      view: storyDetailView
    });
  },
};

export default StoryDetailPage;