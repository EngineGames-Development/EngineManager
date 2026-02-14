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