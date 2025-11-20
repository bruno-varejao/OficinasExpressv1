# Configuração HTTP do Middleware Autenticação.Gov

## Problema Identificado

O middleware Autenticação.Gov instalado pode não estar a expor uma API HTTP REST acessível diretamente pelo browser. Existem várias razões:

1. **SDK Nativo**: O middleware pode fornecer apenas um SDK para aplicações nativas
2. **WebSocket**: Pode usar WebSocket em vez de HTTP REST
3. **Sem API**: Pode não expor API alguma, apenas interface gráfica

## Soluções Disponíveis

### Solução 1: Usar o SDK JavaScript (se disponível)

O governo português pode fornecer um SDK JavaScript. Verifique em:
- https://www.autenticacao.gov.pt/documentacao-tecnica
- https://github.com/amagovpt (GitHub oficial)

### Solução 2: Criar Bridge Application (Recomendado)

Criar uma pequena aplicação local que usa o SDK nativo e expõe uma API REST.

#### Exemplo com Node.js:

1. **Criar projeto Node.js**:
```bash
mkdir cc-bridge
cd cc-bridge
npm init -y
npm install express cors node-fetch
```

2. **Criar server.js**:
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Endpoint de teste
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    service: 'Cartão de Cidadão Bridge',
    version: '1.0.0'
  });
});

// Endpoint para ler cartão
app.get('/read', async (req, res) => {
  try {
    // TODO: Integrar com SDK do middleware
    // Por enquanto, retorna dados simulados
    console.log('📖 Pedido de leitura de cartão recebido');
    
    // Simular delay de leitura
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // IMPORTANTE: Substituir por chamada real ao SDK
    const cardData = {
      success: true,
      name: 'NOME DO CARTÃO',
      nif: '123456789',
      address: 'Morada do Cartão',
      birthDate: '1990-01-01',
      documentNumber: 'PT12345678',
      validUntil: '2030-12-31'
    };
    
    console.log('✅ Dados do cartão:', cardData);
    res.json(cardData);
    
  } catch (error) {
    console.error('❌ Erro ao ler cartão:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

const PORT = 38000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 CC Bridge Server a executar em http://127.0.0.1:${PORT}`);
  console.log(`📖 Endpoint de leitura: http://127.0.0.1:${PORT}/read`);
  console.log('\n⚠️  NOTA: Atualmente em modo de simulação`);
  console.log('   Configure a integração com o SDK do middleware para leitura real\n');
});
```

3. **Executar**:
```bash
node server.js
```

4. **Testar**:
   - Abra browser em `http://localhost:38000`
   - Deve ver: `{"status":"online",...}`
   - Teste leitura: `http://localhost:38000/read`

#### Integração com SDK Real:

Dependendo do SDK fornecido pelo middleware, integre assim:

```javascript
// Exemplo hipotético - consulte documentação oficial
const pteid = require('pteid-sdk'); // Nome hipotético

app.get('/read', async (req, res) => {
  try {
    // Inicializar SDK
    await pteid.initialize();
    
    // Verificar se leitor está conectado
    const readers = await pteid.getReaders();
    if (readers.length === 0) {
      throw new Error('Nenhum leitor detectado');
    }
    
    // Ler cartão
    const card = await pteid.readCard(readers[0]);
    
    // Obter dados
    const personalData = await card.getPersonalData();
    const addressData = await card.getAddress();
    
    res.json({
      success: true,
      name: personalData.name,
      nif: personalData.taxNumber,
      address: addressData.fullAddress,
      birthDate: personalData.dateOfBirth,
      documentNumber: personalData.documentNumber,
      validUntil: personalData.expiryDate
    });
    
    // Limpar
    await pteid.cleanup();
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

### Solução 3: Usar Python Bridge

Se preferir Python:

```python
# bridge.py
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({
        'status': 'online',
        'service': 'Cartão de Cidadão Bridge',
        'version': '1.0.0'
    })

@app.route('/read')
def read_card():
    try:
        # TODO: Integrar com SDK
        # import pteid  # Nome hipotético
        # data = pteid.read_card()
        
        # Simulação
        card_data = {
            'success': True,
            'name': 'NOME DO CARTÃO',
            'nif': '123456789',
            'address': 'Morada do Cartão'
        }
        
        return jsonify(card_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=38000, debug=True)
```

Instalar dependências:
```bash
pip install flask flask-cors
python bridge.py
```

### Solução 4: Electron App

Para uma solução mais robusta com interface gráfica:

```javascript
// main.js (Electron)
const { app, BrowserWindow, ipcMain } = require('electron');
const express = require('express');
const cors = require('cors');

// Criar servidor HTTP
const server = express();
server.use(cors());

server.get('/read', async (req, res) => {
  // Usar APIs nativas do Electron para aceder ao hardware
  // ou chamar SDK nativo através de node-ffi
  
  const cardData = {
    success: true,
    name: 'Nome do Cartão',
    // ...
  };
  
  res.json(cardData);
});

server.listen(38000, '127.0.0.1');

// Criar janela Electron (opcional, pode ser headless)
app.whenReady().then(() => {
  // Configurar interface se necessário
});
```

## Alternativas ao HTTP Bridge

### Opção A: Browser Extension

Criar uma extensão de browser que:
1. Tem permissões para aceder a dispositivos USB
2. Comunica com o middleware nativo
3. Expõe API para a aplicação web

**Prós**: Integração transparente  
**Contras**: Precisa instalar extensão em cada browser

### Opção B: WebUSB API

Usar a WebUSB API do browser (experimental):

```javascript
// No browser, não no servidor
async function readCard() {
  try {
    // Pedir acesso ao dispositivo USB
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 0x072F }] // Exemplo: ACR38
    });
    
    await device.open();
    // ... comunicar com o leitor
    
  } catch (error) {
    console.error('Erro:', error);
  }
}
```

**Prós**: Sem middleware necessário  
**Contras**: Suporte limitado, complexo, requer HTTPS

### Opção C: Native Messaging (Chrome/Firefox)

Para extensão de browser:

```json
{
  "name": "pt.oficinasexpress.ccreader",
  "description": "Cartão de Cidadão Reader",
  "path": "/path/to/native/app",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
```

## Descobrir a API Real do Middleware

### Método 1: Documentação Oficial

Consulte:
- https://www.autenticacao.gov.pt/documentacao-tecnica
- Manual PDF incluído no middleware
- README em `C:\Program Files\Portugal Identity Card\`

### Método 2: Engenharia Reversa (Legal)

```bash
# Encontrar processos em execução
netstat -ano | findstr "LISTENING"

# Ver que portas o middleware usa
# Experimentar cada porta no browser
```

### Método 3: Wireshark

1. Instale Wireshark
2. Capture tráfego de localhost
3. Use a aplicação oficial Autenticação.Gov
4. Veja que pedidos HTTP/WebSocket são feitos

## Recursos Oficiais

### Links Úteis:
- **Site Oficial**: https://www.autenticacao.gov.pt
- **Documentação**: https://www.autenticacao.gov.pt/documentacao-tecnica
- **GitHub AMA**: https://github.com/amagovpt
- **Suporte**: info.cidadao@ama.pt

### Procurar por:
- SDK JavaScript
- API REST documentation
- Developer guide
- Integration examples
- Sample code

## Conclusão

**Recomendação**: Criar uma Bridge Application simples em Node.js ou Python que:

1. ✅ É fácil de configurar e manter
2. ✅ Funciona em qualquer browser
3. ✅ Não requer extensões
4. ✅ Pode ser facilmente atualizado quando o SDK mudar
5. ✅ Permite logs e debug

**Próximos passos**:

1. Verificar documentação oficial do middleware para SDK
2. Criar servidor bridge básico (Node.js ou Python)
3. Testar conexão da OficinasExpress ao bridge
4. Integrar SDK real quando disponível
5. Distribuir bridge junto com a aplicação

---

**NOTA IMPORTANTE**: Esta documentação assume que o middleware oficial não expõe API HTTP diretamente. Se o middleware expuser API, consulte a documentação oficial para os endpoints corretos.

