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

type PasswordStrength = "Weak" | "Medium" | "Strong" | "Very Strong";

export function validatePassword(password: string) {
    let score = 0;

    if (!password) {
        return { valid: false, error: "Password is required", strength: "weak" as PasswordStrength, crackTime : "instantly" };
    }

    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 20;
    if (password.length >= 14) score += 20;

    const complexity = checkComplexity(password);

    if (complexity.lower) score += 10;
    if (complexity.upper) score += 10;
    if (complexity.number) score += 10;
    if (complexity.symbol) score += 10;

    const entropy = estimateEntropy(password);

    if (entropy >= 40) score += 5;
    if (entropy >= 60) score += 10;
    if (entropy >= 80) score += 5;

    if (checkPredictability(password)) score -= 20;

    score = Math.max(0, Math.min(100, score));

    let strength: PasswordStrength;
    if (score < 40) strength = "Weak";
    else if (score < 60) strength = "Medium";
    else if (score < 80) strength = "Strong";
    else strength = "Very Strong";

    const guessesPerSecond = 1e10;
    const avgGuesses = Math.pow(2,entropy - 1);
    const seconds = avgGuesses / guessesPerSecond;

    let crackTime : string;
    if (seconds < 1) crackTime = "instantly";
    else if (seconds < 60) crackTime = "seconds";
    else if (seconds < 3600) crackTime = "minutes";
    else if (seconds < 86400) crackTime = "hours";
    else if (seconds < 31536000) crackTime = "days";
    else if (seconds < 31536000 * 100) crackTime = "years";
    else crackTime = "centuries";

    if (password.length < 14) {
        return { valid: false, error: "Password must be at least 14 characters", strength, crackTime };
    }

    if (!complexity.lower || !complexity.upper || !complexity.number || !complexity.symbol) {
        return { valid: false, error: "Use uppercase, lowercase, number, and symbol", strength, crackTime };
    }

    if (entropy < 60 || checkPredictability(password)) {
        return { valid: false, error: "Password is too predictable", strength, crackTime };
    }

    return { valid: true, error: "", strength, crackTime };
}