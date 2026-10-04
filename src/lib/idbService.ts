import { openDB } from 'idb';

const DB_NAME = 'HabyEduDB';
const DB_VERSION = 1;
const STORE_NAME = 'schoolData';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export const setCachedData = async (key: string, val: any) => {
  return (await dbPromise).put(STORE_NAME, val, key);
};

export const getCachedData = async (key: string) => {
  return (await dbPromise).get(STORE_NAME, key);
};

export const deleteCachedData = async (key: string) => {
  return (await dbPromise).delete(STORE_NAME, key);
};
