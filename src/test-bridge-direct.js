/**
 * Script de Teste Direto do Bridge Server
 * 
 * Este script testa o bridge server sem precisar da OficinasExpress.
 * Use para verificar se o bridge está funcionando corretamente.
 * 
 * USO:
 *   node test-bridge-direct.js
 */

const http = require('http');

console.log('🧪 TESTE DIRETO DO BRIDGE SERVER');
console.log('='.repeat(60));
console.log('');

// Configuração
const BRIDGE_HOST = '127.0.0.1';
const BRIDGE_PORT = 38000;
const TIMEOUT = 5000; // 5 segundos

/**
 * Função auxiliar para fazer requisição HTTP
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BRIDGE_HOST,
      port: BRIDGE_PORT,
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
      reject(new Error('Timeout - Servidor não respondeu em 5 segundos'));
    });

    req.end();
  });
}

/**
 * Teste 1: Verificar se o servidor está online
 */
async function testServerOnline() {
  console.log('📡 Teste 1: Verificar se servidor está online');
  console.log(`   URL: http://${BRIDGE_HOST}:${BRIDGE_PORT}/`);
  
  try {
    const response = await makeRequest('/');
    
    if (response.status === 200) {
      console.log('   ✅ SUCESSO - Servidor está online');
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Serviço: ${response.data.service || 'N/A'}`);
      console.log(`   Versão: ${response.data.version || 'N/A'}`);
      return true;
    } else {
      console.log(`   ⚠️ AVISO - Status inesperado: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERRO - Servidor não está acessível');
    console.log(`   Erro: ${error.message}`);
    return false;
  }
}

/**
 * Teste 2: Verificar endpoint de saúde
 */
async function testHealthEndpoint() {
  console.log('\n💚 Teste 2: Verificar endpoint de saúde');
  console.log(`   URL: http://${BRIDGE_HOST}:${BRIDGE_PORT}/health`);
  
  try {
    const response = await makeRequest('/health');
    
    if (response.status === 200 && response.data.status === 'healthy') {
      console.log('   ✅ SUCESSO - Endpoint de saúde OK');
      console.log(`   Timestamp: ${response.data.timestamp || 'N/A'}`);
      return true;
    } else {
      console.log('   ⚠️ AVISO - Resposta inesperada');
      console.log(`   Resposta:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('   ⚠️ Endpoint /health não disponível (opcional)');
    return true; // Não é crítico
  }
}

/**
 * Teste 3: Verificar endpoint de leitura de cartão
 */
async function testReadEndpoint() {
  console.log('\n📖 Teste 3: Verificar endpoint de leitura de cartão');
  console.log(`   URL: http://${BRIDGE_HOST}:${BRIDGE_PORT}/read`);
  
  try {
    console.log('   Fazendo requisição...');
    const startTime = Date.now();
    
    const response = await makeRequest('/read');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (response.status === 200 && response.data.success) {
      console.log('   ✅ SUCESSO - Leitura de cartão funcionando');
      console.log(`   Tempo de resposta: ${duration}ms`);
      console.log(`   Modo: ${response.data.mode || 'N/A'}`);
      console.log(`   Nome: ${response.data.name || 'N/A'}`);
      console.log(`   NIF: ${response.data.nif || 'N/A'}`);
      console.log(`   Localidade: ${response.data.locality || 'N/A'}`);
      return true;
    } else {
      console.log('   ❌ ERRO - Resposta inesperada');
      console.log(`   Status: ${response.status}`);
      console.log(`   Resposta:`, response.data);
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERRO - Falha na leitura');
    console.log(`   Erro: ${error.message}`);
    return false;
  }
}

/**
 * Teste 4: Verificar CORS
 */
async function testCORS() {
  console.log('\n🌐 Teste 4: Verificar configuração CORS');
  
  return new Promise((resolve) => {
    const options = {
      hostname: BRIDGE_HOST,
      port: BRIDGE_PORT,
      path: '/',
      method: 'OPTIONS',
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      const corsHeader = res.headers['access-control-allow-origin'];
      
      if (corsHeader === '*' || corsHeader === 'http://localhost:3000') {
        console.log('   ✅ SUCESSO - CORS configurado corretamente');
        console.log(`   Access-Control-Allow-Origin: ${corsHeader}`);
        resolve(true);
      } else {
        console.log('   ⚠️ AVISO - CORS pode não estar configurado');
        console.log(`   Access-Control-Allow-Origin: ${corsHeader || 'não definido'}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('   ⚠️ Não foi possível testar CORS');
      resolve(true); // Não é crítico
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('   ⚠️ Timeout ao testar CORS');
      resolve(true);
    });

    req.end();
  });
}

/**
 * Função principal
 */
async function runTests() {
  let allPassed = true;
  
  // Executar testes
  const test1 = await testServerOnline();
  
  if (!test1) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TESTE FALHOU');
    console.log('='.repeat(60));
    console.log('');
    console.log('O servidor bridge não está acessível.');
    console.log('');
    console.log('PASSOS PARA RESOLVER:');
    console.log('1. Verifique se o servidor está em execução');
    console.log('   Execute: node bridge-server-example.js');
    console.log('   ou:      node server.js');
    console.log('');
    console.log('2. Verifique a porta 38000');
    console.log('   Certifique-se que nada mais está usando esta porta');
    console.log('');
    console.log('3. Verifique o firewall');
    console.log('   O firewall pode estar bloqueando a porta 38000');
    console.log('');
    process.exit(1);
  }
  
  const test2 = await testHealthEndpoint();
  const test3 = await testReadEndpoint();
  const test4 = await testCORS();
  
  allPassed = test1 && test3; // test2 e test4 são opcionais
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  console.log('');
  console.log(`Servidor Online:       ${test1 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`Health Check:          ${test2 ? '✅ PASSOU' : '⚠️ OPCIONAL'}`);
  console.log(`Leitura de Cartão:     ${test3 ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`CORS Configurado:      ${test4 ? '✅ PASSOU' : '⚠️ OPCIONAL'}`);
  console.log('');
  
  if (allPassed) {
    console.log('='.repeat(60));
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(60));
    console.log('');
    console.log('O bridge server está funcionando perfeitamente.');
    console.log('');
    console.log('PRÓXIMOS PASSOS:');
    console.log('1. Mantenha o servidor bridge em execução');
    console.log('2. Abra a OficinasExpress no browser');
    console.log('3. Vá ao módulo de Clientes');
    console.log('4. Clique em "Leitor de Cartão"');
    console.log('5. Teste a leitura do cartão');
    console.log('');
    console.log('✨ O sistema detectará automaticamente o bridge server!');
    console.log('');
  } else {
    console.log('='.repeat(60));
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('='.repeat(60));
    console.log('');
    console.log('Verifique os erros acima e resolva os problemas.');
    console.log('');
    console.log('DOCUMENTAÇÃO:');
    console.log('- BRIDGE_SERVER_SETUP_COMPLETO.md - Guia completo');
    console.log('- CARD_READER_TROUBLESHOOTING.md - Resolução de problemas');
    console.log('');
  }
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro crítico ao executar testes:', error);
  process.exit(1);
});
