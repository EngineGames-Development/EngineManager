import { getElement, getID } from './main.js';
import { unwrapDEK } from './password_encryption.js';
 
interface DecryptedEntry {
  website: string;
  username: string;
  password: string;
  note: string;
}
 
let pendingEntry: DecryptedEntry | null = null;
let connect = false;
 
function connectOnce() {
  if (connect) return;
  connect = true;
 
  const popup = getElement<HTMLDivElement>(".password-validation");
  const continueBtn = getID<HTMLButtonElement>("validationContinueBtn");
  const leaveBtn = getChildLeaveBtn(popup);
  const passwordInput = getID<HTMLInputElement>("validation-password-input");
  const resultBox = document.getElementById("validation-result");
 
  const close = () => {
    popup.style.display = "none";
    passwordInput.value = "";
    pendingEntry = null;
    if (resultBox) {
      resultBox.style.display = "none";
      resultBox.textContent = "";
    }
  };
 
  continueBtn.addEventListener("click", async () => {
    if (!pendingEntry) return;
 
    const masterPassword = passwordInput.value.trim();
    const wrappedRaw = localStorage.getItem("wrappedDEK");
    if (!wrappedRaw) return close();
 
    try {
      const stored = JSON.parse(wrappedRaw);
      await unwrapDEK(masterPassword, stored.wrappedKey, stored.kdf);
 
      if (resultBox) {
        resultBox.textContent =
          `Username: ${pendingEntry.username}\nPassword: ${pendingEntry.password}`;
        resultBox.style.display = "block";
      }
    } catch {
      alert("Incorrect master password");
    }
 
    passwordInput.value = "";
  });
 
  leaveBtn?.addEventListener("click", close);
}
 
function getChildLeaveBtn(popup: HTMLDivElement): HTMLButtonElement | null {
  return popup.querySelector<HTMLButtonElement>(".leave-btn");
}
 
export function openPasswordValidation(data: DecryptedEntry) {
  connectOnce();
  pendingEntry = data;
 
  const popup = getElement<HTMLDivElement>(".password-validation");
  const passwordInput = getID<HTMLInputElement>("validation-password-input");
  const resultBox = document.getElementById("validation-result");
 
  passwordInput.value = "";
  if (resultBox) {
    resultBox.style.display = "none";
    resultBox.textContent = "";
  }
 
  popup.style.display = "flex";
}