/**
 * empty regex is considered invalid
 * @returns {boolean} indicating validity
 */
export function isValidRegex(regex: string): boolean {
    if (regex === "") return false;
    try {
        new RegExp(regex);
        return true;
    } catch {
        return false;
    }
}
