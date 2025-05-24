import { createLoadingTemplate } from '../../templates';
import StoryDetailPresenter from './story-detail-presenter';

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
      
      renderStory(storyTemplate) {
        this.container.innerHTML = storyTemplate;
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