
import { generateKeyPair, signData, verifySignature } from './ecdsa-sha128.mjs';

// Data Sample (Metadata)
const metadata = {
    "holder_name": "Putri Suci Renita",
    "event_name": "Workshop Keamanan Siber 2026",
    "issue_date": "2026-01-01",
    "signer_name": "Admin Disdikpora",
    "signer_position": "Kepala Bidang IT",
    "timestamp": "2026-01-01T00:00:00.000Z"
};

console.log("=== PENGUJIAN ALGORITMA ECDSA (CUSTOM CURVE) ===");

// 1. Generate Key Pair
console.log("[1] Membangkitkan Pasangan Kunci (Key Pair Generation)");
const startTimeKey = performance.now();
const keyPair = generateKeyPair();
const endTimeKey = performance.now();

console.log("    Private Key (d): " + keyPair.privateKey);
console.log("    Public Key (Q) : " + keyPair.publicKey);
console.log(`    Waktu Generasi : ${(endTimeKey - startTimeKey).toFixed(4)} ms`);

// 2. Persiapan Data
console.log("\n[2] Menyiapkan Data Input");
const inputString = JSON.stringify(metadata);
console.log(`    Data: "${inputString.substring(0, 50)}..."`);

// 3. Penandatanganan (Signing)
console.log("\n[3] Proses Penandatanganan Digital (Signing)");
console.log("    Menggunakan Private Key untuk menandatangani data hash...");

const startTimeSign = performance.now();
const signature = signData(inputString, keyPair.privateKey);
const endTimeSign = performance.now();

console.log(`    Signature (r, s): ${signature}`);
console.log(`    Waktu Signing   : ${(endTimeSign - startTimeSign).toFixed(4)} ms`);

// 4. Verifikasi (Verification)
console.log("\n[4] Proses Verifikasi (Verification)");
console.log("    Menggunakan Public Key untuk memverifikasi signature...");

const startTimeVerify = performance.now();
const isValid = verifySignature(inputString, signature, keyPair.publicKey);
const endTimeVerify = performance.now();

console.log(`    Hasil Verifikasi: ${isValid ? "VALID (TRUE)" : "INVALID (FALSE)"}`);
console.log(`    Waktu Verifikasi: ${(endTimeVerify - startTimeVerify).toFixed(4)} ms`);

if (isValid) {
    console.log("    Status: PASS (Signature valid untuk data asli)");
} else {
    console.log("    Status: FAIL (Signature ditolak)");
}

// 5. Pengujian Integritas (Tampering Test)
console.log("\n[5] Pengujian Integritas (Tampering Test)");
console.log("    Mengubah data input untu simulasi serangan...");

const tamperedMetadata = { ...metadata, holder_name: "Qutri Suci Renita" };
const tamperedString = JSON.stringify(tamperedMetadata);

console.log(`    Data Asli    : "...Putri..."`);
console.log(`    Data Palsu   : "...Qutri..."`);
console.log("    Memverifikasi signature asli terhadap data palsu...");

const isTamperedValid = verifySignature(tamperedString, signature, keyPair.publicKey);
console.log(`    Hasil Verifikasi: ${isTamperedValid ? "VALID" : "INVALID (FALSE)"}`);

if (!isTamperedValid) {
    console.log("    Status: PASS (Sistem mendeteksi perubahan data)");
} else {
    console.log("    Status: FAIL (Data palsu lolos verifikasi!)");
}
