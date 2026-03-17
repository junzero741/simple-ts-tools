export function isAlphabet(char: string): boolean {
    if (char.length !== 1) return false;
    
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
