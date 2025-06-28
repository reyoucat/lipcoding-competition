const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  createMatchingRequest,
  getMatchingRequestsByMentee,
  getMatchingRequestsByMentor,
  updateMatchingRequestStatus,
  deleteMatchingRequest,
  hasPendingRequest,
  hasAcceptedRequest,
  getMatchingRequestById,
  getUserById
} = require('../database/db');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MatchingRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         mentee_id:
 *           type: integer
 *         mentor_id:
 *           type: integer
 *         message:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateMatchingRequest:
 *       type: object
 *       required:
 *         - mentor_id
 *       properties:
 *         mentor_id:
 *           type: integer
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /matching-requests:
 *   post:
 *     summary: Create a matching request (mentee only)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMatchingRequest'
 *     responses:
 *       201:
 *         description: Matching request created successfully
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - mentee role required
 *       409:
 *         description: Conflict - mentee already has pending request
 *       500:
 *         description: Internal server error
 */
router.post('/matching-requests', [
  authenticateToken,
  requireRole('mentee'),
  body('mentor_id').isInt({ min: 1 }),
  body('message').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mentor_id, message } = req.body;
    const mentee_id = req.user.id;

    // Check if mentee already has a pending request
    const hasPending = await hasPendingRequest(mentee_id);
    if (hasPending) {
      return res.status(409).json({ error: 'You already have a pending matching request' });
    }

    // Check if mentor exists and is actually a mentor
    const mentor = await getUserById(mentor_id);
    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ error: 'Invalid mentor' });
    }

    // Create matching request
    const requestId = await createMatchingRequest(mentee_id, mentor_id, message || '');
    
    res.status(201).json({ 
      message: 'Matching request created successfully',
      requestId 
    });
  } catch (error) {
    console.error('Create matching request error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'You have already sent a request to this mentor' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /matching-requests:
 *   get:
 *     summary: Get matching requests (different for mentors vs mentees)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of matching requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MatchingRequest'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/matching-requests', authenticateToken, async (req, res) => {
  try {
    let requests;
    
    if (req.user.role === 'mentee') {
      requests = await getMatchingRequestsByMentee(req.user.id);
    } else if (req.user.role === 'mentor') {
      requests = await getMatchingRequestsByMentor(req.user.id);
    }
    
    res.json(requests);
  } catch (error) {
    console.error('Get matching requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /matching-requests/{id}:
 *   put:
 *     summary: Update matching request status (mentor only)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Matching request status updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Matching request not found
 *       409:
 *         description: Conflict - mentor already has accepted request
 *       500:
 *         description: Internal server error
 */
router.put('/matching-requests/:id', [
  authenticateToken,
  requireRole('mentor'),
  body('status').isIn(['accepted', 'rejected'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const mentorId = req.user.id;

    // Get the matching request
    const request = await getMatchingRequestById(parseInt(id));
    if (!request) {
      return res.status(404).json({ error: 'Matching request not found' });
    }

    // Check if the mentor owns this request
    if (request.mentor_id !== mentorId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if the request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }

    // If accepting, check if mentor already has an accepted request
    if (status === 'accepted') {
      const hasAccepted = await hasAcceptedRequest(mentorId);
      if (hasAccepted) {
        return res.status(409).json({ error: 'You already have an accepted matching request' });
      }
    }

    // Update the request status
    await updateMatchingRequestStatus(parseInt(id), status);
    
    res.json({ message: `Matching request ${status} successfully` });
  } catch (error) {
    console.error('Update matching request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /matching-requests/{id}:
 *   delete:
 *     summary: Delete matching request (mentee only)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Matching request deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Matching request not found
 *       500:
 *         description: Internal server error
 */
router.delete('/matching-requests/:id', [
  authenticateToken,
  requireRole('mentee')
], async (req, res) => {
  try {
    const { id } = req.params;
    const menteeId = req.user.id;

    // Get the matching request
    const request = await getMatchingRequestById(parseInt(id));
    if (!request) {
      return res.status(404).json({ error: 'Matching request not found' });
    }

    // Check if the mentee owns this request
    if (request.mentee_id !== menteeId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete the request
    await deleteMatchingRequest(parseInt(id));
    
    res.json({ message: 'Matching request deleted successfully' });
  } catch (error) {
    console.error('Delete matching request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
