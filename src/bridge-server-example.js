/**
 * Bridge Server para Cartão de Cidadão Português
 * 
 * Este servidor cria uma ponte entre o middleware Autenticação.Gov
 * e a aplicação web OficinasExpress.
 * 
 * INSTALAÇÃO:
 * 1. Certifique-se que tem Node.js instalado (https://nodejs.org)
 * 2. Crie uma pasta para o bridge (ex: C:\cc-bridge)
 * 3. Copie este ficheiro para a pasta
 * 4. Abra terminal na pasta e execute:
 *    npm install express cors
 * 5. Execute o servidor:
 *    node bridge-server-example.js
 * 
 * USO:
 * - O servidor ficará disponível em http://localhost:38000
 * - A OficinasExpress conectará automaticamente
 * - Mantenha este terminal aberto enquanto usa o sistema
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 38000;

// Ativar CORS para permitir pedidos do browser
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Endpoint principal - Teste de conectividade
 */
app.get('/', (req, res) => {
  console.log('✅ Pedido de teste recebido');
  res.json({
    status: 'online',
    service: 'Cartão de Cidadão Bridge Server',
    version: '1.0.0',
    endpoints: {
      test: 'GET /',
      read: 'GET /read',
      health: 'GET /health'
    },
    mode: 'simulation', // Alterar para 'production' quando integrar SDK real
    message: 'Bridge server em execução com sucesso'
  });
});

/**
 * Endpoint de saúde
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

/**
 * Endpoint principal - Leitura do Cartão de Cidadão
 * 
 * TODO: Integrar com SDK real do middleware Autenticação.Gov
 * Atualmente retorna dados simulados para testes
 */
app.get('/read', async (req, res) => {
  try {
    console.log('📖 Pedido de leitura de cartão recebido');
    console.log('⚠️  MODO SIMULAÇÃO - Retornando dados de teste');
    console.log('💡 Para usar leitor real, integre o SDK do middleware');
    
    // Simular delay de leitura (como se estivesse a comunicar com o leitor)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // ========================================
    // DADOS SIMULADOS - SUBSTITUIR POR LEITURA REAL
    // ========================================
    // Quando tiver acesso ao SDK do middleware, substitua esta secção
    // por chamadas reais ao SDK. Exemplos:
    // 
    // const pteid = require('pteid-sdk'); // Nome hipotético
    // const cardData = await pteid.readCard();
    // 
    // Consulte a documentação oficial em:
    // https://www.autenticacao.gov.pt/documentacao-tecnica
    // ========================================
    
    const simulatedCardData = {
      success: true,
      mode: 'simulation',
      name: 'JOÃO PEDRO SILVA SANTOS',
      nif: '123456789',
      address: 'Rua Example, nº 123, 4º Dto',
      postalCode: '1000-001',
      locality: 'Lisboa',
      birthDate: '1985-03-15',
      documentNumber: 'PT12345678',
      validUntil: '2030-12-31',
      // Nota: Telefone e email não estão no cartão
      phone: '',
      email: '',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Dados do cartão preparados:', simulatedCardData.name);
    console.log('📤 Enviando resposta para OficinasExpress');
    
    res.json(simulatedCardData);
    
  } catch (error) {
    console.error('❌ Erro ao processar leitura do cartão:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * EXEMPLO: Integração com SDK Real (quando disponível)
 * 
 * Descomente e adapte quando tiver acesso ao SDK oficial
 */
/*
app.get('/read-real', async (req, res) => {
  try {
    // Importar SDK do middleware
    const pteid = require('pteid-sdk'); // Nome pode ser diferente
    
    // Inicializar SDK
    await pteid.initialize();
    
    // Obter lista de leitores conectados
    const readers = await pteid.getReaders();
    
    if (readers.length === 0) {
      throw new Error('Nenhum leitor de cartões detectado');
    }
    
    console.log(`Leitores encontrados: ${readers.length}`);
    console.log(`Usando leitor: ${readers[0].name}`);
    
    // Ler cartão do primeiro leitor
    const card = await pteid.readCard(readers[0]);
    
    // Obter dados pessoais
    const personalData = await card.getPersonalData();
    
    // Obter morada
    const addressData = await card.getAddress();
    
    // Preparar resposta
    const cardData = {
      success: true,
      mode: 'production',
      name: personalData.name,
      nif: personalData.taxNumber,
      address: addressData.fullAddress,
      postalCode: addressData.postalCode,
      locality: addressData.locality,
      birthDate: personalData.dateOfBirth,
      documentNumber: personalData.documentNumber,
      validUntil: personalData.expiryDate,
      phone: '', // Não está no cartão
      email: '', // Não está no cartão
      timestamp: new Date().toISOString()
    };
    
    // Limpar recursos
    await pteid.cleanup();
    
    res.json(cardData);
    
  } catch (error) {
    console.error('Erro na leitura real do cartão:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
*/

/**
 * Tratamento de erros 404
 */
app.use((req, res) => {
  console.log(`⚠️  Endpoint não encontrado: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: ['/', '/health', '/read'],
    requestedUrl: req.url
  });
});

/**
 * Iniciar servidor
 */
app.listen(PORT, '127.0.0.1', () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BRIDGE SERVER PARA CARTÃO DE CIDADÃO');
  console.log('='.repeat(60));
  console.log(`✅ Servidor em execução em: http://127.0.0.1:${PORT}`);
  console.log(`📖 Endpoint de leitura: http://127.0.0.1:${PORT}/read`);
  console.log(`💚 Health check: http://127.0.0.1:${PORT}/health`);
  console.log('\n📊 STATUS:');
  console.log('   Modo: SIMULAÇÃO (dados de teste)');
  console.log('   CORS: Ativado (aceita pedidos de qualquer origem)');
  console.log('   Porta: 38000 (padrão do middleware)');
  console.log('\n⚠️  IMPORTANTE:');
  console.log('   Este servidor está em MODO SIMULAÇÃO');
  console.log('   Os dados retornados são sempre os mesmos (para testes)');
  console.log('   Para usar leitor real, integre o SDK do middleware');
  console.log('\n📚 DOCUMENTAÇÃO:');
  console.log('   Setup: MIDDLEWARE_HTTP_SETUP.md');
  console.log('   Troubleshooting: CARD_READER_TROUBLESHOOTING.md');
  console.log('\n💡 DICA:');
  console.log('   Mantenha este terminal aberto enquanto usa a OficinasExpress');
  console.log('   Verá logs de cada pedido de leitura aqui');
  console.log('='.repeat(60) + '\n');
  console.log('Aguardando pedidos...\n');
});

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
