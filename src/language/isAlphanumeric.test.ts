import { describe, it, expect } from 'vitest';
import { isAlphanumeric } from './isAlphanumeric';

describe('isAlphanumeric', () => {
    it('알파벳만 포함된 문자열에 대해 true를 반환해야 함', () => {
        expect(isAlphanumeric('abc')).toBe(true);
        expect(isAlphanumeric('ABC')).toBe(true);
        expect(isAlphanumeric('aBc')).toBe(true);
    });

    it('숫자만 포함된 문자열에 대해 true를 반환해야 함', () => {
        expect(isAlphanumeric('123')).toBe(true);
        expect(isAlphanumeric('0')).toBe(true);
        expect(isAlphanumeric('999')).toBe(true);
    });

    it('알파벳과 숫자 혼합에 대해 true를 반환해야 함', () => {
        expect(isAlphanumeric('abc123')).toBe(true);
        expect(isAlphanumeric('Test123')).toBe(true);
        expect(isAlphanumeric('1a2b3c')).toBe(true);
    });

    it('특수 문자 포함 시 false를 반환해야 함', () => {
        expect(isAlphanumeric('abc!')).toBe(false);
        expect(isAlphanumeric('123@')).toBe(false);
        expect(isAlphanumeric('test#')).toBe(false);
    });

    it('공백 포함 시 false를 반환해야 함', () => {
        expect(isAlphanumeric('abc 123')).toBe(false);
        expect(isAlphanumeric(' abc')).toBe(false);
        expect(isAlphanumeric('abc ')).toBe(false);
    });

    it('빈 문자열에 대해 false를 반환해야 함', () => {
        expect(isAlphanumeric('')).toBe(false);
    });
});
