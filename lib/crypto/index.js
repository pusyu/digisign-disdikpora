/**
 * Crypto Module Index
 * Exports all algorithm modules and provides helper functions
 */

import * as ecdsaSha128 from './ecdsa-sha128.js';
import * as ecdsaNoHash from './ecdsa-no-hash.js';
import * as ecdsaBlake2b from './ecdsa-blake2b.js';
import * as ecdsaSha128Blake2b from './ecdsa-sha128-blake2b.js';

// Algorithm constants
export const ALGORITHMS = {
    ECDSA_BLAKE2B: 'ecdsa_blake2b',
    ECDSA_NO_HASH: 'ecdsa_no_hash',
    ECDSA_SHA128_BLAKE2B: 'ecdsa_sha128_blake2b',
    ECDSA_SHA128: 'ecdsa_sha128'
};

// Algorithm display names for UI
export const ALGORITHM_OPTIONS = [
    { value: ALGORITHMS.ECDSA_BLAKE2B, label: 'ECDSA-BLAKE2B' },
    { value: ALGORITHMS.ECDSA_NO_HASH, label: 'ECDSA-NO-HASH' },
    { value: ALGORITHMS.ECDSA_SHA128_BLAKE2B, label: 'ECDSA-SHA128-BLAKE2B' },
    { value: ALGORITHMS.ECDSA_SHA128, label: 'ECDSA-SHA128' }
];

// Algorithm module mapping
const algorithmModules = {
    [ALGORITHMS.ECDSA_BLAKE2B]: ecdsaBlake2b,
    [ALGORITHMS.ECDSA_NO_HASH]: ecdsaNoHash,
    [ALGORITHMS.ECDSA_SHA128_BLAKE2B]: ecdsaSha128Blake2b,
    [ALGORITHMS.ECDSA_SHA128]: ecdsaSha128
};

/**
 * Get the algorithm module based on algorithm type
 * @param {string} algorithmType - Algorithm type constant
 * @returns {Object} Algorithm module with signData, verifySignature, etc.
 */
export function getAlgorithmModule(algorithmType) {
    const module = algorithmModules[algorithmType];
    if (!module) {
        console.warn(`Unknown algorithm: ${algorithmType}, falling back to ECDSA_SHA128`);
        return algorithmModules[ALGORITHMS.ECDSA_SHA128];
    }
    return module;
}

/**
 * Generate key pair using specified algorithm
 * @param {string} algorithmType - Algorithm type constant
 * @returns {Object} { privateKey, publicKey }
 */
export function generateKeyPair(algorithmType = ALGORITHMS.ECDSA_SHA128) {
    const module = getAlgorithmModule(algorithmType);
    return module.generateKeyPair();
}

/**
 * Sign data using specified algorithm
 * @param {string} data - Data to sign
 * @param {string} privateKeyHex - Private key in hex format
 * @param {string} algorithmType - Algorithm type constant
 * @returns {string} Signature in hex format
 */
export function signData(data, privateKeyHex, algorithmType = ALGORITHMS.ECDSA_SHA128) {
    const module = getAlgorithmModule(algorithmType);
    return module.signData(data, privateKeyHex);
}

/**
 * Verify signature using specified algorithm
 * @param {string} data - Original data
 * @param {string} signatureHex - Signature in hex format
 * @param {string} publicKeyHex - Public key in hex format
 * @param {string} algorithmType - Algorithm type constant
 * @returns {boolean} True if valid, false otherwise
 */
export function verifySignature(data, signatureHex, publicKeyHex, algorithmType = ALGORITHMS.ECDSA_SHA128) {
    const module = getAlgorithmModule(algorithmType);
    return module.verifySignature(data, signatureHex, publicKeyHex);
}

/**
 * Create signable data from certificate info
 * @param {Object} certInfo - Certificate information
 * @returns {string} Data string to be signed
 */
export function createSignableData(certInfo) {
    return ecdsaSha128.createSignableData(certInfo);
}

/**
 * Generate full QR data structure as a URL
 * @param {Object} metadata - Certificate metadata
 * @param {Object} keyPair - { privateKey, publicKey }
 * @param {string} origin - window.location.origin
 * @returns {string} The full URL for the QR code
 */
export function generateQRValue(metadata, keyPair, origin) {
    const currentTimestamp = metadata.timestamp || new Date().toISOString();

    const signableData = createSignableData({
        holderName: metadata.ownerName,
        eventName: metadata.eventName,
        issueDate: metadata.issueDate,
        signerName: metadata.signerName,
        signerPosition: metadata.signerPosition,
        timestamp: currentTimestamp
    });

    const signature = signData(signableData, keyPair.privateKey, metadata.algorithm);

    const rawData = JSON.stringify({
        d: { // data
            o: metadata.ownerName,
            e: metadata.eventName,
            s: metadata.signerName,
            p: metadata.signerPosition,
            t: metadata.issueDate,
            ts: currentTimestamp
        },
        a: metadata.algorithm, // algorithm
        sig: signature, // signature
        pk: keyPair.publicKey // public key for verification
    });

    // Convert to base64 to put in URL
    const base64Data = btoa(unescape(encodeURIComponent(rawData)));
    return `${origin}/verify?data=${base64Data}`;
}

// Re-export individual modules for direct access if needed
export { ecdsaSha128, ecdsaNoHash, ecdsaBlake2b, ecdsaSha128Blake2b };
