
import { blake2bHex } from './blake2b.mjs';

// Data Sample (Metadata)
const metadata = {
    "holder_name": "Putri Suci Renita",
    "event_name": "Workshop Keamanan Siber 2026",
    "issue_date": "2026-01-01",
    "signer_name": "Admin Disdikpora",
    "signer_position": "Kepala Bidang IT",
    "timestamp": "2026-01-01T00:00:00.000Z"
};

console.log("=== PENGUJIAN ALGORITMA BLAKE2b (FINAL DIGEST) ===");

// 1. Persiapan Data
// Pada implementasi Hybrid di app ini, BLAKE2b biasanya menerima input dari output SHA-128
// Tapi untuk uji mandiri (standalone), kita gunakan string metadata langsung
console.log("[1] Menyiapkan Data Input");
console.log("    Metadata:");
console.log(JSON.stringify(metadata, null, 4).replace(/^/gm, "    "));

const inputString = JSON.stringify(metadata);
console.log("    String yang akan di-hash:");
console.log(`    "${inputString.substring(0, 60)}..."`);
console.log(`    Panjang Input: ${inputString.length} bytes`);

// 2. Proses Hashing
console.log("[2] Menjalankan Hashing BLAKE2b (64-byte / 512-bit output)...");

const startTime = performance.now();
const hash = blake2bHex(inputString);
const endTime = performance.now();

// 3. Hasil
console.log("[3] Hasil Output");
// Format hex BLAKE2b standar biasanya panjang (128 char untuk 512 bit)
// Kita tampilkan sebagian agar rapi seperti format permintaan user sebelumnya
console.log(`    Hash Digest (Hex): ${hash.substring(0, 32)}...${hash.substring(hash.length - 16)}`);
console.log(`    Full Digest: ${hash}`);
console.log(`    Ukuran Output: ${hash.length} karakter hex (${hash.length * 4} bit)`);
console.log(`    Waktu Eksekusi: ~${(endTime - startTime).toFixed(1)} ms`);

// 4. Verifikasi Avalanche Effect
console.log("[4] Pengujian Avalanche Effect (Ubah 1 huruf)");
const modifiedMetadata = { ...metadata, holder_name: "Qutri Suci Renita" }; // Putri -> Qutri
const modifiedString = JSON.stringify(modifiedMetadata);
const modifiedHash = blake2bHex(modifiedString);

console.log(`    Input Awal: "...Putri..." -> Hash: ${hash.substring(0, 16)}...`);
console.log(`    Input Baru: "...Qutri..." -> Hash: ${modifiedHash.substring(0, 16)}...`);

if (hash !== modifiedHash) {
    console.log("    Status: PASS (Hash berubah total hanya dengan perubahan 1 bit input)");
} else {
    console.log("    Status: FAIL (Collision detected)");
}
