/**
 * Security Testing Utilities
 * For testing security measures in development and testing environments
 */



/**
 * Test payloads for security validation
 */
export const SECURITY_TEST_PAYLOADS = {
  // SQL Injection test cases
  SQL_INJECTION: [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM users--",
    '1; DELETE FROM pages;',
  ],

  // XSS test cases
  XSS: [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload="alert(1)">',
  ],

  // Path traversal test cases
  PATH_TRAVERSAL: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd',
  ],

  // Command injection test cases
  COMMAND_INJECTION: [
    '; ls -la',
    '| cat /etc/passwd',
    '`whoami`',
    '$(id)',
    '&& rm -rf /',
  ],

  // File upload test cases
  MALICIOUS_FILES: [
    { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
    {
      name: 'test.jsp',
      content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>',
    },
    { name: 'test.exe', content: 'MZ\x90\x00' }, // PE header
    { name: '../../../test.txt', content: 'path traversal' },
  ],

  // Header injection test cases
  HEADER_INJECTION: [
    'test\r\nX-Injected: true',
    'test\nSet-Cookie: admin=true',
    'test\r\n\r\n<script>alert(1)</script>',
  ],
};

/**
 * Security test runner
 */
export class SecurityTester {
  private results: Array<{
    test: string;
    payload: string;
    passed: boolean;
    error?: string;
  }> = [];

  /**
   * Test input validation against malicious payloads
   */
  async testInputValidation(
    validationFunction: (input: string) => boolean | Promise<boolean>,
    testName: string
  ): Promise<void> {
    const payloads = [
      ...SECURITY_TEST_PAYLOADS.SQL_INJECTION,
      ...SECURITY_TEST_PAYLOADS.XSS,
      ...SECURITY_TEST_PAYLOADS.PATH_TRAVERSAL,
      ...SECURITY_TEST_PAYLOADS.COMMAND_INJECTION,
    ];

    for (const payload of payloads) {
      try {
        const result = await validationFunction(payload);
        this.results.push({
          test: testName,
          payload,
          passed: !result, // Should reject malicious input
        });
      } catch (error) {
        this.results.push({
          test: testName,
          payload,
          passed: true, // Exception means validation caught the issue
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Test rate limiting functionality
   */
  async testRateLimit(
    endpoint: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void> {

    let successCount = 0;
    let rateLimitedCount = 0;

    // Send requests rapidly
    for (let i = 0; i < maxRequests + 5; i++) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'User-Agent': 'SecurityTester/1.0',
          },
        });

        if (response.status === 429) {
          rateLimitedCount++;
        } else if (response.ok) {
          successCount++;
        }
      } catch {
        // Network errors don't count
      }
    }

    const testPassed = rateLimitedCount > 0 && successCount <= maxRequests;

    this.results.push({
      test: 'Rate Limiting',
      payload: `${maxRequests} requests in ${windowMs}ms`,
      passed: testPassed,
      error: testPassed
        ? undefined
        : `Success: ${successCount}, Rate limited: ${rateLimitedCount}`,
    });
  }

  /**
   * Test CSRF protection
   */
  async testCSRFProtection(endpoint: string): Promise<void> {
    try {
      // Try to make a POST request without CSRF token
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'data' }),
      });

      const testPassed = response.status === 403 || response.status === 400;

      this.results.push({
        test: 'CSRF Protection',
        payload: 'POST without CSRF token',
        passed: testPassed,
        error: testPassed
          ? undefined
          : `Expected 403/400, got ${response.status}`,
      });
    } catch (error) {
      this.results.push({
        test: 'CSRF Protection',
        payload: 'POST without CSRF token',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Test authentication bypass attempts
   */
  async testAuthBypass(protectedEndpoint: string): Promise<void> {
    const bypassAttempts = [
      {
        headers: {} as Record<string, string>,
        description: 'No authentication',
      },
      {
        headers: { Authorization: 'Bearer fake-token' },
        description: 'Fake token',
      },
      { headers: { Cookie: 'session=fake' }, description: 'Fake session' },
      { headers: { 'X-User-Id': 'admin' }, description: 'Header injection' },
    ];

    for (const attempt of bypassAttempts) {
      try {
        const response = await fetch(protectedEndpoint, {
          method: 'GET',
          headers: attempt.headers,
        });

        const testPassed = response.status === 401 || response.status === 403;

        this.results.push({
          test: 'Authentication Bypass',
          payload: attempt.description,
          passed: testPassed,
          error: testPassed
            ? undefined
            : `Expected 401/403, got ${response.status}`,
        });
      } catch (error) {
        this.results.push({
          test: 'Authentication Bypass',
          payload: attempt.description,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Test file upload security
   */
  async testFileUploadSecurity(uploadEndpoint: string): Promise<void> {
    for (const maliciousFile of SECURITY_TEST_PAYLOADS.MALICIOUS_FILES) {
      try {
        const formData = new FormData();
        const blob = new Blob([maliciousFile.content], { type: 'text/plain' });
        formData.append('file', blob, maliciousFile.name);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
        });

        const testPassed = response.status >= 400;

        this.results.push({
          test: 'File Upload Security',
          payload: maliciousFile.name,
          passed: testPassed,
          error: testPassed
            ? undefined
            : `File upload should be rejected, got ${response.status}`,
        });
      } catch (error) {
        this.results.push({
          test: 'File Upload Security',
          payload: maliciousFile.name,
          passed: true, // Exception means security measure worked
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get test results
   */
  getResults(): Array<{
    test: string;
    payload: string;
    passed: boolean;
    error?: string;
  }> {
    return this.results;
  }

  /**
   * Get summary of test results
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  } {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
    };
  }

  /**
   * Clear test results
   */
  clear(): void {
    this.results = [];
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const summary = this.getSummary();
    let report = `Security Test Report\n`;
    report += `==================\n\n`;
    report += `Summary:\n`;
    report += `- Total Tests: ${summary.total}\n`;
    report += `- Passed: ${summary.passed}\n`;
    report += `- Failed: ${summary.failed}\n`;
    report += `- Pass Rate: ${summary.passRate.toFixed(2)}%\n\n`;

    report += `Detailed Results:\n`;
    report += `-----------------\n`;

    for (const result of this.results) {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `${status} ${result.test}: ${result.payload}\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      report += `\n`;
    }

    return report;
  }
}

/**
 * Run comprehensive security tests
 */
export async function runSecurityTests(baseUrl: string): Promise<string> {
  const tester = new SecurityTester();

  console.log('Running security tests...');

  // Test rate limiting
  await tester.testRateLimit(`${baseUrl}/api/pages`, 100, 15 * 60 * 1000);

  // Test CSRF protection
  await tester.testCSRFProtection(`${baseUrl}/api/pages`);

  // Test authentication bypass
  await tester.testAuthBypass(`${baseUrl}/api/admin/users`);

  // Test file upload security (if endpoint exists)
  await tester.testFileUploadSecurity(`${baseUrl}/api/files/upload`);

  return tester.generateReport();
}

/**
 * Security test utilities for development
 */
export const securityTestUtils = {
  /**
   * Check if a string contains malicious patterns
   */
  containsMaliciousPatterns: (input: string): boolean => {
    const allPayloads = [
      ...SECURITY_TEST_PAYLOADS.SQL_INJECTION,
      ...SECURITY_TEST_PAYLOADS.XSS,
      ...SECURITY_TEST_PAYLOADS.PATH_TRAVERSAL,
      ...SECURITY_TEST_PAYLOADS.COMMAND_INJECTION,
    ];

    return allPayloads.some((payload) =>
      input.toLowerCase().includes(payload.toLowerCase())
    );
  },

  /**
   * Generate test data for security testing
   */
  generateTestData: () => ({
    maliciousStrings: [
      ...SECURITY_TEST_PAYLOADS.SQL_INJECTION,
      ...SECURITY_TEST_PAYLOADS.XSS,
    ],
    maliciousFiles: SECURITY_TEST_PAYLOADS.MALICIOUS_FILES,
    suspiciousHeaders: SECURITY_TEST_PAYLOADS.HEADER_INJECTION,
  }),
};
