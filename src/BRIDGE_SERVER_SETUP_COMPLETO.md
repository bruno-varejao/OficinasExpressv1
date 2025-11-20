# 🌉 Guia Completo: Servidor Bridge para Cartão de Cidadão

## 📋 Índice
1. [O que é o Servidor Bridge?](#o-que-é)
2. [Instalação Rápida (5 minutos)](#instalação-rápida)
3. [Teste de Funcionamento](#teste)
4. [Integração com OficinasExpress](#integração)
5. [Resolução de Problemas](#problemas)

---

## 🎯 O que é o Servidor Bridge? {#o-que-é}

O **Servidor Bridge** é um servidor Node.js local que:

- ✅ **Simula o middleware Autenticação.Gov** (para testes)
- ✅ **Resolve problemas de CORS** entre browser e localhost
- ✅ **Permite testar o sistema** sem leitor físico
- ✅ **Usa a porta 38000** (mesma porta do middleware real)
- ✅ **Pode ser expandido** para integrar o SDK real do middleware

### Por que preciso disto?

Os browsers modernos **bloqueiam** requisições de uma aplicação web para `localhost` por questões de segurança (política CORS). O servidor bridge:

1. Roda localmente no seu computador
2. Aceita pedidos do browser (CORS ativado)
3. Retorna dados simulados do Cartão de Cidadão
4. Simula perfeitamente o comportamento do middleware real

---

## ⚡ Instalação Rápida (5 minutos) {#instalação-rápida}

### Passo 1: Verificar Node.js

Abra o **Terminal** (Windows: PowerShell, Mac/Linux: Terminal) e execute:

```bash
node --version
```

**Deve ver algo como**: `v18.0.0` ou superior

**Se não tiver Node.js instalado**:
- 🔗 Download: https://nodejs.org
- Instale a versão **LTS** (recomendada)
- Reinicie o terminal após instalação

### Passo 2: Criar Pasta do Bridge

Crie uma pasta para o servidor bridge:

**Windows (PowerShell):**
```powershell
mkdir C:\cc-bridge
cd C:\cc-bridge
```

**Mac/Linux:**
```bash
mkdir ~/cc-bridge
cd ~/cc-bridge
```

### Passo 3: Criar Arquivo do Servidor

Copie o conteúdo do arquivo `bridge-server-example.js` para dentro da pasta `cc-bridge`.

Ou crie um novo arquivo chamado `server.js` com este conteúdo mínimo:

```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 38000;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Cartão de Cidadão Bridge Server',
    message: 'Servidor em execução!'
  });
});

app.get('/read', async (req, res) => {
  console.log('📖 Lendo cartão (simulação)...');
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  res.json({
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
    phone: '',
    email: '',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('='.repeat(60));
  console.log('🚀 BRIDGE SERVER ATIVO');
  console.log('='.repeat(60));
  console.log(`✅ URL: http://127.0.0.1:${PORT}`);
  console.log(`📖 Leitura: http://127.0.0.1:${PORT}/read`);
  console.log('\n⚠️  MODO SIMULAÇÃO - Dados de teste\n');
  console.log('Aguardando pedidos...\n');
});
```

### Passo 4: Instalar Dependências

No terminal, dentro da pasta `cc-bridge`, execute:

```bash
npm install express cors
```

**Deve ver**:
```
added 57 packages in 3s
```

### Passo 5: Iniciar o Servidor

Execute:

```bash
node server.js
```

**Deve ver**:
```
============================================================
🚀 BRIDGE SERVER ATIVO
============================================================
✅ URL: http://127.0.0.1:38000
📖 Leitura: http://127.0.0.1:38000/read

⚠️  MODO SIMULAÇÃO - Dados de teste

Aguardando pedidos...
```

🎉 **Servidor bridge está funcionando!**

---

## 🧪 Teste de Funcionamento {#teste}

### Teste 1: Browser

Com o servidor a correr, abra o browser e visite:

```
http://127.0.0.1:38000
```

**Deve ver um JSON**:
```json
{
  "status": "online",
  "service": "Cartão de Cidadão Bridge Server",
  "message": "Servidor em execução!"
}
```

### Teste 2: Endpoint de Leitura

Visite:

```
http://127.0.0.1:38000/read
```

**Deve ver os dados simulados** do cartão:
```json
{
  "success": true,
  "mode": "simulation",
  "name": "JOÃO PEDRO SILVA SANTOS",
  "nif": "123456789",
  ...
}
```

### Teste 3: Console do Servidor

No terminal onde o servidor está a correr, deve ver:

```
📖 Lendo cartão (simulação)...
```

---

## 🔗 Integração com OficinasExpress {#integração}

### Passo 1: Iniciar o Bridge Server

Certifique-se que o servidor bridge está **em execução** (Passo 5 acima).

### Passo 2: Abrir OficinasExpress

1. Abra a aplicação OficinasExpress no browser
2. Faça login
3. Vá para o módulo **Clientes**

### Passo 3: Testar Leitura de Cartão

1. Clique no botão **"Leitor de Cartão"**
2. Clique em **"🔧 Testar Conexão ao Middleware"**

**Deve ver no console do browser** (F12):
```
✅ ENCONTRADO: Porta padrão 38000
   URL: http://localhost:38000
   Status: 200
   Resposta: {"status":"online"...}
```

### Passo 4: Ler Dados do Cartão

1. Clique em **"Ler Cartão"**
2. Aguarde 2 segundos
3. **Verá os dados simulados** aparecerem no diálogo:
   - Nome: JOÃO PEDRO SILVA SANTOS
   - NIF: 123456789
   - Morada: Rua Example, nº 123, 4º Dto
   - Localidade: Lisboa

4. **Preencha o telefone** (obrigatório)
5. Clique em **"Criar Cliente"**

✅ **Cliente criado com sucesso usando o bridge server!**

### Verificar Logs do Servidor

No terminal do bridge server, verá:

```
2024-01-15T10:30:45.123Z - GET /
2024-01-15T10:30:47.456Z - GET /read
📖 Lendo cartão (simulação)...
```

---

## 🔧 Resolução de Problemas {#problemas}

### ❌ Erro: "EADDRINUSE" ou "Porta 38000 já em uso"

**Causa**: Outra aplicação está usando a porta 38000.

**Solução 1**: Parar a aplicação que está usando a porta.

**Solução 2**: Usar outra porta:
1. No arquivo `server.js`, altere:
   ```javascript
   const PORT = 38000; // Alterar para 8080, 9876, etc.
   ```

2. Reinicie o servidor

⚠️ **IMPORTANTE**: Se mudar a porta, a OficinasExpress **tentará automaticamente** as portas alternativas (8080, 9876, etc.).

### ❌ Erro: "npm: command not found"

**Causa**: Node.js não está instalado ou não está no PATH.

**Solução**:
1. Instale o Node.js: https://nodejs.org
2. Reinicie o terminal
3. Teste: `node --version`

### ❌ Erro: "Cannot find module 'express'"

**Causa**: Dependências não instaladas.

**Solução**:
```bash
cd C:\cc-bridge  # ou ~/cc-bridge no Mac/Linux
npm install express cors
```

### ❌ OficinasExpress ainda não deteta o servidor

**Verificações**:

1. **Servidor está a correr?**
   - Deve ver "🚀 BRIDGE SERVER ATIVO" no terminal

2. **URL correta?**
   - Abra http://127.0.0.1:38000 no browser
   - Deve ver JSON com "status": "online"

3. **Firewall bloqueando?**
   - Windows: Permitir Node.js na Firewall
   - Mac: System Preferences → Security → Firewall

4. **CORS problema?**
   - Verifique o console do browser (F12)
   - Não deve ver erros de CORS

### ❌ Servidor fecha imediatamente

**Causa**: Erro no código JavaScript.

**Solução**:
1. Copie novamente o código do `bridge-server-example.js`
2. Ou use o código mínimo fornecido acima
3. Verifique erros de sintaxe

---

## 🎓 Próximos Passos

### Modo Produção (Leitor Real)

Para usar um **leitor de cartões físico**:

1. **Instalar middleware oficial**:
   - 🔗 https://www.autenticacao.gov.pt
   - Baixar e instalar "Autenticação.Gov"

2. **Integrar SDK no bridge**:
   - Consultar documentação oficial
   - Substituir dados simulados por chamadas ao SDK
   - Ver exemplo comentado no `bridge-server-example.js` (linha 136)

3. **Conectar leitor USB**:
   - Inserir Cartão de Cidadão
   - Executar aplicação Autenticação.Gov
   - O bridge server detectará automaticamente

### Automatizar Inicialização

**Windows (criar atalho):**
1. Criar arquivo `start-bridge.bat`:
   ```batch
   @echo off
   cd C:\cc-bridge
   node server.js
   pause
   ```

2. Duplo-clique para iniciar

**Mac/Linux (alias):**
Adicionar ao `~/.bashrc` ou `~/.zshrc`:
```bash
alias cc-bridge="cd ~/cc-bridge && node server.js"
```

Depois, apenas digite `cc-bridge` no terminal.

---

## 📊 Resumo Visual

```
┌─────────────────┐
│  OficinasExpress │ (Browser)
└────────┬────────┘
         │ HTTP Request
         │ GET /read
         ▼
┌─────────────────┐
│  Bridge Server  │ (localhost:38000)
│   (Node.js)     │
└────────┬────────┘
         │ [SIMULAÇÃO]
         │ Retorna dados de teste
         │
         │ [PRODUÇÃO - Futuro]
         ▼
┌─────────────────┐
│   Middleware    │ (Autenticação.Gov)
│   + SDK Real    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Leitor Físico   │
│  + Cartão CC    │
└─────────────────┘
```

---

## ✅ Checklist Final

- [ ] Node.js instalado (`node --version`)
- [ ] Pasta `cc-bridge` criada
- [ ] Arquivo `server.js` criado
- [ ] Dependências instaladas (`npm install express cors`)
- [ ] Servidor iniciado (`node server.js`)
- [ ] Teste no browser: http://127.0.0.1:38000 ✓
- [ ] Teste endpoint: http://127.0.0.1:38000/read ✓
- [ ] OficinasExpress deteta o servidor ✓
- [ ] Leitura de cartão funciona ✓
- [ ] Cliente criado com sucesso ✓

---

## 📚 Documentação Relacionada

- `LEIA-ME_PRIMEIRO.md` - Visão geral do sistema
- `QUICK_FIX_VISUAL.md` - Fluxograma de troubleshooting
- `CARD_READER_TROUBLESHOOTING.md` - Problemas comuns
- `MIDDLEWARE_HTTP_SETUP.md` - Configuração avançada
- `bridge-server-example.js` - Código fonte completo

---

## 🆘 Suporte

Se tiver problemas:

1. **Verificar logs**:
   - Console do bridge server (terminal)
   - Console do browser (F12)

2. **Testar manualmente**:
   - Abrir http://127.0.0.1:38000 no browser
   - Deve ver resposta JSON

3. **Consultar documentação**:
   - CARD_READER_TROUBLESHOOTING.md
   - QUICK_FIX_VISUAL.md

4. **Reiniciar tudo**:
   - Fechar servidor bridge (Ctrl+C)
   - Fechar browser
   - Iniciar servidor bridge
   - Abrir OficinasExpress novamente

---

**🎉 Parabéns! O sistema de leitura de Cartão de Cidadão está pronto a usar!**
