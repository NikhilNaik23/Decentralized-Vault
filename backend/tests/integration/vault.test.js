const request = require('supertest');
const app = require('../../src/app');
const { connectToDatabase, disconnectFromDatabase } = require('../../src/config/database');
const Vault = require('../../src/models/Vault'); // Assuming a Vault model exists

describe('Vault Integration Tests', () => {
    beforeAll(async () => {
        await connectToDatabase();
    });

    afterAll(async () => {
        await disconnectFromDatabase();
    });

    beforeEach(async () => {
        await Vault.deleteMany({}); // Clear the vault collection before each test
    });

    it('should create a new vault entry', async () => {
        const response = await request(app)
            .post('/api/vault')
            .send({
                userId: 'testUserId',
                credentials: {
                    type: 'email',
                    value: 'test@example.com',
                },
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Vault entry created successfully');
        expect(response.body).toHaveProperty('data');
    });

    it('should retrieve vault entries for a user', async () => {
        await Vault.create({
            userId: 'testUserId',
            credentials: {
                type: 'email',
                value: 'test@example.com',
            },
        });

        const response = await request(app)
            .get('/api/vault/testUserId');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveLength(1);
    });

    it('should return 404 if no vault entries found for user', async () => {
        const response = await request(app)
            .get('/api/vault/nonExistentUserId');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'No vault entries found for this user');
    });
});