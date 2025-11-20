# 🌉 Bridge Server - Cartão de Cidadão

## O que é isto?

Um servidor local simples que faz a ponte entre:
- **Middleware Autenticação.Gov** (que lê o cartão físico)
- **OficinasExpress** (aplicação web no browser)

## 🚀 Setup Rápido (5 minutos)

### Pré-requisitos

1. **Node.js** instalado
   - Download: https://nodejs.org
   - Versão mínima: 14.x
   - Verificar: `node --version`

2. **Middleware Autenticação.Gov** instalado
   - Download: https://www.autenticacao.gov.pt
   - Deve estar em execução

### Instalação

```bash
# 1. Criar pasta para o bridge
mkdir cc-bridge
cd cc-bridge

# 2. Copiar ficheiros
# - Copie bridge-server-example.js para esta pasta
# - Copie bridge-package.json para esta pasta (renomear para package.json)

# 3. Instalar dependências
npm install

# 4. Iniciar servidor
npm start
```

Deverá ver:
```
🚀 BRIDGE SERVER PARA CARTÃO DE CIDADÃO
✅ Servidor em execução em: http://127.0.0.1:38000
```

### Testar

```bash
# Noutra janela de terminal
node test-bridge-connection.js
```

Se tudo estiver bem, verá:
```
✅ TODOS OS TESTES PASSARAM!
```

## 📖 Como Usar

### 1. Iniciar Bridge

```bash
npm start
```

Mantenha este terminal aberto!

### 2. Usar na OficinasExpress

1. Abra a OficinasExpress no browser
2. Vá para módulo **Clientes**
3. Clique em **"Leitor de Cartão"**
4. Clique em **"Ler Cartão"**

A aplicação conectará automaticamente ao bridge.

### 3. Ver Logs

No terminal do bridge verá:
```
GET /read
📖 Pedido de leitura de cartão recebido
✅ Dados do cartão preparados: JOÃO PEDRO SILVA SANTOS
```

## ⚙️ Configuração

### Mudar a Porta

Edite `bridge-server-example.js`:

```javascript
const PORT = 38000; // Altere para outra porta se necessário
```

### Modo de Operação

O bridge tem 2 modos:

#### Modo Simulação (Padrão)
- Retorna sempre os mesmos dados de teste
- Não precisa de leitor físico
- Útil para desenvolvimento e testes

#### Modo Produção (Requer SDK)
- Lê cartão físico através do middleware
- Requer integração com SDK do Autenticação.Gov
- Ver secção "Integração com SDK Real"

## 🔧 Integração com SDK Real

### Descobrir o SDK

1. **Verificar documentação oficial**:
   - https://www.autenticacao.gov.pt/documentacao-tecnica
   - Procure por "SDK", "API", "Developer Guide"

2. **Verificar instalação do middleware**:
   ```bash
   # Windows
   dir "C:\Program Files\Portugal Identity Card\"
   
   # Mac
   ls /Applications/Autenticacao.Gov.app/Contents/
   
   # Linux
   ls /usr/lib/pteid/
   ```

3. **Procurar biblioteca Node.js**:
   - Pode haver um módulo npm
   - Ou uma DLL/SO para usar com node-ffi

### Exemplo de Integração

Se encontrar um SDK, integre assim:

```javascript
// No início do ficheiro
const pteid = require('pteid-sdk'); // Nome do SDK

// Modificar endpoint /read
app.get('/read', async (req, res) => {
  try {
    // Inicializar
    await pteid.initialize();
    
    // Obter leitores
    const readers = await pteid.getReaders();
    if (readers.length === 0) {
      throw new Error('Nenhum leitor detectado');
    }
    
    // Ler cartão
    const card = await pteid.readCard(readers[0]);
    const data = await card.getPersonalData();
    const address = await card.getAddress();
    
    // Retornar dados
    res.json({
      success: true,
      mode: 'production',
      name: data.name,
      nif: data.taxNumber,
      address: address.fullAddress,
      // ... outros campos
    });
    
    // Limpar
    await pteid.cleanup();
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'express'"

```bash
npm install
```

### Erro: "Port 38000 is already in use"

Opção A - Usar porta diferente:
```javascript
const PORT = 38001; // Altere no código
```

Opção B - Matar processo na porta:
```bash
# Windows
netstat -ano | findstr :38000
taskkill /PID [número] /F

# Mac/Linux
lsof -ti:38000 | xargs kill
```

### Erro: "ECONNREFUSED" na OficinasExpress

Causas possíveis:
1. Bridge não está em execução → Execute `npm start`
2. Firewall a bloquear → Adicione exceção
3. Porta diferente → Verifique a porta configurada

### Bridge inicia mas OficinasExpress não conecta

1. **Teste manualmente**:
   ```bash
   curl http://localhost:38000
   ```
   
   Deve retornar JSON com status "online"

2. **Verifique CORS**:
   - Abra DevTools no browser (F12)
   - Vá para tab Network
   - Tente ler cartão
   - Veja se há erros CORS

3. **Verifique a porta**:
   - OficinasExpress testa várias portas
   - Veja no console quais foram testadas

## 📊 Monitoring

### Ver todos os pedidos

O bridge loga automaticamente:
```
2024-11-09T10:30:00.000Z - GET /read
📖 Pedido de leitura de cartão recebido
✅ Dados do cartão preparados
```

### Verificar saúde

```bash
curl http://localhost:38000/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-09T10:30:00.000Z"
}
```

## 🔐 Segurança

### Notas Importantes

1. **Localhost apenas**: O bridge apenas aceita conexões de localhost (127.0.0.1)
2. **Sem autenticação**: Qualquer aplicação local pode aceder
3. **CORS aberto**: Aceita pedidos de qualquer origem (necessário para web app)

### Em Produção

Se distribuir este bridge:

1. **Adicionar autenticação**:
```javascript
const API_KEY = 'seu-token-seguro';

app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

2. **CORS restrito**:
```javascript
app.use(cors({
  origin: 'https://sua-aplicacao.com',
  // ...
}));
```

3. **HTTPS** (se necessário):
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(38000);
```

## 📦 Distribuição

### Criar Executável (opcional)

Para distribuir sem exigir Node.js instalado:

```bash
# Instalar pkg
npm install -g pkg

# Criar executável
pkg bridge-server-example.js --targets node14-win-x64 --output cc-bridge.exe
```

Isto cria um .exe que pode ser distribuído.

### Criar Serviço Windows

Para executar automaticamente:

1. **Instalar node-windows**:
```bash
npm install -g node-windows
```

2. **Criar install-service.js**:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'CC Bridge Server',
  description: 'Bridge para Cartão de Cidadão',
  script: 'C:\\cc-bridge\\bridge-server-example.js'
});

svc.on('install', () => {
  svc.start();
});

svc.install();
```

3. **Instalar**:
```bash
node install-service.js
```

## 🆘 Suporte

### Logs

Todos os eventos são logados no console onde o bridge está em execução.

Para guardar logs num ficheiro:
```bash
npm start > bridge.log 2>&1
```

### Issues Comuns

| Problema | Solução |
|----------|---------|
| Bridge não inicia | Verificar se porta está livre |
| Não lê cartão | Verificar se middleware está em execução |
| CORS error | Já está configurado, mas verifique CORS no código |
| Timeout | Aumentar timeout no código (se SDK for lento) |

### Contactos

- **Middleware**: info.cidadao@ama.pt
- **OficinasExpress**: Consulte documentação do sistema

## 📚 Recursos

- **Documentação oficial**: https://www.autenticacao.gov.pt
- **Express.js**: https://expressjs.com
- **Node.js**: https://nodejs.org
- **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

## ✅ Checklist de Setup

- [ ] Node.js instalado e funcionando
- [ ] Middleware Autenticação.Gov instalado
- [ ] Middleware está em execução
- [ ] Bridge server criado numa pasta
- [ ] Dependências instaladas (`npm install`)
- [ ] Bridge em execução (`npm start`)
- [ ] Teste de conexão passou (`node test-bridge-connection.js`)
- [ ] OficinasExpress consegue ler cartão

---

**Versão**: 1.0.0  
**Data**: Novembro 2024  
**Licença**: MIT
