import { createLoginTemplate } from '../../../templates';
import LoginPresenter from './login-presenter';

const LoginPage = {
  render() {
    return createLoginTemplate();
  },

  afterRender() {
    const loginForm = document.getElementById('loginForm');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    LoginPresenter.init({
      loginForm,
      callbacks: {
        setLoadingState: () => {
          submitButton.disabled = true;
          submitButton.textContent = 'Logging in...';
        },
        setDefaultState: () => {
          submitButton.disabled = false;
          submitButton.textContent = 'Login';
        },
        navigateToHome: () => {
          window.location.hash = '#/';
        },
        showErrorMessage: (message) => {
          this._showErrorToast(message);
        }
      }
    });
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

export default LoginPage;