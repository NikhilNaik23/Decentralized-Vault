const request = require('supertest');
const app = require('../../src/app'); // Adjust the path as necessary

describe('Authentication Integration Tests', () => {
    let user;

    beforeAll(async () => {
        // Create a test user
        user = {
            username: 'testuser',
            password: 'testpassword',
        };
    });

    afterAll(async () => {
        // Clean up test data if necessary
    });

    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send(user);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'User registered successfully');
    });

    it('should log in the user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send(user);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('should fail to log in with incorrect credentials', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'wronguser',
                password: 'wrongpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
});