// backend/test-api.js
// Automated API testing script
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let queryId = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`)
};

async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 Starting API Tests');
  console.log('='.repeat(80) + '\n');

  try {
    // Test 1: Register User
    log.test('Test 1: Register User');
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'agent',
        department: 'support'
      });
      authToken = registerRes.data.data.token;
      userId = registerRes.data.data._id;
      log.success('User registered successfully');
    } catch (error) {
      log.error(`Registration failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 2: Login
    log.test('Test 2: Login User');
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'password123'
      });
      authToken = loginRes.data.data.token;
      log.success('Login successful');
    } catch (error) {
      log.error(`Login failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Get Current User
    log.test('Test 3: Get Current User');
    try {
      await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success('Current user retrieved');
    } catch (error) {
      log.error(`Get current user failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 4: Create Query
    log.test('Test 4: Create Query');
    try {
      const queryRes = await axios.post(`${API_URL}/queries`, {
        subject: 'Test Query - Urgent Issue',
        message: 'This is an urgent test message that needs immediate attention!',
        source: 'email',
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        customerPhone: '+1234567890'
      });
      queryId = queryRes.data.data._id;
      log.success(`Query created with ID: ${queryId}`);
      log.info(`Auto-tagged as: ${queryRes.data.data.category}`);
      log.info(`Priority: ${queryRes.data.data.priority}`);
    } catch (error) {
      log.error(`Create query failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 5: Get All Queries
    log.test('Test 5: Get All Queries');
    try {
      const queriesRes = await axios.get(`${API_URL}/queries`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success(`Retrieved ${queriesRes.data.count} queries`);
    } catch (error) {
      log.error(`Get queries failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 6: Get Single Query
    log.test('Test 6: Get Single Query');
    try {
      await axios.get(`${API_URL}/queries/${queryId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success('Single query retrieved');
    } catch (error) {
      log.error(`Get single query failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 7: Assign Query
    log.test('Test 7: Assign Query');
    try {
      await axios.put(`${API_URL}/queries/${queryId}/assign`, 
        { userId },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      log.success('Query assigned successfully');
    } catch (error) {
      log.error(`Assign query failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 8: Update Status
    log.test('Test 8: Update Query Status');
    try {
      await axios.put(`${API_URL}/queries/${queryId}/status`, 
        { status: 'in-progress' },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      log.success('Query status updated');
    } catch (error) {
      log.error(`Update status failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 9: Add Note
    log.test('Test 9: Add Note to Query');
    try {
      await axios.post(`${API_URL}/queries/${queryId}/notes`, 
        { text: 'This is a test note' },
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      log.success('Note added successfully');
    } catch (error) {
      log.error(`Add note failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 10: Escalate Query
    log.test('Test 10: Escalate Query');
    try {
      await axios.put(`${API_URL}/queries/${queryId}/escalate`, {},
        { headers: { Authorization: `Bearer ${authToken}` }}
      );
      log.success('Query escalated');
    } catch (error) {
      log.error(`Escalate query failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 11: Get Analytics
    log.test('Test 11: Get Analytics Overview');
    try {
      const analyticsRes = await axios.get(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success('Analytics retrieved');
      log.info(`Total queries: ${analyticsRes.data.data.totalQueries}`);
    } catch (error) {
      log.error(`Get analytics failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 12: Get Team Performance
    log.test('Test 12: Get Team Performance');
    try {
      await axios.get(`${API_URL}/analytics/team-performance`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success('Team performance retrieved');
    } catch (error) {
      log.error(`Get team performance failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 13: Filter Queries
    log.test('Test 13: Filter Queries by Status');
    try {
      const filterRes = await axios.get(`${API_URL}/queries?status=in-progress`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success(`Filtered queries: ${filterRes.data.count} in-progress`);
    } catch (error) {
      log.error(`Filter queries failed: ${error.response?.data?.message || error.message}`);
    }

    // Test 14: Search Queries
    log.test('Test 14: Search Queries');
    try {
      const searchRes = await axios.get(`${API_URL}/queries?search=urgent`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log.success(`Search results: ${searchRes.data.count} queries`);
    } catch (error) {
      log.error(`Search queries failed: ${error.response?.data?.message || error.message}`);
    }

    console.log('\n' + '='.repeat(80));
    log.success('All tests completed!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Run tests
runTests();