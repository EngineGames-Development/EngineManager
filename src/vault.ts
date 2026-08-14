import { authenticateBiometric } from "./biometric.js";

let cachedDEK: CryptoKey | null = null;

export function setVaultKey(key: CryptoKey) {
  cachedDEK = key;
}

export function getVaultKeyCached(): CryptoKey {
  if (!cachedDEK) throw new Error("Vault locked");
  return cachedDEK;
}

export function clearVaultKey() {
  cachedDEK = null;
}

export async function exportVault() {
  let dek: CryptoKey;

  try {
    dek = getVaultKeyCached();
  } catch {
    alert("Vault is locked! Unlock first.");
    return;
  }

  const biometricSuccess = await authenticateBiometric();
  if (!biometricSuccess) {
    alert("Biometric authentication failed.");
    return;
  }

  const vaultData = localStorage.getItem("vault");
  if (!vaultData) {
    alert("Vault is empty");
    return;
  }

  const encoder = new TextEncoder();
  const vaultBuffer = encoder.encode(vaultData);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedVault = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    dek,
    vaultBuffer
  );

  const combined = new Uint8Array(iv.length + encryptedVault.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedVault), iv.length);

  const blob = new Blob([combined], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "vault_encrypted.bin";
  a.click();

  URL.revokeObjectURL(url);
  alert("Vault exported securely with biometrics!");
}

export async function importVault(file: File) {
  const biometricSuccess = await authenticateBiometric();
  if (!biometricSuccess) {
    alert("Biometric authentication failed.");
    return;
  }

  let dek: CryptoKey;
  try {
    dek = getVaultKeyCached();
  } catch {
    alert("Vault is locked! Unlock first with biometrics.");
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength < 12) {
    alert("Invalid vault file");
    return;
  }

  const iv = new Uint8Array(arrayBuffer.slice(0, 12));
  const encryptedData = arrayBuffer.slice(12);

  let decryptedBuffer: ArrayBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      dek,
      encryptedData
    );
  } catch {
    alert("Failed to decrypt vault: invalid key or corrupted file");
    return;
  }

  const decoder = new TextDecoder();
  const vaultJson = decoder.decode(decryptedBuffer);

  localStorage.setItem("vault", vaultJson);
  alert("Vault imported successfully!");
}