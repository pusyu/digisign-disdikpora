/**
 * BLAKE2b Cryptographic Hash Function
 * Custom implementation based on "blake2b.md" specification
 * 
 * Parameters:
 * - Word size: 64 bit
 * - Rounds: 12
 * - Block size: 128 bytes
 * - Max digest: 64 bytes
 * - Rotation constants: (32, 24, 16, 63)
 */

// Initialization Vector (same as SHA-512)
const IV = [
    0x6a09e667f3bcc908n,
    0xbb67ae8584caa73bn,
    0x3c6ef372fe94f82bn,
    0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n,
    0x9b05688c2b3e6c1fn,
    0x1f83d9abfb41bd6bn,
    0x5be0cd19137e2179n
];

// Message schedule permutation SIGMA
const SIGMA = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0]
];

// 64-bit mask
const MASK64 = 0xffffffffffffffffn;

// Rotate right for 64-bit BigInt
function rotr64(x, n) {
    return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK64;
}

// G mixing function
function G(v, a, b, c, d, x, y) {
    // v[a] = (v[a] + v[b] + x) mod 2^64
    v[a] = (v[a] + v[b] + x) & MASK64;
    // v[d] = (v[d] ^ v[a]) >>> 32
    v[d] = rotr64(v[d] ^ v[a], 32);
    // v[c] = (v[c] + v[d]) mod 2^64
    v[c] = (v[c] + v[d]) & MASK64;
    // v[b] = (v[b] ^ v[c]) >>> 24
    v[b] = rotr64(v[b] ^ v[c], 24);
    // v[a] = (v[a] + v[b] + y) mod 2^64
    v[a] = (v[a] + v[b] + y) & MASK64;
    // v[d] = (v[d] ^ v[a]) >>> 16
    v[d] = rotr64(v[d] ^ v[a], 16);
    // v[c] = (v[c] + v[d]) mod 2^64
    v[c] = (v[c] + v[d]) & MASK64;
    // v[b] = (v[b] ^ v[c]) >>> 63
    v[b] = rotr64(v[b] ^ v[c], 63);
}

// Compression function F
function compress(h, block, t, lastBlock) {
    // Initialize working vector v[0..15]
    const v = [
        h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7],
        IV[0], IV[1], IV[2], IV[3], IV[4], IV[5], IV[6], IV[7]
    ];

    // XOR counter into v[12] and v[13]
    v[12] = v[12] ^ (t & MASK64);           // Low 64 bits of counter
    v[13] = v[13] ^ 0n;                      // High 64 bits (0 for messages < 2^64 bytes)

    // If last block, invert v[14]
    if (lastBlock) {
        v[14] = v[14] ^ MASK64;
    }

    // Parse block into 16 message words (little-endian)
    const m = [];
    for (let i = 0; i < 16; i++) {
        const offset = i * 8;
        let word = 0n;
        for (let j = 0; j < 8; j++) {
            word |= BigInt(block[offset + j] || 0) << BigInt(j * 8);
        }
        m.push(word);
    }

    // 12 rounds of mixing
    for (let round = 0; round < 12; round++) {
        const s = SIGMA[round % 10];

        // Column step
        G(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
        G(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
        G(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
        G(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);

        // Diagonal step
        G(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
        G(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
        G(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
        G(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
    }

    // Finalize: h[i] = h[i] ^ v[i] ^ v[i+8]
    for (let i = 0; i < 8; i++) {
        h[i] = h[i] ^ v[i] ^ v[i + 8];
    }
}

/**
 * BLAKE2b hash function
 * @param {string|Uint8Array} input - Message to hash
 * @param {number} digestLength - Output length in bytes (1-64, default 32)
 * @returns {Uint8Array} Hash digest
 */
export function blake2b(input, digestLength = 32) {
    // Convert string to bytes
    let data;
    if (typeof input === 'string') {
        data = new TextEncoder().encode(input);
    } else {
        data = input;
    }

    // Validate digest length
    if (digestLength < 1 || digestLength > 64) {
        throw new Error('Digest length must be between 1 and 64 bytes');
    }

    // Initialize state h with IV
    const h = [...IV];

    // XOR parameter block into h[0]
    // Parameter: fanout=1, depth=1, digestLength
    h[0] = h[0] ^ BigInt(0x01010000 | digestLength);

    // Process message in 128-byte blocks
    const blockSize = 128;
    let bytesProcessed = 0n;
    let offset = 0;

    while (offset < data.length) {
        const remaining = data.length - offset;
        const isLastBlock = remaining <= blockSize;
        const blockLength = Math.min(remaining, blockSize);

        // Create padded block
        const block = new Uint8Array(blockSize);
        for (let i = 0; i < blockLength; i++) {
            block[i] = data[offset + i];
        }

        bytesProcessed += BigInt(blockLength);

        compress(h, block, bytesProcessed, isLastBlock);

        offset += blockSize;
    }

    // Handle empty input
    if (data.length === 0) {
        const block = new Uint8Array(blockSize);
        compress(h, block, 0n, true);
    }

    // Convert hash state to bytes (little-endian)
    const result = new Uint8Array(digestLength);
    for (let i = 0; i < digestLength; i++) {
        const wordIndex = Math.floor(i / 8);
        const byteIndex = i % 8;
        result[i] = Number((h[wordIndex] >> BigInt(byteIndex * 8)) & 0xffn);
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
 * BLAKE2b hash returning hex string
 */
export function blake2bHex(input, digestLength = 32) {
    return bytesToHex(blake2b(input, digestLength));
}
