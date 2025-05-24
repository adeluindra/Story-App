import { showErrorToast } from './notification';

const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export function setAuthToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setUser(user) {
  if (!user) {
    throw new Error('User data is required');
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export function removeUser() {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return getAuthToken() !== null;
}

export function logout() {
  removeAuthToken();
  removeUser();
  window.location.hash = '#/';
  window.location.reload(); 
}

export function checkAuthState() {
  const authLinks = document.getElementById('auth-links');
  if (!authLinks) return;

  const token = getAuthToken();
  const user = getUser();

  const oldAuthLinks = authLinks.innerHTML;
  
  if (token && user) {
    authLinks.innerHTML = `
      <li><span class="nav-user">Hello, ${user.name}</span></li>
      <li><a href="#" id="logout">Logout</a></li>
    `;
    
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation(); 
        console.log('Logout clicked'); 
        logout();
      });
    }
  } else {
    authLinks.innerHTML = `
      <li><a href="#/login">Login</a></li>
      <li><a href="#/register">Register</a></li>
    `;
  }
}