import { unwrapDEK } from "./password_encryption.js";

const AUTOLOCK_TIME = 5 * 60 * 1000;

let lockTimer: number | null = null;
let visibilityTimer: number | null = null;
let isLocked = hasMasterPassword();
let dekCryptoKey: CryptoKey | null = null;
let autolockStarted = false;

function hasMasterPassword(): boolean {
    return !!localStorage.getItem("wrappedDEK");
}

function clearDEK() {
    dekCryptoKey = null;
}

export function lockApp() {
    if (!hasMasterPassword()) return;

    clearDEK();
    isLocked = true;
    document.dispatchEvent(new Event("app-locked"));

    if (lockTimer !== null) {
        clearTimeout(lockTimer);
        lockTimer = null;
    }
}

export async function unlockApp(password: string): Promise<boolean> {
    if (!hasMasterPassword()) {
        isLocked = false;
        return true;
    }

    try {
        const stored = JSON.parse(localStorage.getItem("wrappedDEK")!);

        dekCryptoKey = await unwrapDEK(
            password,
            stored.wrappedKey,
            stored.kdf
        );

        isLocked = false;
        resetAutolockTimer();
        return true;
    } catch {
        return false;
    }
}

export function isAppLocked(): boolean {
    return isLocked;
}

export function getDEK(): CryptoKey | null {
    return dekCryptoKey;
}

export function resetAutolockTimer() {
    if (!hasMasterPassword() || isLocked) return;

    if (lockTimer !== null) clearTimeout(lockTimer);
    lockTimer = window.setTimeout(lockApp, AUTOLOCK_TIME);
}

export function startAutolock() {
    if (!hasMasterPassword() || autolockStarted) return;

    autolockStarted = true;
    resetAutolockTimer();

    const activityEvents = ["mousemove", "click", "scroll", "touchstart"];
    activityEvents.forEach(event =>
        window.addEventListener(event, resetAutolockTimer, { passive: true })
    );

    window.addEventListener("keydown", resetAutolockTimer);

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

if (hasMasterPassword()) {
    lockApp();
}