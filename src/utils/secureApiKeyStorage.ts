// Encrypts the Google API key before it touches localStorage. The AES-GCM key
// itself lives as a non-extractable CryptoKey in a dedicated IndexedDB database
// (never in localStorage), so a plain `localStorage.getItem`/backup dump - the
// most common way a stray script or browser extension harvests stored secrets -
// only ever sees ciphertext. This doesn't protect against a full XSS compromise
// of this origin (an attacker running JS here could call the same decrypt
// function), but that's true of any client-only storage with no user passphrase.

const DB_NAME = "wg_keystore";
const STORE_NAME = "keys";
const KEY_RECORD_ID = "api_key_enc_key";
const AES_ALGO = "AES-GCM";

const openKeystoreDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getOrCreateEncryptionKey = async (): Promise<CryptoKey> => {
  const db = await openKeystoreDb();
  try {
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(KEY_RECORD_ID);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (existing) return existing;

    const key = await crypto.subtle.generateKey({ name: AES_ALGO, length: 256 }, false, ["encrypt", "decrypt"]);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(key, KEY_RECORD_ID);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return key;
  } finally {
    db.close();
  }
};

const toBase64 = (buf: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromBase64 = (b64: string): Uint8Array => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// Packed format: "<base64 iv>.<base64 ciphertext>"
export const encryptApiKey = async (plaintext: string): Promise<string> => {
  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: AES_ALGO, iv }, key, new TextEncoder().encode(plaintext));
  return `${toBase64(iv.buffer)}.${toBase64(ciphertext)}`;
};

export const decryptApiKey = async (packed: string): Promise<string> => {
  const [ivB64, dataB64] = packed.split(".");
  const key = await getOrCreateEncryptionKey();
  const plainBuf = await crypto.subtle.decrypt(
    { name: AES_ALGO, iv: fromBase64(ivB64) as BufferSource },
    key,
    fromBase64(dataB64) as BufferSource
  );
  return new TextDecoder().decode(plainBuf);
};
