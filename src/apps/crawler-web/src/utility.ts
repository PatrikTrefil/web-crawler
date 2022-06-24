export function isValidRegex(regex: string): boolean {
    try {
        new RegExp(regex);
        return true;
    } catch {
        return false;
    }
}
