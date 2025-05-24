import { createRegisterTemplate } from '../../../templates';
import RegisterPresenter from './register-presenter';

const RegisterPage = {
  render() {
    return createRegisterTemplate();
  },

  afterRender() {
    const registerForm = document.getElementById('registerForm');
    
    RegisterPresenter.init({
      registerForm,
      callbacks: {
        navigateToLogin: () => {
          window.location.hash = '#/login';
        },
        showSuccessMessage: (message) => {
          this._showSuccessToast(message);
        },
        showErrorMessage: (message) => {
          this._showErrorToast(message);
        }
      }
    });
  },

  _showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
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

export default RegisterPage;