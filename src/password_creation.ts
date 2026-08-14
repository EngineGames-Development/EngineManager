import { encryptData, decryptData } from "./password_encryption.js";
import { getVaultKeyCached } from "./vault.js";
import { updateEmptyState } from "./ui.js";
import { getID } from "./main.js";
import { validatePassword } from './password_viewer.js';

export async function addPassword() {
  const dek = getVaultKeyCached();
  const data = {
    website: getID<HTMLInputElement>("websiteinputbox").value,
    username: getID<HTMLInputElement>("username-input").value,
    password: getID<HTMLInputElement>("password-input").value,
    note: getID<HTMLTextAreaElement>("note").value
  };
  const encrypted = await encryptData(dek, JSON.stringify(data));
  const existing = JSON.parse(localStorage.getItem("encryptedPasswords") || "[]");
  existing.push(encrypted);
  localStorage.setItem("encryptedPasswords", JSON.stringify(existing));
  updateEmptyState();
  await createPasswordContainer();
}

async function getFavicon(domain: string) {
  const fallback = "https://www.freeiconspng.com/uploads/globe-icon-18.png";
  try {
    if (!/^https?:\/\//i.test(domain)) domain = "https://" + domain;
    const host = new URL(domain).hostname;
    const url = `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
    return await new Promise<string>(r => {
      const i = new Image();
      i.onload = () => r(url);
      i.onerror = () => r(fallback);
      i.src = url;
    });
  } catch {
    return fallback;
  }
}

export async function createPasswordContainer() {
  const dek = getVaultKeyCached();
  const stored = JSON.parse(localStorage.getItem("encryptedPasswords") || "[]");
  const container = getID<HTMLDivElement>("password-container");
  container.innerHTML = "";
  for (const encrypted of stored) {
    try {
      const decrypted = JSON.parse(await decryptData(dek, encrypted));
      const item = document.createElement("div");
      item.className = "password-item";
      const img = document.createElement("img");
      img.src = await getFavicon(decrypted.website);
      img.width = 32;
      img.height = 32;
      const p = document.createElement("p");
      p.textContent = decrypted.website;
      item.append(img, p);
      container.appendChild(item);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "24");
      svg.setAttribute("height", "24");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.style.marginLeft = "8px";
      svg.style.color = "white";

      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("fill", "currentColor");
      path.setAttribute("d", "M12 5 L12 19 L19 12 Z");
      svg.appendChild(path);
      svg.style.cursor = "pointer";
      item.appendChild(svg);
      svg.addEventListener("click", () => {
        validatePassword(decrypted);
      });
    } catch {}
  }
  updateEmptyState();
}
