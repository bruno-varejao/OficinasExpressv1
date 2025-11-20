# 🚀 Início Rápido - Acesso de Administrador

## Credenciais Padrão

```
Email:    inscricoes@oficinasexpress.com
Password: 123456789
```

## Como Fazer Login

### Método 1: Login Normal (Recomendado)

1. **Abra a aplicação**
2. **Clique no botão "Acesso de Administração"** (botão azul com ícone de escudo no rodapé)
3. **Digite as credenciais:**
   - Email: `inscricoes@oficinasexpress.com`
   - Password: `123456789`
4. **Clique em "Aceder ao Painel Admin"**

### Método 2: Se o Login Não Funcionar

Se receber um erro ao tentar fazer login:

#### Passo 1: Verificar Status
1. No ecrã de login de administrador
2. Clique em **"🔍 Verificar Status do Admin"**
3. Uma janela irá mostrar o diagnóstico completo

#### Passo 2: Interpretar o Diagnóstico
A janela mostrará:
- ✅ **Verde** = Tudo OK
- ❌ **Vermelho** = Problema encontrado

#### Passo 3: Resolver Problemas
1. Se ver qualquer ❌ vermelho, clique em **"🔧 Forçar Criação do Admin"**
2. Aguarde a mensagem de sucesso
3. Clique em **"🔄 Atualizar"** para verificar novamente
4. Tente fazer login novamente

## Ferramentas de Debug Disponíveis

### 🔍 Verificar Status do Admin
**O que faz:** Verifica se a conta existe na autenticação e na base de dados

**Quando usar:**
- Antes do primeiro login
- Se receber erro "Invalid credentials"
- Se receber erro "User not found"

### 🔧 Forçar Criação do Admin
**O que faz:** Cria ou sincroniza a conta de administrador

**Quando usar:**
- Se "Verificar Status" mostrar ❌
- Se nunca conseguiu fazer login
- Após resetar a base de dados

## Erros Comuns e Soluções Rápidas

### ❌ "Invalid login credentials"
**Solução:**
1. Verifique se está usando o email correto: `inscricoes@oficinasexpress.com`
2. Verifique se a password é: `123456789` (sem espaços)
3. Clique em "🔧 Forçar Criação do Admin"
4. Tente novamente

### ❌ "User profile not found"
**Solução:**
1. Clique em "🔧 Forçar Criação do Admin"
2. Aguarde confirmação
3. Tente fazer login novamente

### ❌ "Forbidden: Admin access required"
**Solução:**
1. Clique em "🔍 Verificar Status do Admin"
2. Verifique se o "Role" é "admin"
3. Se não for, clique em "🔧 Forçar Criação do Admin"
4. Tente novamente

### ❌ "Unauthorized"
**Solução:**
1. Certifique-se de que está no ecrã de **"Acesso de Administração"** (não no login normal)
2. O ecrã deve ter um ícone de escudo (🛡️) no topo
3. Se estiver no login normal, clique no botão azul com escudo no rodapé

## Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Está no ecrã de "Acesso de Administração" (não no login normal)
- [ ] Email está correto: `inscricoes@oficinasexpress.com`
- [ ] Password está correta: `123456789`
- [ ] Executou "🔍 Verificar Status do Admin"
- [ ] Se necessário, executou "🔧 Forçar Criação do Admin"
- [ ] Recarregou a página (Ctrl+F5 / Cmd+R)

## Primeira Utilização

### Após Fazer Login com Sucesso

1. **Você verá o Painel de Administração** com a lista de todas as contas
2. **Pode criar novas contas** clicando em "Criar Nova Conta"
3. **Pode editar contas existentes** clicando no ícone de lápis
4. **Pode bloquear/desbloquear contas** clicando no ícone de bloqueio
5. **Pode eliminar contas** clicando no ícone de lixo

### Criar Nova Conta de Oficina

1. Clique em **"Criar Nova Conta"**
2. Preencha os dados:
   - **Nome da Oficina:** Nome da empresa
   - **Nome do Responsável:** Nome completo
   - **Email:** Email de acesso
   - **Password:** Senha (mínimo 8 caracteres)
   - **Função:** Escolha entre:
     - **Rececionista** - Acesso básico
     - **Técnico** - Acesso a folhas de obra
     - **Administrador** - Acesso completo à oficina
     - **Admin (Super Utilizador)** - Acesso ao painel de administração
3. Clique em **"Criar Conta"**
4. A nova conta estará imediatamente disponível para login

## Dicas de Segurança

⚠️ **IMPORTANTE:**

1. **Altere a password padrão** após o primeiro acesso
2. **Não partilhe as credenciais de admin** com utilizadores normais
3. **Crie contas específicas** para cada oficina/utilizador
4. **Use "Bloqueio"** em vez de eliminar contas quando apropriado
5. **Apenas crie contas "Admin"** para super utilizadores de confiança

## Logs e Debug

Para ver informação detalhada de debug:

1. **Abra a Consola do Navegador:**
   - Chrome/Edge: `F12` ou `Ctrl+Shift+I`
   - Firefox: `F12` ou `Ctrl+Shift+K`
   - Safari: `Cmd+Option+I`

2. **Vá para a tab "Console"**

3. **Execute as ações:**
   - Clique em "Verificar Status"
   - Clique em "Forçar Criação"
   - Tente fazer login

4. **Procure por mensagens:**
   - ✅ Verde = Sucesso
   - ⚠️ Amarelo = Aviso
   - ❌ Vermelho = Erro

## Precisa de Mais Ajuda?

Consulte a documentação completa:
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Guia completo de resolução de problemas
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Configuração detalhada
- [README.md](./README.md) - Documentação geral

---

**Última atualização:** Outubro 2025
