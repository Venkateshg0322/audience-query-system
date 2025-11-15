// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/overview
// @desc    Get overall analytics
// @access  Private
router.get('/overview', protect, async (req, res) => {
  try {
    // Total queries
    const totalQueries = await Query.countDocuments();
    
    // Queries by status
    const statusBreakdown = await Query.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Queries by category
    const categoryBreakdown = await Query.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Queries by priority
    const priorityBreakdown = await Query.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);
    
    // Average response time (for resolved queries)
    const responseTimeStats = await Query.aggregate([
      {
        $match: { 
          responseTime: { $ne: null } 
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);
    
    // Queries by source
    const sourceBreakdown = await Query.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Recent queries (last 7 days trend)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentQueries = await Query.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalQueries,
        statusBreakdown,
        categoryBreakdown,
        priorityBreakdown,
        sourceBreakdown,
        responseTimeStats: responseTimeStats[0] || {
          avgResponseTime: 0,
          minResponseTime: 0,
          maxResponseTime: 0
        },
        recentTrend: recentQueries
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// @route   GET /api/analytics/team-performance
// @desc    Get team performance metrics
// @access  Private (admin/manager)
router.get('/team-performance', protect, async (req, res) => {
  try {
    const teamPerformance = await Query.aggregate([
      {
        $match: {
          assignedTo: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalAssigned: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $ne: ['$responseTime', null] },
                '$responseTime',
                null
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          email: '$user.email',
          department: '$user.department',
          totalAssigned: 1,
          resolved: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          resolutionRate: {
            $round: [
              { $multiply: [{ $divide: ['$resolved', '$totalAssigned'] }, 100] },
              2
            ]
          }
        }
      },
      {
        $sort: { totalAssigned: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: teamPerformance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;