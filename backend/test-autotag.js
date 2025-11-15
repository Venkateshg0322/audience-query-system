// backend/test-autotag.js
// Run: node test-autotag.js
const { autoTag, calculatePriority } = require('./utils/autoTag');

const testCases = [
  {
    subject: 'URGENT: System Down',
    message: 'Our entire system is not working! This is critical and needs immediate attention!',
    expectedCategory: 'urgent',
    expectedPriority: 5
  },
  {
    subject: 'Complaint about service',
    message: 'I am very disappointed with the terrible service. This is unacceptable.',
    expectedCategory: 'complaint',
    expectedPriority: 4
  },
  {
    subject: 'How do I reset my password?',
    message: 'Can you help me understand how to reset my password? What are the steps?',
    expectedCategory: 'question',
    expectedPriority: 2
  },
  {
    subject: 'Feature Request',
    message: 'I would love to see a dark mode feature added. Great product overall!',
    expectedCategory: 'feedback',
    expectedPriority: 2
  },
  {
    subject: 'Need access to premium features',
    message: 'I need to upgrade my account. Can you please provide access to premium features?',
    expectedCategory: 'request',
    expectedPriority: 3
  }
];

console.log('🧪 Testing Auto-Tag Function\n');
console.log('='.repeat(80));

testCases.forEach((test, index) => {
  const category = autoTag(test.subject, test.message);
  const priority = calculatePriority(category, test.subject, test.message);
  
  const categoryMatch = category === test.expectedCategory ? '✅' : '❌';
  const priorityMatch = priority === test.expectedPriority ? '✅' : '❌';
  
  console.log(`\nTest ${index + 1}:`);
  console.log(`Subject: "${test.subject}"`);
  console.log(`Message: "${test.message.substring(0, 60)}..."`);
  console.log(`${categoryMatch} Category: ${category} (expected: ${test.expectedCategory})`);
  console.log(`${priorityMatch} Priority: ${priority} (expected: ${test.expectedPriority})`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ Auto-tag testing complete!\n');