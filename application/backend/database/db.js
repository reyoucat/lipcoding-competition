const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Create database connection
const db = new sqlite3.Database(DB_PATH);

// Initialize database with tables
const initialize = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table (for both mentors and mentees)
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('mentor', 'mentee')),
          bio TEXT,
          image_data BLOB,
          image_type TEXT,
          skills TEXT, -- JSON string for mentor skills
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Matching requests table
      db.run(`
        CREATE TABLE IF NOT EXISTS matching_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mentee_id INTEGER NOT NULL,
          mentor_id INTEGER NOT NULL,
          message TEXT,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (mentee_id) REFERENCES users(id),
          FOREIGN KEY (mentor_id) REFERENCES users(id),
          UNIQUE(mentee_id, mentor_id)
        )
      `);

      // Create indexes
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_matching_requests_mentee ON matching_requests(mentee_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_matching_requests_mentor ON matching_requests(mentor_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_matching_requests_status ON matching_requests(status)`);

      // Create trigger to update updated_at timestamp
      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users
        BEGIN
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `);

      db.run(`
        CREATE TRIGGER IF NOT EXISTS update_matching_requests_timestamp 
        AFTER UPDATE ON matching_requests
        BEGIN
          UPDATE matching_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `, async (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database initialized successfully');
          // Create default test accounts
          await createDefaultAccounts();
          resolve();
        }
      });
    });
  });
};

// Create default test accounts
const createDefaultAccounts = async () => {
  try {
    // Check if default accounts already exist
    const mentorExists = await dbHelpers.getUserByEmail('mentor@test.com');
    const menteeExists = await dbHelpers.getUserByEmail('mentee@test.com');

    if (!mentorExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      // Use direct database insertion to avoid double hashing
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          ['mentor@test.com', hashedPassword, '김멘토', 'mentor'],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      // Add mentor profile with skills
      const mentor = await dbHelpers.getUserByEmail('mentor@test.com');
      await dbHelpers.updateUserProfile(mentor.id, {
        bio: '5년차 풀스택 개발자입니다. React, Node.js 전문가로 멘티를 도와드리겠습니다.',
        skills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'AWS']
      });
      console.log('Default mentor account created: mentor@test.com / password123');
    }

    if (!menteeExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      // Use direct database insertion to avoid double hashing
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
          ['mentee@test.com', hashedPassword, '김멘티', 'mentee'],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      // Add mentee profile
      const mentee = await dbHelpers.getUserByEmail('mentee@test.com');
      await dbHelpers.updateUserProfile(mentee.id, {
        bio: 'React를 배우고 싶은 신입 개발자입니다. 멘토링을 통해 성장하고 싶습니다.'
      });
      console.log('Default mentee account created: mentee@test.com / password123');
    }
  } catch (error) {
    console.error('Error creating default accounts:', error);
  }
};

// Database helper functions
const dbHelpers = {
  // Get user by email
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new user
  createUser: (email, password, name, role) => {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, role],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Update user profile
  updateUserProfile: (id, updates) => {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (updates.name) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.bio !== undefined) {
        fields.push('bio = ?');
        values.push(updates.bio);
      }
      if (updates.skills) {
        fields.push('skills = ?');
        values.push(JSON.stringify(updates.skills));
      }
      if (updates.image_data) {
        fields.push('image_data = ?');
        values.push(updates.image_data);
      }
      if (updates.image_type) {
        fields.push('image_type = ?');
        values.push(updates.image_type);
      }

      if (fields.length === 0) {
        resolve();
        return;
      }

      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  // Get all mentors
  getMentors: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM users WHERE role = "mentor" ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Create matching request
  createMatchingRequest: (menteeId, mentorId, message) => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO matching_requests (mentee_id, mentor_id, message) VALUES (?, ?, ?)',
        [menteeId, mentorId, message],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  // Get matching requests by mentee
  getMatchingRequestsByMentee: (menteeId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT mr.*, u.name as mentor_name, u.bio as mentor_bio, u.skills as mentor_skills
        FROM matching_requests mr
        JOIN users u ON mr.mentor_id = u.id
        WHERE mr.mentee_id = ?
        ORDER BY mr.created_at DESC
      `, [menteeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Get matching requests by mentor
  getMatchingRequestsByMentor: (mentorId) => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT mr.*, u.name as mentee_name, u.bio as mentee_bio
        FROM matching_requests mr
        JOIN users u ON mr.mentee_id = u.id
        WHERE mr.mentor_id = ?
        ORDER BY mr.created_at DESC
      `, [mentorId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Update matching request status
  updateMatchingRequestStatus: (id, status) => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE matching_requests SET status = ? WHERE id = ?',
        [status, id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  // Delete matching request
  deleteMatchingRequest: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM matching_requests WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  // Check if mentee has pending request
  hasPendingRequest: (menteeId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM matching_requests WHERE mentee_id = ? AND status = "pending"',
        [menteeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  },

  // Check if mentor has accepted request
  hasAcceptedRequest: (mentorId) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM matching_requests WHERE mentor_id = ? AND status = "accepted"',
        [mentorId],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  },

  // Get matching request by ID
  getMatchingRequestById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM matching_requests WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

module.exports = {
  db,
  initialize,
  ...dbHelpers
};
