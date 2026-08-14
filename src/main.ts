import { applyTheme, setupThemeToggle } from "./theme.js";
import { validateWebsite, validatePassword } from "./validation.js";
import { generateRandomPassword, generateMemorablePassword } from "./passwordGen.js";
import {
  showError,
  showValid,
  togglePasswordVisibility,
  triggerPrint,
  updateEmptyState
} from "./ui.js";
import { SecurePDF } from "./secure_pdf.js";
import { wrapDEK, unwrapDEK } from "./password_encryption.js";
import {
  startAutolock,
  unlockApp,
  isAppLocked,
  unlockWithDEK,
  getUnlockedDEK
} from "./autolock.js";
import { addPassword, createPasswordContainer } from "./password_creation.js";
import {
  setVaultKey,
  clearVaultKey,
  importVault,
  exportVault,
  getVaultKeyCached
} from "./vault.js";
import { registerBiometric, authenticateBiometric } from "./biometric.js";

export function getID<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element ${id}`);
  return el as T;
}

export function getElement<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el as T;
}

export function getChildElement<T extends HTMLElement>(
  parent: Element,
  selector: string
): T {
  const el = parent.querySelector(selector);
  if (!el) throw new Error(`Missing element ${selector}`);
  return el as T;
}

function hasMasterPassword(): boolean {
  return !!localStorage.getItem("wrappedDEK");
}

function showAutolock(show: boolean) {
  const overlay = getElement<HTMLDivElement>(".autolock");
  overlay.style.display = show ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  applyTheme(localStorage.getItem("theme") || "system");
  getID<HTMLSpanElement>("year").textContent = new Date().getFullYear().toString();

  const container = getElement<HTMLDivElement>(".container");
  const addContainer = getElement<HTMLDivElement>(".add-container");
  const masterPasswordContainer = getElement<HTMLDivElement>(".master-password-container");

  const websiteInput = getID<HTMLInputElement>("websiteinputbox");
  const onlineBtn = getID<HTMLButtonElement>("onlineBtn");
  const addBtn = getID<HTMLButtonElement>("add-button");
  const addMasterBtn = getID<HTMLButtonElement>("addmasterpasswordBtn");
  const masterPasswordInput = getID<HTMLInputElement>("master-password-input");
  const autolockPasswordInput = getID<HTMLInputElement>("autolock-password-input");
  const continueBtn = getID<HTMLButtonElement>("continueBtn");

  const onlinePopup = getChildElement<HTMLDivElement>(container, ".popup");
  const onlineEnterBtn = getChildElement<HTMLButtonElement>(onlinePopup, "button:first-of-type");
  const onlineCancelBtn = getChildElement<HTMLButtonElement>(onlinePopup, "button:last-of-type");
  const dontShowCheckbox = getChildElement<HTMLInputElement>(onlinePopup, "input[type='checkbox']");

  continueBtn.addEventListener("click", async () => {
    const password = autolockPasswordInput.value;
    const success = await unlockApp(password);
    if (!success) return alert("Incorrect master password");
    autolockPasswordInput.value = "";
    showAutolock(false);
    await createPasswordContainer();
  });

  websiteInput.addEventListener("input", () => {
    const r = validateWebsite(websiteInput.value.trim());
    r.valid ? showValid(websiteInput) : showError(websiteInput, r.error);
  });

  document.querySelectorAll(".input-wrapper").forEach(wrapper => {
    const passwordInput = getChildElement<HTMLInputElement>(wrapper, "input");
    const generateBtn = wrapper.querySelector<HTMLElement>(".generate");
    const thinkingBtn = wrapper.querySelector<HTMLElement>(".thinking");
    const toggleBtn = wrapper.querySelector<HTMLButtonElement>(".toggle-password");
    const paper = wrapper.querySelector<HTMLDivElement>(".paper");
    const printBtn = document.querySelector<HTMLElement>(".print");

    passwordInput.addEventListener("input", () => {
      const result = validatePassword(passwordInput.value.trim());
      result.valid ? showValid(passwordInput) : showError(passwordInput, result.error);
      getID<HTMLElement>("passwordCheck").textContent =
        `Your password is: ${result.strength} and takes about ${result.crackTime} to crack.`;
    });

    toggleBtn?.addEventListener("click", () =>
      togglePasswordVisibility(passwordInput, toggleBtn)
    );

    generateBtn?.addEventListener("click", () => {
      generateBtn.classList.remove("spin");
      void generateBtn.offsetWidth;
      generateBtn.classList.add("spin");
      passwordInput.classList.add("changed");
      setTimeout(() => passwordInput.classList.remove("changed"), 1000);
      passwordInput.value = generateRandomPassword(24);
      passwordInput.dispatchEvent(new Event("input"));
    });

    thinkingBtn?.addEventListener("click", async () => {
      thinkingBtn.classList.remove("scale");
      void thinkingBtn.offsetWidth;
      thinkingBtn.classList.add("scale");
      passwordInput.classList.add("changed");
      setTimeout(() => passwordInput.classList.remove("changed"), 1000);
      passwordInput.value = await generateMemorablePassword({ wordCount: 8, separator: "-" });
      passwordInput.dispatchEvent(new Event("input"));
    });

    if (printBtn && paper) {
      printBtn.addEventListener("click", () =>
        triggerPrint(printBtn, paper, passwordInput.value)
      );
    }
  });

  updateEmptyState();

  onlineBtn.addEventListener("click", e => {
    e.preventDefault();
    if (localStorage.getItem("skipPopup") === "true") {
      window.location.href = "Online.html";
    } else {
      container.style.display = "flex";
    }
  });

  onlineEnterBtn.addEventListener("click", () => {
    if (dontShowCheckbox.checked) localStorage.setItem("skipPopup", "true");
    container.style.display = "none";
    window.location.href = "Online.html";
  });

  onlineCancelBtn.addEventListener("click", () => (container.style.display = "none"));

  addBtn.addEventListener("click", () => (addContainer.style.display = "flex"));

  document.querySelectorAll(".add-password-btn, #addpasswordBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (isAppLocked()) {
        showAutolock(true);
        return;
      }

      const websiteValue = websiteInput.value.trim();
      const activePasswordInput = getChildElement<HTMLInputElement>(addContainer, ".input-wrapper input");
      const passwordValue = activePasswordInput.value.trim();

      const websiteResult = validateWebsite(websiteValue);
      const passwordResult = validatePassword(passwordValue);

      websiteResult.valid ? showValid(websiteInput) : showError(websiteInput, websiteResult.error);
      passwordResult.valid ? showValid(activePasswordInput) : showError(activePasswordInput, passwordResult.error);
      if (!websiteResult.valid || !passwordResult.valid) return;

      addContainer.style.display = "none";
      if (!hasMasterPassword()) {
        masterPasswordContainer.style.display = "flex";
        return;
      }

      await addPassword();
      await createPasswordContainer();
    });
  });

  addMasterBtn.addEventListener("click", async () => {
    const masterpassword = masterPasswordInput.value.trim();
    if (!masterpassword) return alert("Enter a master password!");
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const wrapped = await wrapDEK(masterpassword, dek);
    localStorage.setItem("wrappedDEK", JSON.stringify(wrapped));
    const key = await unwrapDEK(masterpassword, wrapped.wrappedKey, wrapped.kdf);
    unlockWithDEK(key);
    masterPasswordInput.value = "";
    masterPasswordContainer.style.display = "none";
    await addPassword();
    await createPasswordContainer();
    startAutolock();
  });

  getElement<HTMLElement>(".print").addEventListener("click", () => {
    const masterPassword = masterPasswordInput.value.trim();
    SecurePDF.createSecurePDF(masterPassword, "masterpassword.pdf");
  });

  document.querySelectorAll(".cancel-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addContainer.style.display = "none";
      masterPasswordContainer.style.display = "none";
    });
  });

  const importInput = getID<HTMLInputElement>("importVaultInput");
  const exportBtn = getID<HTMLButtonElement>("exportVaultBtn");
  const importBtn = getID<HTMLButtonElement>("importVaultBtn");

  exportBtn.addEventListener("click", async () => {
    const dek = await authenticateBiometric();
    if (!dek) return alert("Biometric required to export!");
    unlockWithDEK(dek);
    await exportVault();
  });

  importBtn.addEventListener("click", () => importInput.click());

  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      await importVault(file);
      alert("Vault imported successfully!");
      location.reload();
    } catch (err) {
      alert("Failed to import vault: " + err);
    }
  });

  const registerBtn = getID<HTMLButtonElement>("registerBiometricBtn");

  registerBtn.addEventListener("click", async () => {
    let dek: CryptoKey | null = null;

    try {
      dek = getVaultKeyCached();
    } catch {
      const masterPassword = prompt("Enter master password to unlock vault for biometrics:")?.trim();
      if (!masterPassword) return;

      const success = await unlockApp(masterPassword);
      if (!success) return alert("Incorrect master password");

      dek = getUnlockedDEK();
    }

    if (!dek) return alert("Vault key not found — unlock vault first.");

    try {
      await registerBiometric(dek);
      alert("Biometric unlock registered!");
    } catch (err) {
      console.error(err);
      alert("Error registering biometric: " + (err as Error).message);
    }
  });

  registerBtn.disabled = isAppLocked();

  const biometricBtn = getID<HTMLButtonElement>("biometricUnlockBtn");

  biometricBtn?.addEventListener("click", async () => {
    const dek = await authenticateBiometric();
    if (!dek) return alert("Biometric authentication failed!");
    unlockWithDEK(dek);
    showAutolock(false);
    await createPasswordContainer();
    alert("Vault unlocked with biometrics!");
  });

  document.addEventListener("app-locked", () => {
    clearVaultKey();
    showAutolock(true);
  });

  startAutolock();
  if (hasMasterPassword() && isAppLocked()) showAutolock(true);
});