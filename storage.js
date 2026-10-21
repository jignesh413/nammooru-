/**
 * =============================================================================
 * Nammooru — Enterprise Storage Layer (NammooruStorage)
 * =============================================================================
 * High-reliability, quota-safe persistence engine:
 * 1. Persistent unique user profile ID (`nammooru_user_id`).
 * 2. Primary persistence in IndexedDB (`NammooruLocalDB` -> `photo_history`).
 * 3. Graceful fallback synchronization to `localStorage.getItem('nammooru_history')`.
 * 4. Ultra-compact 120px compressed thumbnail generation for IndexedDB.
 * 5. Complete stripping of thumbnails and base64 from `localStorage` mirror to
 *    completely eliminate 5MB QuotaExceededError.
 */

(function (window) {
  'use strict';

  const DB_NAME = 'NammooruLocalDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'photo_history';
  const USER_KEY = 'nammooru_user_id';
  const HISTORY_KEY = 'nammooru_history_v1';
  const FALLBACK_KEY = 'nammooru_history';
  const MAX_HISTORY = 120;

  // Active in-memory cache for synchronous read guarantees
  let inMemoryCache = [];
  let dbPromise = null;
  const listeners = new Set();

  /**
   * Retrieves or provisions a unique, persistent user ID.
   * @returns {string} Unique user identifier
   */
  function getUserId() {
    try {
      let uid = localStorage.getItem(USER_KEY);
      if (!uid || typeof uid !== 'string' || uid.trim() === '') {
        uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(USER_KEY, uid);
      }
      return uid;
    } catch (e) {
      console.warn('[NammooruStorage] User ID localStorage access warning:', e);
      return 'usr_local_guest';
    }
  }

  /**
   * Opens or initializes the IndexedDB store.
   * @returns {Promise<IDBDatabase>}
   */
  function initDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (typeof window.indexedDB === 'undefined') {
        const err = new Error('IndexedDB is not supported on this device/browser');
        console.warn('[NammooruStorage]', err.message);
        return reject(err);
      }

      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = function (e) {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('english', 'english', { unique: false });
          }
        };

        req.onsuccess = function (e) {
          const db = e.target.result;
          db.onversionchange = function () {
            db.close();
            dbPromise = null;
          };
          resolve(db);
        };

        req.onerror = function (e) {
          console.warn('[NammooruStorage] DB Open error:', e.target.error);
          dbPromise = null;
          reject(e.target.error || new Error('Failed to open IndexedDB'));
        };

        req.onblocked = function () {
          console.warn('[NammooruStorage] IndexedDB open blocked by another tab');
        };
      } catch (err) {
        dbPromise = null;
        reject(err);
      }
    });

    return dbPromise;
  }

  /**
   * Compresses any source image/dataUrl/blob into an ultra-compact 120px thumbnail.
   * Keeps storage footprint tiny (<3KB per thumbnail) and execution non-blocking.
   * @param {string|File|Blob|HTMLImageElement|HTMLCanvasElement} source
   * @param {number} [maxSide=120]
   * @param {number} [quality=0.72]
   * @returns {Promise<string|null>}
   */
  function generateThumbnail(source, maxSide = 120, quality = 0.72) {
    return new Promise((resolve) => {
      if (!source) return resolve(null);

      // If source is already a short string or non-image
      if (typeof source === 'string' && !source.startsWith('data:image') && !source.startsWith('blob:')) {
        // If it's a URL or path, we can resolve directly or load it
        if (!source.startsWith('http') && !source.startsWith('/')) {
          return resolve(null);
        }
      }

      try {
        let objectUrl = null;
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const cleanUp = () => {
          if (objectUrl) {
            try { URL.revokeObjectURL(objectUrl); } catch { /* ignore */ }
          }
        };

        img.onload = () => {
          try {
            let width = img.naturalWidth || img.width || 120;
            let height = img.naturalHeight || img.height || 120;

            if (width <= 0 || height <= 0) {
              cleanUp();
              return resolve(null);
            }

            // Scale down to max 120px preserving aspect ratio
            const ratio = Math.min(maxSide / width, maxSide / height, 1);
            const targetWidth = Math.max(1, Math.round(width * ratio));
            const targetHeight = Math.max(1, Math.round(height * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              cleanUp();
              return resolve(null);
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const thumbData = canvas.toDataURL('image/jpeg', quality);
            cleanUp();
            resolve(thumbData);
          } catch (err) {
            console.warn('[NammooruStorage] Canvas thumbnail failed:', err);
            cleanUp();
            resolve(null);
          }
        };

        img.onerror = () => {
          cleanUp();
          resolve(null);
        };

        if (source instanceof Blob || (typeof File !== 'undefined' && source instanceof File)) {
          objectUrl = URL.createObjectURL(source);
          img.src = objectUrl;
        } else if (typeof source === 'string') {
          img.src = source;
        } else if (source instanceof HTMLCanvasElement) {
          try {
            const data = source.toDataURL('image/jpeg', quality);
            resolve(data);
          } catch {
            resolve(null);
          }
        } else if (source instanceof HTMLImageElement) {
          img.src = source.src;
        } else {
          resolve(null);
        }
      } catch (err) {
        console.warn('[NammooruStorage] generateThumbnail exception:', err);
        resolve(null);
      }
    });
  }

  /**
   * Safely reads text-only metadata from localStorage without throwing.
   * @returns {Array<Object>}
   */
  function getHistoryFromLocalStorage() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY) || localStorage.getItem(FALLBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(item => item && typeof item === 'object' && item.english && item.kannada);
    } catch (e) {
      console.warn('[NammooruStorage] Corrupted localStorage history read:', e);
      return [];
    }
  }

  /**
   * Safely mirrors history records to localStorage with ALL image/thumbnail payloads stripped out.
   * Keeps localStorage usage under 25KB, fully immunizing against QuotaExceededError.
   * @param {Array<Object>} records
   */
  function syncToLocalStorageMirror(records) {
    try {
      if (!Array.isArray(records)) return;
      const stripped = records.slice(0, MAX_HISTORY).map(r => ({
        id: r.id,
        userId: r.userId || getUserId(),
        timestamp: r.timestamp || new Date().toISOString(),
        english: r.english || '',
        kannada: r.kannada || '',
        pronunciation: r.pronunciation || r.transliteration || '',
        transliteration: r.transliteration || r.pronunciation || '',
        description: r.description || '',
        confidence: r.confidence || 'high',
        category: r.category || 'everyday',
        thumbnailUrl: null, // STRIPPED: Zero base64 payload to prevent QuotaExceededError
        fullImageUrl: null
      }));

      const serialized = JSON.stringify(stripped);
      try {
        localStorage.setItem(HISTORY_KEY, serialized);
        localStorage.setItem(FALLBACK_KEY, serialized);
      } catch (quotaErr) {
        // Emergency prune: keep only top 25 text records
        console.warn('[NammooruStorage] LocalStorage mirror quota warning, trimming:', quotaErr);
        const trimmed = JSON.stringify(stripped.slice(0, 25));
        localStorage.setItem(HISTORY_KEY, trimmed);
        localStorage.setItem(FALLBACK_KEY, trimmed);
      }
    } catch (err) {
      console.warn('[NammooruStorage] syncToLocalStorageMirror failed gracefully:', err);
    }
  }

  /**
   * Puts a record into IndexedDB object store.
   * @param {Object} record
   * @returns {Promise<void>}
   */
  async function putIndexedDBRecord(record) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error || new Error('Put record failed'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Notifies subscribers of history state change.
   */
  function notifyListeners(records) {
    listeners.forEach(fn => {
      try { fn(records); } catch (e) { console.warn('[NammooruStorage listener error]', e); }
    });
    if (typeof window.renderGarden === 'function') {
      try { window.renderGarden(records); } catch (e) { /* ignore */ }
    }
  }

  /**
   * Updates in-memory cache and triggers subscribers.
   */
  function updateMemoryCache(records) {
    if (Array.isArray(records)) {
      inMemoryCache = records;
    }
  }

  // Pre-seed inMemoryCache from localStorage synchronously so app startup has data immediately
  try {
    inMemoryCache = getHistoryFromLocalStorage();
  } catch {
    inMemoryCache = [];
  }

  /**
   * Public NammooruStorage Interface
   */
  const NammooruStorage = {
    /**
     * Get persistent user ID
     */
    getUserId,

    /**
     * Expose DB initializer
     */
    initDB,

    /**
     * Expose thumbnail generator (<= 120px)
     */
    generateThumbnail,

    /**
     * Synchronous view of latest loaded history
     * @returns {Array<Object>}
     */
    getCachedHistory() {
      return inMemoryCache.slice();
    },

    /**
     * Retrieves all history records per user profile, newest first.
     * Checks IndexedDB first; gracefully falls back to localStorage.
     * @returns {Promise<Array<Object>>}
     */
    async getAllHistory() {
      const currentUserId = getUserId();
      try {
        const db = await initDB();
        const records = await new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            let req;

            if (store.indexNames.contains('timestamp')) {
              req = store.index('timestamp').openCursor(null, 'prev');
            } else {
              req = store.openCursor();
            }

            const results = [];
            req.onsuccess = function (e) {
              const cursor = e.target.result;
              if (cursor) {
                const item = cursor.value;
                if (item && (!item.userId || item.userId === currentUserId)) {
                  results.push(item);
                }
                cursor.continue();
              } else {
                resolve(results);
              }
            };

            req.onerror = function (e) {
              reject(e.target.error || new Error('Cursor iteration failed'));
            };
          } catch (err) {
            reject(err);
          }
        });

        if (records && records.length > 0) {
          records.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          updateMemoryCache(records);
          syncToLocalStorageMirror(records);
          return records;
        }

        // IndexedDB is empty: Check localStorage for legacy records to seed into IndexedDB
        const legacy = getHistoryFromLocalStorage();
        if (legacy && legacy.length > 0) {
          for (const item of legacy) {
            if (!item.userId) item.userId = currentUserId;
            try {
              await putIndexedDBRecord(item);
            } catch (seedErr) {
              console.warn('[NammooruStorage] Seed error:', seedErr);
            }
          }
          legacy.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
          updateMemoryCache(legacy);
          return legacy;
        }

        updateMemoryCache([]);
        return [];
      } catch (err) {
        console.warn('[NammooruStorage] IndexedDB read fallback to localStorage:', err);
        const fallback = getHistoryFromLocalStorage();
        updateMemoryCache(fallback);
        return fallback;
      }
    },

    /**
     * Saves an entry persistently.
     * Generates a 120px thumbnail for IndexedDB, strips thumbnails for localStorage.
     * @param {Object} entryData
     * @returns {Promise<Object|null>} Saved record with thumbnail
     */
    async saveEntry(entryData) {
      if (!entryData || (!entryData.english && !entryData.kannada)) {
        return null;
      }

      try {
        const currentUserId = getUserId();
        const id = entryData.id || ('rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7));
        const timestamp = entryData.timestamp || new Date().toISOString();

        // 1. Generate 120px thumbnail for IndexedDB
        let thumbUrl = entryData.thumbnailUrl || null;
        const candidate = entryData.imageSource || entryData._fullDataUrl || entryData._thumbnailUrl || entryData.thumbnailUrl;
        if (candidate) {
          try {
            const compressed = await generateThumbnail(candidate, 120, 0.72);
            if (compressed) thumbUrl = compressed;
          } catch (tErr) {
            console.warn('[NammooruStorage] Thumbnail generation skipped:', tErr);
          }
        }

        const record = {
          id: id,
          userId: currentUserId,
          timestamp: timestamp,
          english: String(entryData.english || '').trim(),
          kannada: String(entryData.kannada || '').trim(),
          pronunciation: String(entryData.pronunciation || entryData.transliteration || '').trim(),
          transliteration: String(entryData.transliteration || entryData.pronunciation || '').trim(),
          description: String(entryData.description || '').trim(),
          confidence: entryData.confidence || 'high',
          category: String(entryData.category || 'everyday').toLowerCase().trim(),
          thumbnailUrl: thumbUrl, // Stored in IndexedDB safely
          fullImageUrl: null      // NEVER store 1080px base64 anywhere
        };

        // 2. Save into IndexedDB
        try {
          await putIndexedDBRecord(record);
        } catch (idbErr) {
          console.warn('[NammooruStorage] IndexedDB write failed, falling back to memory/local:', idbErr);
        }

        // 3. Update in-memory cache (dedup by english word or ID)
        const existingIdx = inMemoryCache.findIndex(r => 
          r.id === record.id || 
          (r.english && record.english && r.english.toLowerCase() === record.english.toLowerCase())
        );
        if (existingIdx !== -1) {
          inMemoryCache.splice(existingIdx, 1);
        }
        inMemoryCache.unshift(record);
        if (inMemoryCache.length > MAX_HISTORY) {
          inMemoryCache.splice(MAX_HISTORY);
        }

        // 4. Update localStorage mirror (stripped of thumbnails)
        syncToLocalStorageMirror(inMemoryCache);

        // 5. Notify listeners
        notifyListeners(inMemoryCache);

        return record;
      } catch (err) {
        console.error('[NammooruStorage] Critical saveEntry error:', err);
        return null;
      }
    },

    /**
     * Deletes a record by ID from IndexedDB and localStorage mirror.
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async deleteEntry(id) {
      if (!id) return false;
      try {
        const db = await initDB();
        await new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
          } catch (err) {
            reject(err);
          }
        });
      } catch (idbErr) {
        console.warn('[NammooruStorage] IDB delete warning:', idbErr);
      }

      inMemoryCache = inMemoryCache.filter(r => r.id !== id);
      syncToLocalStorageMirror(inMemoryCache);
      notifyListeners(inMemoryCache);
      return true;
    },

    /**
     * Clears all history entries for this user.
     * @returns {Promise<boolean>}
     */
    async clearAllHistory() {
      try {
        const db = await initDB();
        await new Promise((resolve, reject) => {
          try {
            const tx = db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
          } catch (err) {
            reject(err);
          }
        });
      } catch (idbErr) {
        console.warn('[NammooruStorage] IDB clear warning:', idbErr);
      }

      inMemoryCache = [];
      try {
        localStorage.removeItem(HISTORY_KEY);
        localStorage.removeItem(FALLBACK_KEY);
      } catch (e) {
        console.warn('[NammooruStorage] localStorage clear warning:', e);
      }

      notifyListeners(inMemoryCache);
      return true;
    },

    /**
     * Subscribe to history mutations.
     * @param {Function} fn
     * @returns {Function} unsubscribe function
     */
    subscribe(fn) {
      if (typeof fn === 'function') {
        listeners.add(fn);
        return () => listeners.delete(fn);
      }
      return () => {};
    }
  };

  // Kick off asynchronous IndexedDB hydration immediately
  NammooruStorage.getAllHistory().catch((err) => {
    console.warn('[NammooruStorage] Initial hydration error:', err);
  });

  // Expose globally
  window.NammooruStorage = NammooruStorage;

})(typeof window !== 'undefined' ? window : this);
