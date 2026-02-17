/**
 * ECDSA with SHA-128 Custom Implementation
 * 
 * Domain Parameters (Proper Small Curve with Prime Order):
 * q = 29 (Field modulus - prime)
 * a = 4, b = 20 (Curve coefficients: y² = x³ + 4x + 20)
 * G = (1, 5) (Base point - verified on curve)
 * n = 37 (Group order - PRIME! This ensures all non-zero s have inverses)
 * 
 * Hash: Custom SHA-128 implementation
 */

import { sha128 } from './sha128.mjs';

export const ALGORITHM_NAME = 'ecdsa_sha128';
export const ALGORITHM_DISPLAY_NAME = 'ECDSA + SHA-128 (Custom)';

// --- Mathematical Constants ---
export const q = 29n;  // Field modulus
export const a = 4n;   // Curve coefficient
export const b = 20n;  // Curve coefficient
export const G = { x: 1n, y: 5n };  // Base point (1³ + 4*1 + 20 = 25 = 5² mod 29)
export const n = 37n;  // Group order (prime!)

// --- Helper Functions for Modular Arithmetic ---

// (a mod n) that handles negative numbers correctly
export function mod(vals, m) {
  const result = vals % m;
  return result >= 0n ? result : result + m;
}

// Modular Inverse using Extended Euclidean Algorithm
export function modInverse(a, m) {
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  let [old_t, t] = [0n, 1n];

  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }

  if (old_r !== 1n) {
    throw new Error('Modular inverse does not exist');
  }

  return mod(old_s, m);
}

// --- Elliptic Curve Operations ---

export function isPointAtInfinity(P) {
  return P === null || P === undefined;
}

export function pointAdd(P, Q) {
  if (isPointAtInfinity(P)) return Q;
  if (isPointAtInfinity(Q)) return P;

  const { x: x1, y: y1 } = P;
  const { x: x2, y: y2 } = Q;

  // Normalize to ensure proper comparison
  const x1_mod = mod(x1, q);
  const y1_mod = mod(y1, q);
  const x2_mod = mod(x2, q);
  const y2_mod = mod(y2, q);

  if (x1_mod === x2_mod) {
    if (y1_mod !== y2_mod) {
      return null; // Point at infinity (P + (-P) = O)
    }
    // Point doubling: P == Q
    if (y1_mod === 0n) return null; // Tangent is vertical
    const numerator = mod(3n * x1_mod * x1_mod + a, q);
    const denominator = modInverse(mod(2n * y1_mod, q), q);
    const lambda = mod(numerator * denominator, q);
    const x3 = mod(lambda * lambda - x1_mod - x2_mod, q);
    const y3 = mod(lambda * (x1_mod - x3) - y1_mod, q);
    return { x: x3, y: y3 };
  }

  // Point addition: P != Q
  const numerator = mod(y2_mod - y1_mod, q);
  const denominator = modInverse(mod(x2_mod - x1_mod, q), q);
  const lambda = mod(numerator * denominator, q);
  const x3 = mod(lambda * lambda - x1_mod - x2_mod, q);
  const y3 = mod(lambda * (x1_mod - x3) - y1_mod, q);
  return { x: x3, y: y3 };
}

export function pointMultiply(k, P) {
  let R = null; // Point at infinity
  let Q_point = P;
  let scalar = BigInt(k);

  while (scalar > 0n) {
    if (scalar & 1n) {
      R = pointAdd(R, Q_point);
    }
    Q_point = pointAdd(Q_point, Q_point);
    scalar >>= 1n;
  }
  return R;
}

// --- Hash Function using SHA-128 ---

/**
 * Hash using SHA-128, then reduce to mod n
 * e = sum(sha128_bytes) mod n
 */
function sha128Hash(message) {
  const hashBytes = sha128(message);
  let sum = 0n;
  for (let i = 0; i < hashBytes.length; i++) {
    sum += BigInt(hashBytes[i]);
  }
  return sum % n;
}

// --- Exported Functions ---

/**
 * Generate ECDSA key pair
 * Key d is random in [1, n-1]
 */
export function generateKeyPair() {
  // Generate random private key d in range [1, n-1]
  // n=37, so range is 1 to 36
  const d = BigInt(Math.floor(Math.random() * 36) + 1);

  // Calculate Public Key Q = d * G
  const Q = pointMultiply(d, G);

  return {
    privateKey: d.toString(),
    publicKey: JSON.stringify({ x: Q.x.toString(), y: Q.y.toString() })
  };
}

/**
 * Sign data using custom ECDSA
 */
export function signData(data, privateKeyStr) {
  const d = BigInt(privateKeyStr);
  const m = typeof data === 'string' ? data : JSON.stringify(data);

  // 1. Hash message
  const e = sha128Hash(m);

  // 2. Select ephemeral key k
  // Must be in [1, n-1] and gcd(k, n) = 1
  let k, r, s;
  let validSignature = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!validSignature && attempts < maxAttempts) {
    attempts++;

    // Pick random k in [1, n-1] = [1, 36] (all values valid since n is prime)
    k = BigInt(Math.floor(Math.random() * 36) + 1);

    // 3. Compute point (x1, y1) = k * G
    const R_point = pointMultiply(k, G);
    if (R_point === null) continue;

    const x1 = R_point.x;

    // 4. r = x1 mod n
    r = mod(x1, n);
    if (r === 0n) continue;

    // 5. s = k^-1 * (e + d*r) mod n
    const k_inv = modInverse(k, n);
    s = mod(k_inv * (e + d * r), n);

    if (s === 0n) continue;

    // Since n is prime, any non-zero s is valid (has modular inverse)
    if (s !== 0n) {
      validSignature = true;
    }
  }

  if (s === 0n) {
    throw new Error('Failed to generate valid signature');
  }

  // Return signature as JSON string
  return JSON.stringify({ r: r.toString(), s: s.toString() });
}

/**
 * Verify signature using custom ECDSA
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

    // Basic checks
    if (r < 1n || r >= n || s < 1n || s >= n) return false;

    // 1. Hash message
    const m = typeof data === 'string' ? data : JSON.stringify(data);
    const e = sha128Hash(m);

    // 2. w = s^-1 mod n
    const w = modInverse(s, n);

    // 3. u1 = e*w mod n
    const u1 = mod(e * w, n);

    // 4. u2 = r*w mod n
    const u2 = mod(r * w, n);

    // 5. X = u1*G + u2*Q
    const term1 = pointMultiply(u1, G);
    const term2 = pointMultiply(u2, Q);
    const X = pointAdd(term1, term2);

    if (isPointAtInfinity(X)) return false;

    // 6. Verify r == x_X mod n
    const v = mod(X.x, n);

    return v === r;
  } catch (err) {
    console.error("Verification failed:", err);
    return false;
  }
}

/**
 * Create data to be signed from certificate info
 * We'll just return it as a JSON string for hashing
 */
export function createSignableData(certInfo) {
  return JSON.stringify({
    holderName: certInfo.holder_name,
    eventName: certInfo.event_name,
    issueDate: certInfo.issue_date,
    signerName: certInfo.signer_name,
    signerPosition: certInfo.signer_position || '',
    timestamp: certInfo.timestamp || new Date().toISOString()
  });
}