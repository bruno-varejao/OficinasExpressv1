# Teste: Inicialização do Administrador

## Testes Rápidos no Console do Navegador

Abra o console do navegador (F12) e execute os seguintes comandos:

### 1. Testar Health Check do Servidor

```javascript
fetch('https://jwwzxehrwxtaxsgcfjsm.supabase.co/functions/v1/make-server-6971b43c/health')
  .then(r => r.json())
  .then(data => {
    console.log('🏥 Health Check:', data)
  })
  .catch(err => console.error('❌ Erro:', err))
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T...",
  "message": "OficinasExpress API is running"
}
```

---

### 2. Testar Inicialização do Admin

```javascript
const projectId = 'jwwzxehrwxtaxsgcfjsm'
const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d3p4ZWhyd3h0YXhzZ2NmanNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc1NTAsImV4cCI6MjA3NzA4MzU1MH0.rRKi8FpVxfZgwSg2ROdpLhtabBJQt6MtIQdpUNcUsRo'

fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/init-admin`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  },
})
  .then(r => {
    console.log('📡 Status:', r.status, r.statusText)
    return r.json()
  })
  .then(data => {
    console.log('📋 Resposta:', data)
    if (data.success) {
      console.log('✅ Admin inicializado com sucesso!')
    } else {
      console.error('❌ Erro:', data.error)
    }
  })
  .catch(err => console.error('❌ Erro de rede:', err))
```

**Resultado esperado (se admin já existe):**
```json
{
  "success": true,
  "message": "Admin account already exists",
  "adminId": "uuid-do-admin"
}
```

**Resultado esperado (se admin foi criado):**
```json
{
  "success": true,
  "message": "Admin account created successfully",
  "email": "inscricoes@oficinasexpress.com",
  "adminId": "uuid-do-admin"
}
```

---

### 3. Verificar Status do Admin

```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/admin-status`, {
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`,
  },
})
  .then(r => r.json())
  .then(data => {
    console.log('📊 Status do Admin:')
    console.log('  - Existe no Auth:', data.existsInAuth ? '✅' : '❌')
    console.log('  - Existe no KV:', data.existsInKV ? '✅' : '❌')
    console.log('  - Total utilizadores (KV):', data.totalUsersInKV)
    console.log('  - Total utilizadores (Auth):', data.totalUsersInAuth)
    
    if (data.kvData) {
      console.log('  - Role:', data.kvData.role)
      console.log('  - Email:', data.kvData.email)
    }
    
    if (data.existsInAuth && data.existsInKV) {
      console.log('✅ Admin completamente configurado!')
    } else {
      console.log('⚠️ Admin não está completamente configurado')
      console.log('💡 Execute o comando de inicialização (teste #2) para corrigir')
    }
  })
  .catch(err => console.error('❌ Erro:', err))
```

---

### 4. Testar Login do Admin (após inicialização)

⚠️ **Importante:** Apenas execute este teste após confirmar que o admin foi inicializado (testes #2 ou #3).

```javascript
// Primeiro, importe o Supabase client
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = `https://${projectId}.supabase.co`
const supabase = createClient(supabaseUrl, publicAnonKey)

// Tente fazer login
supabase.auth.signInWithPassword({
  email: 'inscricoes@oficinasexpress.com',
  password: '123456789'
})
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erro no login:', error.message)
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log('👤 Utilizador:', data.user.email)
      console.log('🔑 Token:', data.session.access_token.substring(0, 20) + '...')
    }
  })
```

---

## Interpretação dos Resultados

### ✅ Tudo Correto

Se todos os testes passarem:
1. Health check retorna `status: "ok"` ✅
2. Init-admin retorna `success: true` ✅
3. Admin-status mostra ambos como `true` ✅
4. Login funciona ✅

**Próximo passo:** Pode usar a aplicação normalmente!

---

### ❌ Problemas Comuns

#### Erro 401 (Unauthorized)

```
❌ Erro: { code: 401, message: "Missing authorization header" }
```

**Causa:** Token não está sendo enviado ou é inválido.

**Solução:**
1. Verifique se `publicAnonKey` está correto
2. Confirme que o header `Authorization` está presente
3. Verifique se a Edge Function está deployed

---

#### Erro 404 (Not Found)

```
❌ Erro 404: Not Found
```

**Causa:** Rota não existe ou Edge Function não está deployed.

**Solução:**
1. Vá para Supabase Dashboard → Edge Functions
2. Verifique se a função `server` está **Active**
3. Se não estiver, faça deploy manualmente

---

#### Erro 500 (Internal Server Error)

```
❌ Erro: { error: "Internal server error" }
```

**Causa:** Erro no código do servidor.

**Solução:**
1. Vá para Supabase Dashboard → Edge Functions → server → Logs
2. Procure por mensagens de erro
3. Verifique se as variáveis de ambiente estão configuradas:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

#### Admin Existe no Auth mas não no KV

```
📊 Status do Admin:
  - Existe no Auth: ✅
  - Existe no KV: ❌
```

**Causa:** Desincronização entre Auth e KV Store.

**Solução:**
Execute o teste #2 novamente. O código detectará esta situação e criará o perfil no KV automaticamente.

---

## Logs no Servidor (Supabase Dashboard)

Para ver os logs detalhados:

1. Abra **Supabase Dashboard**
2. Vá para **Edge Functions**
3. Clique em **server**
4. Vá para **Logs**

Procure por:
- `🚀 POST /init-admin - Request received`
- `✅ Admin account already exists` ou `🎉 Admin account fully created`
- `❌ Error creating admin user:` (se houver erro)

---

## Executar Todos os Testes de Uma Vez

Cole isto no console para executar todos os testes sequencialmente:

```javascript
const runAllTests = async () => {
  const projectId = 'jwwzxehrwxtaxsgcfjsm'
  const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d3p4ZWhyd3h0YXhzZ2NmanNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc1NTAsImV4cCI6MjA3NzA4MzU1MH0.rRKi8FpVxfZgwSg2ROdpLhtabBJQt6MtIQdpUNcUsRo'

  console.log('🧪 ===== INICIANDO TESTES =====\n')

  // Teste 1: Health Check
  console.log('🏥 Teste 1: Health Check')
  try {
    const health = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/health`)
    const healthData = await health.json()
    console.log('✅ Health:', healthData.status)
  } catch (err) {
    console.error('❌ Health Check falhou:', err.message)
  }

  console.log('\n')

  // Teste 2: Init Admin
  console.log('🔧 Teste 2: Inicializar Admin')
  try {
    const init = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/init-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    })
    const initData = await init.json()
    console.log(initData.success ? '✅' : '❌', 'Init Admin:', initData.message || initData.error)
  } catch (err) {
    console.error('❌ Init Admin falhou:', err.message)
  }

  console.log('\n')

  // Teste 3: Admin Status
  console.log('📊 Teste 3: Status do Admin')
  try {
    const status = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/admin-status`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    })
    const statusData = await status.json()
    console.log('  - Existe no Auth:', statusData.existsInAuth ? '✅' : '❌')
    console.log('  - Existe no KV:', statusData.existsInKV ? '✅' : '❌')
    console.log('  - Total utilizadores:', statusData.totalUsersInKV)
  } catch (err) {
    console.error('❌ Admin Status falhou:', err.message)
  }

  console.log('\n🧪 ===== TESTES CONCLUÍDOS =====')
}

runAllTests()
```

---

## Resultado Final Esperado

```
🧪 ===== INICIANDO TESTES =====

🏥 Teste 1: Health Check
✅ Health: ok

🔧 Teste 2: Inicializar Admin
✅ Init Admin: Admin account already exists

📊 Teste 3: Status do Admin
  - Existe no Auth: ✅
  - Existe no KV: ✅
  - Total utilizadores: 1

🧪 ===== TESTES CONCLUÍDOS =====
```

Se vir este resultado, está tudo a funcionar perfeitamente! 🎉
