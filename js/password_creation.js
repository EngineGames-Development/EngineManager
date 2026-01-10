import { encryptData, decryptData, importDEK } from './password_encryption.js';

export async function addPassword() {
    const dek = crypto.getRandomValues(new Uint8Array(32));
    const dekCryptoKey = await importDEK(dek);

    const data = {
      website : document.getElementById("websiteinputbox").value,
      username: document.getElementById("username-input").value,
      password: document.getElementById("password-input").value,
      note: document.getElementById("note").value
    };

    const encrypted = await encryptData(dekCryptoKey, JSON.stringify(data));
    localStorage.setItem("encryptedFormData", JSON.stringify(encrypted));
    createPasswordContainer(dekCryptoKey);
}

function getFavicon(url, defaultFavicon = "https://www.freeiconspng.com/uploads/globe-icon-18.png") {
    try {
        const domain = new URL(url).origin.replace(/^http:/, "https:");

        const faviconUrl = `${domain}/favicon.ico`;

        return faviconUrl;
    } catch (e) {
        return defaultFavicon
    }
}

export async function createPasswordContainer(dekCryptoKey) {
    const stored = JSON.parse(localStorage.getItem("encryptedFormData"));
    const decryptedJSON = await decryptData(dekCryptoKey, stored);
    const decryptedData = JSON.parse(decryptedJSON);

    let passwordcontainer = document.createElement("div");
    passwordcontainer.classList.add("passwords");
    passwordcontainer.appendChild(document.getElementById("password-container"))

    const website = decryptedData.website;
    const favicon = getFavicon(website);
    
    const faviconimage = document.createElement("img");
    faviconimage.src = favicon;
    faviconimage.width = 32;
    faviconimage.height = 32;
    passwordcontainer.appendChild(faviconimage);

    let passwordname = document.createElement("p");
    passwordname.textContent = website;
    passwordname.appendChild(passwordcontainer);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "32");
    svg.setAttribute("height", "32");
    svg.setAttribute("viewBox", "0 0 448 512");
    svg.style.marginLeft = "8px";

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", "M400 192h-24v-72C376 53.8 322.2 0 256 0S136 53.8 136 120v72h-24c-26.5 0-48 21.5-48 48v224c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48V240c0-26.5-21.5-48-48-48zm-152-72c0-30.9 25.1-56 56-56s56 25.1 56 56v72h-112v-72zm152 344H104V240h296v224z");

    svg.appendChild(path);
    passwordcontainer.appendChild(svg);
}