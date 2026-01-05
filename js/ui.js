function findErrorElement(input) {
    const wrapper = input.closest('.input-wrapper');
    if (wrapper && wrapper.nextElementSibling?.classList.contains('error-text')) {
        return wrapper.nextElementSibling;
    }

    if (input.nextElementSibling?.classList.contains('error-text')) {
        return input.nextElementSibling;
    }

    return null;
}

export function showError(input, message) {
    const errorEl = findErrorElement(input);

    input.classList.add('input-error');
    input.classList.remove('input-valid');

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

export function showValid(input) {
    const errorEl = findErrorElement(input);

    input.classList.add('input-valid');
    input.classList.remove('input-error');

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.style.display = 'none';
    }
}

export function togglePasswordVisibility(input, toggleBtn) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggleBtn.classList.toggle('active', isPassword);
}

export function triggerPrint(printer, paper) {
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