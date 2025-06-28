const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const mentorRoutes = require('./routes/mentor');
const matchingRoutes = require('./routes/matching');

// Import database
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mentor-Mentee Matching API',
      version: '1.0.0',
      description: 'API for mentor-mentee matching application'
    },
    servers: [
      {
        url: 'http://localhost:8080/api',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'] // paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(swaggerOptions);

// Swagger UI
app.use('/swagger-ui', swaggerUi.serve, swaggerUi.setup(specs));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Redirect root to swagger UI
app.get('/', (req, res) => {
  res.redirect('/swagger-ui');
});

// API routes
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', mentorRoutes);
app.use('/api', matchingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize database and start server
db.initialize()
  .then(() => {
    if (require.main === module) {
      app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
        console.log(`Swagger UI available at http://localhost:${PORT}/swagger-ui`);
      });
    }
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    if (require.main === module) {
      process.exit(1);
    }
  });

module.exports = app;
