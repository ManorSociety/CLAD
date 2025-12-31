/**
 * CLAD Storage Service - IndexedDB with offline caching support
 */

import { Project, UsageStats, SubscriptionTier, SavedColor } from '../types';

const DB_NAME = 'CladStudioDB';
const DB_VERSION = 3;

export class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('offlineCache')) {
          db.createObjectStore('offlineCache', { keyPath: 'projectId' });
        }
        if (!db.objectStoreNames.contains('savedColors')) {
          db.createObjectStore('savedColors', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    });
    return this.initPromise;
  }

  // ============ PROJECTS ============
  async saveProjects(projects: Project[]): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['projects'], 'readwrite');
      const store = tx.objectStore('projects');
      store.clear();
      projects.forEach(p => store.add(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveProject(project: Project): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['projects'], 'readwrite');
      tx.objectStore('projects').put(project);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['projects'], 'readwrite');
      tx.objectStore('projects').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllProjects(): Promise<Project[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['projects'], 'readonly');
      const request = tx.objectStore('projects').getAll();
      request.onsuccess = () => resolve((request.result || []).sort((a: Project, b: Project) => b.createdAt - a.createdAt));
      request.onerror = () => reject(request.error);
    });
  }

  async getProject(id: string): Promise<Project | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['projects'], 'readonly');
      const request = tx.objectStore('projects').get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ USAGE ============
  async saveUsage(usage: UsageStats): Promise<void> {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db!.transaction(['settings'], 'readwrite');
      tx.objectStore('settings').put(usage, 'usage');
      resolve();
    });
  }

  async getUsage(): Promise<UsageStats | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['settings'], 'readonly');
      const request = tx.objectStore('settings').get('usage');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ SAVED COLORS ============
  async saveColor(color: SavedColor): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['savedColors'], 'readwrite');
      tx.objectStore('savedColors').put(color);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllColors(): Promise<SavedColor[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['savedColors'], 'readonly');
      const request = tx.objectStore('savedColors').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteColor(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['savedColors'], 'readwrite');
      tx.objectStore('savedColors').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ============ OFFLINE CACHE ============
  async cacheProjectForOffline(projectId: string, data: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['offlineCache'], 'readwrite');
      tx.objectStore('offlineCache').put({ projectId, data, cachedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getOfflineCachedProject(projectId: string): Promise<any | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['offlineCache'], 'readonly');
      const request = tx.objectStore('offlineCache').get(projectId);
      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllOfflineCachedProjects(): Promise<string[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['offlineCache'], 'readonly');
      const request = tx.objectStore('offlineCache').getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromOfflineCache(projectId: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['offlineCache'], 'readwrite');
      tx.objectStore('offlineCache').delete(projectId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ============ PENDING SYNC ============
  async addToPendingSync(item: { id: string; type: string; data: any }): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['pendingSync'], 'readwrite');
      tx.objectStore('pendingSync').put({ ...item, createdAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingSyncItems(): Promise<any[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['pendingSync'], 'readonly');
      const request = tx.objectStore('pendingSync').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingSyncItem(id: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['pendingSync'], 'readwrite');
      tx.objectStore('pendingSync').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearPendingSync(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['pendingSync'], 'readwrite');
      tx.objectStore('pendingSync').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const storage = new StorageService();

// ============ OFFLINE DETECTION ============
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const onOnlineStatusChange = (callback: (online: boolean) => void): () => void => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
