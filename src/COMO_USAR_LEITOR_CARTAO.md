# 🎯 Como Usar o Leitor de Cartão de Cidadão

## ⚡ Início Rápido (3 minutos)

### Opção 1: Modo de Demonstração (SEM instalação)

1. Abra a OficinasExpress
2. Vá ao módulo **Clientes**
3. Clique em **"Leitor de Cartão"**
4. Clique em **"Ler Cartão"**
5. Aguarde 2 segundos
6. Verá dados simulados de teste
7. Preencha o telefone e clique **"Criar Cliente"**

✅ **Pronto!** Cliente criado com dados simulados.

---

### Opção 2: Com Bridge Server (Teste realista)

#### 1️⃣ Instalar Node.js

Se ainda não tem:
- Download: https://nodejs.org
- Instale a versão LTS
- Reinicie o terminal

#### 2️⃣ Criar pasta do bridge

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

#### 3️⃣ Copiar arquivo do servidor

Copie o arquivo `bridge-server-example.js` para a pasta `cc-bridge`.

Ou copie o script de inicialização:
- Windows: `START_BRIDGE.bat`
- Mac/Linux: `START_BRIDGE.sh`

#### 4️⃣ Instalar dependências

```bash
npm install express cors
```

#### 5️⃣ Iniciar o servidor

**Com script (RECOMENDADO):**

Windows: Duplo-clique em `START_BRIDGE.bat`

Mac/Linux:
```bash
chmod +x START_BRIDGE.sh
./START_BRIDGE.sh
```

**Manual:**
```bash
node bridge-server-example.js
```

Deve ver:
```
🚀 BRIDGE SERVER ATIVO
✅ URL: http://127.0.0.1:38000
```

#### 6️⃣ Testar

Abra o browser e visite:
```
http://127.0.0.1:38000
```

Deve ver um JSON com `"status": "online"`

#### 7️⃣ Usar na OficinasExpress

1. Com o servidor bridge **em execução**
2. Abra OficinasExpress → Clientes → **"Leitor de Cartão"**
3. Clique **"🔧 Testar Conexão"**
4. Deve ver: **✅ ENCONTRADO: Porta padrão 38000**
5. Clique **"Ler Cartão"**
6. Dados simulados aparecerão
7. Preencha telefone e crie cliente

---

## 🧪 Testar sem Browser

Para testar o bridge server diretamente:

```bash
node test-bridge-direct.js
```

Verá:
```
✅ Servidor Online: PASSOU
✅ Leitura de Cartão: PASSOU
🎉 TODOS OS TESTES PASSARAM!
```

---

## 🔧 Resolução Rápida de Problemas

### ❌ "Middleware não encontrado"

**Causa**: Bridge server não está em execução.

**Solução**:
1. Abrir terminal na pasta `cc-bridge`
2. Executar: `node bridge-server-example.js`
3. Deixar o terminal aberto
4. Tentar novamente na OficinasExpress

### ❌ "Porta 38000 já em uso"

**Solução 1**: Parar o que está usando a porta.

**Solução 2**: Usar porta alternativa (8080):
1. Editar `bridge-server-example.js`
2. Mudar: `const PORT = 38000` para `const PORT = 8080`
3. Reiniciar servidor
4. OficinasExpress detectará automaticamente

### ❌ "npm: command not found"

**Causa**: Node.js não instalado.

**Solução**:
1. Instalar Node.js: https://nodejs.org
2. Reiniciar terminal
3. Testar: `node --version`

### ❌ Bridge server fecha imediatamente

**Causa**: Erro no código.

**Solução**:
1. Baixar novamente `bridge-server-example.js`
2. Verificar se tem erros de sintaxe
3. Tentar executar: `node bridge-server-example.js`
4. Ver mensagem de erro no terminal

---

## 📊 Como Funciona

### Modo Demonstração (sem bridge)
```
OficinasExpress → Backend Supabase → Dados Simulados
```
- ✅ Funciona sempre
- ✅ Sem instalação
- ⚠️ Dados sempre iguais

### Com Bridge Server
```
OficinasExpress → Bridge Server → Dados Simulados (realista)
```
- ✅ Simula middleware real
- ✅ Testa conexão
- ✅ Dados realistas
- ✅ Logs detalhados
- ⚠️ Requer instalação simples

### Produção (futuro - com leitor físico)
```
OficinasExpress → Bridge Server → Middleware → Leitor → Cartão
```
- ✅ Leitura real do cartão
- ✅ Dados reais do cidadão
- ⚠️ Requer leitor USB
- ⚠️ Requer middleware oficial

---

## 📚 Documentação Completa

Guias detalhados (por ordem de leitura):

1. **LEIA-ME_PRIMEIRO.md** ← COMECE AQUI
   - Visão geral do sistema
   - Arquitetura
   - Conceitos principais

2. **BRIDGE_SERVER_SETUP_COMPLETO.md**
   - Guia passo-a-passo completo
   - Instalação detalhada
   - Troubleshooting avançado

3. **QUICK_FIX_VISUAL.md**
   - Fluxograma visual
   - Soluções rápidas
   - Decisões rápidas

4. **CARD_READER_TROUBLESHOOTING.md**
   - Problemas comuns
   - Soluções detalhadas
   - FAQ

5. **MIDDLEWARE_HTTP_SETUP.md**
   - Configuração HTTP
   - Integração avançada
   - SDK real (futuro)

---

## ✅ Checklist de Sucesso

Para o **Modo de Demonstração** (SEM bridge):
- [ ] Abrir OficinasExpress
- [ ] Ir para Clientes
- [ ] Clicar "Leitor de Cartão"
- [ ] Clicar "Ler Cartão"
- [ ] Ver dados simulados
- [ ] Preencher telefone
- [ ] Criar cliente ✓

Para o **Bridge Server**:
- [ ] Node.js instalado
- [ ] Pasta `cc-bridge` criada
- [ ] Arquivo `bridge-server-example.js` copiado
- [ ] `npm install express cors` executado
- [ ] Servidor iniciado (`node bridge-server-example.js`)
- [ ] Browser: http://127.0.0.1:38000 funciona ✓
- [ ] OficinasExpress: "Testar Conexão" encontra servidor ✓
- [ ] "Ler Cartão" funciona ✓
- [ ] Cliente criado ✓

---

## 🎓 Conceitos Importantes

### O que é o Bridge Server?

É um **servidor Node.js local** que:
- Roda no seu computador
- Simula o middleware Autenticação.Gov
- Resolve problemas de CORS
- Permite testar o sistema sem leitor físico

### Por que dois modos?

1. **Demonstração** (backend):
   - Para quem quer testar AGORA
   - Sem instalação
   - Funciona sempre

2. **Bridge Server** (local):
   - Para testes realistas
   - Simula ambiente de produção
   - Preparado para SDK real
   - Melhor para desenvolvimento

### Quando usar cada modo?

**Use Demonstração se**:
- Quer testar rapidamente
- Não tem tempo para instalar Node.js
- Só quer ver como funciona

**Use Bridge Server se**:
- Quer testar de forma realista
- Vai desenvolver/expandir o sistema
- Planeia usar leitor real no futuro
- Quer ver logs detalhados

---

## 🆘 Precisa de Ajuda?

1. **Logs do Browser**:
   - Pressione F12
   - Vá para "Console"
   - Veja mensagens detalhadas

2. **Logs do Bridge**:
   - Veja o terminal onde o servidor está rodando
   - Verá cada requisição

3. **Teste Manual**:
   - Abra http://127.0.0.1:38000 no browser
   - Deve ver resposta JSON

4. **Script de Teste**:
   - Execute: `node test-bridge-direct.js`
   - Veja resultados dos testes

5. **Documentação**:
   - BRIDGE_SERVER_SETUP_COMPLETO.md
   - CARD_READER_TROUBLESHOOTING.md

---

**🚀 Pronto! Agora pode usar o sistema de leitura de Cartão de Cidadão!**

**💡 Dica**: Comece pelo **Modo de Demonstração** para ver como funciona, depois instale o **Bridge Server** para testes mais avançados.
