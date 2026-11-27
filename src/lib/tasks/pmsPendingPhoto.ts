const formats = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
const maxBytes = 8 * 1024 * 1024;

export const PMS_PHOTO_BUCKET = 'myuno-pms-task-photos';

export function pmsPhotoExtension(file: Blob): string | null {
  const mime = file.type as keyof typeof formats;
  return file.size > 0 && file.size <= maxBytes && Object.prototype.hasOwnProperty.call(formats, mime) ? formats[mime] : null;
}

function openPhotoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('myuno-pms-photos', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Photo storage is busy'));
  });
}

export async function writePendingPmsPhoto(key: string, photo: Blob) {
  const database = await openPhotoDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('pending', 'readwrite');
      transaction.objectStore('pending').put(photo, key);
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function readPendingPmsPhoto(key: string): Promise<Blob | undefined> {
  const database = await openPhotoDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction('pending').objectStore('pending').get(key);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function removePendingPmsPhoto(key: string) {
  const database = await openPhotoDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('pending', 'readwrite');
      transaction.objectStore('pending').delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
