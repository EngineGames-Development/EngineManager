import { applyTheme, setupThemeToggle } from './theme.js';
import { validateWebsite, validatePassword } from './validation.js';
import { generateRandomPassword, generateMemorablePassword } from './passwordGen.js';
import { showError, showValid, togglePasswordVisibility, triggerPrint, updateEmptyState } from './ui.js';
//import { SecurePDF } from './secure_pdf.js';
import { wrapDEK } from './password_encryption.js';
import { addPassword } from './password_creation.js';

export function getID<T extends HTMLElement>(selector: string): T {
  const el = document.getElementById(selector);
  if (!el) throw new Error(`Element ${selector} not found`);
  return el as T;
}
export function getElement<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element ${selector} not found`);
  return el as T;
}

export function getChildElement<T extends HTMLElement>(
  parent: Element,
  selector: string
): T {
  const el = parent.querySelector(selector);
  if (!el) throw new Error(`Element ${selector} not found inside parent`);
  return el as T;
}

document.addEventListener("DOMContentLoaded", () => {
    setupThemeToggle();
    applyTheme(localStorage.getItem("theme") || "system");
    getID<HTMLSpanElement>("year").textContent = new Date().getFullYear().toString();

    const container = getElement<HTMLDivElement>(".container");
    const passwordContainer = getID<HTMLInputElement>("password-container");
    const addContainer = getElement<HTMLDivElement>(".add-container");
    const masterPasswordContainer = getElement<HTMLDivElement>(".master-password-container");

    const websiteInput = getID<HTMLInputElement>("websiteinputbox");

    const onlineBtn = getID<HTMLButtonElement>("onlineBtn");
    const addBtn = getID<HTMLButtonElement>("add-button");
    const addmasterpasswordBtn = getID<HTMLButtonElement>("addmasterpasswordBtn");
    const masterpasswordinput = getID<HTMLInputElement>("master-password-input");

    const onlinePopup = getChildElement<HTMLDivElement>(container, ".popup");
    const onlineEnterBtn = getChildElement<HTMLButtonElement>(onlinePopup,"button:first-of-type");
    const onlineCancelBtn = getChildElement<HTMLButtonElement>(onlinePopup,"button:last-of-type");
    const dontShowCheckbox = getChildElement<HTMLInputElement>(onlinePopup,"input[type='checkbox']");

    websiteInput.addEventListener("input", () => {
        const result = validateWebsite(websiteInput.value.trim());
        result.valid ? showValid(websiteInput) : showError(websiteInput, result.error);
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
            result.valid
                ? showValid(passwordInput)
                : showError(passwordInput, result.error);
        });

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () =>
                togglePasswordVisibility(passwordInput, toggleBtn)
            );
        }

        if (generateBtn) {
            generateBtn.addEventListener("click", () => {
                generateBtn.classList.remove("spin");
                void generateBtn.offsetWidth;
                generateBtn.classList.add("spin");
                passwordInput.classList.add("changed");
                setTimeout(() => passwordInput.classList.remove("changed"), 1000);

                passwordInput.value = generateRandomPassword(24);

                const result = validatePassword(passwordInput.value.trim());
                result.valid
                    ? showValid(passwordInput)
                    : showError(passwordInput, result.error);
            });
        }

        if (thinkingBtn) {
            thinkingBtn.addEventListener("click", async () => {
                thinkingBtn.classList.remove("scale");
                void thinkingBtn.offsetWidth;
                thinkingBtn.classList.add("scale");
                passwordInput.classList.add("changed");
                setTimeout(() => passwordInput.classList.remove("changed"), 1000);

                passwordInput.value = await generateMemorablePassword({
                    wordCount: 8,
                    separator: "-"
                });

                const result = validatePassword(passwordInput.value.trim());
                result.valid
                    ? showValid(passwordInput)
                    : showError(passwordInput, result.error);
            });
        }

        if (printBtn && paper) {
            printBtn.addEventListener("click", () =>
                triggerPrint(printBtn, paper, passwordInput.value)
            );
        }
    });


    function isMasterPasswordSet() {
      return localStorage.getItem("wrappedDEK") !== null;
    }

    updateEmptyState();

    onlineBtn.addEventListener("click", e => {
        e.preventDefault();
        if (localStorage.getItem("skipPopup") === "true") window.location.href = "Online.html";
        else container.style.display = "flex";
    });

    onlineEnterBtn.addEventListener("click", () => {
        if (dontShowCheckbox.checked) localStorage.setItem("skipPopup", "true");
        container.style.display = "none";
        window.location.href = "Online.html";
    });

    onlineCancelBtn.addEventListener("click", () => container.style.display = "none");

    addBtn.addEventListener("click", () => addContainer.style.display = "flex");
    
    document.querySelectorAll(".add-password-btn, #addpasswordBtn").forEach(btn => {
      btn.addEventListener("click", () => {
        const websiteValue = websiteInput.value.trim();
        const activePasswordInput = getChildElement<HTMLInputElement>(addContainer,".input-wrapper input");
        const passwordValue = activePasswordInput.value.trim();

        const websiteResult = validateWebsite(websiteValue);
        const passwordResult = validatePassword(passwordValue);

        websiteResult.valid
            ? showValid(websiteInput)
            : showError(websiteInput, websiteResult.error);

        passwordResult.valid
            ? showValid(activePasswordInput)
            : showError(activePasswordInput, passwordResult.error);

        if (!websiteResult.valid || !passwordResult.valid) return;

        addContainer.style.display = "none";

        if (isMasterPasswordSet()) {
            addPassword();
            masterPasswordContainer.style.display = "none";
        } else {
            masterPasswordContainer.style.display = "flex";
        }
      });
    });

    addmasterpasswordBtn.addEventListener("click", async () => {
        const masterpassword = masterpasswordinput.value.trim();
        if (!masterpassword) {
            alert("Enter a master password!")
            return;
        }

        const dek = crypto.getRandomValues(new Uint8Array(32));
        
        const wrapped = await wrapDEK(masterpassword,dek);

        localStorage.setItem("wrappedDEK", JSON.stringify(wrapped));

        alert("Master password saved securely!");
        masterpasswordinput.value = "";
        masterPasswordContainer.style.display = "none";
        addPassword();
        updateEmptyState();
    });

    getElement<HTMLElement>(".print").addEventListener("click", () => {
      const masterPasswordInput = getElement<HTMLInputElement>('.master-password-container input');
      const masterPassword = masterPasswordInput.value.trim();

      //SecurePDF.createSecurePDF(masterPassword, 'masterpassword.pdf');
    });

    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            addContainer.style.display = "none";
            masterPasswordContainer.style.display = "none";
        });
    });
});