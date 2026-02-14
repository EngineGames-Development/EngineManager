export async function registerBiometric(): Promise<string | null> {
  if (!("credentials" in navigator)) return null;

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: {
      name: "SecureVault"
    },
    user: {
      id: crypto.getRandomValues(new Uint8Array(16)),
      name: "enginemanager",
      displayName: "EngineManager"
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 }
    ],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required"
    },
    timeout: 60000,
    attestation: "none"
  };

  const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
  if (!credential) return null;

  const rawId = Array.from(new Uint8Array(credential.rawId));
  return btoa(String.fromCharCode(...rawId));
}

export async function authenticateBiometric(credentialId: string): Promise<boolean> {
  const idBuffer = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials: [{
      id: idBuffer,
      type: "public-key",
      transports: ["internal"]
    }],
    userVerification: "required",
    timeout: 60000
  };

  try {
    const assertion = await navigator.credentials.get({ publicKey });
    return !!assertion;
  } catch {
    return false;
  }
}
