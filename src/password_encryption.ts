function forceArrayBuffer(input: ArrayBuffer | SharedArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (input instanceof ArrayBuffer) return input.slice(0);
  if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength).slice().buffer;
  return new Uint8Array(input as unknown as ArrayBuffer).slice().buffer;
}

function ab2b64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function b642ab(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function generateDEK(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

async function deriveWrappingKey(
  password: string,
  kdf: { salt: ArrayBuffer; iterations: number; hash: 'SHA-512' | 'SHA-256' }
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: forceArrayBuffer(kdf.salt),
      iterations: kdf.iterations,
      hash: kdf.hash,
    },
    baseKey,
    { name: 'AES-KW', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

export async function importDEK(raw: Uint8Array, extractable = true): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    forceArrayBuffer(raw),
    'AES-GCM',
    extractable,
    ['encrypt', 'decrypt']
  );
}

export async function wrapDEK(password: string, dek: Uint8Array) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltBuffer = saltBytes.slice().buffer;

  const kdf = {
    salt: saltBuffer,
    iterations: 600_000,
    hash: 'SHA-512' as const,
  };

  const wrappingKey = await deriveWrappingKey(password, kdf);
  const dekKey = await importDEK(dek, true);

  const wrapped = await crypto.subtle.wrapKey('raw', dekKey, wrappingKey, 'AES-KW');
  const wrappedBuffer = forceArrayBuffer(wrapped);

  const verifier = await encryptData(dekKey, 'password-check', 'verifier-v1');

  return {
    wrappedKey: ab2b64(wrappedBuffer),
    kdf: { ...kdf, salt: ab2b64(saltBuffer) }, // export salt as base64
    verifier,
  };
}

export async function unwrapDEK(
  password: string,
  wrappedKeyBase64: string,
  kdf: { salt: string; iterations: number; hash: 'SHA-512' }
): Promise<CryptoKey> {
  const saltBuffer = b642ab(kdf.salt);
  const wrappingKey = await deriveWrappingKey(password, { ...kdf, salt: saltBuffer });
  const rawBuffer = forceArrayBuffer(b642ab(wrappedKeyBase64));

  return crypto.subtle.unwrapKey(
    'raw',
    rawBuffer,
    wrappingKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function verifyMasterPassword(
  password: string,
  wrappedKey: string,
  kdf: { salt: string; iterations: number; hash: 'SHA-512' },
  verifier: { ciphertext: string; iv: string }
): Promise<boolean> {
  try {
    const dek = await unwrapDEK(password, wrappedKey, kdf);
    const plaintext = await decryptData(dek, verifier, 'verifier-v1');
    return plaintext === 'password-check';
  } catch {
    return false;
  }
}

export async function encryptData(
  key: CryptoKey,
  plaintext: string,
  context?: string
): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const additionalData = context ? forceArrayBuffer(enc.encode(context)) : undefined;

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: forceArrayBuffer(iv),
      additionalData,
    },
    key,
    forceArrayBuffer(enc.encode(plaintext))
  );

  return {
    ciphertext: ab2b64(forceArrayBuffer(encrypted)),
    iv: ab2b64(forceArrayBuffer(iv)),
  };
}

export async function decryptData(
  key: CryptoKey,
  encrypted: { ciphertext: string; iv: string },
  context?: string
): Promise<string> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const additionalData = context ? forceArrayBuffer(enc.encode(context)) : undefined;

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: forceArrayBuffer(b642ab(encrypted.iv)),
      additionalData,
    },
    key,
    forceArrayBuffer(b642ab(encrypted.ciphertext))
  );

  return dec.decode(decrypted);
}