/**
 * ECDSA with BLAKE2b Algorithm
 * Uses custom BLAKE2b implementation + custom ECDSA curve
 */

import { blake2b } from './blake2b.js';
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

export const ALGORITHM_NAME = 'ecdsa_blake2b';
export const ALGORITHM_DISPLAY_NAME = 'ECDSA + BLAKE2b (Custom)';

// Re-export key generation and data creation from base module
export const generateKeyPair = genKeyPair;
export const createSignableData = createData;

/**
 * Custom hash using BLAKE2b
 * e = sum(blake2b_bytes) mod n
 */
function blake2bHash(message) {
    const hashBytes = blake2b(message, 32); // 32-byte hash
    let sum = 0n;
    for (let i = 0; i < hashBytes.length; i++) {
        sum += BigInt(hashBytes[i]);
    }
    return sum % n;
}

/**
 * Sign data using ECDSA with custom BLAKE2b hash
 */
export function signData(data, privateKeyStr) {
    const d = BigInt(privateKeyStr);
    const m = typeof data === 'string' ? data : JSON.stringify(data);

    // Hash message with BLAKE2b
    const e = blake2bHash(m);

    let k, r, s;
    let validSignature = false;
    let attempts = 0;

    while (!validSignature && attempts < 100) {
        attempts++;
        // Pick random k in [1, n-1] = [1, 36] (all values valid since n is prime)
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
 * Verify signature using ECDSA with BLAKE2b hash
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

        // Hash message with BLAKE2b (Critical difference from standard verify)
        const e = blake2bHash(m);

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
