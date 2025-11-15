// backend/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    enum: ['question', 'request', 'complaint', 'feedback', 'urgent', 'general']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#6B7280' // gray-500
  },
  icon: {
    type: String,
    default: 'inbox'
  },
  keywords: [{
    type: String,
    lowercase: true
  }],
  priority: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Statistics
  totalQueries: {
    type: Number,
    default: 0
  },
  avgResponseTime: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster lookups
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

// Method to increment query count
categorySchema.methods.incrementCount = async function() {
  this.totalQueries += 1;
  return this.save();
};

// Static method to get all active categories
categorySchema.statics.getActiveCategories = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Static method to find by keywords
categorySchema.statics.findByKeywords = function(text) {
  const lowerText = text.toLowerCase();
  return this.find({
    keywords: { $in: lowerText.split(' ') },
    isActive: true
  }).sort({ priority: -1 });
};

module.exports = mongoose.model('Category', categorySchema);