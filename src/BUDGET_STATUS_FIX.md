# Correção do Erro "Failed to fetch" ao Atualizar Status de Orçamento

## Problema Identificado

O erro `TypeError: Failed to fetch` ocorria ao tentar atualizar o status de um orçamento (aprovar/rejeitar).

## Causa Raiz

A configuração do CORS no servidor **não incluía o método PATCH**, que é usado pela rota de atualização de status. A lista de métodos permitidos era:
```javascript
allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

## Correções Implementadas

### 1. ✅ Configuração CORS Corrigida
**Arquivo:** `/supabase/functions/server/index.tsx`

Adicionado o método `PATCH` à configuração do CORS:
```javascript
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
```

### 2. ✅ Logs Melhorados no Backend
**Arquivo:** `/supabase/functions/server/index.tsx`

Adicionados logs detalhados na rota PATCH para facilitar debugging:
```javascript
app.patch('/make-server-6971b43c/budgets/:id/status', requireAuth, async (c) => {
  console.log('🔄 PATCH /budgets/:id/status - Updating budget status')
  console.log('📋 Budget ID:', budgetId, '| New status:', status)
  // ... resto do código com logs
})
```

### 3. ✅ Tratamento de Erros Melhorado no Frontend
**Arquivo:** `/components/BudgetsModule.tsx`

Melhorado o tratamento de erros com logs mais detalhados:
```javascript
const updateBudgetStatus = async (budgetId: string, status: 'approved' | 'rejected') => {
  try {
    const url = `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${budgetId}/status`
    console.log('🔄 Updating budget status:', { budgetId, status, url })
    console.log('🔑 Access token:', accessToken ? 'Present' : 'Missing')
    
    // ... fetch com logs completos de resposta
  } catch (error) {
    console.error('❌ Network or fetch error:', error)
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    toast.error('Erro de conexão ao atualizar orçamento. Verifique se o servidor está ativo.')
  }
}
```

### 4. ✅ Rota GET para Oficinas
**Arquivo:** `/supabase/functions/server/index.tsx`

Adicionada rota `GET /workshops/:id` que faltava para o `WorkshopContext` funcionar:
```javascript
app.get('/make-server-6971b43c/workshops/:id', requireAuth, async (c) => {
  const workshopId = c.req.param('id')
  const workshop = await kv.get(`workshop:${workshopId}`)
  if (!workshop) {
    return c.json({ error: 'Workshop not found' }, 404)
  }
  return c.json({ workshop })
})
```

### 5. ✅ Rotas de Teste para Diagnóstico
**Arquivo:** `/supabase/functions/server/index.tsx`

Criadas rotas de teste para facilitar o diagnóstico de problemas:
```javascript
// Test PATCH endpoint
app.patch('/make-server-6971b43c/test-patch', (c) => {
  return c.json({ success: true, message: 'PATCH method is working correctly' })
})

// Test endpoint with auth
app.patch('/make-server-6971b43c/test-patch-auth', requireAuth, (c) => {
  return c.json({ success: true, message: 'PATCH with auth is working correctly' })
})
```

### 6. ✅ Painel de Diagnóstico
**Arquivo:** `/components/DiagnosticsPanel.tsx` (NOVO)

Criado um painel completo de diagnóstico que testa:
- ✓ Conectividade com o servidor (Health Check)
- ✓ Método PATCH sem autenticação
- ✓ Método PATCH com autenticação
- ✓ Busca de orçamentos (GET)
- ✓ Validação do token de acesso

**Como usar:**
1. Faça login na plataforma
2. No Dashboard, clique em "Diagnóstico do Sistema"
3. Clique em "Executar Diagnóstico"
4. Verifique os resultados de cada teste

## Como Verificar se Está Funcionando

### Teste Manual:
1. Faça login na plataforma OficinasExpress
2. Acesse o módulo de "Orçamentos"
3. Crie um orçamento ou selecione um existente com status "Pendente"
4. Clique no botão de aprovar (✓) ou rejeitar (✗)
5. Verifique se a mensagem de sucesso aparece
6. Verifique a consola do browser - deve ver logs detalhados

### Teste com Painel de Diagnóstico:
1. No Dashboard, clique em "Diagnóstico do Sistema"
2. Execute os testes
3. Todos os testes devem passar (status verde)

## Logs Esperados no Browser Console

### Sucesso:
```
🔄 Updating budget status: { budgetId: "xxx", status: "approved", url: "..." }
🔑 Access token: Present
📡 Response received: { ok: true, status: 200, statusText: "OK" }
✅ Budget status updated successfully: { success: true, budget: {...} }
```

### Erro (se ocorrer):
```
🔄 Updating budget status: { budgetId: "xxx", status: "approved", url: "..." }
🔑 Access token: Present
📡 Response received: { ok: false, status: 500, statusText: "Internal Server Error" }
❌ Error response from server: { error: "..." }
```

## Logs Esperados no Servidor (Supabase Logs)

### Sucesso:
```
✅ requireAuth: Utilizador autenticado: user@email.com (ID: xxx)
🔄 PATCH /budgets/:id/status - Updating budget status
📋 Budget ID: xxx | New status: approved
✅ Budget status updated successfully: xxx -> approved
```

## Verificações de Segurança

✅ A rota requer autenticação (`requireAuth` middleware)
✅ Validação do status (apenas 'pending', 'approved', 'rejected' são aceites)
✅ Verificação se o orçamento existe antes de atualizar
✅ Logs não expõem informações sensíveis

## Próximos Passos

Se o erro persistir após estas correções:

1. **Verifique o Deploy:** Certifique-se que a Edge Function está deployed
2. **Execute Diagnóstico:** Use o painel de diagnóstico para identificar o problema específico
3. **Verifique Logs:** Acesse os logs da Edge Function no Supabase Dashboard
4. **Teste Manualmente:** Use ferramentas como Postman/Insomnia para testar a rota diretamente

## Arquivos Modificados

- ✅ `/supabase/functions/server/index.tsx` - Correção CORS + logs + rotas teste
- ✅ `/components/BudgetsModule.tsx` - Logs detalhados
- ✅ `/components/DiagnosticsPanel.tsx` - Novo painel de diagnóstico
- ✅ `/App.tsx` - Integração do painel de diagnóstico

## Data da Correção

28 de Outubro de 2025
