const STORAGE_KEY_PREFIX = '';

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memory = new Map<string, string>();

function createWebStorage(): StorageLike {
  return {
    async getItem(key) {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(STORAGE_KEY_PREFIX + key);
        }
      } catch {
        // ignore
      }
      return memory.get(key) ?? null;
    },
    async setItem(key, value) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_PREFIX + key, value);
          return;
        }
      } catch {
        // ignore
      }
      memory.set(key, value);
    },
    async removeItem(key) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY_PREFIX + key);
          return;
        }
      } catch {
        // ignore
      }
      memory.delete(key);
    },
  };
}

let storagePromise: Promise<StorageLike> | null = null;

async function getStorage(): Promise<StorageLike> {
  if (!storagePromise) {
    storagePromise = (async () => {
      try {
        const mod = await import('@react-native-async-storage/async-storage');
        return mod.default as StorageLike;
      } catch {
        return createWebStorage();
      }
    })();
  }
  return storagePromise;
}

export const appStorage = {
  async getItem(key: string) {
    const storage = await getStorage();
    return storage.getItem(key);
  },
  async setItem(key: string, value: string) {
    const storage = await getStorage();
    await storage.setItem(key, value);
  },
  async removeItem(key: string) {
    const storage = await getStorage();
    await storage.removeItem(key);
  },
};
