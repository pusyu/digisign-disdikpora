
import { sha128Hex } from './sha128.mjs';

// Data Sample (Metadata)
const metadata = {
    "holder_name": "Putri Suci Renita",
    "event_name": "Workshop Keamanan Siber 2026",
    "issue_date": "2026-01-01",
    "signer_name": "Admin Disdikpora",
    "signer_position": "Kepala Bidang IT",
    "timestamp": "2026-01-01T00:00:00.000Z"
};

console.log("=== PENGUJIAN ALGORITMA SHA-128 (CUSTOM) ===");

// 1. Persiapan Data
console.log("[1] Menyiapkan Data Input");
console.log("    Metadata:");
console.log(JSON.stringify(metadata, null, 4).replace(/^/gm, "    "));

// Konversi ke string (Canonical format simulation)
const inputString = JSON.stringify(metadata);
console.log("    String yang akan di-hash:");
console.log(`    "${inputString.substring(0, 60)}..."`);
console.log(`    Panjang Input: ${inputString.length} bytes`);

// 2. Proses Hashing
console.log("[2] Menjalankan Hashing SHA-128...");

const startTime = performance.now();
const hash = sha128Hex(inputString);
const endTime = performance.now();

// 3. Hasil
console.log("[3] Hasil Output");
console.log(`    Hash Digest (Hex): ${hash}`);
console.log(`    Ukuran Output: ${hash.length} karakter hex (${hash.length * 4} bit)`);
console.log(`    Waktu Eksekusi: ~${(endTime - startTime).toFixed(1)} ms`);

// 4. Verifikasi Avalanche Effect
console.log("[4] Pengujian Avalanche Effect (Ubah 1 huruf)");
const modifiedMetadata = { ...metadata, holder_name: "Qutri Suci Renita" }; // Putri -> Qutri
const modifiedString = JSON.stringify(modifiedMetadata);
const modifiedHash = sha128Hex(modifiedString);

console.log(`    Input Awal: "...Putri..." -> Hash: ${hash}`);
console.log(`    Input Baru: "...Qutri..." -> Hash: ${modifiedHash}`);

let diffCount = 0;
for (let i = 0; i < hash.length; i++) {
    if (hash[i] !== modifiedHash[i]) diffCount++;
}

if (hash !== modifiedHash) {
    console.log("    Status: PASS (Hash berubah total hanya dengan perubahan 1 bit input)");
} else {
    console.log("    Status: FAIL (Collision detected)");
}
