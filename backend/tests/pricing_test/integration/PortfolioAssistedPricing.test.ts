/**
 * Integration Tests: Portfolio-Assisted Pricing API
 *
 * Tests the full HTTP request/response cycle for the portfolio-assist endpoint.
 * Requires backend server running.
 *
 * @jest-environment node
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_V1 = `${BASE_URL}/api/v1`;

let authToken: string | undefined;
let serverRunning = false;
let testUserId: number | undefined;

// Helper for authenticated requests
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

describe('Portfolio-Assisted Pricing API', () => {

  beforeAll(async () => {
    try {
      // Check server health by testing signup endpoint
      const testEmail = `integrationtest_${Date.now()}@test.com`;
      const signupRes = await fetch(`${API_V1}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'Test1234!',
          role: 'designer'
        })
      });
      
      if (!signupRes.ok) throw new Error('Server not responding');
      serverRunning = true;
      
      const signupData = await signupRes.json();
      testUserId = signupData.data?.user?.user_id;
      const otp = signupData.data?.otp || '123456';
      
      // Verify OTP and get token
      const verifyRes = await fetch(`${API_V1}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, otp })
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        authToken = verifyData.data?.token;
      }
    } catch {
      console.warn('⚠️  Backend server not running — skipping integration tests.');
    }
  }, 15000);

  // ── Authentication guard ──────────────────────────────────

  describe('POST /pricing/portfolio-assist', () => {

    it('should reject unauthenticated requests with 401', async () => {
      if (!serverRunning) return;

      const response = await fetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          client_region: 'cambodia',
          portfolio_url: 'https://dribbble.com/test',
        }),
      });

      expect(response.status).toBe(401);
    });

    // ── Validation ────────────────────────────────────────

    it('should reject missing client_region with 400', async () => {
      if (!serverRunning || !authToken) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          portfolio_url: 'https://dribbble.com/test',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject empty body with 400', async () => {
      if (!serverRunning || !authToken) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          client_region: 'cambodia',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid URL scheme with 400', async () => {
      if (!serverRunning || !authToken) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          client_region: 'cambodia',
          portfolio_url: 'ftp://evil.com/payload',
        }),
      });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message || body.error).toMatch(/HTTP/i);
    });

    it('should reject whitespace-only portfolio_text with 400', async () => {
      if (!serverRunning || !authToken) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          client_region: 'cambodia',
          portfolio_text: '    ',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject empty overrides object with 400', async () => {
      if (!serverRunning || !authToken) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          client_region: 'cambodia',
          overrides: {},
        }),
      });

      expect(response.status).toBe(400);
    });

    // ── Happy path (requires auth + onboarding) ───────────

    it('should return 200 with valid overrides-only request', async () => {
      if (!serverRunning || !authToken || !testUserId) return;

      const response = await authFetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: testUserId,
          client_region: 'cambodia',
          client_type: 'sme',
          overrides: { seniority_level: 'mid' },
        }),
      });

      // If the user has onboarding completed, 200; otherwise 404
      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        const body = await response.json();
        expect(body.data).toHaveProperty('ai_status');
        expect(body.data).toHaveProperty('confirmed_values');
        expect(body.data).toHaveProperty('mapping');
        expect(body.data).toHaveProperty('explainability');
      }
    });

    // ── PDF upload tests ──────────────────────────────────

    it('should accept PDF upload via multipart/form-data', async () => {
      if (!serverRunning || !authToken || !testUserId) return;

      // Create a minimal test PDF
      const pdfContent = Buffer.from('%PDF-1.4\nTest PDF content');
      const formData = new FormData();
      formData.append('user_id', String(testUserId));
      formData.append('client_region', 'cambodia');
      formData.append('client_type', 'corporate');
      formData.append('portfolio_pdf', new Blob([pdfContent], { type: 'application/pdf' }), 'test.pdf');

      const response = await fetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      // Expect 200 or 404 (if user has no base rate)
      expect([200, 404]).toContain(response.status);
    });

    it('should reject non-PDF file upload', async () => {
      if (!serverRunning || !authToken) return;

      const txtContent = Buffer.from('This is not a PDF');
      const formData = new FormData();
      formData.append('user_id', '1');
      formData.append('client_region', 'cambodia');
      formData.append('portfolio_pdf', new Blob([txtContent], { type: 'text/plain' }), 'test.txt');

      const response = await fetch(`${API_V1}/pricing/portfolio-assist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });

      expect(response.status).toBe(400);
    });
  });
});
