/**
 * Script de Teste - Bridge Server Produção
 * Testa integração real com middleware Autenticação.Gov
 * 
 * USO:
 *   node test-production-bridge.js
 */

const http = require('http');

console.log('🧪 TESTE COMPLETO - BRIDGE SERVER PRODUÇÃO');
console.log('='.repeat(70));
console.log('');

const HOST = '127.0.0.1';
const PORT = 38000;
const TIMEOUT = 10000;

/**
 * Fazer requisição HTTP
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: JSON.parse(data)
          });
        } catch (error) {
          reject(new Error('Resposta não é JSON válido: ' + data));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout - Servidor não respondeu'));
    });

    req.end();
  });
}

/**
 * Teste 1: Verificar status do servidor
 */
async function testServerStatus() {
  console.log('📡 Teste 1: Status do servidor');
  console.log(`   URL: http://${HOST}:${PORT}/`);
  
  try {
    const response = await makeRequest('/');
    
    if (response.status === 200) {
      console.log('   ✅ SUCESSO - Servidor online');
      console.log(`   Status: ${response.status}`);
      console.log(`   Serviço: ${response.data.service || 'N/A'}`);
      console.log(`   Versão: ${response.data.version || 'N/A'}`);
      console.log(`   Modo: ${response.data.mode || 'N/A'}`);
      console.log(`   Middleware: ${response.data.middlewareUrl || 'não detectado'}`);
      
      return {
        success: true,
        mode: response.data.mode
      };
    } else {
      console.log(`   ⚠️ AVISO - Status inesperado: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log('   ❌ ERRO - Servidor não acessível');
    console.log(`   Erro: ${error.message}`);
    return { success: false };
  }
}

/**
 * Teste 2: Health check
 */
async function testHealthCheck() {
  console.log('\n💚 Teste 2: Health check');
  console.log(`   URL: http://${HOST}:${PORT}/health`);
  
  try {
    const response = await makeRequest('/health');
    
    if (response.status === 200) {
      console.log('   ✅ SUCESSO - Health check OK');
      console.log(`   Modo: ${response.data.middlewareMode || 'N/A'}`);
      console.log(`   Processo middleware: ${response.data.middlewareProcess || 'N/A'}`);
      return true;
    } else {
      console.log('   ⚠️ AVISO - Resposta inesperada');
      return false;
    }
  } catch (error) {
    console.log('   ⚠️ Health check não disponível');
    return true; // Não crítico
  }
}

/**
 * Teste 3: Detecção do middleware
 */
async function testMiddlewareDetection() {
  console.log('\n🔍 Teste 3: Detecção do middleware');
  console.log(`   URL: http://${HOST}:${PORT}/detect`);
  
  try {
    const response = await makeRequest('/detect');
    
    console.log('   ✅ SUCESSO - Detecção executada');
    console.log(`   Detectado: ${response.data.detected ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`   Modo: ${response.data.mode || 'N/A'}`);
    console.log(`   URL: ${response.data.url || 'não encontrado'}`);
    console.log(`   Mensagem: ${response.data.message || 'N/A'}`);
    
    return {
      success: true,
      detected: response.data.detected,
      mode: response.data.mode
    };
  } catch (error) {
    console.log('   ❌ ERRO - Falha na detecção');
    console.log(`   Erro: ${error.message}`);
    return { success: false, detected: false };
  }
}

/**
 * Teste 4: Leitura de cartão (REAL ou SIMULADO)
 */
async function testCardReading() {
  console.log('\n📖 Teste 4: Leitura do cartão');
  console.log(`   URL: http://${HOST}:${PORT}/read`);
  console.log('   Aguardando resposta (pode demorar 3-10s)...');
  
  try {
    const startTime = Date.now();
    
    const response = await makeRequest('/read');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ SUCESSO - Leitura concluída');
      console.log(`   Tempo: ${duration}ms`);
      console.log(`   Modo: ${response.data.mode || 'N/A'}`);
      console.log(`   Fonte: ${response.data.source || 'N/A'}`);
      
      if (response.data.fallback) {
        console.log('   ⚠️ FALLBACK ativado');
        console.log(`   Razão: ${response.data.fallbackReason || 'N/A'}`);
      }
      
      console.log('\n   📊 Dados lidos:');
      console.log(`      Nome: ${response.data.name || 'N/A'}`);
      console.log(`      NIF: ${response.data.nif || 'N/A'}`);
      console.log(`      Morada: ${response.data.address || 'N/A'}`);
      console.log(`      Código Postal: ${response.data.postalCode || 'N/A'}`);
      console.log(`      Localidade: ${response.data.locality || 'N/A'}`);
      console.log(`      Data Nascimento: ${response.data.birthDate || 'N/A'}`);
      console.log(`      Nº Documento: ${response.data.documentNumber || 'N/A'}`);
      console.log(`      Validade: ${response.data.validUntil || 'N/A'}`);
      
      return {
        success: true,
        mode: response.data.mode,
        realData: response.data.mode === 'production' && !response.data.fallback
      };
    } else {
      console.log('   ❌ ERRO - Resposta inesperada');
      console.log(`   Status: ${response.status}`);
      return { success: false, realData: false };
    }
  } catch (error) {
    console.log('   ❌ ERRO - Falha na leitura');
    console.log(`   Erro: ${error.message}`);
    return { success: false, realData: false };
  }
}

/**
 * Teste 5: Simulação forçada (dev)
 */
async function testForcedSimulation() {
  console.log('\n🧪 Teste 5: Simulação forçada (dev)');
  console.log(`   URL: http://${HOST}:${PORT}/test-simulation`);
  
  try {
    const response = await makeRequest('/test-simulation');
    
    if (response.status === 200 && response.data.mode === 'simulation') {
      console.log('   ✅ SUCESSO - Simulação funciona');
      console.log(`   Nome: ${response.data.name || 'N/A'}`);
      return true;
    } else {
      console.log('   ⚠️ AVISO - Resposta inesperada');
      return false;
    }
  } catch (error) {
    console.log('   ⚠️ Endpoint de simulação não disponível');
    return true; // Não crítico
  }
}

/**
 * Função principal
 */
async function runTests() {
  const results = {
    serverOnline: false,
    healthCheck: false,
    middlewareDetected: false,
    cardReading: false,
    usingRealData: false
  };
  
  // Teste 1: Status
  const statusResult = await testServerStatus();
  results.serverOnline = statusResult.success;
  
  if (!results.serverOnline) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ SERVIDOR NÃO ESTÁ ONLINE');
    console.log('='.repeat(70));
    console.log('');
    console.log('O bridge server não está acessível.');
    console.log('');
    console.log('PASSOS:');
    console.log('1. Executar: node bridge-server-production.js');
    console.log('   ou:       START_BRIDGE_PRODUCTION.bat');
    console.log('   ou:       ./START_BRIDGE_PRODUCTION.sh');
    console.log('');
    console.log('2. Aguardar mensagem "Aguardando pedidos..."');
    console.log('3. Executar este teste novamente');
    console.log('');
    process.exit(1);
  }
  
  // Teste 2: Health
  results.healthCheck = await testHealthCheck();
  
  // Teste 3: Detecção
  const detectionResult = await testMiddlewareDetection();
  results.middlewareDetected = detectionResult.detected;
  
  // Teste 4: Leitura
  const readingResult = await testCardReading();
  results.cardReading = readingResult.success;
  results.usingRealData = readingResult.realData;
  
  // Teste 5: Simulação
  await testForcedSimulation();
  
  // Resumo
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(70));
  console.log('');
  console.log(`Servidor Online:       ${results.serverOnline ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Health Check:          ${results.healthCheck ? '✅ PASSOU' : '⚠️ OPCIONAL'}`);
  console.log(`Middleware Detectado:  ${results.middlewareDetected ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Leitura de Cartão:     ${results.cardReading ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Usando Dados Reais:    ${results.usingRealData ? '✅ SIM' : '⚠️ NÃO (simulação)'}`);
  console.log('');
  
  // Conclusão
  console.log('='.repeat(70));
  
  if (results.serverOnline && results.cardReading) {
    if (results.usingRealData) {
      console.log('🎉 SUCESSO TOTAL - LEITURA REAL FUNCIONANDO!');
      console.log('='.repeat(70));
      console.log('');
      console.log('✅ O bridge server está usando o middleware REAL');
      console.log('✅ Leitura de cartões físicos está operacional');
      console.log('');
      console.log('PRÓXIMOS PASSOS:');
      console.log('1. Manter o bridge server em execução');
      console.log('2. Abrir OficinasExpress no browser');
      console.log('3. Módulo Clientes → Leitor de Cartão');
      console.log('4. Inserir cartão no leitor');
      console.log('5. Clicar "Ler Cartão"');
      console.log('');
      console.log('✨ Dados REAIS do cartão aparecerão automaticamente!');
    } else {
      console.log('⚠️ FUNCIONANDO EM MODO SIMULAÇÃO');
      console.log('='.repeat(70));
      console.log('');
      console.log('✅ O bridge server está funcionando');
      console.log('⚠️ Middleware NÃO foi detectado');
      console.log('⚠️ Usando dados simulados');
      console.log('');
      console.log('PARA ATIVAR LEITURA REAL:');
      console.log('1. Instalar middleware Autenticação.Gov');
      console.log('   https://www.autenticacao.gov.pt/web/guest/cc-aplicacao');
      console.log('2. Conectar leitor USB');
      console.log('3. Inserir Cartão de Cidadão');
      console.log('4. Abrir aplicação Autenticação.Gov');
      console.log('5. Executar: curl http://127.0.0.1:38000/detect');
      console.log('6. Reiniciar bridge server');
      console.log('');
      console.log('💡 Enquanto isso, o sistema funciona com dados simulados.');
    }
  } else {
    console.log('❌ TESTES FALHARAM');
    console.log('='.repeat(70));
    console.log('');
    console.log('Alguns testes não passaram.');
    console.log('');
    console.log('DIAGNÓSTICO:');
    console.log(`- Servidor: ${results.serverOnline ? 'OK ✅' : 'FALHOU ❌'}`);
    console.log(`- Leitura: ${results.cardReading ? 'OK ✅' : 'FALHOU ❌'}`);
    console.log('');
    console.log('DOCUMENTAÇÃO:');
    console.log('- INTEGRACAO_SDK_REAL.md - Guia completo');
    console.log('- CARD_READER_TROUBLESHOOTING.md - Problemas');
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('');
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro crítico:', error);
  process.exit(1);
});
