const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function validateWebsite(value : string) {
    if (!value) return { valid: false, error: "Website is required" };
    if (!domainRegex.test(value)) return { valid: false, error: "Enter a valid domain" };
    return { valid: true, error: "" };
}

export function checkComplexity(password : string) {
    return {
        length: password.length >= 14,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /\d/.test(password),
        symbol: /[^A-Za-z0-9]/.test(password)
    };
}

export function estimateEntropy(password : string) {
    let pool = 0;
    if (/[a-z]/.test(password)) pool += 26;
    if (/[A-Z]/.test(password)) pool += 26;
    if (/[0-9]/.test(password)) pool += 10;
    if (/[^A-Za-z0-9]/.test(password)) pool += 32;
    return password.length * Math.log2(pool || 1);
}

export function checkPredictability(password: string) {
    const patterns = [
        /(.)\1{2,}/,
        /1234|2345|3456/,
        /abcd|bcde|cdef/,
        /qwerty|asdf|zxcv/i,
        /password|admin|welcome/i,
        /^\d{4}$/
    ];
    return patterns.some(rx => rx.test(password));
}

export function validatePassword(password : string) {
    if (!password) {
        return { valid: false, error: "Password is required" };
    }

    if (password.length < 14) {
        return { valid: false, error: "Password must be at least 14 characters" };
    }

    const complexity = checkComplexity(password);
    if (!complexity.lower || !complexity.upper || !complexity.number || !complexity.symbol) {
        return { valid: false, error: "Use uppercase, lowercase, number, and symbol" };
    }

    const entropy = estimateEntropy(password);
    if (entropy < 60 || checkPredictability(password)) {
        return { valid: false, error: "Password is too predictable" };
    }

    return { valid: true, error: "" };
}