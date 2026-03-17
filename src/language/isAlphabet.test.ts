import { describe, it, expect } from 'vitest';
import { isAlphabet } from './isAlphabet';

describe('isAlphabet', () => {
    it('소문자에 대해 true를 반환해야 함', () => {
        expect(isAlphabet('a')).toBe(true);
        expect(isAlphabet('z')).toBe(true);
        expect(isAlphabet('m')).toBe(true);
    });

    it('대문자에 대해 true를 반환해야 함', () => {
        expect(isAlphabet('A')).toBe(true);
        expect(isAlphabet('Z')).toBe(true);
        expect(isAlphabet('M')).toBe(true);
    });

    it('숫자에 대해 false를 반환해야 함', () => {
        expect(isAlphabet('0')).toBe(false);
        expect(isAlphabet('5')).toBe(false);
        expect(isAlphabet('9')).toBe(false);
    });

    it('특수 문자에 대해 false를 반환해야 함', () => {
        expect(isAlphabet('!')).toBe(false);
        expect(isAlphabet('@')).toBe(false);
        expect(isAlphabet('#')).toBe(false);
        expect(isAlphabet(' ')).toBe(false);
    });

    it('여러 문자에 대해 false를 반환해야 함', () => {
        expect(isAlphabet('ab')).toBe(false);
        expect(isAlphabet('ABC')).toBe(false);
        expect(isAlphabet('hello')).toBe(false);
    });

    it('빈 문자열에 대해 false를 반환해야 함', () => {
        expect(isAlphabet('')).toBe(false);
    });
});
