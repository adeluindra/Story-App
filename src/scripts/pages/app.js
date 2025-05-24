import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { checkAuthState, getAuthToken } from '../utils/auth';
import { createNotificationToggle, initNotificationToggle } from '../utils/notification-toggle';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #skipLink = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#skipLink = document.querySelector('.skip-link');

    this._setupDrawer();
    this._setupSkipLink();
    this._initNotificationToggle();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) && !this.#drawerButton.contains(event.target)) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  _setupSkipLink() {
    if (this.#skipLink) {
      this.#skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        this.#skipLink.blur();
        this.#content.focus();
        this.#content.scrollIntoView();
      });
    }
  }

  _initNotificationToggle() {
    const token = getAuthToken();
    const notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) return;

    if (token) {
      notificationContainer.style.display = 'block';
      if (!document.getElementById('notification-toggle-btn')) {
        const notificationToggleHTML = createNotificationToggle();
        notificationContainer.innerHTML = notificationToggleHTML;

        // Initialize event listeners
        setTimeout(() => {
          initNotificationToggle();
        }, 100);
      }
    } else {
      notificationContainer.style.display = 'none';
      notificationContainer.innerHTML = '';
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    if (!page) {
      this.#content.innerHTML = '<h1>Page Not Found</h1>';
      return;
    }

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        this.#content.innerHTML = page.render();
        page.afterRender();
        this._initNotificationToggle();
      });
    } else {
      this.#content.innerHTML = page.render();
      await page.afterRender();
      this._initNotificationToggle();
    }
  }
}

export default App;