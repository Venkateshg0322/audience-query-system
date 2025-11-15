// backend/utils/autoTag.js
// This function automatically categorizes queries based on keywords

const autoTag = (subject, message) => {
  const text = `${subject} ${message}`.toLowerCase();
  
  // Define keyword patterns for each category
  const patterns = {
    complaint: [
      'disappointed', 'terrible', 'awful', 'bad', 'poor', 'worst',
      'complaint', 'complain', 'dissatisfied', 'unhappy', 'angry',
      'frustrated', 'unacceptable', 'disgusted', 'horrible', 'hate'
    ],
    urgent: [
      'urgent', 'emergency', 'asap', 'immediately', 'critical',
      'not working', 'broken', 'down', 'crashed', 'error',
      'help!', 'quickly', 'right now', 'serious'
    ],
    question: [
      'how', 'what', 'when', 'where', 'why', 'which',
      'can i', 'could you', 'would you', 'is it possible',
      '?', 'question', 'asking', 'wondering', 'clarification'
    ],
    request: [
      'need', 'want', 'require', 'request', 'please',
      'can you', 'could you', 'would like', 'looking for',
      'seeking', 'interested in', 'get', 'provide'
    ],
    feedback: [
      'feedback', 'suggestion', 'suggest', 'recommend',
      'improvement', 'enhance', 'feature', 'love', 'great',
      'excellent', 'amazing', 'wonderful', 'appreciate'
    ]
  };
  
  // Count matches for each category
  const scores = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.filter(keyword => text.includes(keyword)).length;
  }
  
  // Find category with highest score
  let maxCategory = 'general';
  let maxScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxCategory = category;
    }
  }
  
  return maxScore > 0 ? maxCategory : 'general';
};

// Calculate priority based on category and urgency indicators
const calculatePriority = (category, subject, message) => {
  const text = `${subject} ${message}`.toLowerCase();
  
  let priority = 3; // Default medium priority
  
  // Adjust based on category
  if (category === 'urgent') priority = 5;
  else if (category === 'complaint') priority = 4;
  else if (category === 'request') priority = 3;
  else if (category === 'question') priority = 2;
  else if (category === 'feedback') priority = 2;
  
  // Boost priority for urgent keywords
  const urgentKeywords = ['urgent', 'emergency', 'asap', 'critical', 'broken', 'not working'];
  const hasUrgentKeyword = urgentKeywords.some(keyword => text.includes(keyword));
  if (hasUrgentKeyword) priority = Math.min(5, priority + 1);
  
  // Check for exclamation marks (indicates urgency)
  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount >= 2) priority = Math.min(5, priority + 1);
  
  return priority;
};

module.exports = { autoTag, calculatePriority };