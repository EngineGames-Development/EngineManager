export async function generateDEK() {
    return crypto.getRandomValues(new Uint8Array(32));
}

export async function getKeyFromPassword(masterPassword, salt, iterations = 500_000) {
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
            salt: salt,
            iterations: iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-KW", length: 256 },
        true,
        ["wrapKey", "unwrapKey"]
    );
}

export async function importDEK(rawDek) {
    return crypto.subtle.importKey(
        "raw",
        rawDek,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function wrapDEK(masterPassword, dek) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const wrappingKey = await getKeyFromPassword(masterPassword, salt);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        dek,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );

    const wrappedKey = await crypto.subtle.wrapKey("raw", cryptoKey, wrappingKey, "AES-KW");

    return {
        wrappedKey: arrayBufferToBase64(wrappedKey),
        salt: arrayBufferToBase64(salt)
    };
}

export async function unwrapDEK(masterPassword, wrappedKeyBase64, saltBase64) {
    const salt = base64ToArrayBuffer(saltBase64);
    const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64);

    const wrappingKey = await getKeyFromPassword(masterPassword, salt);

    const cryptoKey = await crypto.subtle.unwrapKey(
        "raw",
        wrappedKey,
        wrappingKey,
        "AES-KW",
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    return cryptoKey;
}

export async function encryptData(dekCryptoKey, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        dekCryptoKey,
        enc.encode(plaintext)
    );

    return {
        ciphertext: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv)
    };
}

export async function decryptData(dekCryptoKey, encryptedData) {
    const { ciphertext, iv } = encryptedData;
    const dec = new TextDecoder();

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
        dekCryptoKey,
        base64ToArrayBuffer(ciphertext)
    );

    return dec.decode(decrypted);
}

export function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}

export function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}