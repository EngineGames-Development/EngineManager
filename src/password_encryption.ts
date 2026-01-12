export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export function generateDEK(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
}

export async function getKeyFromPassword(
    masterPassword: string,
    salt: Uint8Array,
    iterations = 500_000
): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(masterPassword),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt.buffer as ArrayBuffer,
            iterations,
            hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"]
    );
}

export async function importDEK(rawDek: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        rawDek.buffer as ArrayBuffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function wrapDEK(
    masterPassword: string,
    dek: Uint8Array
): Promise<{ wrappedKey: string; salt: string }> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const wrappingKey = await getKeyFromPassword(masterPassword, salt);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        dek.buffer as ArrayBuffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );

    const wrappedKey = await crypto.subtle.wrapKey(
        "raw",
        cryptoKey,
        wrappingKey,
        "AES-KW"
    );

    return {
        wrappedKey: arrayBufferToBase64(wrappedKey as ArrayBuffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    };
}

export async function unwrapDEK(
    masterPassword: string,
    wrappedKeyBase64: string,
    saltBase64: string
): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64);

    const wrappingKey = await getKeyFromPassword(masterPassword, salt);

    const cryptoKey = await crypto.subtle.unwrapKey(
        "raw",
        wrappedKey as ArrayBuffer,
        wrappingKey,
        "AES-KW",
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return cryptoKey;
}

export async function encryptData(
    dekCryptoKey: CryptoKey,
    plaintext: string
): Promise<{ ciphertext: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        dekCryptoKey,
        enc.encode(plaintext)
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    };
}

export async function decryptData(
    dekCryptoKey: CryptoKey,
    encryptedData: { ciphertext: string; iv: string }
): Promise<string> {
    const { ciphertext, iv } = encryptedData;
    const dec = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(iv) as ArrayBuffer },
        dekCryptoKey,
        base64ToArrayBuffer(ciphertext) as ArrayBuffer
    );

    return dec.decode(decrypted);
}