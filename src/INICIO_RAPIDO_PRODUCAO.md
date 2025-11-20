# ⚡ Início Rápido - Leitura REAL do Cartão de Cidadão

## 🎯 Objetivo

Configurar o sistema para ler **dados REAIS** do Cartão de Cidadão Português usando o middleware oficial.

**Tempo total**: 20-30 minutos (primeira vez)

---

## 📋 O Que Você Precisa

### Hardware
- [ ] Computador (Windows, Mac ou Linux)
- [ ] Leitor de cartões USB (€20-50)
- [ ] Cartão de Cidadão válido
- [ ] Cabo USB (geralmente vem com o leitor)

### Software
- [ ] Node.js (https://nodejs.org)
- [ ] Middleware Autenticação.Gov (https://www.autenticacao.gov.pt)
- [ ] Bridge server (já incluído no projeto)

---

## 🚀 Passo-a-Passo

### PASSO 1: Instalar Node.js (se não tiver)

**Verificar se já tem**:
```bash
node --version
```

Se retornar versão (ex: v18.0.0) → **JÁ TEM! Pular para Passo 2**

**Se não tiver**:
1. Ir para https://nodejs.org
2. Download da versão **LTS** (recomendada)
3. Executar instalador
4. Seguir o assistente (Next, Next, Install)
5. Reiniciar terminal
6. Testar: `node --version`

✅ **Checkpoint**: Deve mostrar a versão do Node.js

---

### PASSO 2: Instalar Middleware Autenticação.Gov

**Download**:
1. Ir para: https://www.autenticacao.gov.pt/web/guest/cc-aplicacao
2. Clicar em "Downloads"
3. Escolher seu sistema operacional:
   - Windows (7, 8, 10, 11)
   - macOS (10.13 ou superior)
   - Linux (Ubuntu, Debian, Fedora, etc.)

**Instalação Windows**:
1. Executar `Autenticacao.gov_Installer_x64.msi`
2. Seguir assistente de instalação
3. Concluir instalação
4. **Reiniciar computador** (recomendado)

**Instalação macOS**:
1. Abrir arquivo `.pkg` baixado
2. Seguir assistente
3. Autorizar nas Preferências do Sistema se pedido
4. Concluir instalação

**Instalação Linux**:
```bash
# Ubuntu/Debian
sudo dpkg -i autenticacao-gov*.deb
sudo apt-get install -f

# Fedora
sudo rpm -i autenticacao-gov*.rpm
```

**Verificar instalação**:
- Windows: Menu Iniciar → "Autenticação.Gov"
- macOS: Launchpad → "Autenticação.Gov"
- Linux: Menu aplicações → "Autenticação.Gov"

✅ **Checkpoint**: Aplicação Autenticação.Gov abre

---

### PASSO 3: Conectar Hardware

**3.1 - Conectar leitor USB**:
1. Pegar leitor de cartões USB
2. Conectar cabo USB ao computador
3. Aguardar Windows/macOS reconhecer (10-30s)
4. LED do leitor deve acender (verde/azul)

**3.2 - Inserir cartão**:
1. Pegar Cartão de Cidadão
2. **Chip voltado para cima**
3. Inserir no leitor (seta indica direção)
4. Empurrar até ouvir clique
5. LED pode piscar ou mudar de cor

**3.3 - Testar na aplicação**:
1. Abrir "Autenticação.Gov"
2. Aguardar carregar (5-10s)
3. **Deve mostrar seus dados pessoais**:
   - Foto
   - Nome
   - NIF
   - Data de nascimento
   - Validade

Se mostrar → **HARDWARE OK! ✅**

Se não mostrar:
- ❌ Remover e reinserir cartão
- ❌ Reconectar leitor USB
- ❌ Reiniciar aplicação
- ❌ Consultar troubleshooting abaixo

✅ **Checkpoint**: Aplicação mostra seus dados

---

### PASSO 4: Configurar Bridge Server

**4.1 - Criar pasta**:

Windows (PowerShell):
```powershell
cd C:\
mkdir cc-bridge-prod
cd cc-bridge-prod
```

Mac/Linux:
```bash
cd ~
mkdir cc-bridge-prod
cd cc-bridge-prod
```

**4.2 - Copiar arquivo do servidor**:

Copiar o arquivo `bridge-server-production.js` do projeto para esta pasta.

**Localização no projeto**: `/bridge-server-production.js`

**4.3 - Instalar dependências**:

```bash
npm install express cors node-fetch@2
```

Aguardar mensagem:
```
added 57 packages in 3s
```

**4.4 - Verificar arquivos**:

```bash
# Verificar se tudo está OK
ls
# ou (Windows)
dir
```

Deve mostrar:
```
bridge-server-production.js
node_modules/
package.json
package-lock.json
```

✅ **Checkpoint**: Dependências instaladas

---

### PASSO 5: Iniciar Bridge Server

**Opção A - Manual**:
```bash
node bridge-server-production.js
```

**Opção B - Script (Recomendado)**:

Windows:
```bash
# Copiar START_BRIDGE_PRODUCTION.bat para a pasta
# Duplo-clique no arquivo
```

Mac/Linux:
```bash
# Copiar START_BRIDGE_PRODUCTION.sh para a pasta
chmod +x START_BRIDGE_PRODUCTION.sh
./START_BRIDGE_PRODUCTION.sh
```

**Console deve mostrar**:
```
============================================================
🚀 BRIDGE SERVER - CARTÃO DE CIDADÃO (PRODUÇÃO)
============================================================

🔍 Procurando middleware Autenticação.Gov...
   Testando: http://127.0.0.1:35963
   ✅ ENCONTRADO em http://127.0.0.1:35963

📡 SERVIDOR HTTP
   URL: http://127.0.0.1:38000
   Porta: 38000

🎯 MODO DE OPERAÇÃO
   Modo: REAL
   Middleware: http://127.0.0.1:35963
   Processo: Em execução ✅
   Fonte de dados: LEITURA REAL DO CARTÃO

✅ PRONTO PARA LEITURA REAL

Aguardando pedidos...
```

**Se ver "Modo: REAL"** → **PERFEITO! ✅**

**Se ver "Modo: SIMULATION"** → Middleware não detectado:
1. Verificar se aplicação Autenticação.Gov está aberta
2. Aguardar 5 segundos
3. Reiniciar bridge server
4. Se persistir → consultar troubleshooting

✅ **Checkpoint**: Servidor mostra "Modo: REAL"

---

### PASSO 6: Testar Leitura

**6.1 - Testar no browser**:

Abrir navegador e ir para:
```
http://127.0.0.1:38000
```

**Deve mostrar**:
```json
{
  "status": "online",
  "service": "Cartão de Cidadão Bridge Server - PRODUÇÃO",
  "mode": "real",
  "middlewareUrl": "http://127.0.0.1:35963",
  "message": "✅ Middleware real detectado e disponível"
}
```

**6.2 - Testar leitura do cartão**:

```
http://127.0.0.1:38000/read
```

**Aguardar 3-10 segundos...**

**Deve mostrar seus dados REAIS**:
```json
{
  "success": true,
  "mode": "production",
  "source": "middleware-real",
  "name": "SEU NOME COMPLETO",
  "nif": "123456789",
  "address": "Sua morada real",
  "postalCode": "XXXX-XXX",
  "locality": "Sua cidade",
  ...
}
```

**Se ver seus dados** → **FUNCIONANDO! ✅**

**6.3 - Teste automático (opcional)**:

```bash
# Copiar test-production-bridge.js para a pasta
node test-production-bridge.js
```

Deve passar todos os testes:
```
🎉 SUCESSO TOTAL - LEITURA REAL FUNCIONANDO!
✅ Usando Dados Reais: SIM
```

✅ **Checkpoint**: Leitura retorna dados reais

---

### PASSO 7: Usar na OficinasExpress

**7.1 - Abrir OficinasExpress**:
```
http://localhost:3000
(ou URL onde está rodando)
```

**7.2 - Login**:
- Fazer login na plataforma
- Ir para módulo **Clientes**

**7.3 - Testar conexão**:
1. Clicar botão **"Leitor de Cartão"**
2. Clicar **"🔧 Testar Conexão ao Middleware"**

**Console deve mostrar**:
```
✅ ENCONTRADO: Porta padrão 38000
   URL: http://localhost:38000
   Status: 200
   Modo: real
```

**7.4 - Ler cartão**:
1. Certificar que cartão está inserido
2. Clicar botão **"Ler Cartão"**
3. Aguardar 3-10 segundos (barra de progresso)

**Deve aparecer**:
```
✅ Cartão lido com sucesso!
📊 Modo: PRODUÇÃO (Dados Reais)

Nome: SEU NOME COMPLETO
NIF: 123456789
Morada: Sua morada real
Código Postal: XXXX-XXX
Localidade: Sua cidade
Data Nascimento: DD/MM/AAAA
Nº Documento: XXXXXXXXX
```

**7.5 - Criar cliente**:
1. Preencher campo **Telefone** (obrigatório)
2. (Opcional) Preencher **Email**
3. Clicar **"Criar Cliente"**

**Mensagem de sucesso**:
```
✅ Cliente criado com sucesso!
```

**7.6 - Verificar**:
- Cliente aparece na lista
- Dados estão corretos
- Tudo funcionando!

✅ **Checkpoint**: Cliente criado com dados reais do cartão

---

## 🎉 PARABÉNS!

### Você configurou com sucesso:

- ✅ Middleware Autenticação.Gov
- ✅ Hardware (leitor + cartão)
- ✅ Bridge Server Produção
- ✅ Leitura REAL do Cartão de Cidadão
- ✅ Integração com OficinasExpress

### Agora você pode:

1. **Cadastrar clientes automaticamente**
   - Inserir cartão → Ler → Preencher telefone → Criar

2. **Agilizar atendimento**
   - Sem digitação manual de dados
   - Sem erros de digitação
   - Mais rápido e profissional

3. **Usar em produção**
   - Sistema pronto para oficina real
   - Dados reais dos cidadãos
   - Conformidade com legislação

---

## 🔧 Troubleshooting Rápido

### ❌ Middleware não detectado

**Sintoma**: Console mostra "Modo: SIMULATION"

**Soluções**:
1. Abrir aplicação Autenticação.Gov
2. Aguardar 10 segundos
3. Fechar bridge server (Ctrl+C)
4. Reiniciar: `node bridge-server-production.js`
5. Verificar se agora mostra "Modo: REAL"

Se ainda não:
```bash
# Testar middleware diretamente
curl http://127.0.0.1:35963
```

Se retornar erro → middleware não está rodando:
- Reinstalar middleware
- Reiniciar computador
- Verificar antivírus/firewall

---

### ❌ Erro ao ler cartão

**Sintoma**: "Erro ao ler do middleware" ou timeout

**Soluções**:
1. **Verificar cartão inserido**:
   - Remover e reinserir
   - Chip voltado para cima
   - Empurrar até clique

2. **Testar na aplicação oficial**:
   - Abrir Autenticação.Gov
   - Deve mostrar seus dados
   - Se não mostrar → problema no leitor/cartão

3. **Limpar chip**:
   - Remover cartão
   - Passar pano seco no chip
   - Reinserir

4. **Reconectar leitor**:
   - Desconectar USB
   - Aguardar 5 segundos
   - Reconectar
   - Aguardar LED acender

---

### ❌ Bridge server não inicia

**Sintoma**: Erro ao executar `node bridge-server-production.js`

**Soluções**:
1. **Verificar Node.js**:
   ```bash
   node --version
   ```
   Se erro → reinstalar Node.js

2. **Verificar dependências**:
   ```bash
   npm install express cors node-fetch@2
   ```

3. **Verificar arquivo**:
   ```bash
   ls bridge-server-production.js
   # ou (Windows)
   dir bridge-server-production.js
   ```
   Se não existir → copiar novamente

4. **Verificar porta 38000**:
   ```bash
   # Ver se algo está usando a porta
   netstat -ano | findstr "38000"
   ```
   Se estiver em uso → parar o outro processo

---

### ❌ OficinasExpress não encontra servidor

**Sintoma**: Teste de conexão retorna "não encontrado"

**Soluções**:
1. **Verificar se bridge está rodando**:
   - Deve ver no terminal: "Aguardando pedidos..."
   
2. **Testar no browser**:
   ```
   http://127.0.0.1:38000
   ```
   Deve retornar JSON com status

3. **Verificar porta**:
   - Bridge deve estar na porta 38000
   - OficinasExpress procura na 38000

4. **Firewall**:
   - Permitir Node.js no firewall
   - Windows: Permitir acesso privado

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[INTEGRACAO_SDK_REAL.md](./INTEGRACAO_SDK_REAL.md)** - Guia completo (50+ páginas)
- **[INTEGRACAO_SDK_RESUMO.md](./INTEGRACAO_SDK_RESUMO.md)** - Resumo executivo
- **[CARD_READER_TROUBLESHOOTING.md](./CARD_READER_TROUBLESHOOTING.md)** - Problemas comuns
- **[INDICE_DOCUMENTACAO_CARTAO.md](./INDICE_DOCUMENTACAO_CARTAO.md)** - Índice completo

---

## ✅ Checklist Final

Use esta checklist para garantir que tudo está funcionando:

### Hardware
- [ ] Leitor USB conectado
- [ ] LED do leitor aceso
- [ ] Cartão inserido corretamente
- [ ] Aplicação Autenticação.Gov mostra dados

### Software
- [ ] Node.js instalado e funcionando
- [ ] Middleware Autenticação.Gov instalado
- [ ] Bridge server iniciado sem erros
- [ ] Console mostra "Modo: REAL"

### Testes
- [ ] Browser: http://127.0.0.1:38000 → status OK
- [ ] Browser: http://127.0.0.1:38000/read → dados reais
- [ ] OficinasExpress: Teste conexão → encontrado
- [ ] OficinasExpress: Ler cartão → dados aparecem
- [ ] OficinasExpress: Criar cliente → sucesso

### Operação
- [ ] Processo documentado para equipe
- [ ] Todos sabem como iniciar bridge
- [ ] Procedimento de troubleshooting conhecido
- [ ] Backup da documentação feito

---

## 💡 Dicas de Uso Diário

### Ao Iniciar o Dia

1. **Ligar computador**
2. **Conectar leitor USB** (se não deixar conectado)
3. **Abrir aplicação Autenticação.Gov**
4. **Iniciar bridge server**:
   - Windows: duplo-clique `START_BRIDGE_PRODUCTION.bat`
   - Mac/Linux: `./START_BRIDGE_PRODUCTION.sh`
5. **Aguardar** mensagem "Aguardando pedidos..."
6. **Abrir OficinasExpress**
7. **Pronto para usar!**

### Durante o Dia

- **Manter terminal do bridge aberto** (minimizado OK)
- **Não fechar aplicação Autenticação.Gov**
- **Trocar cartão** quando necessário (remover/inserir)
- **Se erro**: remover e reinserir cartão

### Ao Fechar

1. **Fechar OficinasExpress**
2. **Fechar bridge** (Ctrl+C no terminal)
3. **Fechar Autenticação.Gov**
4. **Remover cartão do leitor**
5. **(Opcional) Desconectar leitor USB**

---

## 🆘 Suporte

**Se ainda tiver problemas**:

1. **Consultar documentação**:
   - INTEGRACAO_SDK_REAL.md
   - CARD_READER_TROUBLESHOOTING.md

2. **Executar testes automáticos**:
   ```bash
   node test-production-bridge.js
   ```

3. **Verificar logs**:
   - Console do bridge server
   - Console do browser (F12)

4. **Contactar suporte**:
   - Email: inscricoes@oficinasexpress.com
   - Incluir logs e mensagens de erro

---

**🎊 Sistema de leitura REAL do Cartão de Cidadão configurado e funcionando!**

**✨ Agora é só usar e agilizar o atendimento na sua oficina!**
