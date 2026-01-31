import { getElement } from './main.js';

export function validatePassword(data: unknown) {
  document.addEventListener("DOMContentLoaded", () => {
    const passwordvalidation = getElement<HTMLDivElement>(".password-validation");

    if (!passwordvalidation) return;

    passwordvalidation.style.display = "flex";
  });
}