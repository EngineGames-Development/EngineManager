// password view, save(import export), search, 2 passwörter zusammentuhen
import { getElement } from './main.js';

export function validatePassword(data: unknown) {
  console.log("clicked");
  document.addEventListener("DOMContentLoaded", () => {
    console.log("clicked further")
    const passwordvalidation = getElement<HTMLDivElement>(".password-validation");

    if (!passwordvalidation) return;

    passwordvalidation.style.display = "flex";
  });
}