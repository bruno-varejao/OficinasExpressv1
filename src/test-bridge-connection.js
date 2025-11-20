/**
 * Script de Teste - Bridge Server do Cartão de Cidadão
 * 
 * Este script testa a conexão ao bridge server
 * 
 * USO:
 * node test-bridge-connection.js
 */

const PORT = 38000;
const HOST = '127.0.0.1';
const BASE_URL = `http://${HOST}:${PORT}`;

console.log('🧪 TESTE DE CONEXÃO AO BRIDGE SERVER');
console.log('='.repeat(60));
console.log(`URL Base: ${BASE_URL}`);
console.log('='.repeat(60) + '\n');

/**
 * Função auxiliar para fazer pedidos HTTP
 */
async function testEndpoint(endpoint, description) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n🔍 Testando: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Tempo de resposta: ${responseTime}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCESSO`);
      console.log(`   Resposta:`, JSON.stringify(data, null, 2).split('\n').map(line => `   ${line}`).join('\n'));
      return { success: true, data, responseTime };
    } else {
      const text = await response.text();
      console.log(`   ⚠️  Resposta com erro: ${text.substring(0, 100)}`);
      return { success: false, error: text, responseTime };
    }
    
  } catch (error) {
    console.log(`   ❌ FALHA: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Executar testes
 */
async function runTests() {
  const tests = [
    { endpoint: '/', description: 'Endpoint principal (info)' },
    { endpoint: '/health', description: 'Health check' },
    { endpoint: '/read', description: 'Leitura de cartão' },
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    results.push({
      ...test,
      ...result
    });
    
    // Aguardar um pouco entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Resumo
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS TESTES');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\nTestes executados: ${totalCount}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${totalCount - successCount}`);
  
  if (successCount === totalCount) {
    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('O bridge server está a funcionar corretamente.');
    console.log('A OficinasExpress pode agora conectar-se ao servidor.');
  } else if (successCount === 0) {
    console.log('\n❌ TODOS OS TESTES FALHARAM!');
    console.log('\nPossíveis causas:');
    console.log('1. O bridge server não está em execução');
    console.log('   Solução: Execute "node bridge-server-example.js" noutra janela');
    console.log('2. O servidor está noutra porta');
    console.log('   Solução: Verifique a porta configurada');
    console.log('3. Firewall está a bloquear');
    console.log('   Solução: Adicione exceção para localhost:38000');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('Verifique os detalhes acima para ver quais endpoints têm problemas.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Teste concluído');
  console.log('='.repeat(60) + '\n');
}

// Executar testes
runTests().catch(error => {
  console.error('\n❌ Erro fatal durante os testes:', error);
  process.exit(1);
});
