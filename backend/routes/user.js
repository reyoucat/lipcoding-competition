const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { getUserById, updateUserProfile } = require('../database/db');

const router = express.Router();

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 // 1MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [mentor, mentee]
 *         profile:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             bio:
 *               type: string
 *             imageUrl:
 *               type: string
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         bio:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        name: user.name,
        bio: user.bio || '',
        imageUrl: user.image_data ? `/images/${user.role}/${user.id}` : `/public/images/default-${user.role}.png`,
        skills: [] // Initialize skills as empty array for all users
      }
    };

    // Add skills for mentors
    if (user.role === 'mentor' && user.skills) {
      try {
        console.log('Raw skills data:', user.skills);
        console.log('Type of skills data:', typeof user.skills);
        
        // Check if it's already an array (parsed)
        if (Array.isArray(user.skills)) {
          userProfile.profile.skills = user.skills;
        } else {
          // Try to parse JSON string
          userProfile.profile.skills = JSON.parse(user.skills);
        }
      } catch (e) {
        console.error('Error parsing skills:', e);
        userProfile.profile.skills = [];
      }
    }

    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /me:
 *   put:
 *     summary: Update current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/me', [
  authenticateToken,
  body('name').optional().trim().isLength({ min: 1 }),
  body('bio').optional().trim(),
  body('skills').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    
    // Only mentors can update skills
    if (req.user.role === 'mentor' && req.body.skills) {
      updates.skills = req.body.skills;
    }

    await updateUserProfile(req.user.id, updates);
    
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /me/image:
 *   post:
 *     summary: Upload profile image
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/me/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Basic image validation (size already handled by multer)
    const imageBuffer = req.file.buffer;
    
    // Simple validation - check if it's actually an image by looking at headers
    const isPNG = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47;
    const isJPEG = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && imageBuffer[2] === 0xFF;
    
    if (!isPNG && !isJPEG) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const updates = {
      image_data: imageBuffer,
      image_type: req.file.mimetype
    };

    await updateUserProfile(req.user.id, updates);
    
    res.json({ 
      message: 'Image uploaded successfully',
      imageUrl: `/images/${req.user.role}/${req.user.id}`
    });
  } catch (error) {
    console.error('Upload image error:', error);
    if (error.message === 'Only JPG and PNG files are allowed') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /images/{role}/{id}:
 *   get:
 *     summary: Get profile image
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mentor, mentee]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Profile image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
router.get('/images/:role/:id', async (req, res) => {
  try {
    const { role, id } = req.params;
    
    if (!['mentor', 'mentee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await getUserById(parseInt(id));
    if (!user || user.role !== role) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.image_data) {
      // Return default local image
      return res.redirect(`/images/default-${role}.png`);
    }

    res.set('Content-Type', user.image_type);
    res.send(user.image_data);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
