/**
 * ECDSA without Hash Algorithm
 * Signs data directly without cryptographic hash - uses raw byte values
 * 
 * Note: This is less secure than using a proper hash but demonstrates
 * the ECDSA mechanics without hashing step.
 */

import {
    generateKeyPair as genKeyPair,
    createSignableData as createData,
    mod,
    modInverse,
    pointAdd,
    pointMultiply,
    isPointAtInfinity,
    G,
    n
} from './ecdsa-sha128.js';

export const ALGORITHM_NAME = 'ecdsa_no_hash';
export const ALGORITHM_DISPLAY_NAME = 'ECDSA (No Hash)';

// Re-export from base module
export const generateKeyPair = genKeyPair;
export const createSignableData = createData;

/**
 * NO HASH - Use first few bytes of message directly as e
 * This takes the byte values and combines them into a single number mod n
 */
function noHash(message) {
    const str = typeof message === 'string' ? message : JSON.stringify(message);

    // Take first 8 characters and create a number from their byte values
    let e = 0n;
    const len = Math.min(str.length, 8);
    for (let i = 0; i < len; i++) {
        e = (e * 256n + BigInt(str.charCodeAt(i))) % n;
    }

    // Ensure e is at least 1
    if (e === 0n) e = 1n;

    return e;
}

/**
 * Sign data using ECDSA without hash
 */
export function signData(data, privateKeyStr) {
    const d = BigInt(privateKeyStr);
    const m = typeof data === 'string' ? data : JSON.stringify(data);

    // NO HASH - use raw bytes directly
    const e = noHash(m);

    let k, r, s;
    let validSignature = false;
    let attempts = 0;

    while (!validSignature && attempts < 100) {
        attempts++;
        k = BigInt(Math.floor(Math.random() * 36) + 1);

        const R_point = pointMultiply(k, G);
        if (R_point === null) continue;

        r = mod(R_point.x, n);
        if (r === 0n) continue;

        const k_inv = modInverse(k, n);
        s = mod(k_inv * (e + d * r), n);

        if (s !== 0n) {
            validSignature = true;
        }
    }

    if (s === 0n) {
        throw new Error('Failed to generate valid signature');
    }

    return JSON.stringify({ r: r.toString(), s: s.toString() });
}

/**
 * Verify signature using ECDSA without hash
 */
export function verifySignature(data, signatureStr, publicKeyStr) {
    try {
        const sig = JSON.parse(signatureStr);
        const r = BigInt(sig.r);
        const s = BigInt(sig.s);
        const Q = JSON.parse(publicKeyStr, (key, value) => {
            if (key === 'x' || key === 'y') return BigInt(value);
            return value;
        });

        if (r < 1n || r >= n || s < 1n || s >= n) return false;

        const m = typeof data === 'string' ? data : JSON.stringify(data);
        const e = noHash(m);  // NO HASH - same as signing

        const w = modInverse(s, n);
        const u1 = mod(e * w, n);
        const u2 = mod(r * w, n);

        const term1 = pointMultiply(u1, G);
        const term2 = pointMultiply(u2, Q);
        const X = pointAdd(term1, term2);

        if (isPointAtInfinity(X)) return false;

        const v = mod(X.x, n);
        return v === r;
    } catch (err) {
        console.error("Verification failed:", err);
        return false;
    }
}
