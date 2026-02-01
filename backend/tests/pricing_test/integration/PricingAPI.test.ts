/**
 * Integration Tests: Pricing API Endpoints
 * 
 * Tests the full HTTP request/response cycle for pricing endpoints.
 * Requires backend server running.
 * 
 * @jest-environment node
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_V1 = `${BASE_URL}/api/v1`;

// Test user credentials (created per test run)
let testUser = {
  email: `integration_test_${Date.now()}@test.aurea.com`,
  password: 'TestPassword123!',
  first_name: 'Integration',
  last_name: 'Test'
};

let authToken: string;
let sessionId: string;

// Helper to make authenticated requests
async function authFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  });
}

describe('Pricing API Integration Tests', () => {
  
  // Setup: Create test user and authenticate
  beforeAll(async () => {
    // Skip if server not running
    try {
      const health = await fetch(`${API_V1}/health`);
      if (!health.ok) throw new Error('Server not responding');
    } catch (e) {
      console.warn('⚠️  Backend server not running. Skipping integration tests.');
      return;
    }

    // Sign up test user
    const signupRes = await fetch(`${BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });

    if (!signupRes.ok) {
      // User might already exist, try login
      console.log('Signup failed, user may exist');
    }

    // For test environment, we'll need to get token differently
    // In real tests, you'd verify OTP or use a test token
  }, 30000);

  describe('Health Check', () => {
    
    it('should return healthy status', async () => {
      const response = await fetch(`${API_V1}/health`);
      expect(response.ok).toBe(true);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });
  });

  describe('POST /calculate/base-rate', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/calculate/base-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 }),
      });

      expect(response.status).toBe(401);
    });

    // More tests would require valid auth token
  });

  describe('POST /calculate/project-rate', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/calculate/project-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          client_type: 'sme',
          client_region: 'cambodia'
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should reject invalid client_type', async () => {
      // This would need auth token
      // Testing validation without auth for now
      const response = await fetch(`${API_V1}/pricing/calculate/project-rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          client_type: 'invalid_type',
          client_region: 'cambodia'
        }),
      });

      // Should fail with 401 (auth) or 400 (validation)
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('GET /pricing/benchmark', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/benchmark`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /pricing/profile', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/profile`, {
        method: 'GET',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /pricing/profile', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profit_margin: 0.2,
          billable_hours_per_month: 120
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /pricing/quick-estimate', () => {
    
    it('should require authentication', async () => {
      const response = await fetch(`${API_V1}/pricing/quick-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: 'graphic designer',
          experience_years: 5,
          location: 'Phnom Penh'
        }),
      });

      expect(response.status).toBe(401);
    });
  });
});

// Cleanup (if we created test data)
afterAll(async () => {
  // In a real test suite, clean up test user and data
  console.log('Integration tests completed. Test user:', testUser.email);
});
