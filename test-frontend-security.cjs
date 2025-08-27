// Test di sicurezza per il frontend
// Verifica validazione client-side, gestione errori e tentativi di accesso non autorizzato

const API_BASE = 'http://localhost:3001';

// Colori per output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Tentativo di accesso con email non autorizzata
async function testUnauthorizedEmail() {
  log('\n🔍 Test 1: Accesso con email non autorizzata', 'blue');
  
  // Simula un token Google valido ma con email non autorizzata
  const fakeGoogleToken = createFakeGoogleToken('unauthorized@example.com');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: fakeGoogleToken })
    });
    
    const result = await response.json();
    
    if (response.status === 401 && !result.success) {
      log('✅ Test superato: Email non autorizzata respinta', 'green');
      return true;
    } else {
      log('❌ VULNERABILITÀ: Email non autorizzata accettata!', 'red');
      log(`Status: ${response.status}, Response: ${JSON.stringify(result)}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`Errore: ${error.message}`, 'red');
    return false;
  }
}

// Test 2: Validazione formato credential client-side
async function testClientSideValidation() {
  log('\n🔍 Test 2: Validazione formato credential', 'blue');
  
  const invalidCredentials = [
    '', // Vuoto
    'short', // Troppo corto
    'a'.repeat(3000), // Troppo lungo
    null, // Null
    123, // Numero invece di stringa
    'invalid.format' // Formato non JWT
  ];
  
  let passedTests = 0;
  
  for (let i = 0; i < invalidCredentials.length; i++) {
    const credential = invalidCredentials[i];
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential })
      });
      
      const result = await response.json();
      
      if (response.status === 400 && !result.success) {
        log(`✅ Credential invalido ${i + 1} respinto correttamente`, 'green');
        passedTests++;
      } else {
        log(`❌ Credential invalido ${i + 1} accettato!`, 'red');
      }
    } catch (error) {
      log(`Errore nel test ${i + 1}: ${error.message}`, 'yellow');
    }
  }
  
  const success = passedTests === invalidCredentials.length;
  log(`\nRisultato: ${passedTests}/${invalidCredentials.length} test superati`, success ? 'green' : 'red');
  return success;
}

// Test 3: Gestione errori XSS
async function testXSSPrevention() {
  log('\n🔍 Test 3: Prevenzione XSS nei messaggi di errore', 'blue');
  
  const xssPayload = '<script>alert("XSS")</script>';
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: xssPayload })
    });
    
    const result = await response.json();
    
    // Verifica che il messaggio di errore non contenga script
    if (result.message && !result.message.includes('<script>')) {
      log('✅ Test superato: Payload XSS sanitizzato', 'green');
      return true;
    } else {
      log('❌ VULNERABILITÀ: Possibile XSS nei messaggi di errore!', 'red');
      return false;
    }
  } catch (error) {
    log(`Errore: ${error.message}`, 'red');
    return false;
  }
}

// Test 4: Verifica CORS
async function testCORSHeaders() {
  log('\n🔍 Test 4: Verifica configurazione CORS', 'blue');
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
    const corsMethods = response.headers.get('Access-Control-Allow-Methods');
    
    if (corsOrigin && corsMethods && corsMethods.includes('POST')) {
      log('✅ Test superato: CORS configurato correttamente', 'green');
      return true;
    } else {
      log('❌ Problema: CORS non configurato correttamente', 'red');
      return false;
    }
  } catch (error) {
    log(`Errore: ${error.message}`, 'red');
    return false;
  }
}

// Test 5: Verifica rate limiting
async function testRateLimiting() {
  log('\n🔍 Test 5: Verifica rate limiting', 'blue');
  
  const requests = [];
  const fakeToken = createFakeGoogleToken('test@example.com');
  
  // Invia 10 richieste rapidamente
  for (let i = 0; i < 10; i++) {
    requests.push(
      fetch(`${API_BASE}/api/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: fakeToken })
      })
    );
  }
  
  try {
    const responses = await Promise.all(requests);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    if (rateLimitedCount > 0) {
      log(`✅ Test superato: ${rateLimitedCount}/10 richieste bloccate dal rate limiting`, 'green');
      return true;
    } else {
      log('❌ Problema: Rate limiting non attivo', 'red');
      return false;
    }
  } catch (error) {
    log(`Errore: ${error.message}`, 'red');
    return false;
  }
}

// Test 6: Verifica gestione token scaduti
async function testExpiredToken() {
  log('\n🔍 Test 6: Gestione token scaduti', 'blue');
  
  // Crea un token con timestamp scaduto
  const expiredToken = createFakeGoogleToken('krossingweight@gmail.com', true);
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: expiredToken })
    });
    
    const result = await response.json();
    log(`Debug - Status: ${response.status}, Response: ${JSON.stringify(result)}`, 'yellow');
    
    if (response.status === 401 && !result.success) {
      log('✅ Test superato: Token scaduto respinto', 'green');
      return true;
    } else {
      log('❌ VULNERABILITÀ: Token scaduto accettato!', 'red');
      return false;
    }
  } catch (error) {
    log(`Errore: ${error.message}`, 'red');
    return false;
  }
}

// Utility: Crea un token Google falso per i test
function createFakeGoogleToken(email, expired = false) {
  const header = {
    "alg": "RS256",
    "kid": "fake-key-id",
    "typ": "JWT"
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    "iss": "accounts.google.com",
    "aud": "your-google-client-id-here.apps.googleusercontent.com", // Usa lo stesso del server
    "sub": "123456789",
    "email": email,
    "email_verified": true,
    "name": "Test User",
    "picture": "https://example.com/photo.jpg",
    "iat": expired ? now - 7200 : now - 60, // Se scaduto, 2 ore fa, altrimenti 1 minuto fa
    "exp": expired ? now - 3600 : now + 3600 // Se scaduto, 1 ora fa, altrimenti 1 ora nel futuro
  };
  
  const signature = "fake-signature";
  
  // Codifica Base64URL (semplificata per i test)
  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };
  
  return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.${signature}`;
}

// Esegui tutti i test
async function runAllTests() {
  log('🚀 Avvio test di sicurezza frontend...\n', 'blue');
  
  const tests = [
    { name: 'Validazione client-side', fn: testClientSideValidation },
    { name: 'Prevenzione XSS', fn: testXSSPrevention },
    { name: 'Configurazione CORS', fn: testCORSHeaders },
    { name: 'Token scaduti', fn: testExpiredToken },
    { name: 'Email non autorizzata', fn: testUnauthorizedEmail },
    { name: 'Rate limiting', fn: testRateLimiting }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passedTests++;
    } catch (error) {
      log(`❌ Errore nel test '${test.name}': ${error.message}`, 'red');
    }
    
    // Pausa più lunga tra i test per evitare rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  log(`\n📊 Risultati finali:`, 'blue');
  log(`✅ Test superati: ${passedTests}/${tests.length}`, passedTests === tests.length ? 'green' : 'yellow');
  log(`❌ Test falliti: ${tests.length - passedTests}/${tests.length}`, passedTests === tests.length ? 'green' : 'red');
  
  if (passedTests === tests.length) {
    log('\n🎉 Tutti i test di sicurezza frontend sono stati superati!', 'green');
  } else {
    log('\n⚠️  Alcuni test di sicurezza hanno rilevato vulnerabilità.', 'yellow');
  }
}

// Avvia i test
runAllTests().catch(console.error);