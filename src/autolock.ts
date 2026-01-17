import { unwrapDEK } from "./password_encryption.js";

const AUTOLOCK_TIME = 5 * 60 * 1000;

let lockTimer: number | null = null;
let isLocked = false;
let dekCryptoKey: CryptoKey | null = null;

function hasMasterPassword(): boolean {
    return (
        !!localStorage.getItem("wrappedDEK") &&
        !!localStorage.getItem("dekSalt")
    );
}

function clearDEK() {
    dekCryptoKey = null;
}

export function lockApp() {
    if (!hasMasterPassword()) return;

    clearDEK();
    isLocked = true;

    document.dispatchEvent(new Event("app-locked"));
}

export async function unlockApp(password: string): Promise<boolean> {
    const wrappedDEK = localStorage.getItem("wrappedDEK");
    const salt = localStorage.getItem("dekSalt");

    if (!wrappedDEK || !salt) return true;

    try {
        dekCryptoKey = await unwrapDEK(password, wrappedDEK, salt);
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

    if (lockTimer !== null) {
        clearTimeout(lockTimer);
    }

    lockTimer = window.setTimeout(lockApp, AUTOLOCK_TIME);
}

export function startAutolock() {
    if (!hasMasterPassword()) return;

    resetAutolockTimer();

    const events = [
        "mousemove",
        "keydown",
        "click",
        "scroll",
        "touchstart",
    ];

    events.forEach(event =>
        window.addEventListener(event, resetAutolockTimer, { passive: true })
    );

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) lockApp();
    });

    window.addEventListener("beforeunload", lockApp);
}