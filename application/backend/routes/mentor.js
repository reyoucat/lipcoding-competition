const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getMentors } = require('../database/db');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Mentor:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         bio:
 *           type: string
 *         imageUrl:
 *           type: string
 *         skills:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /mentors:
 *   get:
 *     summary: Get list of mentors
 *     tags: [Mentors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: skill
 *         schema:
 *           type: string
 *         description: Filter by skill
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, skills]
 *         description: Sort mentors by name or skills
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: List of mentors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mentor'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - mentee role required
 *       500:
 *         description: Internal server error
 */
router.get('/mentors', authenticateToken, requireRole('mentee'), async (req, res) => {
  try {
    const { skill, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    let mentors = await getMentors();
    
    // Transform mentor data
    mentors = mentors.map(mentor => {
      const mentorData = {
        id: mentor.id,
        name: mentor.name,
        bio: mentor.bio || '',
        imageUrl: mentor.image_data ? `/images/mentor/${mentor.id}` : '/public/images/default-mentor.png',
        skills: []
      };
      
      // Parse skills
      if (mentor.skills) {
        try {
          mentorData.skills = JSON.parse(mentor.skills);
        } catch (e) {
          mentorData.skills = [];
        }
      }
      
      return mentorData;
    });
    
    // Filter by skill if provided
    if (skill) {
      mentors = mentors.filter(mentor => 
        mentor.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    }
    
    // Sort mentors
    mentors.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'skills') {
        const aSkills = a.skills.join(', ');
        const bSkills = b.skills.join(', ');
        comparison = aSkills.localeCompare(bSkills);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    res.json(mentors);
  } catch (error) {
    console.error('Get mentors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
