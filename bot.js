const aptos = require('aptos');
const { Buffer } = require('buffer');

// Daftar kunci privat dalam format heksadesimal
const privateKeysHex = [
    '30226b75450dae00750227b63ec2bc6003b12b509a33edb7f7c712b51a477444',
    '2',
    '3',
    // Tambahkan kunci privat lainnya di sini
];

// Buat akun Aptos dari kunci privat
const accounts = privateKeysHex.map(keyHex => {
    const privateKeyArray = Uint8Array.from(Buffer.from(keyHex, 'hex'));
    return new aptos.AptosAccount(privateKeyArray);
});

// Buat klien Aptos untuk testnet
const client = new aptos.AptosClient("https://aptos.testnet.suzuka.movementlabs.xyz/v1");

async function swap() {
    for (let i = 1; i <= 20; i++) {
        console.log(`Pengulangan ke-${i}`);
        for (const account of accounts) {
            try {
                console.log(`Proses swap untuk akun: ${account.address().hex()}`);

                // Verifikasi akun
                const accountInfo = await client.getAccount(account.address());
                console.log("Akun ditemukan");

                // Payload swap
                const payload = {
                    function: "0x65c7939df25c4986b38a6af99602bf17daa1a2d7b53e6847ed25c04f74f54607::RazorSwapPool::swap_exact_coins_for_coins_entry",
                    type_arguments: [
                        "0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::USDC",
                        "0x275f508689de8756169d1ee02d889c777de1cebda3a7bbcce63ba8a27c563c6f::tokens::WBTC"
                    ],
                    arguments: [
                        "10000000", // Jumlah koin yang akan ditukar
                        "14639"     // Jumlah minimum koin yang diterima (diatur ke 0 untuk fleksibilitas maksimum)
                    ]
                };

                // Buat transaksi
                const transaction = await client.generateTransaction(account.address(), payload);
                const signedTransaction = await client.signTransaction(account, transaction);
                const transactionResponse = await client.submitTransaction(signedTransaction);

                console.log(`Transaksi dikirim untuk akun ${account.address().hex()}:`, transactionResponse.hash);

                // Tunggu konfirmasi transaksi
                const result = await waitForTransaction(client, transactionResponse.hash);
                console.log(`Transaksi dikonfirmasi untuk akun ${account.address().hex()}:`);

            } catch (error) {
                console.error(`Terjadi kesalahan untuk akun ${account.address().hex()}:`, error);
            }
        }

        // Tampilkan hitung mundur sebelum pengulangan berikutnya
        for (let j = 20; j > 0; j--) {
            process.stdout.write(`\rMenunggu ${j} detik untuk pengulangan berikutnya...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }
}

async function waitForTransaction(client, transactionHash) {
    while (true) {
        try {
            const response = await client.getTransactionByHash(transactionHash);
            if (response) {
                return response;
            }
        } catch (error) {
            console.error("Kesalahan saat memeriksa status transaksi:", error);
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Tunggu 5 detik sebelum memeriksa lagi
    }
}

// Jalankan fungsi swap
swap();
