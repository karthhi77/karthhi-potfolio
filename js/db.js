/**
 * IndexedDB Persistent Storage for Uploaded Photos & Metadata
 * Dedicated to karthhi — Cinematographer | Editor
 */

class PortfolioDB {
  constructor() {
    this.dbName = 'LiquidPortfolio_karthhi_v4';
    this.version = 1;
    this.db = null;
  }

  async init() {
    // Purge legacy databases
    try {
      if (window.indexedDB) {
        window.indexedDB.deleteDatabase('LiquidPortfolioDB');
        window.indexedDB.deleteDatabase('LiquidPortfolio_karthhi_v2');
        window.indexedDB.deleteDatabase('LiquidPortfolio_karthhi_v3');
      }
    } catch (e) {
      console.warn('Legacy DB cleanup notice:', e);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('photos')) {
          const store = db.createObjectStore('photos', { keyPath: 'id' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('favorited', 'favorited', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'photoId' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e.target.error);
        reject(e.target.error);
      };
    });
  }

  async getAllPhotos() {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('photos', 'readonly');
      const store = tx.objectStore('photos');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async addPhoto(photo) {
    await this.ensureReady();
    const item = {
      id: photo.id || 'photo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      url: photo.url, // Data URL or relative URL
      filename: photo.filename || 'Frame.jpg',
      title: photo.title || 'Untitled Frame',
      category: photo.category || (photo.aspect === 'landscape' ? '16:9 Cinematic' : '9:16 Vertical'),
      aspect: photo.aspect || 'landscape',
      width: photo.width || 1920,
      height: photo.height || 1080,
      iso: '',
      shutter: '',
      aperture: '',
      camera: '',
      date: photo.date || new Date().toISOString().split('T')[0],
      favorited: !!photo.favorited,
      isUserUpload: true,
      createdAt: photo.createdAt || Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const req = store.put(item);

      req.onsuccess = () => resolve(item);
      req.onerror = () => reject(req.error);
    });
  }

  async updatePhoto(id, updates) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result;
        if (!item) {
          reject(new Error('Photo not found: ' + id));
          return;
        }
        Object.assign(item, updates);
        const putReq = store.put(item);
        putReq.onsuccess = () => resolve(item);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  async toggleFavorite(id) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['photos', 'favorites'], 'readwrite');
      const photoStore = tx.objectStore('photos');
      const favStore = tx.objectStore('favorites');

      const favReq = favStore.get(id);
      favReq.onsuccess = () => {
        const isFav = !!favReq.result;
        if (isFav) {
          favStore.delete(id);
        } else {
          favStore.put({ photoId: id, timestamp: Date.now() });
        }

        // Also check if photo exists in photos store
        const pReq = photoStore.get(id);
        pReq.onsuccess = () => {
          const item = pReq.result;
          if (item) {
            item.favorited = !isFav;
            photoStore.put(item);
          }
          resolve({ id, favorited: !isFav });
        };
      };
      favReq.onerror = () => reject(favReq.error);
    });
  }

  async getFavorites() {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('favorites', 'readonly');
      const store = tx.objectStore('favorites');
      const req = store.getAll();
      req.onsuccess = () => {
        const ids = new Set((req.result || []).map(f => f.photoId));
        resolve(ids);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deletePhoto(id) {
    await this.ensureReady();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('photos', 'readwrite');
      const store = tx.objectStore('photos');
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clearUserUploads() {
    const photos = await this.getAllPhotos();
    for (const p of photos) {
      await this.deletePhoto(p.id);
    }
  }

  async exportBackup() {
    const photos = await this.getAllPhotos();
    const payload = {
      version: 2,
      curator: 'karthhi',
      role: 'Cinematographer | Editor',
      exportedAt: new Date().toISOString(),
      photos
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async importBackup(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.photos || !Array.isArray(data.photos)) {
      throw new Error('Invalid backup file format');
    }
    for (const photo of data.photos) {
      await this.addPhoto(photo);
    }
    return data.photos.length;
  }

  async ensureReady() {
    if (!this.db) {
      await this.init();
    }
  }
}

window.PortfolioDB = new PortfolioDB();
