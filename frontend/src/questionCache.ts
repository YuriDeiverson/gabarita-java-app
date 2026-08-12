import type { Question } from './types';

const DATABASE_NAME = 'gabarita-content-cache';
const DATABASE_VERSION = 1;
const STORE_NAME = 'question-sets';

interface CachedQuestionSet {
  key: string;
  questions: Question[];
  updatedAt: number;
}

let databasePromise: Promise<IDBDatabase | null> | null = null;

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (!('indexedDB' in window)) return Promise.resolve(null);
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return databasePromise;
};

export const readQuestionCache = async (key: string): Promise<Question[]> => {
  const database = await openDatabase();
  if (!database) return [];

  try {
    return await new Promise((resolve) => {
      const request = database.transaction(STORE_NAME, 'readonly')
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => {
        const cached = request.result as CachedQuestionSet | undefined;
        resolve(Array.isArray(cached?.questions) ? cached.questions : []);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
};

export const writeQuestionCache = async (key: string, questions: Question[]): Promise<void> => {
  const database = await openDatabase();
  if (!database || questions.length === 0) return;

  try {
    await new Promise<void>((resolve) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ key, questions, updatedAt: Date.now() } satisfies CachedQuestionSet);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.onabort = () => resolve();
    });
  } catch {
    // Caching is an optimization and must never block the question bank.
  }
};
