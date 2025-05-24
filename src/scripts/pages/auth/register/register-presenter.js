import StoryApi from '../../../data/api';

const RegisterPresenter = {
  init({ registerForm, callbacks }) {
    this._registerForm = registerForm;
    this._callbacks = callbacks;

    this._setupEventListeners();
  },

  _setupEventListeners() {
    this._registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const name = this._registerForm.querySelector('#name').value;
      const email = this._registerForm.querySelector('#email').value;
      const password = this._registerForm.querySelector('#password').value;

      try {
        await StoryApi.register({ name, email, password });
        
        this._callbacks.showSuccessMessage('Registration successful! Please login.');
        
        this._callbacks.navigateToLogin();
      } catch (error) {
        this._callbacks.showErrorMessage(error.message);
      }
    });
  },
};

export default RegisterPresenter;