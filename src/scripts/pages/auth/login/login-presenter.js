import StoryApi from '../../../data/api';
import { setAuthToken, setUser } from '../../../utils/auth';

const LoginPresenter = {
  init({ loginForm, callbacks }) {
    this._loginForm = loginForm;
    this._callbacks = callbacks;

    this._setupEventListeners();
  },

  _setupEventListeners() {
    this._loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      this._callbacks.setLoadingState();
      
      const email = this._loginForm.querySelector('#email').value;
      const password = this._loginForm.querySelector('#password').value;

      try {
        const response = await StoryApi.login({ email, password });
        
        if (!response.loginResult || !response.loginResult.token) {
          throw new Error('Invalid login response. Token not found.');
        }
        
        setAuthToken(response.loginResult.token);
        setUser({
          id: response.loginResult.userId,
          name: response.loginResult.name,
        });

        this._callbacks.navigateToHome();
      } catch (error) {
        this._callbacks.showErrorMessage(error.message);
      } finally {
        this._callbacks.setDefaultState();
      }
    });
  },
};

export default LoginPresenter;