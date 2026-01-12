export function generateRandomPassword(length = 24) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
    const password = [];
    const maxValid = Math.floor(256 / charset.length) * charset.length;
    const buffer = new Uint8Array(length * 2);

    while (password.length < length) {
        crypto.getRandomValues(buffer);
        for (const byte of buffer) {
            if (byte < maxValid) {
                password.push(charset[byte % charset.length]);
                if (password.length === length) break;
            }
        }
    }
    return password.join('');
}

export async function generateMemorablePassword({
    wordCount = 7,
    separator = "-"
}: { wordCount?: number; separator?: string } = {}): Promise<string> {
    const res = await fetch("./wordlist.txt");
    const text = await res.text();

    // Split words from the wordlist file
    const words: string[] = text
        .split("\n")
        .map(line => line.split("\t")[1])
        .filter(Boolean);

    const symbols: string = "!@#$%^&*";
    const numbers: string = "0123456789";

    // Secure random helper
    const secureRandom = (max: number): number => {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        return buf[0] % max;
    };

    const parts: string[] = [];

    // Pick random words
    for (let i = 0; i < wordCount; i++) {
        let word = words[secureRandom(words.length)];
        word = word.charAt(0).toUpperCase() + word.slice(1);
        parts.push(word);
    }

    // Insert a random number and symbol
    parts.splice(secureRandom(parts.length), 0, numbers[secureRandom(numbers.length)]);
    parts.splice(secureRandom(parts.length), 0, symbols[secureRandom(symbols.length)]);

    return parts.join(separator);
}