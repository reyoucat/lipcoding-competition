const request = require('supertest');
const app = require('../server');
const db = require('../database/db');

describe('Authentication API', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, done); // Use port 0 for testing
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    // Clean up database with more thorough cleanup
    await new Promise((resolve, reject) => {
      db.db.serialize(() => {
        db.db.run('DELETE FROM matching_requests', (err) => {
          if (err) console.error('Error deleting matching_requests:', err);
        });
        db.db.run('DELETE FROM users', (err) => {
          if (err) console.error('Error deleting users:', err);
          else resolve();
        });
      });
    });

    // Wait for database cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('POST /api/signup', () => {
    test('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'mentor'
      };

      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('userId');
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'mentor'
      };

      // Create first user
      await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/signup')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({
          email: 'invalid-email',
          password: '123', // too short
          role: 'invalid-role'
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
          role: 'mentor'
        });
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
    });

    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });
});
