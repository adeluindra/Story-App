const DB_NAME = 'StoryAppDB';
const DB_VERSION = 1;
const STORIES_STORE = 'stories';

class IndexedDBHandler {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(STORIES_STORE)) {
          const storiesStore = db.createObjectStore(STORIES_STORE, { 
            keyPath: 'id',
            autoIncrement: false 
          });
          
          storiesStore.createIndex('createdAt', 'createdAt', { unique: false });
          storiesStore.createIndex('name', 'name', { unique: false });
        }
      };
    });
  }

  async saveStories(stories) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);

      let savedCount = 0;
      const totalStories = stories.length;

      if (totalStories === 0) {
        resolve([]);
        return;
      }

      stories.forEach((story) => {
        const storyWithMetadata = {
          ...story,
          savedAt: new Date().toISOString(),
          isOffline: true
        };

        const request = store.put(storyWithMetadata);

        request.onsuccess = () => {
          savedCount++;
          if (savedCount === totalStories) {
            resolve(stories);
          }
        };

        request.onerror = () => {
          reject(new Error(`Failed to save story: ${story.id}`));
        };
      });

      transaction.onerror = () => {
        reject(new Error('Transaction failed while saving stories'));
      };
    });
  }

  async saveStory(story) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);

      const storyWithMetadata = {
        ...story,
        savedAt: new Date().toISOString(),
        isOffline: true
      };

      const request = store.put(storyWithMetadata);

      request.onsuccess = () => {
        resolve(storyWithMetadata);
      };

      request.onerror = () => {
        reject(new Error(`Failed to save story: ${story.id}`));
      };
    });
  }

  async getAllStories() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const stories = request.result || [];
        stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(stories);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve stories from IndexedDB'));
      };
    });
  }

  async getStoryById(id) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to retrieve story with ID: ${id}`));
      };
    });
  }

  async deleteStory(id) {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete story with ID: ${id}`));
      };
    });
  }

  async deleteAllStories() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error('Failed to clear all stories'));
      };
    });
  }

  async getStoriesCount() {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORIES_STORE], 'readonly');
      const store = transaction.objectStore(STORIES_STORE);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to count stories'));
      };
    });
  }

  async searchStories(query) {
    if (!this.db) {
      await this.init();
    }

    const allStories = await this.getAllStories();
    const lowercaseQuery = query.toLowerCase();

    return allStories.filter(story => 
      story.name.toLowerCase().includes(lowercaseQuery) ||
      story.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  static isSupported() {
    return 'indexedDB' in window;
  }

  async getDBInfo() {
    const count = await this.getStoriesCount();
    return {
      name: DB_NAME,
      version: DB_VERSION,
      storiesCount: count,
      isConnected: !!this.db
    };
  }
}

const indexedDBHandler = new IndexedDBHandler();

export default indexedDBHandler;