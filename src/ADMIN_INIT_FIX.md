# Correção: Inicialização do Administrador

## Problema Resolvido

Erro ao inicializar conta de administrador:
```
❌ Admin initialization failed: {
  "code": 401,
  "message": "Missing authorization header"
}
```

## Causa

A requisição para `/init-admin` não estava a enviar o header de `Authorization` com o `publicAnonKey`, que é necessário para autenticar requisições às Edge Functions do Supabase.

## Soluções Implementadas

### 1. ✅ Header de Autorização Adicionado

**Arquivo:** `App.tsx`

```typescript
// ANTES (sem autorização)
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
})

// DEPOIS (com autorização)
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  },
})
```

### 2. ✅ Logging Detalhado

Adicionado logging completo para facilitar diagnóstico:

```typescript
console.log('🔧 Initializing admin account...')
console.log('🔑 Using projectId:', projectId)
console.log('🔑 publicAnonKey available:', !!publicAnonKey)
console.log('🌐 Request URL:', url)
console.log('📡 Response status:', response.status, response.statusText)
```

### 3. ✅ Melhor Tratamento de Erros

```typescript
let data
try {
  data = await response.json()
} catch (e) {
  console.error('❌ Failed to parse response as JSON:', e)
  data = { error: 'Invalid JSON response' }
}
```

### 4. ✅ CORS Melhorado no Servidor

**Arquivo:** `supabase/functions/server/index.tsx`

```typescript
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
```

### 5. ✅ Logging no Servidor

```typescript
app.post('/make-server-6971b43c/init-admin', async (c) => {
  try {
    console.log('🚀 POST /init-admin - Request received')
    console.log('📋 Headers:', c.req.header())
    // ... resto do código
  }
})
```

### 6. ✅ Rota de Health Check

Adicionada rota para verificar se o servidor está a funcionar:

```typescript
app.get('/make-server-6971b43c/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'OficinasExpress API is running'
  })
})
```

## Como Verificar se Está Funcionando

### 1. Verificar Health Check

Abra o console do navegador e execute:

```javascript
fetch('https://jwwzxehrwxtaxsgcfjsm.supabase.co/functions/v1/make-server-6971b43c/health')
  .then(r => r.json())
  .then(console.log)
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T...",
  "message": "OficinasExpress API is running"
}
```

### 2. Ver Logs de Inicialização

Ao abrir a aplicação, veja no console do navegador:

```
🔧 Initializing admin account...
🔑 Using projectId: jwwzxehrwxtaxsgcfjsm
🔑 publicAnonKey available: true
🌐 Request URL: https://...
📡 Response status: 200 OK
✅ Admin initialization success: Admin account already exists
```

### 3. Ver Logs do Servidor

No Supabase Dashboard:
1. Vá para **Edge Functions** → **Logs**
2. Procure por:
   - `🚀 POST /init-admin - Request received`
   - `✅ Admin account already exists` ou
   - `🎉 Admin account fully created`

## Credenciais do Administrador

Após a inicialização bem-sucedida, pode fazer login com:

- **Email:** `inscricoes@oficinasexpress.com`
- **Password:** `123456789`

## Troubleshooting

### Se continuar a receber erro 401

1. **Verifique se o publicAnonKey está correto:**
   ```javascript
   import { publicAnonKey } from './utils/supabase/info'
   console.log('Key:', publicAnonKey)
   ```

2. **Verifique as variáveis de ambiente no Supabase:**
   - Vá para **Settings** → **Edge Functions**
   - Confirme que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão definidos

3. **Force redeploy da Edge Function:**
   - Vá para **Edge Functions** → **server**
   - Clique em **Redeploy**

### Se o servidor não responder

1. **Verifique se a Edge Function está deployed:**
   - Vá para **Edge Functions**
   - Confirme que `server` está **Active**

2. **Veja os logs de deploy:**
   - Clique na função `server`
   - Vá para **Logs**
   - Procure por erros de deploy

### Se receber erro de CORS

O CORS já está configurado para aceitar todas as origens. Se ainda houver problemas:

1. **Limpe o cache do navegador**
2. **Teste em modo anónimo/privado**
3. **Verifique se não há extensões bloqueando requests**

## Próximos Passos

Após a correção:

1. ✅ Recarregue a página
2. ✅ Veja os logs no console - deve aparecer "Admin initialization success"
3. ✅ Clique em "Acesso de Administração"
4. ✅ Faça login com as credenciais do admin
5. ✅ Aceda ao painel de administração

## Estrutura de Logging Implementada

Todos os logs agora seguem um padrão com emojis:

- 🚀 Início de operação
- ✅ Sucesso
- ❌ Erro
- 🔧 Configuração
- 🔍 Verificação
- 📋 Dados/Info
- 🌐 Network/Request
- 📡 Response
- 🔑 Credenciais/Keys
- 💡 Dica
- 🏢 Workshop
- 👤 Utilizador

Isto facilita encontrar informações relevantes nos logs.
