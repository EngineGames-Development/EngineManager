function getID<T extends HTMLElement>(selector: string): T {
  const el = document.getElementById(selector);
  if (!el) throw new Error(`Element ${selector} not found`);
  return el as T;
}
function getElement<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element ${selector} not found`);
  return el as T;
}

function getChildElement<T extends HTMLElement>(
  parent: Element,
  selector: string
): T {
  const el = parent.querySelector(selector);
  if (!el) throw new Error(`Element ${selector} not found inside parent`);
  return el as T;
}

const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
}

export function escapeHTML(str : string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "'");
}

const loginBtn = document.getElementById("login-button");
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        console.log("Login button clicked (placeholder)");
    });
}

function setEqualHeightsPerRow() {
    const container = document.querySelector<HTMLDivElement>('.card-container');
    
    if (!container) return; 
    
    const cards = Array.from(container.children) as HTMLElement[];
    let rowTop = 0;
    let rowCards : HTMLElement[] = [];
    let maxHeight = 0;

    cards.forEach(card => card.style.height = 'auto');

    cards.forEach(card => {
        const cardTop = card.offsetTop;

        if (cardTop !== rowTop) {
            rowCards.forEach(c => c.style.height = maxHeight + 'px');

            rowTop = cardTop;
            rowCards = [card];
            maxHeight = card.offsetHeight;
        } else {
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

function applyTheme(theme : string) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeButtons.forEach(btn => btn.textContent = '☀️');
  } else if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeButtons.forEach(btn => btn.textContent = '🌙');
  } else {
    document.documentElement.setAttribute('data-theme', '');
    themeButtons.forEach(btn => btn.textContent = '🌓');
  }
  localStorage.setItem('theme', theme);
  currentTheme = theme;
}

themeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (currentTheme === 'system') applyTheme('dark');
    else if (currentTheme === 'dark') applyTheme('light');
    else applyTheme('system');
  });
});

applyTheme(currentTheme);

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector<HTMLDivElement>(".container");
  const onlineBtn = document.getElementById("onlineBtn") as HTMLButtonElement | null;
  const enterBtn = document.querySelector<HTMLButtonElement>(".popup button:first-of-type");
  const cancelBtn = document.querySelector<HTMLButtonElement>(".popup button:last-of-type");
  const dontShowCheckbox = document.querySelector<HTMLInputElement>(".popup input[type='checkbox']");

  if (!container || !onlineBtn || !enterBtn || !cancelBtn || !dontShowCheckbox) {
    return;
  }

  onlineBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (localStorage.getItem("skipPopup") === "true") {
      window.location.href = "Online.html";
    } else {
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
