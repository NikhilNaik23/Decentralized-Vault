const Blockchain = require('../../src/blockchain/Blockchain');

describe('Blockchain', () => {
    let blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
    });

    test('should create a new blockchain', () => {
        expect(blockchain).toBeDefined();
        expect(blockchain.chain).toHaveLength(1); // Genesis block
    });

    test('should add a new block', () => {
        const previousBlock = blockchain.getLatestBlock();
        const newBlockData = { data: 'Test Block' };
        const newBlock = blockchain.addBlock(newBlockData);

        expect(newBlock).toBeDefined();
        expect(newBlock.index).toBe(previousBlock.index + 1);
        expect(newBlock.previousHash).toBe(previousBlock.hash);
        expect(newBlock.data).toEqual(newBlockData);
    });

    test('should validate a valid chain', () => {
        blockchain.addBlock({ data: 'Block 1' });
        blockchain.addBlock({ data: 'Block 2' });

        expect(blockchain.isChainValid()).toBe(true);
    });

    test('should invalidate a tampered chain', () => {
        blockchain.addBlock({ data: 'Block 1' });
        const tamperedBlock = blockchain.chain[1];
        tamperedBlock.data = { data: 'Tampered Block' };

        expect(blockchain.isChainValid()).toBe(false);
    });

    test('should return the latest block', () => {
        const newBlockData = { data: 'Block 1' };
        blockchain.addBlock(newBlockData);
        const latestBlock = blockchain.getLatestBlock();

        expect(latestBlock.data).toEqual(newBlockData);
    });
});