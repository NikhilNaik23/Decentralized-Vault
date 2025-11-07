const encryptionService = require('../../src/services/encryptionService');

describe('Encryption Service', () => {
    const testData = 'Hello, World!';
    const testKey = 'my-secret-key';

    test('should encrypt and decrypt data correctly', () => {
        const encryptedData = encryptionService.encrypt(testData, testKey);
        const decryptedData = encryptionService.decrypt(encryptedData, testKey);
        
        expect(decryptedData).toBe(testData);
    });

    test('should throw an error when decrypting with an incorrect key', () => {
        const encryptedData = encryptionService.encrypt(testData, testKey);
        const wrongKey = 'wrong-key';

        expect(() => {
            encryptionService.decrypt(encryptedData, wrongKey);
        }).toThrow('Decryption failed');
    });

    test('should handle empty data', () => {
        const encryptedData = encryptionService.encrypt('', testKey);
        const decryptedData = encryptionService.decrypt(encryptedData, testKey);
        
        expect(decryptedData).toBe('');
    });
});