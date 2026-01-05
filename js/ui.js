export function showError(input) {
    input.classList.add('input-error');
    input.classList.remove('input-valid');
}

export function showValid(input) {
    input.classList.add('input-valid');
    input.classList.remove('input-error');
}

export function togglePasswordVisibility(input, toggleBtn) {
    if (input.type === "password") {
        input.type = "text";
        toggleBtn.classList.add("active");
    } else {
        input.type = "password";
        toggleBtn.classList.remove("active");
    }
}

export function triggerPrint(printer, paper) {
    printer.classList.add('active');
    paper.classList.add('active');
    printer.addEventListener('animationend', () => {
        printer.classList.remove('active');
        paper.classList.remove('active');
    }, { once: true });
}