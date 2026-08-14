import { setVaultKey } from "./vault.js";

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function registerBiometric(dek: CryptoKey): Promise<string | null> {
  if (!("credentials" in navigator)) return null;

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)).buffer,
    rp: { name: "SecureVault" },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: "enginemanager",
      displayName: "EngineManager"
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 }
    ],
    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
    timeout: 60000,
    attestation: "none"
  };

  const cred = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
  if (!cred) return null;

  const exportedDEK = await crypto.subtle.exportKey("raw", dek);
  localStorage.setItem("biometricWrappedDEK", JSON.stringify({
    credentialId: bufferToBase64(cred.rawId),
    dek: bufferToBase64(exportedDEK)
  }));

  return bufferToBase64(cred.rawId);
}

export async function authenticateBiometric(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem("biometricWrappedDEK");
  if (!stored) return null;

  const { credentialId, dek } = JSON.parse(stored);

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)).buffer,
    allowCredentials: [{ id: base64ToBuffer(credentialId), type: "public-key", transports: ["internal"] }],
    userVerification: "required",
    timeout: 60000
  };

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    if (!assertion) return null;

    const importedKey = await crypto.subtle.importKey(
      "raw",
      base64ToBuffer(dek),
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );

    setVaultKey(importedKey);
    return importedKey;

  } catch {
    return null;
  }
}