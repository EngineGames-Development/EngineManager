// Add same website add password view, add save

import {getID, getElement, getChildElement} from './main.js';
import { encryptData, decryptData, importDEK } from './password_encryption.js';
import { updateEmptyState } from './ui.js';
import { validatePassword } from './password_viewer.js';

export async function addPassword() {
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const dekCryptoKey = await importDEK(dek);

    const data = {
      website : getID<HTMLInputElement>("websiteinputbox").value,
      username: getID<HTMLInputElement>("username-input").value,
      password: getID<HTMLInputElement>("password-input").value,
      note: getID<HTMLTextAreaElement>("note").value
    };

    const encrypted = await encryptData(dekCryptoKey, JSON.stringify(data));

    const existing = JSON.parse(localStorage.getItem("encryptedPasswords") || "[]");

    existing.push(encrypted);

    localStorage.setItem("encryptedPasswords", JSON.stringify(existing));
    updateEmptyState();
    await createPasswordContainer(dekCryptoKey);
}

async function getFavicon(domain: any | URL) {
    const defaultFavicon = "https://www.freeiconspng.com/uploads/globe-icon-18.png";

    try {
        if (!/^https?:\/\//i.test(domain)) {
            domain = "https://" + domain;
        }
        const urlObj = new URL(domain);
        const host = urlObj.hostname;

        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${host}`;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(faviconUrl);
            img.onerror = () => resolve(defaultFavicon);
            img.src = faviconUrl;
        });
    } catch (e) {
        return Promise.resolve(defaultFavicon);
    }
}

export async function createPasswordContainer(dekCryptoKey: CryptoKey) {
    const stored = JSON.parse(localStorage.getItem("encryptedPasswords") || "[]");

    const passwordContainer = getID<HTMLDivElement>("password-container");
    while (passwordContainer.firstChild) {
        passwordContainer.removeChild(passwordContainer.firstChild);
    }

    for (const encrypted of stored) {
        const decryptedJSON = await decryptData(dekCryptoKey, encrypted);
        const decryptedData = JSON.parse(decryptedJSON);

        const passwordItem = document.createElement("div");
        passwordItem.classList.add("password-item");

        const website = decryptedData.website;
        const favicon = await getFavicon(website);

        const faviconImage = document.createElement("img");
        faviconImage.src = favicon as string;
        faviconImage.width = 32;
        faviconImage.height = 32;

        const passwordName = document.createElement("p");
        passwordName.textContent = decryptedData.website;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.classList.add("passwordsvg");
        svg.setAttribute("width", "24");
        svg.setAttribute("height", "24");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.style.marginLeft = "8px";

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("fill", "currentColor");
        path.setAttribute(
            "d",
            "M5.536 21.886a1 1 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886"
        );

        svg.appendChild(path);
        svg.addEventListener("click", () => {
            validatePassword(decryptedData);
        });

        passwordItem.appendChild(faviconImage);
        passwordItem.appendChild(passwordName);
        passwordItem.appendChild(svg);

        passwordContainer.appendChild(passwordItem);
    }

    updateEmptyState();
}