import { createHomeTemplate, createLoadingTemplate } from '../../templates';
import HomePresenter from './home-presenter';

const HomePage = {
  render() {
    return `
      ${createHomeTemplate()}
      ${createLoadingTemplate()}
    `;
  },

  afterRender() {
    const storiesContainer = document.getElementById('stories');
    const loadingContainer = document.getElementById('loading');

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
        displayStories: (stories) => {
          this._displayStories(stories, storiesContainer);
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

  _displayStories(stories, container) {
    container.innerHTML = '';

    if (stories.length === 0) {
      container.innerHTML = '<p class="empty-message">No stories found</p>';
      return;
    }

    stories.forEach((story) => {
      if (!story.photoUrl) {
        story.photoUrl = './images/logo.png';
      }
      
      const storyElement = document.createElement('div');
      storyElement.innerHTML = this._createStoryItemTemplate(story);
      
      const actualStoryElement = storyElement.firstElementChild;
      container.appendChild(actualStoryElement);

      if (story.lat && story.lon) {
        setTimeout(() => {
          const mapElement = document.getElementById(`map-${story.id}`);
          if (mapElement) {
            this._initMapForStory(`map-${story.id}`, story.lat, story.lon);
          }
        }, 100);
      }
    });
  },

  _createStoryItemTemplate(story) {
    const { createStoryItemTemplate } = require('../../templates');
    return createStoryItemTemplate(story);
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
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }, 100);
  }
};

export default HomePage;