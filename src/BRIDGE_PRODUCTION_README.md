# 🔌 Bridge Server - Leitura REAL do Cartão de Cidadão

## 📌 O Que É Este Servidor?

Este é o **Bridge Server PRODUÇÃO** que permite à OficinasExpress ler dados **REAIS** do Cartão de Cidadão Português usando o middleware oficial do Autenticação.Gov.

---

## ⚡ Quick Start

### Requisitos
- Node.js instalado
- Middleware Autenticação.Gov instalado e rodando
- Leitor USB conectado
- Cartão de Cidadão inserido

### Instalação (1ª vez)
```bash
npm install express cors node-fetch@2
```

### Executar
```bash
node bridge-server-production.js
```

Ou usar script:
- Windows: `START_BRIDGE_PRODUCTION.bat`
- Mac/Linux: `./START_BRIDGE_PRODUCTION.sh`

### Verificar
Abrir: http://127.0.0.1:38000

Deve retornar:
```json
{
  "status": "online",
  "mode": "real",
  "message": "✅ Middleware real detectado e disponível"
}
```

---

## 🎯 Como Funciona

### Detecção Automática

Ao iniciar, o servidor:
1. Procura o middleware em 4 portas (35963, 39901, 39902, 39903)
2. Se encontrar → **Modo REAL**
3. Se não encontrar → **Modo SIMULAÇÃO**

### Modos de Operação

#### 🟢 Modo REAL
- Middleware detectado
- Usa dados do cartão físico
- Leitura autêntica

#### 🟡 Modo SIMULAÇÃO
- Middleware não disponível
- Retorna dados de teste
- Sistema continua funcional

#### 🔵 Modo FALLBACK
- Tentou ler real mas falhou
- Automaticamente usa simulação
- Indica razão do fallback

---

## 📡 Endpoints Disponíveis

### `GET /`
Status do servidor

**Response**:
```json
{
  "status": "online",
  "mode": "real" | "simulation",
  "middlewareUrl": "http://127.0.0.1:35963"
}
```

### `GET /health`
Health check

**Response**:
```json
{
  "status": "healthy",
  "middlewareMode": "real",
  "middlewareProcess": "running"
}
```

### `GET /detect`
Re-detectar middleware

**Response**:
```json
{
  "detected": true,
  "mode": "real",
  "url": "http://127.0.0.1:35963"
}
```

### `GET /read` ⭐
Ler cartão de cidadão (PRINCIPAL)

**Response (modo real)**:
```json
{
  "success": true,
  "mode": "production",
  "source": "middleware-real",
  "name": "NOME COMPLETO",
  "nif": "123456789",
  "address": "Rua Example, nº 123",
  "postalCode": "1000-001",
  "locality": "Lisboa",
  "birthDate": "1990-01-15",
  "documentNumber": "12345678",
  "validUntil": "2030-12-31"
}
```

**Response (modo simulação)**:
```json
{
  "success": true,
  "mode": "simulation",
  "source": "simulated-data",
  "name": "JOÃO PEDRO SILVA SANTOS",
  ...
}
```

### `GET /test-simulation`
Forçar simulação (desenvolvimento)

---

## 🔍 Logs e Diagnóstico

### Logs no Console

O servidor mostra logs detalhados:

```
📖 Pedido de leitura de cartão recebido
   Modo atual: real
🎯 Tentando leitura REAL do cartão...
📡 Conectando ao middleware real...
   URL: http://127.0.0.1:35963
✅ Dados lidos com sucesso do cartão
📊 Dados preparados:
   Nome: NOME REAL
   NIF: 123456789
   Localidade: Lisboa
   Modo: production
   Fonte: middleware-real
📤 Enviando resposta...
```

### Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | Sucesso - dados retornados |
| 404 | Endpoint não encontrado |
| 500 | Erro no servidor/middleware |

---

## 🧪 Testes

### Teste Manual

```bash
# Status
curl http://127.0.0.1:38000

# Leitura
curl http://127.0.0.1:38000/read

# Detecção
curl http://127.0.0.1:38000/detect
```

### Teste Automático

```bash
node test-production-bridge.js
```

Executa 5 testes:
1. ✅ Status do servidor
2. ✅ Health check
3. ✅ Detecção do middleware
4. ✅ Leitura de cartão
5. ✅ Simulação forçada

---

## 🐛 Troubleshooting

### Problema: Modo SIMULATION quando deveria ser REAL

**Causa**: Middleware não detectado

**Soluções**:
1. Abrir aplicação Autenticação.Gov
2. Aguardar 10 segundos
3. Executar: `curl http://127.0.0.1:35963`
4. Se responder → reiniciar bridge
5. Se não responder → middleware não está rodando

### Problema: Erro ao ler cartão

**Causa**: Cartão não inserido ou leitor desconectado

**Soluções**:
1. Verificar LED do leitor (deve estar aceso)
2. Remover e reinserir cartão
3. Testar na aplicação Autenticação.Gov
4. Se funciona lá → reiniciar bridge

### Problema: Timeout

**Causa**: Leitura demorou mais de 10 segundos

**Soluções**:
1. Aguardar computador ficar mais responsivo
2. Limpar chip do cartão
3. Aumentar timeout no código (linha ~225)

### Problema: CORS bloqueado

**Causa**: Browser bloqueia requisições localhost

**Solução**: CORS já está configurado no servidor
- Se persistir, usar 127.0.0.1 em vez de localhost

---

## 📚 Documentação

### Guias Principais

- **[INICIO_RAPIDO_PRODUCAO.md](./INICIO_RAPIDO_PRODUCAO.md)**
  - Setup completo passo-a-passo
  - Primeira vez: siga este guia

- **[INTEGRACAO_SDK_REAL.md](./INTEGRACAO_SDK_REAL.md)**
  - Guia técnico completo (50+ páginas)
  - Arquitetura detalhada
  - Troubleshooting extenso

- **[INTEGRACAO_SDK_RESUMO.md](./INTEGRACAO_SDK_RESUMO.md)**
  - Resumo executivo
  - Quick reference
  - Checklists

### Outros Documentos

- CARD_READER_TROUBLESHOOTING.md - Problemas comuns
- COMO_USAR_LEITOR_CARTAO.md - Guia de uso
- INDICE_DOCUMENTACAO_CARTAO.md - Índice completo

---

## 🔧 Configuração Avançada

### Mudar Porta

Por padrão usa porta 38000. Para mudar:

```javascript
const PORT = 38000; // Alterar para outra porta
```

**Nota**: OficinasExpress procura na 38000 por padrão.

### Adicionar Portas do Middleware

Se o middleware usar porta diferente:

```javascript
const MIDDLEWARE_PORTS = [35963, 39901, 39902, 39903, 12345]; // Adicionar
```

### Ajustar Timeout

Padrão é 10 segundos:

```javascript
timeout: 10000, // Alterar para 20000 (20s)
```

### Ativar Logs Persistentes

```javascript
const fs = require('fs');
const logStream = fs.createWriteStream('bridge.log', { flags: 'a' });

function log(message) {
  console.log(message);
  logStream.write(`${new Date().toISOString()} - ${message}\n`);
}
```

---

## 🏭 Uso em Produção

### Inicialização Automática

**Windows - Criar Serviço**:
Use NSSM (Non-Sucking Service Manager):
```bash
nssm install BridgeCC node bridge-server-production.js
```

**Linux - Systemd**:
Criar `/etc/systemd/system/bridge-cc.service`:
```ini
[Unit]
Description=Bridge Server - Cartao de Cidadao
After=network.target

[Service]
Type=simple
User=oficina
WorkingDirectory=/home/oficina/cc-bridge-prod
ExecStart=/usr/bin/node bridge-server-production.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Ativar:
```bash
sudo systemctl enable bridge-cc
sudo systemctl start bridge-cc
```

**macOS - LaunchAgent**:
Criar `~/Library/LaunchAgents/com.oficinasexpress.bridge.plist`

### Monitoramento

**PM2** (Process Manager):
```bash
npm install -g pm2
pm2 start bridge-server-production.js --name bridge-cc
pm2 startup
pm2 save
```

**Ver logs**:
```bash
pm2 logs bridge-cc
```

**Reiniciar**:
```bash
pm2 restart bridge-cc
```

### Backup

Manter backup de:
- `bridge-server-production.js`
- `package.json`
- Documentação

---

## 📊 Métricas (Futuro)

O servidor pode ser expandido para coletar métricas:

```javascript
const metrics = {
  totalReads: 0,
  successfulReads: 0,
  failedReads: 0,
  averageReadTime: 0,
  uptime: process.uptime()
};

app.get('/metrics', (req, res) => {
  res.json(metrics);
});
```

---

## 🔐 Segurança

### Dados Sensíveis

O servidor:
- ✅ Não armazena dados do cartão
- ✅ Não faz log de dados pessoais (apenas nome/NIF no console)
- ✅ Não envia dados para internet
- ✅ Apenas comunicação local (127.0.0.1)

### CORS

Configurado para aceitar de qualquer origem (`*`).

Para produção, restringir:
```javascript
app.use(cors({
  origin: 'http://localhost:3000', // Apenas OficinasExpress
  methods: ['GET'],
  credentials: false
}));
```

### HTTPS

Para adicionar HTTPS:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(443);
```

---

## 🆘 Suporte

### Problemas?

1. **Verificar logs** no console do servidor
2. **Executar testes**: `node test-production-bridge.js`
3. **Consultar documentação**: INTEGRACAO_SDK_REAL.md
4. **Contactar suporte**: inscricoes@oficinasexpress.com

### Reportar Bug

Incluir:
- Logs do console
- Mensagem de erro
- Passos para reproduzir
- Sistema operacional
- Versão do Node.js

---

## 📝 Changelog

### v2.0.0 (2024-11-09)
- ✅ Integração completa com middleware real
- ✅ Detecção automática
- ✅ Fallback inteligente
- ✅ Logs detalhados
- ✅ 6 endpoints HTTP

### v1.0.0 (2024-11-08)
- Versão simulação apenas

---

## 📄 Licença

© 2024 OficinasExpress. Todos os direitos reservados.

---

## ✅ Checklist Rápido

Antes de usar em produção:

- [ ] Node.js instalado
- [ ] Middleware Autenticação.Gov instalado
- [ ] Hardware conectado e funcionando
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor inicia sem erros
- [ ] Modo REAL ativado
- [ ] Teste manual funciona (`curl`)
- [ ] Teste automático passa (`test-production-bridge.js`)
- [ ] OficinasExpress conecta com sucesso
- [ ] Leitura de cartão funciona
- [ ] Equipe treinada
- [ ] Documentação disponível

---

**🚀 Bridge Server Produção - Pronto para uso real!**

Para começar: [INICIO_RAPIDO_PRODUCAO.md](./INICIO_RAPIDO_PRODUCAO.md)
