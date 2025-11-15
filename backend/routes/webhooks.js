// backend/routes/webhooks.js - Receive queries from external sources
const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { notifyNewQuery } = require('../socket');
const { autoTag, calculatePriority } = require('../utils/autoTag');

// @route   POST /api/webhooks/email
// @desc    Receive email queries (e.g., from Zapier, Gmail API)
// @access  Public (should be secured with API key in production)
router.post('/email', async (req, res) => {
  try {
    const { subject, body, from, fromName, timestamp } = req.body;
    
    // Parse email
    const category = autoTag(subject, body);
    const priority = calculatePriority(category, subject, body);
    
    const query = await Query.create({
      subject: subject || 'No Subject',
      message: body,
      source: 'email',
      customerName: fromName || from,
      customerEmail: from,
      category,
      priority,
      status: 'new'
    });
    
    // Notify all connected users in real-time
    notifyNewQuery(query);
    
    console.log('📧 New email query received:', query._id);
    
    res.status(201).json({
      success: true,
      message: 'Email query created',
      data: query
    });
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   POST /api/webhooks/twitter
// @desc    Receive Twitter mentions (via Twitter API webhook)
// @access  Public (should be secured)
router.post('/twitter', async (req, res) => {
  try {
    const { tweet_text, user_name, user_screen_name, tweet_id } = req.body;
    
    const category = autoTag('Twitter Mention', tweet_text);
    const priority = calculatePriority(category, 'Twitter Mention', tweet_text);
    
    const query = await Query.create({
      subject: `Twitter: @${user_screen_name}`,
      message: tweet_text,
      source: 'twitter',
      customerName: user_name,
      customerEmail: `${user_screen_name}@twitter.com`,
      category,
      priority,
      status: 'new',
      tags: ['twitter', `tweet:${tweet_id}`]
    });
    
    notifyNewQuery(query);
    
    console.log('🐦 New Twitter query received:', query._id);
    
    res.status(201).json({
      success: true,
      message: 'Twitter query created',
      data: query
    });
  } catch (error) {
    console.error('Twitter webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   POST /api/webhooks/facebook
// @desc    Receive Facebook messages
// @access  Public (should be secured)
router.post('/facebook', async (req, res) => {
  try {
    const { sender_name, sender_id, message_text, page_id } = req.body;
    
    const category = autoTag('Facebook Message', message_text);
    const priority = calculatePriority(category, 'Facebook Message', message_text);
    
    const query = await Query.create({
      subject: `Facebook: ${sender_name}`,
      message: message_text,
      source: 'facebook',
      customerName: sender_name,
      customerEmail: `${sender_id}@facebook.com`,
      category,
      priority,
      status: 'new',
      tags: ['facebook', `page:${page_id}`]
    });
    
    notifyNewQuery(query);
    
    console.log('📘 New Facebook query received:', query._id);
    
    res.status(201).json({
      success: true,
      message: 'Facebook query created',
      data: query
    });
  } catch (error) {
    console.error('Facebook webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   POST /api/webhooks/chat
// @desc    Receive chat widget messages
// @access  Public
router.post('/chat', async (req, res) => {
  try {
    const { name, email, message, session_id, page_url } = req.body;
    
    const category = autoTag('Chat', message);
    const priority = calculatePriority(category, 'Chat', message);
    
    const query = await Query.create({
      subject: `Chat: ${name}`,
      message: `${message}\n\nPage: ${page_url}`,
      source: 'chat',
      customerName: name,
      customerEmail: email,
      category,
      priority,
      status: 'new',
      tags: ['chat', `session:${session_id}`]
    });
    
    notifyNewQuery(query);
    
    console.log('💬 New chat query received:', query._id);
    
    res.status(201).json({
      success: true,
      message: 'Chat query created',
      data: query
    });
  } catch (error) {
    console.error('Chat webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   POST /api/webhooks/generic
// @desc    Generic webhook for any source
// @access  Public (should be secured with API key)
router.post('/generic', async (req, res) => {
  try {
    const { 
      subject, 
      message, 
      source, 
      customerName, 
      customerEmail, 
      customerPhone 
    } = req.body;
    
    // Validate required fields
    if (!subject || !message || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, message, customerName, customerEmail'
      });
    }
    
    const category = autoTag(subject, message);
    const priority = calculatePriority(category, subject, message);
    
    const query = await Query.create({
      subject,
      message,
      source: source || 'community',
      customerName,
      customerEmail,
      customerPhone,
      category,
      priority,
      status: 'new'
    });
    
    notifyNewQuery(query);
    
    console.log('🌐 New generic query received:', query._id);
    
    res.status(201).json({
      success: true,
      message: 'Query created successfully',
      data: query
    });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   GET /api/webhooks/test
// @desc    Test webhook endpoint
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working!',
    timestamp: new Date().toISOString(),
    availableWebhooks: [
      'POST /api/webhooks/email',
      'POST /api/webhooks/twitter',
      'POST /api/webhooks/facebook',
      'POST /api/webhooks/chat',
      'POST /api/webhooks/generic'
    ]
  });
});

module.exports = router;