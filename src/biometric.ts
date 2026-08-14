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

function getPrfOutput(cred: PublicKeyCredential): ArrayBuffer | null {
  const ext = cred.getClientExtensionResults() as {
    prf?: { results?: { first?: ArrayBuffer } };
  };
  return ext.prf?.results?.first ?? null;
}
 
async function derivePrfWrappingKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const hkdfKey = await crypto.subtle.importKey("raw", prfOutput, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("EngineManager-biometric-wrap-v1")
    },
    hkdfKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

export async function registerBiometric(dek: CryptoKey): Promise<string | null> {
  if (!("credentials" in navigator)) return null;
 
  const prfSalt = crypto.getRandomValues(new Uint8Array(32));
 
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
    attestation: "none",
    extensions: { prf: { eval: { first: prfSalt } } } as AuthenticationExtensionsClientInputs
  };
 
  const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  if (!cred) return null;
 
  const prfOutput = getPrfOutput(cred);
  if (!prfOutput) {
    throw new Error(
      "This device/browser does not support hardware-backed key derivation (WebAuthn PRF extension), " +
      "so biometric unlock cannot be enabled securely here."
    );
  }
 
  const wrappingKey = await derivePrfWrappingKey(prfOutput);
  const wrappedDEK = await crypto.subtle.wrapKey("raw", dek, wrappingKey, "AES-KW");
 
  localStorage.setItem("biometricWrappedDEK", JSON.stringify({
    credentialId: bufferToBase64(cred.rawId),
    prfSalt: bufferToBase64(prfSalt.buffer),
    wrappedDEK: bufferToBase64(wrappedDEK)
  }));
 
  return bufferToBase64(cred.rawId);
}
 
export async function authenticateBiometric(): Promise<CryptoKey | null> {
  const stored = localStorage.getItem("biometricWrappedDEK");
  if (!stored) return null;
 
  let credentialId: string, prfSalt: string, wrappedDEK: string;
  try {
    ({ credentialId, prfSalt, wrappedDEK } = JSON.parse(stored));
    if (!credentialId || !prfSalt || !wrappedDEK) return null;
  } catch {
    return null;
  }
 
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)).buffer,
    allowCredentials: [{ id: base64ToBuffer(credentialId), type: "public-key", transports: ["internal"] }],
    userVerification: "required",
    timeout: 60000,
    extensions: { prf: { eval: { first: base64ToBuffer(prfSalt) } } } as AuthenticationExtensionsClientInputs
  };
 
  try {
    const assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
    if (!assertion) return null;
 
    const prfOutput = getPrfOutput(assertion);
    if (!prfOutput) return null;
 
    const wrappingKey = await derivePrfWrappingKey(prfOutput);
    const importedKey = await crypto.subtle.unwrapKey(
      "raw",
      base64ToBuffer(wrappedDEK),
      wrappingKey,
      "AES-KW",
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
 
    setVaultKey(importedKey);
    return importedKey;
  } catch {
    return null;
  }
}