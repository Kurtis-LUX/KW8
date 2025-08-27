const crypto = require('crypto');

// Configurazione
const API_BASE = 'http://localhost:3001';

// Utility per logging colorato
function log(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Crea un token Google fake per test
function createFakeGoogleToken(email, expired = false) {
  const header = {
    "alg": "RS256",
    "kid": "fake-key-id",
    "typ": "JWT"
  };
  
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    "iss": "accounts.google.com",
    "aud": "your-google-client-id-here.apps.googleusercontent.com",
    "sub": "123456789",
    "email": email,
    "email_verified": true,
    "name": "Test User",
    "picture": "https://example.com/photo.jpg",
    "iat": expired ? now - 7200 : now - 60, // Se scaduto, 2 ore fa
    "exp": expired ? now - 3600 : now + 3600 // Se scaduto, 1 ora fa
  };
  
  const signature = "fake-signature-" + crypto.randomBytes(32).toString('hex');
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const encodedSignature = Buffer.from(signature).toString('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Test specifico per token scaduti
async function testExpiredTokenOnly() {
  log('\n🔍 Test specifico: Gestione token scaduti', 'blue');
  
  // Test 1: Token valido (non scaduto)
  log('\n1. Test con token valido...', 'yellow');
  const validToken = createFakeGoogleToken('krossingweight@gmail.com', false);
  
  try {
    const response1 = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: validToken })
    });
    
    const result1 = await response1.json();
    log(`Token valido - Status: ${response1.status}, Response: ${JSON.stringify(result1)}`, 'yellow');
    
    // Aspetta un po' prima del prossimo test
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    log(`Errore con token valido: ${error.message}`, 'red');
  }
  
  // Test 2: Token scaduto
  log('\n2. Test con token scaduto...', 'yellow');
  const expiredToken = createFakeGoogleToken('krossingweight@gmail.com', true);
  
  try {
    const response2 = await fetch(`${API_BASE}/api/auth/google-signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: expiredToken })
    });
    
    const result2 = await response2.json();
    log(`Token scaduto - Status: ${response2.status}, Response: ${JSON.stringify(result2)}`, 'yellow');
    
    if (response2.status === 401 && !result2.success) {
      log('✅ Test superato: Token scaduto respinto correttamente', 'green');
      return true;
    } else {
      log('❌ VULNERABILITÀ: Token scaduto accettato!', 'red');
      return false;
    }
  } catch (error) {
    log(`Errore con token scaduto: ${error.message}`, 'red');
    return false;
  }
}

// Esegui il test
testExpiredTokenOnly().then(result => {
  log(`\n📊 Risultato test token scaduti: ${result ? 'SUPERATO' : 'FALLITO'}`, result ? 'green' : 'red');
  process.exit(result ? 0 : 1);
}).catch(error => {
  log(`Errore durante l'esecuzione del test: ${error.message}`, 'red');
  process.exit(1);
});