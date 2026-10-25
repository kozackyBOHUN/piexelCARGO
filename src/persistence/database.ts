import type { SaveEnvelope } from '../domain/models';
import { validateSave } from './schema';
export class SaveDatabase {
  private db: Promise<IDBDatabase> | null = null;
  constructor(private name = 'pixelcargo-v1') {}
  private open(): Promise<IDBDatabase> {
    if (!this.db) this.db = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('saves'); };
      req.onerror = () => { this.db = null; reject(req.error); };
      req.onblocked = () => { this.db = null; reject(new Error('Baza zapisów jest zablokowana przez inną wersję aplikacji.')); };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); this.db = null; };
        resolve(db);
      };
    });
    return this.db;
  }
  async load(): Promise<SaveEnvelope | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readonly');
      const req = tx.objectStore('saves').get('current');
      tx.oncomplete = () => { try { resolve(req.result === undefined ? null : validateSave(req.result)); } catch (e) { reject(e); } };
      tx.onabort = () => reject(tx.error ?? new Error('Odczyt zapisu został przerwany.'));
      tx.onerror = () => reject(tx.error);
    });
  }
  async write(envelope: SaveEnvelope): Promise<void> {
    const safe = validateSave(envelope);
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('saves', 'readwrite');
      tx.objectStore('saves').put(safe, 'current');
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error('Zapis został przerwany.'));
      tx.onerror = () => reject(tx.error);
    });
  }
  async close() { if (this.db) (await this.db).close(); this.db = null; }
}
