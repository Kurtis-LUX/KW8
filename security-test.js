// Test di sicurezza per il sistema di autenticazione Google
// Questo file serve per testare potenziali vulnerabilità

const API_BASE = 'http://localhost:3001';

// Test 1: Tentativo di bypass con token falso
async function testFakeToken() {
  console.log('\n🔍 Test 1: Token falso');
  
  const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: fakeToken })
    });
    
    const result = await response.json();
    console.log('Risposta:', result);
    
    if (response.status === 400 && !result.success) {
      console.log('✅ Test superato: Token falso respinto');
    } else {
      console.log('❌ VULNERABILITÀ: Token falso accettato!');
    }
  } catch (error) {
    console.log('Errore:', error.message);
  }
}

// Test 2: Tentativo di SQL injection nel credential
async function testSQLInjection() {
  console.log('\n🔍 Test 2: SQL Injection');
  
  const maliciousPayload = "'; DROP TABLE users; --";
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: maliciousPayload })
    });
    
    const result = await response.json();
    console.log('Risposta:', result);
    
    if (response.status === 400 && !result.success) {
      console.log('✅ Test superato: Payload SQL injection respinto');
    } else {
      console.log('❌ VULNERABILITÀ: Payload SQL injection non gestito!');
    }
  } catch (error) {
    console.log('Errore:', error.message);
  }
}

// Test 3: Rate limiting
async function testRateLimit() {
  console.log('\n🔍 Test 3: Rate Limiting');
  
  const promises = [];
  
  // Invia 10 richieste simultanee
  for (let i = 0; i < 10; i++) {
    promises.push(
      fetch(`${API_BASE}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: 'test' })
      })
    );
  }
  
  try {
    const responses = await Promise.all(promises);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    console.log(`Richieste bloccate da rate limit: ${rateLimitedCount}/10`);
    
    if (rateLimitedCount > 0) {
      console.log('✅ Test superato: Rate limiting attivo');
    } else {
      console.log('⚠️ ATTENZIONE: Rate limiting potrebbe non essere attivo');
    }
  } catch (error) {
    console.log('Errore:', error.message);
  }
}

// Test 4: Tentativo con payload troppo grande
async function testLargePayload() {
  console.log('\n🔍 Test 4: Payload troppo grande');
  
  const largePayload = 'A'.repeat(10000); // 10KB di dati
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: largePayload })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    
    if (response.status === 413) {
      console.log('✅ Test superato: Payload troppo grande respinto');
    } else {
      console.log('❌ VULNERABILITÀ: Payload troppo grande accettato!');
    }
  } catch (error) {
    console.log('Errore:', error.message);
  }
}

// Test 5: Tentativo con metodi HTTP non consentiti
async function testInvalidMethods() {
  console.log('\n🔍 Test 5: Metodi HTTP non consentiti');
  
  const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];
  
  for (const method of methods) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
        method: method
      });
      
      console.log(`${method}: Status ${response.status}`);
      
      if (response.status === 405) {
        console.log(`✅ ${method} correttamente respinto`);
      } else {
        console.log(`❌ VULNERABILITÀ: ${method} non respinto!`);
      }
    } catch (error) {
      console.log(`${method}: Errore -`, error.message);
    }
  }
}

// Test 6: Tentativo con Content-Type non valido
async function testInvalidContentType() {
  console.log('\n🔍 Test 6: Content-Type non valido');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'credential=fake'
    });
    
    console.log('Status:', response.status);
    
    if (response.status >= 400) {
      console.log('✅ Test superato: Content-Type non valido respinto');
    } else {
      console.log('❌ VULNERABILITÀ: Content-Type non valido accettato!');
    }
  } catch (error) {
    console.log('Errore:', error.message);
  }
}

// Esegui tutti i test
async function runAllTests() {
  console.log('🔒 INIZIO TEST DI SICUREZZA');
  console.log('================================');
  
  await testFakeToken();
  await testSQLInjection();
  await testRateLimit();
  await testLargePayload();
  await testInvalidMethods();
  await testInvalidContentType();
  
  console.log('\n================================');
  console.log('🔒 TEST DI SICUREZZA COMPLETATI');
}

// Esegui i test se il file viene eseguito direttamente
if (typeof window === 'undefined') {
  runAllTests().catch(console.error);
}

// Esporta per uso in browser
if (typeof window !== 'undefined') {
  window.securityTests = {
    runAllTests,
    testFakeToken,
    testSQLInjection,
    testRateLimit,
    testLargePayload,
    testInvalidMethods,
    testInvalidContentType
  };
}