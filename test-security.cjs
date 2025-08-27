const https = require('https');
const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3001';
const ENDPOINT = '/api/auth/google-signin';

// Test data
const FAKE_TOKEN = 'fake.jwt.token';
const SQL_INJECTION = "'; DROP TABLE users; --";
const LARGE_PAYLOAD = 'x'.repeat(10000);

// Rate limiting test
const RATE_LIMIT_REQUESTS = 10;

function makeRequest(method, data, contentType = 'application/json') {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: ENDPOINT,
      method: method,
      headers: {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('🔒 Starting Security Tests for Google Sign-In API\n');
  
  const results = {
    passed: 0,
    failed: 0,
    vulnerabilities: []
  };

  // Test 1: Invalid HTTP Methods
  console.log('1. Testing invalid HTTP methods...');
  const invalidMethods = ['GET', 'PUT', 'DELETE', 'PATCH'];
  
  for (const method of invalidMethods) {
    const response = await makeRequest(method, { credential: FAKE_TOKEN });
    if (response.status === 405 || response.status === 404) {
      console.log(`   ✅ ${method} correctly rejected (${response.status})`);
      results.passed++;
    } else {
      console.log(`   ❌ ${method} not properly rejected (${response.status})`);
      results.failed++;
      results.vulnerabilities.push(`${method} method not properly rejected`);
    }
  }

  // Test 2: Invalid Content-Type
  console.log('\n2. Testing invalid content types...');
  const response2 = await makeRequest('POST', { credential: FAKE_TOKEN }, 'text/plain');
  if (response2.status === 400 || response2.status === 415) {
    console.log(`   ✅ Invalid content-type rejected (${response2.status})`);
    results.passed++;
  } else {
    console.log(`   ❌ Invalid content-type not rejected (${response2.status})`);
    results.failed++;
    results.vulnerabilities.push('Invalid content-type not rejected');
  }

  // Test 3: Fake Token Validation
  console.log('\n3. Testing fake token validation...');
  const response3 = await makeRequest('POST', { credential: FAKE_TOKEN });
  if (response3.status === 401 || response3.status === 403) {
    console.log(`   ✅ Fake token rejected (${response3.status})`);
    results.passed++;
  } else {
    console.log(`   ❌ Fake token not properly rejected (${response3.status})`);
    console.log(`   Response: ${response3.body}`);
    results.failed++;
    results.vulnerabilities.push('Fake tokens accepted');
  }

  // Test 4: SQL Injection
  console.log('\n4. Testing SQL injection...');
  const response4 = await makeRequest('POST', { credential: SQL_INJECTION });
  if (response4.status === 400 || response4.status === 401) {
    console.log(`   ✅ SQL injection payload rejected (${response4.status})`);
    results.passed++;
  } else {
    console.log(`   ❌ SQL injection payload not rejected (${response4.status})`);
    console.log(`   Response: ${response4.body}`);
    results.failed++;
    results.vulnerabilities.push('SQL injection payloads not handled');
  }

  // Test 5: Large Payload
  console.log('\n5. Testing large payload...');
  const response5 = await makeRequest('POST', { credential: LARGE_PAYLOAD });
  if (response5.status === 413 || response5.status === 400) {
    console.log(`   ✅ Large payload rejected (${response5.status})`);
    results.passed++;
  } else {
    console.log(`   ❌ Large payload not rejected (${response5.status})`);
    results.failed++;
    results.vulnerabilities.push('Large payloads accepted');
  }

  // Test 6: Rate Limiting
  console.log('\n6. Testing rate limiting...');
  let blockedRequests = 0;
  
  for (let i = 0; i < RATE_LIMIT_REQUESTS; i++) {
    const response = await makeRequest('POST', { credential: FAKE_TOKEN });
    if (response.status === 429) {
      blockedRequests++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (blockedRequests > 0) {
    console.log(`   ✅ Rate limiting active (${blockedRequests}/${RATE_LIMIT_REQUESTS} requests blocked)`);
    results.passed++;
  } else {
    console.log(`   ❌ Rate limiting not working (${blockedRequests}/${RATE_LIMIT_REQUESTS} requests blocked)`);
    results.failed++;
    results.vulnerabilities.push('Rate limiting not active');
  }

  // Test 7: Missing Credential
  console.log('\n7. Testing missing credential...');
  const response7 = await makeRequest('POST', {});
  if (response7.status === 400) {
    console.log(`   ✅ Missing credential rejected (${response7.status})`);
    results.passed++;
  } else {
    console.log(`   ❌ Missing credential not rejected (${response7.status})`);
    results.failed++;
    results.vulnerabilities.push('Missing credential not handled');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🔒 SECURITY TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`🔍 Total Tests: ${results.passed + results.failed}`);
  
  if (results.vulnerabilities.length > 0) {
    console.log('\n🚨 VULNERABILITIES FOUND:');
    results.vulnerabilities.forEach((vuln, index) => {
      console.log(`   ${index + 1}. ${vuln}`);
    });
  } else {
    console.log('\n🎉 No vulnerabilities found!');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Exit with error code if vulnerabilities found
  if (results.vulnerabilities.length > 0) {
    process.exit(1);
  }
}

// Run tests
runSecurityTests().catch(console.error);