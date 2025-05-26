export const createHomeTemplate = () => `
  <section class="hero">
    <div class="hero__inner">
      <h1 class="hero__title">Share Your Story</h1>
      <p class="hero__tagline">Tell us about your Dicoding experience</p>
    </div>
  </section>

  <section class="content">
    <div class="latest">
      <div class="latest__header">
        <h2 class="latest__label">Latest Stories</h2>
        <a href="#/favorites" class="favorites-link">
          <span class="favorites-icon">❤️</span>
          <span>My Favorites</span>
          <span id="favorites-count" class="favorites-count">0</span>
        </a>
      </div>
      <div class="stories" id="stories"></div>
      <div class="loading" id="loading"></div>
    </div>
  </section>
`;

export const createFavoritesTemplate = () => `
  <section class="favorites">
    <div class="favorites__header">
      <h2 class="favorites__title">My Favorite Stories</h2>
      <a href="#/" class="back-link">← Back to Home</a>
    </div>
    <div class="favorites__content">
      <div class="stories" id="favorite-stories"></div>
      <div class="loading" id="loading"></div>
      <div class="empty-favorites" id="empty-favorites" style="display: none;">
        <p>No favorite stories yet. Start adding some from the home page!</p>
        <a href="#/" class="button">Browse Stories</a>
      </div>
    </div>
  </section>
`;

export const createAboutTemplate = () => `
  <section class="about">
    <div class="about__inner container">
      <h2 class="about__title">About Story App</h2>
      <div class="about__content">
        <div class="about__image">
          <img src="./images/jumbotron.jpg" alt="Dicoding Team" class="lazyload">
        </div>
        <div class="about__description">
          <p>Story App is a platform for sharing your experiences at Dicoding. You can post stories with photos and locations to share with others.</p>
          <p>This application is built with pure JavaScript using the MVP (Model-View-Presenter) pattern and follows accessibility standards.</p>
        </div>
      </div>
    </div>
  </section>
`;

export const createStoryItemTemplate = (story, isFavorite = false) => `
  <article class="story-item" tabindex="0">
    <div class="story-item__header">
      <h3 class="story-item__name">${story.name}</h3>
      <div class="story-item__meta">
        <time class="story-item__date" datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</time>
        <button 
          class="favorite-btn ${isFavorite ? 'favorited' : ''}" 
          data-story-id="${story.id}"
          title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
          aria-label="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
        >
          <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
        </button>
      </div>
    </div>
    <div class="story-item__content">
      <img 
        class="story-item__image lazyload" 
        data-src="${story.photoUrl}" 
        src="${story.photoUrl}" 
        alt="${story.name || 'Story image'}"
        onerror="this.onerror=null; this.src='./images/logo.png';"
      >
      <p class="story-item__description">${story.description}</p>
    </div>
    ${story.lat && story.lon ? `
    <div class="story-item__map" id="map-${story.id}"></div>
    ` : ''}
    <div class="story-item__footer">
      <a href="#/story-detail/${story.id}" class="story-item__button">Read More</a>
    </div>
  </article>
`;

export const createStoryDetailTemplate = (story, isFavorite = false) => `
  <section class="story-detail">
    <div class="story-detail__header">
      <h2 class="story-detail__title">${story.name}'s Story</h2>
      <div class="story-detail__meta">
        <time class="story-detail__date" datetime="${story.createdAt}">${new Date(story.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</time>
        <button 
          class="favorite-btn large ${isFavorite ? 'favorited' : ''}" 
          id="favorite-btn"
          data-story-id="${story.id}"
          title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
        >
          <span class="favorite-icon">${isFavorite ? '❤️' : '🤍'}</span>
          <span class="favorite-text">${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </button>
      </div>
    </div>
    <div class="story-detail__content">
      <img 
        class="story-detail__image" 
        src="${story.photoUrl}" 
        alt="${story.name || 'Story image'}"
        onerror="this.onerror=null; this.src='./images/logo.png';"
      >
      <p class="story-detail__description">${story.description}</p>
      ${story.lat && story.lon ? `
      <div class="story-detail__map" id="map"></div>
      ` : ''}
    </div>
    <div class="story-detail__footer">
      <a href="#/" class="story-detail__button">Back to Home</a>
    </div>
  </section>
`;

export const createNewStoryTemplate = () => `
  <section class="new-story">
    <h2 class="new-story__title">Add New Story</h2>
    <form id="storyForm" class="story-form">
      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" required></textarea>
      </div>
      <div class="form-group">
        <label for="photoInput">Photo</label>
        <input type="file" id="photoInput" name="photo" accept="image/*" capture="environment">
        
        <div class="camera-container">
          <!-- Camera Selection Dropdown -->
          <div class="camera-select-container" style="display: none;">
            <label for="cameraSelect">Choose Camera:</label>
            <select id="cameraSelect" class="camera-select">
              <option value="">Loading cameras...</option>
            </select>
          </div>
          
          <!-- Toggle Camera Button -->
          <button type="button" id="toggleCamera" class="button">Buka Kamera</button>
          
          <video id="camera" class="camera" autoplay playsinline style="display: none;"></video>
          <canvas id="canvas" class="canvas"></canvas>
          <div class="camera-controls">
            <button type="button" id="takePhoto" class="button" style="display: none;">Take Photo</button>
            <button type="button" id="retakePhoto" class="button secondary" style="display: none;">Retake</button>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="location">Location</label>
        <div class="map-container" id="map"></div>
        <button type="button" id="getLocation" class="button">Use Current Location</button>
        <input type="hidden" id="lat" name="lat">
        <input type="hidden" id="lon" name="lon">
      </div>
      <button type="submit" class="button primary">Submit Story</button>
    </form>
  </section>
`;

export const createLoginTemplate = () => `
  <section class="auth">
    <div class="auth__inner">
      <h2 class="auth__title">Login</h2>
      <form id="loginForm" class="auth__form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required minlength="8">
        </div>
        <button type="submit" class="button primary">Login</button>
      </form>
      <p class="auth__link">Don't have an account? <a href="#/register">Register here</a></p>
    </div>
  </section>
`;

export const createRegisterTemplate = () => `
  <section class="auth">
    <div class="auth__inner">
      <h2 class="auth__title">Register</h2>
      <form id="registerForm" class="auth__form">
        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required minlength="8">
        </div>
        <button type="submit" class="button primary">Register</button>
      </form>
      <p class="auth__link">Already have an account? <a href="#/login">Login here</a></p>
    </div>
  </section>
`;

export const createLoadingTemplate = () => `
  <div class="loading" id="loading" style="display: none;">
    <div class="loading-spinner"></div>
    <p class="loading__text">Loading...</p>
  </div>
`;

export const createErrorTemplate = (message) => `
  <div class="error">
    <p class="error__message">${message}</p>
  </div>
`;