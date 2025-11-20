# 🔧 Troubleshooting - Leitor de Cartão de Cidadão

## ⚠️ Problema: "Middleware instalado mas não faz leitura"

Este guia vai ajudá-lo a diagnosticar e resolver problemas de comunicação entre a OficinasExpress e o middleware Autenticação.Gov.

---

## 🔍 PASSO 1: Usar a Ferramenta de Diagnóstico

A OficinasExpress tem uma ferramenta de diagnóstico integrada:

1. Aceda ao módulo **Clientes**
2. Clique no botão **"Leitor de Cartão"**
3. No diálogo que aparece, clique em **"🔧 Testar Conexão ao Middleware"**
4. Aguarde 10-15 segundos enquanto o sistema testa todas as portas
5. Veja os resultados no painel que aparece

### O que procurar nos resultados:

- ✅ **ENCONTRADO**: O middleware foi detectado nesta porta
- ⚠️ **Status XXX**: O middleware respondeu mas com código de erro
- ❌ **Failed to fetch**: Não há nada a executar nesta porta
- ❌ **TypeError**: Problema de CORS ou configuração

---

## 🔍 PASSO 2: Verificar se o Middleware está em Execução

### Windows:

1. **Método 1 - Aplicação**:
   ```
   - Procure "Autenticação.Gov" no menu Iniciar
   - Abra a aplicação
   - Deve aparecer um ícone na bandeja do sistema (próximo ao relógio)
   ```

2. **Método 2 - Gestor de Tarefas**:
   ```
   - Pressione Ctrl + Shift + Esc
   - Vá para a tab "Detalhes" ou "Processos"
   - Procure por:
     * pteidmw
     * pteid
     * eidmw
     * CCMovel
   ```

3. **Método 3 - Serviços**:
   ```
   - Pressione Win + R
   - Digite: services.msc
   - Procure por "Autenticação.Gov" ou "PTEID"
   - Verifique se o estado é "Em execução"
   ```

### macOS:

1. **Verificar Aplicação**:
   ```
   - Vá para Aplicações
   - Procure "Autenticação.Gov" ou "pteidmw"
   - Execute a aplicação
   - Deve aparecer na barra de menu
   ```

2. **Monitor de Atividade**:
   ```
   - Abra o Monitor de Atividade (Applications > Utilities)
   - Procure por "pteidmw" ou "eidmw"
   ```

### Linux:

```bash
# Verificar se o serviço está em execução
systemctl status pteid
ps aux | grep pteid

# Verificar se o daemon está ativo
ps aux | grep eidmw

# Verificar portas abertas
netstat -tuln | grep 38000
netstat -tuln | grep 9876
```

---

## 🔍 PASSO 3: Identificar a Porta do Middleware

O middleware pode estar a executar em diferentes portas. As mais comuns são:

| Porta | Descrição |
|-------|-----------|
| 38000 | Porta padrão mais comum |
| 9876  | Porta alternativa comum |
| 35963 | Usada por algumas versões |
| 39901 | Usada por algumas versões |
| 8080  | Porta genérica HTTP |

### Como descobrir a porta:

#### Windows - Usando netstat:
```cmd
# Abra o Prompt de Comando (cmd)
netstat -ano | findstr "pteid"
netstat -ano | findstr "eidmw"
```

#### macOS/Linux - Usando lsof:
```bash
# Descobrir que porta o middleware está usando
lsof -i -P | grep pteid
lsof -i -P | grep eidmw

# Ou com netstat
netstat -tuln | grep LISTEN
```

A porta aparecerá como algo tipo: `127.0.0.1:38000`

---

## 🔍 PASSO 4: Testar Manualmente no Browser

Depois de identificar a porta, teste diretamente no browser:

1. Abra o browser (Chrome, Firefox, Edge)
2. Digite na barra de endereços:
   ```
   http://localhost:38000
   ```
   (substitua 38000 pela porta que encontrou)

3. **O que esperar**:
   - ✅ **Página carrega** (mesmo que vazia ou com erro 404): Middleware está a executar
   - ❌ **"Site não pode ser alcançado"**: Middleware não está a executar ou porta errada
   - ⚠️ **Erro CORS**: Middleware está a executar mas precisa de configuração

---

## 🔍 PASSO 5: Verificar Endpoints da API

O middleware pode expor diferentes endpoints. Teste cada um:

```
http://localhost:38000/
http://localhost:38000/read
http://localhost:38000/card/read
http://localhost:38000/api/read
http://localhost:38000/v1/read
http://localhost:38000/pteid/read
http://localhost:38000/cc/read
```

**Dica**: Abra a Consola de Desenvolvedor (F12) no browser para ver mensagens de erro detalhadas.

---

## 🔧 SOLUÇÕES PARA PROBLEMAS COMUNS

### Problema 1: Middleware não inicia

**Sintomas**: Aplicação não abre ou fecha imediatamente

**Soluções**:

1. **Reinstalar o middleware**:
   ```
   - Desinstale completamente (Painel de Controlo > Programas)
   - Reinicie o computador
   - Descarregue a versão mais recente de www.autenticacao.gov.pt
   - Instale como Administrador
   - Reinicie novamente
   ```

2. **Verificar drivers do leitor**:
   ```
   - Abra o Gestor de Dispositivos (Windows)
   - Procure por "Smart Card Readers" ou "Leitores de Smart Card"
   - Se tiver um triângulo amarelo, atualize os drivers
   - Ou desinstale e deixe o Windows reinstalar
   ```

3. **Executar como Administrador**:
   ```
   - Clique com botão direito na aplicação Autenticação.Gov
   - Selecione "Executar como administrador"
   ```

### Problema 2: Erro de CORS

**Sintomas**: No console do browser aparece erro tipo "CORS policy"

**Explicação**: O middleware não permite pedidos do browser por segurança

**Soluções**:

1. **Usar uma extensão de browser**:
   - Instale uma extensão que desative CORS temporariamente
   - **ATENÇÃO**: Só use para testes, desative depois!
   - Exemplos: "CORS Unblock" (Chrome), "CORS Everywhere" (Firefox)

2. **Configurar o middleware**:
   - Procure pelo ficheiro de configuração do middleware
   - Geralmente em `C:\Program Files\Portugal Identity Card\` (Windows)
   - Ou `~/Library/Application Support/pteid/` (macOS)
   - Procure por opções de CORS ou allowed origins
   - Adicione `*` ou o domínio da aplicação

3. **Usar proxy local**:
   - Configure um proxy local que adicione headers CORS
   - Ferramentas: local-cors-proxy, cors-anywhere

### Problema 3: Firewall a bloquear

**Sintomas**: Conexão falha mesmo com middleware em execução

**Soluções**:

#### Windows Defender Firewall:
```
1. Painel de Controlo > Sistema e Segurança > Firewall do Windows
2. Clicar em "Permitir uma aplicação através do Firewall"
3. Clicar em "Alterar definições"
4. Clicar em "Permitir outra aplicação"
5. Procurar e adicionar "pteidmw" ou "Autenticação.Gov"
6. Certificar que ambas as checkboxes (Privada e Pública) estão marcadas
```

#### macOS Firewall:
```
1. Preferências do Sistema > Segurança e Privacidade > Firewall
2. Clicar no cadeado para fazer alterações
3. Clicar em "Opções de Firewall"
4. Adicionar "Autenticação.Gov" à lista de apps permitidas
```

#### Antivírus:
- Alguns antivírus bloqueiam conexões localhost
- Adicione exceção para localhost:38000
- Ou desative temporariamente para testar

### Problema 4: Leitor não detectado

**Sintomas**: Middleware executa mas não deteta o cartão

**Soluções**:

1. **Verificar conexão USB**:
   ```
   - Desconecte o leitor
   - Aguarde 5 segundos
   - Conecte numa porta USB diferente
   - Prefira portas USB na parte traseira do computador (mais estáveis)
   ```

2. **Testar o leitor**:
   ```
   - Abra a aplicação oficial Autenticação.Gov
   - Vá para a opção de leitura de cartão
   - Se funcionar ali, o leitor está OK
   - Se não funcionar, problema é no leitor/drivers
   ```

3. **Limpar o cartão**:
   ```
   - Remova o cartão
   - Limpe os contactos dourados com pano seco
   - Reinsira cuidadosamente
   ```

### Problema 5: Versão antiga do middleware

**Sintomas**: Funcionalidades não disponíveis

**Solução**:

1. Verificar versão:
   ```
   - Abra Autenticação.Gov
   - Menu Ajuda > Acerca de
   - Veja a versão instalada
   ```

2. Comparar com versão mais recente:
   ```
   - Aceda a www.autenticacao.gov.pt
   - Veja a versão disponível para download
   ```

3. Atualizar:
   ```
   - Se a sua versão for mais antiga, descarregue a nova
   - Desinstale a versão antiga
   - Instale a versão nova
   - Reinicie o computador
   ```

---

## 🛠️ CONFIGURAÇÃO AVANÇADA

### Opção 1: Usar Porta Específica

Se descobriu que o middleware usa porta diferente, pode configurar:

1. Abra a Consola de Desenvolvedor do Browser (F12)
2. Execute este código JavaScript para testar:

```javascript
// Substitua PORT pela porta que encontrou
const PORT = 38000;
fetch(`http://localhost:${PORT}`)
  .then(res => {
    console.log('✅ Middleware encontrado!', res.status);
    return res.text();
  })
  .then(text => console.log('Resposta:', text))
  .catch(err => console.error('❌ Erro:', err));
```

### Opção 2: Aplicação Bridge Personalizada

Se o middleware não expõe API HTTP, pode criar uma aplicação intermediária:

1. **Node.js Bridge**:
```javascript
// server.js
const express = require('express');
const cors = require('cors');
// Importar SDK do middleware (se disponível)
// const pteid = require('pteid-sdk');

const app = express();
app.use(cors());

app.get('/read', async (req, res) => {
  try {
    // Chamar SDK do middleware
    // const cardData = await pteid.readCard();
    const cardData = {
      name: 'João Silva',
      nif: '123456789',
      address: 'Rua Example, 123'
    };
    res.json(cardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(38000, () => {
  console.log('Bridge running on http://localhost:38000');
});
```

2. Executar:
```bash
npm install express cors
node server.js
```

---

## 📞 OBTER SUPORTE

### Logs do Sistema

Para pedir ajuda, recolha estas informações:

1. **Resultado do teste de conexão** (da ferramenta integrada)
2. **Versão do middleware** (Menu Ajuda > Acerca de)
3. **Sistema operativo** e versão
4. **Modelo do leitor de cartões**
5. **Mensagens de erro** da consola do browser (F12)

### Windows - Logs do Middleware:
```
C:\Users\[Utilizador]\AppData\Local\Portugal Identity Card\logs\
```

### macOS - Logs do Middleware:
```
~/Library/Logs/pteid/
```

### Linux - Logs do Middleware:
```
~/.pteid/logs/
/var/log/pteid/
```

### Contactos de Suporte:

**Autenticação.Gov (Middleware)**:
- Site: https://www.autenticacao.gov.pt
- Email: info.cidadao@ama.pt
- Telefone: (+351) 211 509 509
- Horário: Segunda a Sexta, 9h-18h

**Fórum da Comunidade**:
- https://www.autenticacao.gov.pt/forum

---

## ✅ CHECKLIST COMPLETO

Antes de pedir suporte, verifique:

- [ ] Middleware Autenticação.Gov está instalado
- [ ] Aplicação do middleware está em execução
- [ ] Leitor USB está conectado
- [ ] Cartão está inserido no leitor
- [ ] Executou o teste de conexão integrado
- [ ] Testou no browser (http://localhost:38000)
- [ ] Verificou se não há erros de firewall
- [ ] Drivers do leitor estão atualizados
- [ ] Middleware está na versão mais recente
- [ ] Reiniciou o computador após instalação

---

## 🔄 SOLUÇÃO TEMPORÁRIA: Usar Modo de Demonstração

Enquanto resolve o problema do middleware, pode usar o sistema em modo de demonstração:

1. Clique em "Ler Cartão" normalmente
2. O sistema deteta que o middleware não está disponível
3. Carrega automaticamente dados simulados
4. Pode continuar a trabalhar e testar o sistema
5. Quando resolver, voltará a usar o leitor real automaticamente

**Nota**: Os dados de demonstração são sempre os mesmos e não refletem cartões reais.

---

**Última atualização**: Novembro 2024  
**Versão**: 2.0  
**Plataforma**: OficinasExpress
