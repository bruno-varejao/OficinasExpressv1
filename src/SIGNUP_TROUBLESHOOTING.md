# Resolução de Problemas - Criação de Contas

Este guia ajuda a diagnosticar e resolver problemas ao criar novas contas de oficina no OficinasExpress.

## ✅ Melhorias Implementadas

### 1. Logs Detalhados no Backend
- ✅ Logs de cada etapa do processo de signup
- ✅ Validação de campos obrigatórios
- ✅ Validação de tamanho mínimo de password (6 caracteres)
- ✅ Mensagens de erro em português
- ✅ Limpeza automática (rollback) se a criação falhar

### 2. Validação no Frontend
- ✅ Validação antes de enviar para o servidor
- ✅ Mensagens de erro claras e em português
- ✅ Feedback visual durante o processo
- ✅ Login automático após criação bem-sucedida

## 🔍 Como Diagnosticar Problemas

### Passo 1: Abrir a Consola do Navegador
1. Pressione `F12` ou clique com botão direito > "Inspecionar"
2. Vá para o separador "Console"
3. Tente criar uma nova conta
4. Observe as mensagens de log

### Passo 2: Identificar o Erro

#### Mensagens Comuns e Soluções:

**"Email, password e nome são obrigatórios"**
- ✅ Solução: Preencha todos os campos obrigatórios (marcados com *)

**"Password deve ter pelo menos 6 caracteres"**
- ✅ Solução: Use uma password com 6 ou mais caracteres

**"Este email já está registado"**
- ✅ Solução: Use outro email ou faça login com as credenciais existentes

**"Erro de conexão. Verifique a sua internet"**
- ✅ Solução: Verifique a conexão de internet e se o backend está ativo

**"Erro interno ao criar conta"**
- ✅ Solução: Verifique os logs do servidor (ver abaixo)

### Passo 3: Verificar Logs do Servidor

Para ver logs detalhados do backend:

1. Aceda ao painel Supabase
2. Vá para "Edge Functions" > "make-server-6971b43c"
3. Clique em "Logs"
4. Procure por mensagens que começam com:
   - 🚀 (início do processo)
   - ❌ (erros)
   - ✅ (sucesso)

## 🐛 Cenários de Erro Específicos

### Erro: "Workshop created but user creation failed"

**Diagnóstico:**
- O workshop foi criado com sucesso
- Mas a criação do utilizador no Supabase Auth falhou

**Solução:**
- O sistema faz rollback automático (apaga o workshop criado)
- Tente novamente com outro email
- Verifique se o Supabase Auth está configurado corretamente

### Erro: "User created but profile save failed"

**Diagnóstico:**
- Utilizador criado no Supabase Auth
- Mas o perfil não foi guardado no KV store

**Solução:**
- Contacte o administrador do sistema
- O utilizador existe mas não consegue fazer login

### Erro: "Invalid token" após criar conta

**Diagnóstico:**
- Conta criada com sucesso
- Mas o login automático falhou

**Solução:**
- Faça logout
- Faça login manualmente com as credenciais criadas

## 📊 Estrutura de Dados

Quando uma conta é criada, são criados:

### 1. Workshop (KV Store)
```json
{
  "id": "uuid-da-oficina",
  "name": "Nome da Oficina",
  "createdAt": "2025-11-01T...",
  "isActive": true
}
```

### 2. Utilizador (Supabase Auth)
```json
{
  "email": "email@exemplo.com",
  "user_metadata": {
    "name": "Nome do Utilizador",
    "role": "administrador",
    "workshopName": "Nome da Oficina",
    "workshopId": "uuid-da-oficina"
  },
  "email_confirm": true
}
```

### 3. Perfil de Utilizador (KV Store)
```json
{
  "id": "uuid-do-utilizador",
  "email": "email@exemplo.com",
  "name": "Nome do Utilizador",
  "role": "administrador",
  "workshopId": "uuid-da-oficina",
  "workshopName": "Nome da Oficina",
  "createdAt": "2025-11-01T..."
}
```

## 🔧 Comandos de Diagnóstico

### Verificar se o servidor está ativo:
```bash
curl https://[PROJECT_ID].supabase.co/functions/v1/make-server-6971b43c/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "...",
  "message": "OficinasExpress API is running"
}
```

### Testar criação de conta via API:
```bash
curl -X POST https://[PROJECT_ID].supabase.co/functions/v1/make-server-6971b43c/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -d '{
    "email": "teste@exemplo.com",
    "password": "123456",
    "name": "Utilizador Teste",
    "role": "administrador",
    "workshopName": "Oficina Teste"
  }'
```

## 📞 Suporte

Se os problemas persistirem:

1. ✅ Capture os logs da consola do navegador (F12)
2. ✅ Capture os logs do Edge Function no Supabase
3. ✅ Anote a mensagem de erro exata
4. ✅ Tente criar conta com dados diferentes

## 🎯 Checklist de Resolução

- [ ] Todos os campos obrigatórios estão preenchidos?
- [ ] A password tem pelo menos 6 caracteres?
- [ ] O email ainda não está registado?
- [ ] A consola do navegador mostra algum erro?
- [ ] O backend está ativo (health check passa)?
- [ ] Os logs do Edge Function mostram o erro?
- [ ] Tentou com outro email/password?
- [ ] Fez refresh da página antes de tentar novamente?

## 🔄 Próximos Passos

Se conseguiu identificar o erro mas não consegue resolver:

1. Documente o erro exacto
2. Capture screenshots
3. Partilhe os logs
4. Contacte o suporte técnico
