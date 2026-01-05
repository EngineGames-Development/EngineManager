import { applyTheme, setupThemeToggle } from './theme.js';
import { validateWebsite, validatePassword } from './validation.js';
import { generateRandomPassword, generateMemorablePassword } from './passwordGen.js';
import { showError, showValid, togglePasswordVisibility, triggerPrint } from './ui.js';

document.addEventListener("DOMContentLoaded", () => {
    setupThemeToggle();
    applyTheme(localStorage.getItem("theme") || "system");

    const container = document.querySelector(".container");
    const passwordContainer = document.getElementById("password-container");
    const addContainer = document.querySelector(".add-container");
    const masterPasswordContainer = document.querySelector(".master-password-container");

    const websiteInput = document.getElementById("websiteinputbox");
    const websiteError = document.getElementById("websiteError");

    const onlineBtn = document.getElementById("onlineBtn");
    const addBtn = document.getElementById("add-button");

    const onlinePopup = container.querySelector(".popup");
    const onlineEnterBtn = onlinePopup.querySelector("button:first-of-type");
    const onlineCancelBtn = onlinePopup.querySelector("button:last-of-type");
    const dontShowCheckbox = onlinePopup.querySelector("input[type='checkbox']");

    websiteInput.addEventListener("input", () => {
        const result = validateWebsite(websiteInput.value.trim());
        result.valid
            ? showValid(websiteInput, websiteError)
            : showError(websiteInput, websiteError, result.error);
    });

    document.querySelectorAll(".input-wrapper").forEach(wrapper => {
        const passwordInput = wrapper.querySelector("input");
        const passwordError = wrapper.closest(".popup")?.querySelector(".error-text");
        const generateBtn = wrapper.querySelector(".generate");
        const thinkingBtn = wrapper.querySelector(".thinking");
        const toggleBtn = wrapper.querySelector(".toggle-password");
        const printBtn = wrapper.querySelector(".print");
        const paper = wrapper.querySelector(".paper");

        if (!passwordInput) return;

        passwordInput.addEventListener("input", () => {
            const result = validatePassword(passwordInput.value.trim());
            result.valid
                ? showValid(passwordInput, passwordError)
                : showError(passwordInput, passwordError, result.error);
        });

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                togglePasswordVisibility(passwordInput, toggleBtn);
            });
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
                    ? showValid(passwordInput, passwordError)
                    : showError(passwordInput, passwordError, result.error);
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
                    ? showValid(passwordInput, passwordError)
                    : showError(passwordInput, passwordError, result.error);
            });
        }

        if (printBtn && paper) {
            printBtn.addEventListener("click", () => {
                triggerPrint(printBtn, paper);
            });
        }
    });

    if (passwordContainer.children.length === 0) {
        const header = document.createElement("h1");
        header.id = "password-text";
        header.textContent = "No passwords yet!";
        passwordContainer.appendChild(header);
    }

    onlineBtn.addEventListener("click", e => {
        e.preventDefault();
        if (localStorage.getItem("skipPopup") === "true") {
            window.location.href = "Online.html";
        } else {
            container.style.display = "flex";
        }
    });

    onlineEnterBtn.addEventListener("click", () => {
        if (dontShowCheckbox.checked) {
            localStorage.setItem("skipPopup", "true");
        }
        container.style.display = "none";
        window.location.href = "Online.html";
    });

    onlineCancelBtn.addEventListener("click", () => {
        container.style.display = "none";
    });

    addBtn.addEventListener("click", () => {
        addContainer.style.display = "flex";
    });

    document.querySelectorAll(".add-password-btn, #addpasswordBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            const websiteResult = validateWebsite(websiteInput.value.trim());

            const activePasswordInput =
                addContainer.querySelector(".input-wrapper input");

            const activePasswordError =
                addContainer.querySelector(".error-text");

            const passwordResult = validatePassword(activePasswordInput.value.trim());

            websiteResult.valid
                ? showValid(websiteInput, websiteError)
                : showError(websiteInput, websiteError, websiteResult.error);

            passwordResult.valid
                ? showValid(activePasswordInput, activePasswordError)
                : showError(activePasswordInput, activePasswordError, passwordResult.error);

            if (websiteResult.valid && passwordResult.valid) {
                addContainer.style.display = "none";
                masterPasswordContainer.style.display = "flex";
            }
        });
    });

    document.querySelectorAll(".cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            addContainer.style.display = "none";
            masterPasswordContainer.style.display = "none";
        });
    });
});