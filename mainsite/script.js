"use strict";
document.getElementById("year").textContent = new Date().getFullYear();
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
document.getElementById("login-button").addEventListener("click", () => {
    console.log("Login button clicked (placeholder)");
});
function setEqualHeightsPerRow() {
    const container = document.querySelector('.card-container');
    const cards = Array.from(container.children);
    let rowTop = 0;
    let rowCards = [];
    let maxHeight = 0;
    cards.forEach(card => card.style.height = 'auto');
    cards.forEach(card => {
        const cardTop = card.offsetTop;
        if (cardTop !== rowTop) {
            rowCards.forEach(c => c.style.height = maxHeight + 'px');
            rowTop = cardTop;
            rowCards = [card];
            maxHeight = card.offsetHeight;
        }
        else {
            rowCards.push(card);
            if (card.offsetHeight > maxHeight) {
                maxHeight = card.offsetHeight;
            }
        }
    });
    rowCards.forEach(c => c.style.height = maxHeight + 'px');
}
window.addEventListener('load', setEqualHeightsPerRow);
window.addEventListener('resize', setEqualHeightsPerRow);
const themeButtons = document.querySelectorAll('#theme-toggle, #footer-theme-toggle');
let currentTheme = localStorage.getItem('theme') || 'system';
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeButtons.forEach(btn => btn.textContent = '☀️');
    }
    else if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeButtons.forEach(btn => btn.textContent = '🌙');
    }
    else {
        document.documentElement.setAttribute('data-theme', '');
        themeButtons.forEach(btn => btn.textContent = '🌓');
    }
    localStorage.setItem('theme', theme);
    currentTheme = theme;
}
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentTheme === 'system')
            applyTheme('dark');
        else if (currentTheme === 'dark')
            applyTheme('light');
        else
            applyTheme('system');
    });
});
applyTheme(currentTheme);
document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container");
    const onlineBtn = document.getElementById("onlineBtn");
    const enterBtn = document.querySelector(".popup button:first-of-type");
    const cancelBtn = document.querySelector(".popup button:last-of-type");
    const dontShowCheckbox = document.querySelector(".popup input[type='checkbox']");
    onlineBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (localStorage.getItem("skipPopup") === "true") {
            window.location.href = "Online.html";
        }
        else {
            container.style.display = "flex";
        }
    });
    enterBtn.addEventListener("click", () => {
        if (dontShowCheckbox.checked) {
            localStorage.setItem("skipPopup", "true");
        }
        container.style.display = "none";
        window.location.href = "Online.html";
    });
    cancelBtn.addEventListener("click", () => {
        container.style.display = "none";
    });
});
//# sourceMappingURL=script.js.map