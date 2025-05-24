import { parseActivePathname } from '../../routes/url-parser';
import StoryApi from '../../data/api';
import { getAuthToken } from '../../utils/auth';
import { showErrorToast } from '../../utils/notification';
import { createStoryDetailTemplate } from '../../templates';

const StoryDetailPresenter = {
  init({ view }) {
    this._view = view;
    this._token = getAuthToken();
    this._storyId = parseActivePathname().id;

    this._view.showLoading();
    this._fetchStoryDetail();
  },

  async _fetchStoryDetail() {
    try {
      const story = await StoryApi.getStoryDetail(this._storyId, this._token);
      
      if (!story.photoUrl) {
        story.photoUrl = './images/logo.png';
      }
      
      this._displayStory(story);
    } catch (error) {
      showErrorToast(error.message);
      this._view.redirectToHome();
    } finally {
      this._view.hideLoading();
    }
  },

  _displayStory(story) {
    const storyTemplate = createStoryDetailTemplate(story);
    this._view.renderStory(storyTemplate);
    
    if (story.lat && story.lon) {
      this._view.initMap(story);
    }
  }
};

export default StoryDetailPresenter;