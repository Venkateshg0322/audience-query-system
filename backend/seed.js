// backend/seed.js - Run this to populate database with sample data
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Query = require('./models/Query');
const Category = require('./models/Category');

dotenv.config();

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    department: 'general'
  },
  {
    name: 'John Smith',
    email: 'john@example.com',
    password: 'password123',
    role: 'agent',
    department: 'support'
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: 'password123',
    role: 'agent',
    department: 'technical'
  }
];

const sampleCategories = [
  {
    name: 'question',
    displayName: 'Question',
    description: 'Customer inquiries and questions',
    color: '#3B82F6', // blue
    icon: 'help-circle',
    keywords: ['how', 'what', 'when', 'where', 'why', 'which', 'can', 'could', 'would', 'question'],
    priority: 2
  },
  {
    name: 'request',
    displayName: 'Request',
    description: 'Service or feature requests',
    color: '#8B5CF6', // purple
    icon: 'message-square',
    keywords: ['need', 'want', 'require', 'request', 'please', 'can you', 'could you', 'would like'],
    priority: 3
  },
  {
    name: 'complaint',
    displayName: 'Complaint',
    description: 'Customer complaints and issues',
    color: '#EF4444', // red
    icon: 'alert-circle',
    keywords: ['disappointed', 'terrible', 'awful', 'bad', 'poor', 'worst', 'complaint', 'unhappy', 'frustrated'],
    priority: 4
  },
  {
    name: 'feedback',
    displayName: 'Feedback',
    description: 'Customer feedback and suggestions',
    color: '#10B981', // green
    icon: 'message-circle',
    keywords: ['feedback', 'suggestion', 'suggest', 'recommend', 'improvement', 'love', 'great', 'excellent'],
    priority: 2
  },
  {
    name: 'urgent',
    displayName: 'Urgent',
    description: 'Critical and urgent issues',
    color: '#DC2626', // dark red
    icon: 'alert-triangle',
    keywords: ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'broken', 'not working', 'down'],
    priority: 5
  },
  {
    name: 'general',
    displayName: 'General',
    description: 'General inquiries',
    color: '#6B7280', // gray
    icon: 'inbox',
    keywords: [],
    priority: 3
  }
];

const sampleQueries = [
  {
    subject: 'Product not working',
    message: 'URGENT! My product stopped working this morning. This is critical for my business. Please help immediately!',
    source: 'email',
    customerName: 'Michael Brown',
    customerEmail: 'michael@customer.com',
    customerPhone: '+1234567890'
  },
  {
    subject: 'How to reset password?',
    message: 'Hi, I forgot my password and need help resetting it. Can you guide me through the process?',
    source: 'chat',
    customerName: 'Emily Davis',
    customerEmail: 'emily@customer.com'
  },
  {
    subject: 'Billing issue',
    message: 'I was charged twice for my subscription. This is unacceptable! I need a refund immediately.',
    source: 'twitter',
    customerName: 'Robert Wilson',
    customerEmail: 'robert@customer.com'
  },
  {
    subject: 'Feature request',
    message: 'I would love to see a dark mode feature. It would make the app much better to use at night. Great product overall!',
    source: 'community',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa@customer.com'
  },
  {
    subject: 'Need help with setup',
    message: 'Can someone help me set up my account? I need assistance with configuring the settings.',
    source: 'email',
    customerName: 'David Martinez',
    customerEmail: 'david@customer.com'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Query.deleteMany({});
    await Category.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create categories first
    const categories = await Category.create(sampleCategories);
    console.log(`✅ Created ${categories.length} categories`);

    // Create users
    const users = await User.create(sampleUsers);
    console.log(`✅ Created ${users.length} users`);

    // Create queries (auto-tagging will happen in the model)
    const queries = await Query.create(sampleQueries);
    console.log(`✅ Created ${queries.length} queries`);

    // Assign some queries to users
    const [agent1, agent2] = users.filter(u => u.role === 'agent');
    
    await Query.findByIdAndUpdate(queries[0]._id, {
      assignedTo: agent1._id,
      status: 'in-progress'
    });
    
    await Query.findByIdAndUpdate(queries[1]._id, {
      assignedTo: agent2._id,
      status: 'resolved',
      resolvedAt: new Date(),
      responseTime: 45
    });

    console.log('✅ Assigned queries to agents');
    
    // Update category statistics
    for (const query of queries) {
      await Category.findOneAndUpdate(
        { name: query.category },
        { $inc: { totalQueries: 1 } }
      );
    }
    console.log('✅ Updated category statistics');
    
    console.log('\n📝 Sample Login Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: password123');
    console.log('\n🎉 Database seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};


seedDatabase();