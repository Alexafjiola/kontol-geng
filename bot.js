const aptos = require('aptos');
const { Buffer } = require('buffer');

// Kunci privat Anda dalam format heksadesimal
const privateKeyHex = '64e27eba26ae2aaef328cb09df7d693645c1d468e0afc62fc3905c3f410cb84b';
const privateKeyArray = Uint8Array.from(Buffer.from(privateKeyHex, 'hex'));

// Buat akun Aptos dari kunci privat
const account = new aptos.AptosAccount(privateKeyArray);

// Buat klien Aptos untuk testnet
const client = new aptos.AptosClient("https://aptos.testnet.suzuka.movementlabs.xyz/v1");

// Nilai yang diharapkan dan slippage
const expectedAmountRZR = 0.0161636;
const slippagePercent = 0.50;
const slippageFactor = 1 + (slippagePercent / 100);

// Hitung jumlah minimum yang diterima setelah slippage
const minimumReceivedRZR = expectedAmountRZR / slippageFactor;
const minimumReceivedRZRInUnit = Math.floor(minimumReceivedRZR * 1e8); // Misalnya, 1e8 untuk presisi

async function swap() {
    for (let i = 0; i < 20; i++) {
        try {
            console.log(`\nMelakukan swap ke-${i + 1}`);

            // Payload swap dengan jumlah minimum yang dihitung
            const payload = {
                function: "0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::swap_coins_for_exact_coins_2_pair_entry",
                type_arguments: [
                    "0x1::aptos_coin::AptosCoin",
                    "0x8093e814c5cde1a2775750e999b3d9a01633fca54959126d890e87d95acbabca::staking::StakeCoin",
                    "0xcab9a7545a4f4a46308e2ac914a5ce2dcf63482713e683b4bc5fc4b514a790f2::razor_token::Razor"
                ],
                arguments: [
                    "1000000000", // Jumlah koin yang akan ditukar
                    minimumReceivedRZRInUnit.toString() // Jumlah minimum koin yang diterima
                ],
                type: "entry_function_payload"
            };

            // Buat transaksi
            const transaction = await client.generateTransaction(account.address(), payload);
            const signedTransaction = await client.signTransaction(account, transaction);
            const transactionResponse = await client.submitTransaction(signedTransaction);

            console.log(`Alamat: ${account.address()}`);
            console.log(`Hash Transaksi: ${transactionResponse.hash}`);

            // Hitung mundur 2 menit (120 detik)
            for (let seconds = 120; seconds > 0; seconds--) {
                process.stdout.write(`\rMenunggu ${seconds} detik sebelum swap berikutnya...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Tunggu 1 detik
            }
            console.log(); // Pindah ke baris baru setelah hitung mundur

        } catch (error) {
            console.error(`Terjadi kesalahan pada swap ke-${i + 1}:`, error);
            // Tunggu sebelum mencoba lagi
            await new Promise(resolve => setTimeout(resolve, 10000)); // Tunggu 10 detik sebelum mencoba lagi
        }
    }
}

// Jalankan fungsi swap
swap();
