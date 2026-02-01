/**
 * ECDSA with SHA-128 + BLAKE2b Double Hash
 * First hash with SHA-128, then hash with BLAKE2b
 */

import { sha128 } from './sha128.js';
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

export const ALGORITHM_NAME = 'ecdsa_sha128_blake2b';
export const ALGORITHM_DISPLAY_NAME = 'ECDSA + SHA-128 + BLAKE2b (Custom)';

// Re-export from base module
export const generateKeyPair = genKeyPair;
export const createSignableData = createData;

/**
 * Double hash: SHA-128 -> BLAKE2b -> sum mod n
 */
function doubleHash(message) {
    // Step 1: SHA-128
    const sha128Bytes = sha128(message);

    // Step 2: BLAKE2b of SHA-128 result
    const blake2bBytes = blake2b(sha128Bytes, 32);

    // Step 3: Sum bytes mod n
    let sum = 0n;
    for (let i = 0; i < blake2bBytes.length; i++) {
        sum += BigInt(blake2bBytes[i]);
    }
    return sum % n;
}

/**
 * Sign data using ECDSA with double hash (SHA-128 + BLAKE2b)
 */
export function signData(data, privateKeyStr) {
    const d = BigInt(privateKeyStr);
    const m = typeof data === 'string' ? data : JSON.stringify(data);

    // Double hash
    const e = doubleHash(m);

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
 * Verify signature using ECDSA with double hash
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
        const e = doubleHash(m);  // Double hash same as signing

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