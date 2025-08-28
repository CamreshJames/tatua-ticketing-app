const CIPHER_KEY = 'tatua_super_secret_key_for_aes_2025!';

export function encryptAES(text) {
    try {
        return CryptoJS.AES.encrypt(text, CIPHER_KEY).toString();
    } catch (e) {
        console.error("AES Encryption failed:", e);
        return text;
    }
}

export function decryptAES(ciphertext) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, CIPHER_KEY);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) throw new Error("Decryption resulted in empty string.");
        return decryptedText;
    } catch (e) {
        console.error("AES Decryption failed:", e);
        return ciphertext;
    }
}