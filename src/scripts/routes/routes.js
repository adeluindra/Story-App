import HomePage from '../pages/home/home-page';
import AboutPage from '../pages/about/about-page';
import NewPage from '../pages/new/new-page';
import StoryDetailPage from '../pages/story-detail/story-detail-page';
import LoginPage from '../pages/auth/login/login-page';
import RegisterPage from '../pages/auth/register/register-page';

const routes = {
  '/': HomePage,
  '/about': AboutPage,
  '/new': NewPage,
  '/story-detail/:id': StoryDetailPage,
  '/login': LoginPage,
  '/register': RegisterPage,
};

export default routes;