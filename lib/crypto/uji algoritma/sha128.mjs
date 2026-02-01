/**
 * SHA-128 Cryptographic Hash Function
 * Educational implementation based on SHA-256 with modifications for 128-bit output
 * 
 * Parameters:
 * - Word size: 32 bit
 * - Block size: 512 bit (64 bytes)
 * - Rounds: 32 (reduced from SHA-256's 64)
 * - Output: 128 bit (16 bytes)
 */

// Initial Hash Values (modified from SHA-256, using first 4 values)
const H_INIT = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a
];

// Round Constants (using first 32 constants from SHA-256)
const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967
];

// Rotate right for 32-bit
function rotr(x, n) {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
}

// Shift right for 32-bit
function shr(x, n) {
    return x >>> n;
}

// Ch(x,y,z) = (x AND y) XOR ((NOT x) AND z)
function Ch(x, y, z) {
    return ((x & y) ^ (~x & z)) >>> 0;
}

// Maj(x,y,z) = (x AND y) XOR (x AND z) XOR (y AND z)
function Maj(x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
}

// Σ₀(x) = ROTR²(x) ⊕ ROTR¹³(x) ⊕ ROTR²²(x)
function Sigma0(x) {
    return (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
}

// Σ₁(x) = ROTR⁶(x) ⊕ ROTR¹¹(x) ⊕ ROTR²⁵(x)
function Sigma1(x) {
    return (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;
}

// σ₀(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)
function sigma0(x) {
    return (rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3)) >>> 0;
}

// σ₁(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)
function sigma1(x) {
    return (rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10)) >>> 0;
}

/**
 * Pad message according to SHA-128 specification (same as SHA-256)
 * @param {Uint8Array} message - Input message bytes
 * @returns {Uint8Array} - Padded message
 */
function padMessage(message) {
    const msgLen = message.length;
    const bitLen = msgLen * 8;

    // Calculate padding length
    // Message + 1 byte (0x80) + padding + 8 bytes (length)
    // Total must be multiple of 64 bytes
    let padLen = 64 - ((msgLen + 9) % 64);
    if (padLen === 64) padLen = 0;

    const totalLen = msgLen + 1 + padLen + 8;
    const padded = new Uint8Array(totalLen);

    // Copy original message
    padded.set(message);

    // Append bit '1' (0x80)
    padded[msgLen] = 0x80;

    // Append zeros (already initialized to 0)

    // Append length as 64-bit big-endian
    // For simplicity, we assume message length fits in 32 bits
    const lenPos = totalLen - 8;
    // High 32 bits (0 for messages < 2^32 bits)
    padded[lenPos] = 0;
    padded[lenPos + 1] = 0;
    padded[lenPos + 2] = 0;
    padded[lenPos + 3] = 0;
    // Low 32 bits
    padded[lenPos + 4] = (bitLen >>> 24) & 0xFF;
    padded[lenPos + 5] = (bitLen >>> 16) & 0xFF;
    padded[lenPos + 6] = (bitLen >>> 8) & 0xFF;
    padded[lenPos + 7] = bitLen & 0xFF;

    return padded;
}

/**
 * Process a single 512-bit block
 * @param {number[]} H - Current hash state (4 x 32-bit words for SHA-128)
 * @param {Uint8Array} block - 64-byte block
 */
function processBlock(H, block) {
    // Create message schedule W[0..31] (reduced from 64 for SHA-128)
    const W = new Array(32);

    // W[0..15] = message block (big-endian)
    for (let t = 0; t < 16; t++) {
        const i = t * 4;
        W[t] = (block[i] << 24) | (block[i + 1] << 16) | (block[i + 2] << 8) | block[i + 3];
    }

    // W[16..31] = message schedule expansion (reduced)
    for (let t = 16; t < 32; t++) {
        W[t] = (sigma1(W[t - 2]) + W[t - 7] + sigma0(W[t - 15]) + W[t - 16]) >>> 0;
    }

    // Initialize working variables (only 4 for SHA-128)
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];

    // 32 rounds of compression (reduced from 64)
    for (let t = 0; t < 32; t++) {
        // Modified compression function for 4 variables instead of 8
        const T1 = (d + Sigma1(a) + Ch(a, b, c) + K[t] + W[t]) >>> 0;
        const T2 = (Sigma0(a) + Maj(a, b, c)) >>> 0;

        d = c;
        c = b;
        b = a;
        a = (T1 + T2) >>> 0;
    }

    // Update hash state (only 4 values)
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
}

/**
 * SHA-128 hash function
 * @param {string|Uint8Array} input - Message to hash
 * @returns {Uint8Array} - 16-byte hash digest
 */
export function sha128(input) {
    // Convert string to bytes
    let data;
    if (typeof input === 'string') {
        data = new TextEncoder().encode(input);
    } else {
        data = input;
    }

    // Pad the message
    const padded = padMessage(data);

    // Initialize hash state (4 values for 128-bit output)
    const H = [...H_INIT];

    // Process each 512-bit (64-byte) block
    for (let i = 0; i < padded.length; i += 64) {
        const block = padded.slice(i, i + 64);
        processBlock(H, block);
    }

    // Convert hash state to bytes (big-endian) - only 16 bytes for SHA-128
    const result = new Uint8Array(16);
    for (let i = 0; i < 4; i++) {
        result[i * 4] = (H[i] >>> 24) & 0xFF;
        result[i * 4 + 1] = (H[i] >>> 16) & 0xFF;
        result[i * 4 + 2] = (H[i] >>> 8) & 0xFF;
        result[i * 4 + 3] = H[i] & 0xFF;
    }

    return result;
}

/**
 * Convert Uint8Array to hex string
 */
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * SHA-128 hash returning hex string
 */
export function sha128Hex(input) {
    return bytesToHex(sha128(input));
}