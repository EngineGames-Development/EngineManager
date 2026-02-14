function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.slice(u8.byteOffset, u8.byteOffset + u8.byteLength).buffer;
}

function ab2b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function b642ab(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function generateDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function importDEK(raw: Uint8Array, extractable = true): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", u8ToArrayBuffer(raw), "AES-GCM", extractable, ["encrypt", "decrypt"]);
}

async function deriveWrappingKey(password: string, kdf: { salt: string; iterations: number }): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b642ab(kdf.salt), iterations: kdf.iterations, hash: "SHA-512" },
    baseKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

export async function wrapDEK(password: string, dek: Uint8Array) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const kdf = { salt: ab2b64(salt.buffer), iterations: 600000 };
  const wrappingKey = await deriveWrappingKey(password, kdf);
  const dekKey = await importDEK(dek, true);
  const wrapped = await crypto.subtle.wrapKey("raw", dekKey, wrappingKey, "AES-KW");
  return { wrappedKey: ab2b64(wrapped), kdf };
}

export async function unwrapDEK(password: string, wrappedKey: string, kdf: { salt: string; iterations: number }): Promise<CryptoKey> {
  const wrappingKey = await deriveWrappingKey(password, kdf);
  return crypto.subtle.unwrapKey(
    "raw",
    b642ab(wrappedKey),
    wrappingKey,
    "AES-KW",
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(key: CryptoKey, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return { ciphertext: ab2b64(encrypted), iv: ab2b64(iv.buffer) };
}

export async function decryptData(key: CryptoKey, encrypted: { ciphertext: string; iv: string }) {
  const dec = new TextDecoder();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b642ab(encrypted.iv) },
    key,
    b642ab(encrypted.ciphertext)
  );
  return dec.decode(decrypted);
}
