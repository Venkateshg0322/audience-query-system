// backend/models/Query.js
const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  // Basic Information
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Source Information
  source: {
    type: String,
    enum: ['email', 'twitter', 'facebook', 'instagram', 'chat', 'community'],
    required: true
  },
  
  // Customer Information
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: String,
  
  // Auto-categorization
  category: {
    type: String,
    enum: ['question', 'request', 'complaint', 'feedback', 'urgent', 'general'],
    default: 'general'
  },
  
  // Priority System (1-5, 5 being highest)
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  
  // Assignment & Status
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'resolved', 'closed'],
    default: 'new'
  },
  
  // Tracking
  responseTime: {
    type: Number, // in minutes
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // History & Notes
  notes: [{
    text: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  tags: [String],
  isEscalated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster searches
querySchema.index({ status: 1, priority: -1, createdAt: -1 });
querySchema.index({ customerEmail: 1 });
querySchema.index({ assignedTo: 1 });

// Pre-save middleware to auto-categorize (if not already set)
querySchema.pre('save', function(next) {
  // Only auto-categorize on new documents
  if (this.isNew && this.category === 'general') {
    const { autoTag, calculatePriority } = require('../utils/autoTag');
    this.category = autoTag(this.subject, this.message);
    this.priority = calculatePriority(this.category, this.subject, this.message);
  }
  next();
});

module.exports = mongoose.model('Query', querySchema);