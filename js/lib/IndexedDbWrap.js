export class IndexedDbWrap {

    static stores = ["projects", "times"];

    constructor(dbName, dbVersion, dbUpgrade) {
        this.dbName = dbName;
        this.dbVersion = dbVersion;
        this.dbUpgrade = dbUpgrade;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = null;
            if (!('indexedDB' in window)) reject('not supported');
            const dbOpen = indexedDB.open(this.dbName, this.dbVersion);
            if (this.dbUpgrade) {
                dbOpen.onupgradeneeded = e => {
                    IndexedDbWrap.stores.forEach(storeName => {
                        e.target.result.createObjectStore(storeName, {keyPath: "id", autoIncrement: true})
                    })
                };
            }
            dbOpen.onsuccess = () => {
                this.db = dbOpen.result;
                resolve(this);
            };
            dbOpen.onerror = e => {
                reject(`IndexedDB error: ${e.target.errorCode}`);
            };
        });
    }

    get connection() {
        return this.db;
    }

    add(storeName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(value);
            transaction.oncomplete = () => {
                resolve(request.result);
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }

    get(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this.prepareTransaction(storeName, "readonly");
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.prepareTransaction(storeName, "readonly");
            const request = store.getAll();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    getAllKeys(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.prepareTransaction(storeName, "readonly");
            const request = store.getAllKeys();
            request.onsuccess = () => {
                resolve(request.result);
            };
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            transaction.oncomplete = () => {
                resolve(request.result);
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }

    prepareTransaction(storeName, mode) {
        const transaction = this.db.transaction(storeName, mode);
        return transaction.objectStore(storeName);
    }
}