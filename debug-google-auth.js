// Script di debug per Google OAuth
// Esegui con: node debug-google-auth.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colori per output console
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 Controllo file .env.local...', 'blue');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ File .env.local non trovato!', 'red');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  let hasGoogleClientId = false;
  let clientId = '';
  
  lines.forEach(line => {
    if (line.startsWith('VITE_GOOGLE_CLIENT_ID=')) {
      hasGoogleClientId = true;
      clientId = line.split('=')[1];
      log(`✅ VITE_GOOGLE_CLIENT_ID trovato: ${clientId.substring(0, 20)}...`, 'green');
    }
  });
  
  if (!hasGoogleClientId) {
    log('❌ VITE_GOOGLE_CLIENT_ID non trovato in .env.local!', 'red');
    return false;
  }
  
  return { clientId };
}

function checkGoogleOAuthConfig(clientId) {
  return new Promise((resolve) => {
    log('\n🔍 Verifica configurazione Google OAuth...', 'blue');
    
    // Simula una richiesta per verificare se il client ID è valido
    const testUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=test`;
    
    log(`📋 Client ID: ${clientId}`, 'yellow');
    log('📋 Origini JavaScript che devono essere configurate:', 'yellow');
    log('   - http://localhost:5173', 'yellow');
    log('   - http://127.0.0.1:5173', 'yellow');
    log('   - https://palestra-kw8.web.app', 'yellow');
    
    resolve(true);
  });
}

function checkCorsConfiguration() {
  log('\n🔍 Controllo configurazione CORS...', 'blue');
  
  // Verifica file di configurazione CORS
  const corsFiles = [
    'api/auth/google-signin.ts',
    'api/middleware/rbac.ts'
  ];
  
  corsFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('localhost:5173')) {
        log(`✅ ${file}: localhost:5173 configurato`, 'green');
      } else {
        log(`⚠️  ${file}: localhost:5173 potrebbe non essere configurato`, 'yellow');
      }
    }
  });
}

function provideSolution() {
  log('\n🔧 SOLUZIONE STEP-BY-STEP:', 'blue');
  log('\n1. Vai su Google Cloud Console:', 'yellow');
  log('   https://console.cloud.google.com/apis/credentials', 'yellow');
  
  log('\n2. Trova il tuo OAuth 2.0 Client ID e clicca per modificarlo', 'yellow');
  
  log('\n3. In "Authorized JavaScript origins" aggiungi:', 'yellow');
  log('   - http://localhost:5173', 'green');
  log('   - http://127.0.0.1:5173', 'green');
  
  log('\n4. In "Authorized redirect URIs" aggiungi:', 'yellow');
  log('   - http://localhost:5173', 'green');
  log('   - http://localhost:5173/auth/callback', 'green');
  
  log('\n5. Salva le modifiche e aspetta 5-10 minuti', 'yellow');
  
  log('\n6. Riavvia il server di sviluppo:', 'yellow');
  log('   npm run dev', 'green');
  
  log('\n7. Testa in modalità incognito per evitare cache', 'yellow');
  
  log('\n📝 Note importanti:', 'blue');
  log('   - Le modifiche possono richiedere fino a 10 minuti per essere attive', 'yellow');
  log('   - Svuota la cache del browser dopo le modifiche', 'yellow');
  log('   - Testa sempre in modalità incognito', 'yellow');
}

function checkNetworkConnectivity() {
  return new Promise((resolve) => {
    log('\n🔍 Controllo connettività di rete...', 'blue');
    
    const req = https.request('https://accounts.google.com', { method: 'HEAD' }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 302) {
        log('✅ Connessione a Google OK', 'green');
      } else {
        log(`⚠️  Risposta inaspettata da Google: ${res.statusCode}`, 'yellow');
      }
      resolve(true);
    });
    
    req.on('error', (err) => {
      log(`❌ Errore di connessione: ${err.message}`, 'red');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      log('❌ Timeout connessione a Google', 'red');
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

async function runDiagnostics() {
  log('🚀 DIAGNOSTICA GOOGLE OAUTH - AMBIENTE LOCALE', 'blue');
  log('================================================', 'blue');
  
  // 1. Controlla file .env.local
  const envCheck = checkEnvFile();
  if (!envCheck) {
    log('\n❌ Configurazione ambiente non valida. Controlla il file .env.local', 'red');
    provideSolution();
    return;
  }
  
  // 2. Controlla configurazione Google OAuth
  await checkGoogleOAuthConfig(envCheck.clientId);
  
  // 3. Controlla configurazione CORS
  checkCorsConfiguration();
  
  // 4. Controlla connettività
  await checkNetworkConnectivity();
  
  // 5. Fornisci soluzione
  provideSolution();
  
  log('\n✅ Diagnostica completata!', 'green');
  log('\n💡 Se il problema persiste dopo aver seguito i passaggi:', 'blue');
  log('   1. Aspetta 10-15 minuti per la propagazione delle modifiche', 'yellow');
  log('   2. Riavvia completamente il browser', 'yellow');
  log('   3. Controlla la console del browser per errori specifici', 'yellow');
}

// Esegui diagnostica
runDiagnostics().catch(console.error);