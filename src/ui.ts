import { getElement, getChildElement, getID } from './main.js';

export function updateEmptyState() {
  const passwordContainer = getID<HTMLDivElement>("password-container");
  const hasPasswords =
    passwordContainer.querySelectorAll(".password-item").length > 0;

  const headers = passwordContainer.querySelectorAll(".password-text");

  if (!hasPasswords) {
    if (headers.length === 0) {
      let h1 = document.createElement("h1");
      h1.classList.add("password-text");
      h1.textContent = "No passwords yet!";
      h1.style.marginTop = "10px";
      passwordContainer.appendChild(h1);
    }
  } else {
    headers.forEach(h => h.remove());
  }
}

function findErrorElement(input : HTMLInputElement): HTMLElement | null {
    const wrapper = input.closest('.input-wrapper');
    if (wrapper && wrapper.nextElementSibling?.classList.contains('error-text')) {
        return wrapper.nextElementSibling as HTMLElement;
    }

    if (input.nextElementSibling?.classList.contains('error-text')) {
        return input.nextElementSibling as HTMLElement;
    }

    return null;
}

export function showError(input : HTMLInputElement, message : string) {
    const errorEl = findErrorElement(input);

    input.classList.add('input-error');
    input.classList.remove('input-valid');

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

export function showValid(input : HTMLInputElement) {
    const errorEl = findErrorElement(input);

    input.classList.add('input-valid');
    input.classList.remove('input-error');

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

export function togglePasswordVisibility(input : HTMLInputElement, toggleBtn : HTMLButtonElement) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggleBtn.classList.toggle('active', isPassword);
}

export function triggerPrint(
    printer: HTMLElement,
    paper: HTMLElement,
    value: string
): void {
    printer.classList.add('active');
    paper.classList.add('active');

    printer.addEventListener(
        'animationend',
        () => {
            printer.classList.remove('active');
            paper.classList.remove('active');
        },
        { once: true }
    );
}