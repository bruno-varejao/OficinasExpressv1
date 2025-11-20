/**
 * Bridge Server PRODUÇÃO - Cartão de Cidadão Português
 * Integração REAL com Middleware Autenticação.Gov
 * 
 * REQUISITOS:
 * 1. Node.js instalado (https://nodejs.org)
 * 2. Middleware Autenticação.Gov instalado e em execução
 *    Download: https://www.autenticacao.gov.pt/web/guest/cc-aplicacao
 * 3. Leitor de cartões USB conectado
 * 4. Cartão de Cidadão inserido no leitor
 * 
 * INSTALAÇÃO:
 * 1. Criar pasta: mkdir cc-bridge && cd cc-bridge
 * 2. Copiar este ficheiro para a pasta
 * 3. Instalar dependências:
 *    npm install express cors node-fetch@2
 * 4. Executar:
 *    node bridge-server-production.js
 * 
 * COMO FUNCIONA:
 * - Detecta automaticamente se o middleware está disponível
 * - Se disponível: usa leitura REAL do cartão
 * - Se não disponível: fallback para dados simulados
 * - Logs detalhados de toda a operação
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const PORT = 38000;

// URLs do middleware Autenticação.Gov (tenta várias portas)
const MIDDLEWARE_PORTS = [35963, 39901, 39902, 39903];
let detectedMiddlewareUrl = null;
let middlewareMode = 'unknown'; // 'real', 'simulation', 'unknown'

// ============================================
// CONFIGURAÇÃO
// ============================================

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================
// DETECÇÃO DO MIDDLEWARE
// ============================================

/**
 * Detecta se o middleware Autenticação.Gov está instalado e rodando
 */
async function detectMiddleware() {
  console.log('\n🔍 Procurando middleware Autenticação.Gov...');
  
  // Tentar cada porta possível
  for (const port of MIDDLEWARE_PORTS) {
    const url = `http://127.0.0.1:${port}`;
    
    try {
      console.log(`   Testando: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        timeout: 2000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok || response.status === 404) {
        // Middleware responde (mesmo que seja 404, significa que está ativo)
        detectedMiddlewareUrl = url;
        middlewareMode = 'real';
        console.log(`   ✅ ENCONTRADO em ${url}`);
        return true;
      }
    } catch (error) {
      // Porta não responde, continuar para próxima
      continue;
    }
  }
  
  // Não encontrado
  console.log('   ❌ Middleware não encontrado em nenhuma porta');
  console.log('   ⚠️  Modo SIMULAÇÃO ativado');
  middlewareMode = 'simulation';
  return false;
}

/**
 * Verifica se o processo do middleware está rodando
 */
function checkMiddlewareProcess() {
  return new Promise((resolve) => {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
      command = 'tasklist | findstr "pteidmw"';
    } else if (platform === 'darwin') {
      command = 'ps aux | grep "pteidmw\\|autenticacao"';
    } else {
      command = 'ps aux | grep pteidmw';
    }
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(false);
      } else {
        resolve(stdout.length > 0);
      }
    });
  });
}

// ============================================
// LEITURA REAL DO CARTÃO
// ============================================

/**
 * Lê o cartão usando o middleware real
 */
async function readCardFromMiddleware() {
  if (!detectedMiddlewareUrl) {
    throw new Error('Middleware não está disponível');
  }
  
  console.log('📡 Conectando ao middleware real...');
  console.log(`   URL: ${detectedMiddlewareUrl}`);
  
  try {
    // O middleware Autenticação.Gov expõe endpoints REST
    // Endpoint principal para ler dados do cartão
    const response = await fetch(`${detectedMiddlewareUrl}/citizencard/read`, {
      method: 'GET',
      timeout: 10000, // 10 segundos (leitura pode demorar)
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Middleware retornou status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados lidos com sucesso do cartão');
    
    // Normalizar os dados para o formato esperado
    return {
      success: true,
      mode: 'production',
      source: 'middleware-real',
      name: data.name || data.fullName || '',
      nif: data.taxNumber || data.nif || '',
      address: data.address || '',
      postalCode: data.postalCode || data.zipCode || '',
      locality: data.locality || data.city || '',
      birthDate: data.dateOfBirth || data.birthDate || '',
      documentNumber: data.documentNumber || data.civilIdNumber || '',
      validUntil: data.expiryDate || data.validUntil || '',
      phone: '',
      email: '',
      timestamp: new Date().toISOString(),
      raw: data // Dados originais para debug
    };
    
  } catch (error) {
    console.error('❌ Erro ao ler do middleware:', error.message);
    throw error;
  }
}

/**
 * Alternativa: Leitura via SDK nativo (Node addon)
 * Esta função usa o SDK C++ do middleware via bindings Node
 */
async function readCardFromSDK() {
  console.log('📡 Usando SDK nativo do middleware...');
  
  try {
    // Nota: Isto requer o addon nativo pteid-nodejs
    // Instalar com: npm install pteid-nodejs
    // (Se disponível - pode não estar em repositórios públicos)
    
    // Exemplo de uso (código hipotético):
    /*
    const pteid = require('pteid-nodejs');
    
    await pteid.initSDK();
    const readers = await pteid.getReaders();
    
    if (readers.length === 0) {
      throw new Error('Nenhum leitor de cartões detectado');
    }
    
    console.log(`   Usando leitor: ${readers[0].name}`);
    
    const card = await readers[0].getCard();
    const identity = await card.getIdentity();
    const address = await card.getAddress();
    
    return {
      success: true,
      mode: 'production',
      source: 'sdk-native',
      name: identity.name,
      nif: identity.taxNumber,
      address: address.street,
      postalCode: address.postalCode,
      locality: address.locality,
      birthDate: identity.dateOfBirth,
      documentNumber: identity.documentNumber,
      validUntil: identity.expiryDate,
      phone: '',
      email: '',
      timestamp: new Date().toISOString()
    };
    
    await pteid.releaseSDK();
    */
    
    throw new Error('SDK nativo não implementado. Use readCardFromMiddleware()');
    
  } catch (error) {
    console.error('❌ Erro ao ler do SDK:', error.message);
    throw error;
  }
}

// ============================================
// LEITURA SIMULADA (FALLBACK)
// ============================================

/**
 * Retorna dados simulados quando middleware não está disponível
 */
async function getSimulatedCardData() {
  console.log('⚠️  Usando dados SIMULADOS (middleware não disponível)');
  
  // Simular delay de leitura
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    mode: 'simulation',
    source: 'simulated-data',
    name: 'JOÃO PEDRO SILVA SANTOS',
    nif: '123456789',
    address: 'Rua Example, nº 123, 4º Dto',
    postalCode: '1000-001',
    locality: 'Lisboa',
    birthDate: '1985-03-15',
    documentNumber: 'PT12345678',
    validUntil: '2030-12-31',
    phone: '',
    email: '',
    timestamp: new Date().toISOString()
  };
}

// ============================================
// ENDPOINTS HTTP
// ============================================

/**
 * Endpoint principal - Status do servidor
 */
app.get('/', (req, res) => {
  console.log('✅ Pedido de status recebido');
  
  res.json({
    status: 'online',
    service: 'Cartão de Cidadão Bridge Server - PRODUÇÃO',
    version: '2.0.0',
    mode: middlewareMode,
    middlewareUrl: detectedMiddlewareUrl || 'não detectado',
    endpoints: {
      test: 'GET /',
      read: 'GET /read',
      health: 'GET /health',
      detectMiddleware: 'GET /detect'
    },
    message: middlewareMode === 'real' 
      ? '✅ Middleware real detectado e disponível'
      : '⚠️ Middleware não encontrado - usando simulação',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint de saúde
 */
app.get('/health', async (req, res) => {
  const processRunning = await checkMiddlewareProcess();
  
  res.json({
    status: 'healthy',
    middlewareMode: middlewareMode,
    middlewareUrl: detectedMiddlewareUrl,
    middlewareProcess: processRunning ? 'running' : 'not-running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint para re-detectar o middleware
 */
app.get('/detect', async (req, res) => {
  console.log('🔍 Re-detecção do middleware solicitada');
  
  const found = await detectMiddleware();
  
  res.json({
    detected: found,
    mode: middlewareMode,
    url: detectedMiddlewareUrl,
    message: found 
      ? 'Middleware detectado com sucesso'
      : 'Middleware não encontrado',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint principal - Leitura do Cartão de Cidadão
 * Usa middleware real se disponível, senão usa simulação
 */
app.get('/read', async (req, res) => {
  try {
    console.log('\n📖 Pedido de leitura de cartão recebido');
    console.log(`   Modo atual: ${middlewareMode}`);
    
    let cardData;
    
    // Tentar leitura real primeiro
    if (middlewareMode === 'real' && detectedMiddlewareUrl) {
      try {
        console.log('🎯 Tentando leitura REAL do cartão...');
        cardData = await readCardFromMiddleware();
        console.log('✅ Leitura REAL concluída com sucesso');
        
      } catch (error) {
        console.error('❌ Erro na leitura real:', error.message);
        console.log('🔄 Fallback para dados simulados...');
        
        // Fallback para simulação
        cardData = await getSimulatedCardData();
        cardData.fallback = true;
        cardData.fallbackReason = error.message;
      }
    } else {
      // Usar simulação direto
      cardData = await getSimulatedCardData();
    }
    
    // Log do resultado
    console.log(`📊 Dados preparados:
   Nome: ${cardData.name}
   NIF: ${cardData.nif}
   Localidade: ${cardData.locality}
   Modo: ${cardData.mode}
   Fonte: ${cardData.source}`);
    
    console.log('📤 Enviando resposta...\n');
    
    res.json(cardData);
    
  } catch (error) {
    console.error('❌ Erro crítico ao processar leitura:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      mode: 'error',
      timestamp: new Date().toISOString(),
      helpText: 'Verifique se o middleware está instalado e o cartão está inserido'
    });
  }
});

/**
 * Endpoint para forçar modo de teste (desenvolvimento)
 */
app.get('/test-simulation', async (req, res) => {
  console.log('🧪 Modo de teste solicitado (forçar simulação)');
  
  const data = await getSimulatedCardData();
  res.json(data);
});

/**
 * Endpoint 404
 */
app.use((req, res) => {
  console.log(`⚠️  Endpoint não encontrado: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: ['/', '/health', '/read', '/detect', '/test-simulation'],
    requestedUrl: req.url
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

/**
 * Inicializar servidor
 */
async function startServer() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 BRIDGE SERVER - CARTÃO DE CIDADÃO (PRODUÇÃO)');
  console.log('='.repeat(70));
  console.log('');
  
  // Detectar middleware ao iniciar
  await detectMiddleware();
  
  // Verificar processo
  const processRunning = await checkMiddlewareProcess();
  
  // Iniciar servidor HTTP
  app.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('📡 SERVIDOR HTTP');
    console.log(`   URL: http://127.0.0.1:${PORT}`);
    console.log(`   Porta: ${PORT}`);
    console.log('');
    console.log('🎯 MODO DE OPERAÇÃO');
    console.log(`   Modo: ${middlewareMode.toUpperCase()}`);
    
    if (middlewareMode === 'real') {
      console.log(`   Middleware: ${detectedMiddlewareUrl}`);
      console.log(`   Processo: ${processRunning ? 'Em execução ✅' : 'Não detectado ⚠️'}`);
      console.log('   Fonte de dados: LEITURA REAL DO CARTÃO');
    } else {
      console.log('   Middleware: NÃO DETECTADO');
      console.log('   Fonte de dados: DADOS SIMULADOS');
    }
    
    console.log('');
    console.log('📋 ENDPOINTS DISPONÍVEIS');
    console.log('   GET  /           - Status do servidor');
    console.log('   GET  /health     - Health check');
    console.log('   GET  /read       - Ler cartão de cidadão');
    console.log('   GET  /detect     - Re-detectar middleware');
    console.log('   GET  /test-simulation - Forçar simulação (dev)');
    console.log('');
    
    if (middlewareMode === 'simulation') {
      console.log('⚠️  IMPORTANTE - MIDDLEWARE NÃO ENCONTRADO');
      console.log('');
      console.log('   Para usar leitura REAL do cartão:');
      console.log('   1. Instalar middleware Autenticação.Gov');
      console.log('      https://www.autenticacao.gov.pt/web/guest/cc-aplicacao');
      console.log('   2. Conectar leitor USB');
      console.log('   3. Inserir Cartão de Cidadão');
      console.log('   4. Executar aplicação Autenticação.Gov');
      console.log('   5. Reiniciar este bridge server');
      console.log('');
      console.log('   Ou execute: curl http://127.0.0.1:38000/detect');
      console.log('');
    } else {
      console.log('✅ PRONTO PARA LEITURA REAL');
      console.log('');
      console.log('   Certifique-se que:');
      console.log('   ✓ Leitor USB está conectado');
      console.log('   ✓ Cartão de Cidadão está inserido');
      console.log('   ✓ Aplicação Autenticação.Gov está aberta');
      console.log('');
    }
    
    console.log('💡 DICAS');
    console.log('   • Mantenha este terminal aberto');
    console.log('   • Logs aparecem aqui em tempo real');
    console.log('   • Para parar: Ctrl+C');
    console.log('');
    console.log('='.repeat(70));
    console.log('');
    console.log('Aguardando pedidos...\n');
  });
}

/**
 * Tratamento de encerramento gracioso
 */
process.on('SIGINT', () => {
  console.log('\n\n🛑 Encerrando Bridge Server...');
  console.log('✅ Servidor encerrado com sucesso');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Encerrando Bridge Server...');
  console.log('✅ Servidor encerrado com sucesso');
  process.exit(0);
});

// Iniciar
startServer().catch(error => {
  console.error('❌ Erro crítico ao iniciar servidor:', error);
  process.exit(1);
});
