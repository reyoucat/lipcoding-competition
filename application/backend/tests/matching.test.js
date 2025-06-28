const request = require('supertest');
const app = require('../server');
const db = require('../database/db');

describe('Matching API', () => {
  let server;
  let mentorToken;
  let menteeToken;
  let mentorId;
  let menteeId;

  beforeAll((done) => {
    server = app.listen(0, done);
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
    await new Promise(resolve => setTimeout(resolve, 200));

    // Create test users
    const mentorResponse = await request(app)
      .post('/api/signup')
      .send({
        email: 'testmentor@example.com',
        password: 'password123',
        name: 'Test Mentor',
        role: 'mentor'
      });
    
    if (mentorResponse.status !== 201) {
      console.error('Mentor signup failed:', mentorResponse.body);
      throw new Error(`Mentor signup failed with status ${mentorResponse.status}`);
    }
    mentorId = mentorResponse.body.userId;

    const menteeResponse = await request(app)
      .post('/api/signup')
      .send({
        email: 'testmentee@example.com',
        password: 'password123',
        name: 'Test Mentee',
        role: 'mentee'
      });
    
    if (menteeResponse.status !== 201) {
      console.error('Mentee signup failed:', menteeResponse.body);
      throw new Error(`Mentee signup failed with status ${menteeResponse.status}`);
    }
    menteeId = menteeResponse.body.userId;

    // Wait for user creation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Get tokens
    const mentorLogin = await request(app)
      .post('/api/login')
      .send({
        email: 'testmentor@example.com',
        password: 'password123'
      });
    
    if (mentorLogin.status !== 200) {
      console.error('Mentor login failed:', mentorLogin.body);
      console.error('Mentor login status:', mentorLogin.status);
      console.error('Available users after signup:');
      // Let's check what users exist
      const checkUsers = await new Promise((resolve) => {
        db.db.all('SELECT id, email, role, name FROM users', (err, rows) => {
          if (err) console.error('DB error:', err);
          else console.error('Users in DB:', rows);
          resolve(rows);
        });
      });
      throw new Error(`Mentor login failed with status ${mentorLogin.status}`);
    }
    mentorToken = mentorLogin.body.token;

    const menteeLogin = await request(app)
      .post('/api/login')
      .send({
        email: 'testmentee@example.com',
        password: 'password123'
      });
    
    if (menteeLogin.status !== 200) {
      console.error('Mentee login failed:', menteeLogin.body);
      throw new Error(`Mentee login failed with status ${menteeLogin.status}`);
    }
    menteeToken = menteeLogin.body.token;
  });

  describe('POST /api/matching-requests', () => {
    test('should create matching request successfully', async () => {
      const response = await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({
          mentor_id: mentorId,
          message: 'I would like to learn from you!'
        });

      if (response.status !== 201) {
        console.error('Create matching request failed:', response.body);
        console.error('Mentee token:', menteeToken);
        console.error('Mentor ID:', mentorId);
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Matching request created successfully');
      expect(response.body).toHaveProperty('requestId');
    });

    test('should reject request from mentor', async () => {
      const response = await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          mentor_id: menteeId,
          message: 'Test message'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject duplicate request', async () => {
      // Create first request
      await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({
          mentor_id: mentorId,
          message: 'First request'
        })
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({
          mentor_id: mentorId,
          message: 'Second request'
        })
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/matching-requests', () => {
    beforeEach(async () => {
      // Create a test request
      await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({
          mentor_id: mentorId,
          message: 'Test request'
        });
    });

    test('should get requests for mentee', async () => {
      const response = await request(app)
        .get('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('mentor_name', 'Test Mentor');
    });

    test('should get requests for mentor', async () => {
      const response = await request(app)
        .get('/api/matching-requests')
        .set('Authorization', `Bearer ${mentorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('mentee_name', 'Test Mentee');
    });
  });

  describe('PUT /api/matching-requests/:id', () => {
    let requestId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/matching-requests')
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({
          mentor_id: mentorId,
          message: 'Test request'
        });
      
      if (response.status !== 201) {
        console.error('Failed to create matching request:', response.body);
        throw new Error(`Failed to create matching request with status ${response.status}`);
      }
      
      requestId = response.body.requestId;
      
      // Wait a bit to ensure the request is fully created
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should accept request successfully', async () => {
      const response = await request(app)
        .put(`/api/matching-requests/${requestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ status: 'accepted' });

      if (response.status !== 200) {
        console.error('Accept request failed:', response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject request successfully', async () => {
      const response = await request(app)
        .put(`/api/matching-requests/${requestId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ status: 'rejected' });

      if (response.status !== 200) {
        console.error('Reject request failed:', response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    test('should reject access from mentee', async () => {
      const response = await request(app)
        .put(`/api/matching-requests/${requestId}`)
        .set('Authorization', `Bearer ${menteeToken}`)
        .send({ status: 'accepted' })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });
});
