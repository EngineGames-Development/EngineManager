import { applyTheme, setupThemeToggle } from './theme.js';
import { validateWebsite, validatePassword } from './validation.js';
import { generateRandomPassword, generateMemorablePassword } from './passwordGen.js';
import { showError, showValid, togglePasswordVisibility, triggerPrint } from './ui.js';
import { SecurePDF } from './secure_pdf.js';
import { encryptData,decryptData, wrapDEK } from './password_encryption.js';

document.addEventListener("DOMContentLoaded", () => {
    setupThemeToggle();
    applyTheme(localStorage.getItem("theme") || "system");

    const container = document.querySelector(".container");
    const passwordContainer = document.getElementById("password-container");
    const addContainer = document.querySelector(".add-container");
    const masterPasswordContainer = document.querySelector(".master-password-container");

    const websiteInput = document.getElementById("websiteinputbox");

    const onlineBtn = document.getElementById("onlineBtn");
    const addBtn = document.getElementById("add-button");
    const addmasterpasswordBtn = document.getElementById("addmasterpasswordBtn");
    const masterpasswordinput = document.getElementById("master-password-input");

    const onlinePopup = container.querySelector(".popup");
    const onlineEnterBtn = onlinePopup.querySelector("button:first-of-type");
    const onlineCancelBtn = onlinePopup.querySelector("button:last-of-type");
    const dontShowCheckbox = onlinePopup.querySelector("input[type='checkbox']");

    websiteInput.addEventListener("input", () => {
        const result = validateWebsite(websiteInput.value.trim());
        result.valid ? showValid(websiteInput) : showError(websiteInput, result.error);
    });

    document.querySelectorAll(".input-wrapper").forEach(wrapper => {
        const passwordInput = wrapper.querySelector("input");
        if (!passwordInput) return;

        const generateBtn = wrapper.querySelector(".generate");
        const thinkingBtn = wrapper.querySelector(".thinking");
        const toggleBtn = wrapper.querySelector(".toggle-password");
        const printBtn = wrapper.querySelector(".print");
        const paper = wrapper.querySelector(".paper");

        passwordInput.addEventListener("input", () => {
            const result = validatePassword(passwordInput.value.trim());
            result.valid ? showValid(passwordInput) : showError(passwordInput, result.error);
        });

        if (toggleBtn) toggleBtn.addEventListener("click", () => togglePasswordVisibility(passwordInput, toggleBtn));

        if (generateBtn) generateBtn.addEventListener("click", () => {
            generateBtn.classList.remove("spin"); void generateBtn.offsetWidth; generateBtn.classList.add("spin");
            passwordInput.classList.add("changed");
            setTimeout(() => passwordInput.classList.remove("changed"), 1000);
            passwordInput.value = generateRandomPassword(24);
            const result = validatePassword(passwordInput.value.trim());
            result.valid ? showValid(passwordInput) : showError(passwordInput, result.error);
        });

        if (thinkingBtn) thinkingBtn.addEventListener("click", async () => {
            thinkingBtn.classList.remove("scale"); void thinkingBtn.offsetWidth; thinkingBtn.classList.add("scale");
            passwordInput.classList.add("changed");
            setTimeout(() => passwordInput.classList.remove("changed"), 1000);
            passwordInput.value = await generateMemorablePassword({ wordCount: 8, separator: "-" });
            const result = validatePassword(passwordInput.value.trim());
            result.valid ? showValid(passwordInput) : showError(passwordInput, result.error);
        });

        if (printBtn && paper) printBtn.addEventListener("click", () => triggerPrint(printBtn, paper,passwordInput.value));
    });

    function addPassword() {

    }

    function isMasterPasswordSet() {
      return localStorage.getItem("wrappedDEK") !== null;
    }

    function updateEmptyState() {
     const hasPasswords =
       passwordContainer.querySelectorAll(".password-item").length > 0;

     const header = passwordContainer.querySelector("#password-text");

     if (!hasPasswords) {
      if (!header) {
        const h1 = document.createElement("h1");
        h1.id = "password-text";
        h1.textContent = "No passwords yet!";
        passwordContainer.appendChild(h1);
      }
     } else {
      header?.remove();
     }
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
        const activePasswordInput = addContainer.querySelector(".input-wrapper input");
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

        updateEmptyState();
        addPassword();
    });

    document.querySelector(".print").addEventListener("click", () => {
      const masterPasswordInput = document.querySelector('.master-password-container input');
      const masterPassword = masterPasswordInput.value.trim();

      SecurePDF.createSecurePDF(masterPassword, 'masterpassword.pdf');
    });

    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            addContainer.style.display = "none";
            masterPasswordContainer.style.display = "none";
        });
    });
});