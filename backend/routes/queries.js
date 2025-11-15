// backend/routes/queries.js - WITH REAL-TIME NOTIFICATIONS
const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { autoTag, calculatePriority } = require('../utils/autoTag');
const { 
  notifyNewQuery, 
  notifyQueryAssigned, 
  notifyQueryUpdated, 
  notifyQueryEscalated 
} = require('../socket');

// @route   POST /api/queries
// @desc    Create new query
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { subject, message, source, customerName, customerEmail, customerPhone } = req.body;
    
    const category = autoTag(subject, message);
    const priority = calculatePriority(category, subject, message);
    
    const query = await Query.create({
      subject,
      message,
      source,
      customerName,
      customerEmail,
      customerPhone,
      category,
      priority,
      status: 'new'
    });
    
    // 🔥 REAL-TIME: Notify all users
    notifyNewQuery(query);
    
    res.status(201).json({
      success: true,
      data: query
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   GET /api/queries
// @desc    Get all queries with filtering
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, priority, category, source, assignedTo, search } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = parseInt(priority);
    if (category) filter.category = category;
    if (source) filter.source = source;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (req.user.role === 'agent') {
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null }
      ];
    }
    
    const queries = await Query.find(filter)
      .populate('assignedTo', 'name email department')
      .sort({ priority: -1, createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      count: queries.length,
      data: queries
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   GET /api/queries/:id
// @desc    Get single query
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('notes.addedBy', 'name email');
    
    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: 'Query not found' 
      });
    }
    
    res.json({
      success: true,
      data: query
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   PUT /api/queries/:id/assign
// @desc    Assign query to user
// @access  Private
router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: 'Query not found' 
      });
    }
    
    if (query.assignedTo) {
      await User.findByIdAndUpdate(query.assignedTo, {
        $inc: { activeQueries: -1 }
      });
    }
    
    query.assignedTo = userId;
    query.status = 'assigned';
    await query.save();
    
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { activeQueries: 1 }
      });
    }
    
    const updatedQuery = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email department');
    
    // 🔥 REAL-TIME: Notify assigned user
    if (userId) {
      notifyQueryAssigned(updatedQuery, userId);
    }
    notifyQueryUpdated(updatedQuery);
    
    res.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   PUT /api/queries/:id/status
// @desc    Update query status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: 'Query not found' 
      });
    }
    
    query.status = status;
    
    if ((status === 'resolved' || status === 'closed') && !query.resolvedAt) {
      query.resolvedAt = new Date();
      const responseTimeMinutes = Math.floor((query.resolvedAt - query.createdAt) / 60000);
      query.responseTime = responseTimeMinutes;
      
      if (query.assignedTo) {
        await User.findByIdAndUpdate(query.assignedTo, {
          $inc: { activeQueries: -1 }
        });
      }
    }
    
    await query.save();
    
    const updatedQuery = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email department');
    
    // 🔥 REAL-TIME: Notify all users
    notifyQueryUpdated(updatedQuery);
    
    res.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   PUT /api/queries/:id/escalate
// @desc    Escalate query
// @access  Private
router.put('/:id/escalate', protect, async (req, res) => {
  try {
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: 'Query not found' 
      });
    }
    
    query.isEscalated = true;
    query.priority = 5;
    await query.save();
    
    const updatedQuery = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email department');
    
    // 🔥 REAL-TIME: Urgent notification to all
    notifyQueryEscalated(updatedQuery);
    
    res.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   POST /api/queries/:id/notes
// @desc    Add note to query
// @access  Private
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text } = req.body;
    
    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ 
        success: false, 
        message: 'Query not found' 
      });
    }
    
    query.notes.push({
      text,
      addedBy: req.user._id,
      addedAt: new Date()
    });
    
    await query.save();
    
    const updatedQuery = await Query.findById(req.params.id)
      .populate('assignedTo', 'name email department')
      .populate('notes.addedBy', 'name email');
    
    // 🔥 REAL-TIME: Notify about note added
    notifyQueryUpdated(updatedQuery);
    
    res.json({
      success: true,
      data: updatedQuery
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;