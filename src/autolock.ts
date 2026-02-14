import { unwrapDEK } from "./password_encryption.js";
import { setVaultKey, clearVaultKey } from "./vault.js";

const AUTOLOCK_TIME = 5 * 60 * 1000;

let lockTimer: number | null = null;
let visibilityTimer: number | null = null;
let locked = hasMasterPassword();
let started = false;

function hasMasterPassword(): boolean {
  return !!localStorage.getItem("wrappedDEK");
}

export function lockApp() {
  if (!hasMasterPassword()) return;
  clearVaultKey();
  locked = true;
  document.dispatchEvent(new Event("app-locked"));
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = null;
}

export async function unlockApp(password: string): Promise<boolean> {
  if (!hasMasterPassword()) {
    locked = false;
    return true;
  }

  try {
    const stored = JSON.parse(localStorage.getItem("wrappedDEK")!);
    const dek = await unwrapDEK(password, stored.wrappedKey, stored.kdf);
    setVaultKey(dek);
    locked = false;
    resetAutolockTimer();
    return true;
  } catch {
    return false;
  }
}

export function isAppLocked(): boolean {
  return locked;
}

export function resetAutolockTimer() {
  if (!hasMasterPassword() || locked) return;
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = window.setTimeout(lockApp, AUTOLOCK_TIME);
}

export function startAutolock() {
  if (!hasMasterPassword() || started) return;
  started = true;
  resetAutolockTimer();

  ["mousemove", "click", "scroll", "touchstart", "keydown"].forEach(e =>
    window.addEventListener(e, resetAutolockTimer, { passive: true })
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      visibilityTimer = window.setTimeout(lockApp, AUTOLOCK_TIME);
    } else if (visibilityTimer) {
      clearTimeout(visibilityTimer);
      visibilityTimer = null;
      resetAutolockTimer();
    }
  });
}

if (hasMasterPassword()) lockApp();