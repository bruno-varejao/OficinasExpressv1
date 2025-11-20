# 🔧 Fix do Workflow Status - Service Sheet & Client Portal

## 🐛 Problema Identificado

O cliente reportou que o **Fluxo da Obra** não estava a apresentar informação correta no **Client Portal**.

### Diagnóstico Completo

Logs do Client Portal mostraram:
```
Work Order: FO-1762181564554
  Status: "paused" ✅
  
Service Sheet: c5804275-9633-4035-990a-676b7699c565
  Status: "reception" ❌ (deveria ser "execution")
  
History: [] ❌ (vazio - sem entradas)
```

**Conclusão**: O Service Sheet foi criado mas **NUNCA foi atualizado** quando o técnico mudou o status do Fluxo da Obra!

## 🔍 Causa Raiz

Descobrimos **DOIS problemas críticos** no código:

### 1️⃣ **Endpoint Inexistente** - `/service-sheets` (com hífen)

**Problema**: 
- Frontend chamava: `POST /make-server-6971b43c/service-sheets` 
- Backend apenas tinha: `POST /make-server-6971b43c/servicesheets` (sem hífen)
- **Resultado**: TODAS as chamadas falhavam silenciosamente! ❌

**Impacto**:
- Service Sheet nunca era criado
- Service Sheet nunca era atualizado  
- serviceSheetId nunca era guardado no Work Order
- A cada tentativa, criava um novo Service Sheet (ou falhava)

### 2️⃣ **Falta de Verificação no KV Store**

**Problema**:
- Quando o `selectedWorkOrder.serviceSheetId` estava vazio/null
- O código assumia que não existia Service Sheet
- Tentava criar um novo em vez de procurar no banco de dados

**Impacto**:
- Duplicação potencial de Service Sheets
- Histórico criado no Service Sheet errado
- Cliente via informação desatualizada

## ✅ Solução Implementada

### Fix 1: Criar Endpoints com Hífen

Adicionado em `/supabase/functions/server/integration_routes.tsx`:

```typescript
// ==================== ALIAS ROUTES FOR service-sheets (with hyphen) ====================

// Create Service Sheet (with hyphen)
app.post('/make-server-6971b43c/service-sheets', requireAuth, async (c: any) => {
  // ... implementação completa
})

// Update Service Sheet (with hyphen)  
app.put('/make-server-6971b43c/service-sheets/:id', requireAuth, async (c: any) => {
  // ... implementação completa
})

// Get Service Sheet by ID (with hyphen)
app.get('/make-server-6971b43c/service-sheets/:id', requireAuth, async (c: any) => {
  // ... implementação completa
})
```

### Fix 2: Busca Inteligente de Service Sheet Existente

Adicionado em `/components/ServiceSheetModule.tsx` no `updateWorkflowStatus`:

```typescript
// IMPORTANT: If no serviceSheetId in memory, try to find existing one in database
if (!serviceSheetId) {
  console.log('⚠️ No serviceSheetId in selectedWorkOrder, searching database for existing service sheet...')
  try {
    const searchResponse = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/service-sheet-status/${selectedWorkOrder.id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.serviceSheet && searchData.serviceSheet.id) {
        serviceSheetId = searchData.serviceSheet.id
        console.log('✅ Found existing service sheet in database:', serviceSheetId)
        // Update local state so we don't search again
        setSelectedWorkOrder(prev => prev ? { ...prev, serviceSheetId } : null)
      }
    }
  } catch (searchError) {
    console.error('⚠️ Error searching for existing service sheet:', searchError)
  }
}
```

### Fix 3: Logs Detalhados para Debug

Adicionados logs completos em todas as operações:
- ✅ Criação de Service Sheet
- ✅ Atualização de Service Sheet  
- ✅ Link Service Sheet ↔ Work Order
- ✅ Criação de histórico de status
- ✅ Validação de condições

## 🧪 Como Testar

1. **Abrir DevTools** (F12) e ir para a tab Console
2. **Selecionar uma viatura** no módulo "Folha de Serviço"
3. **Mudar o status** no Fluxo da Obra (ex: Reception → Diagnosis → Execution)
4. **Verificar os logs** na consola:
   ```
   🔄 WORKFLOW STATUS UPDATE: {...}
   📝 Creating NEW service sheet... (se for primeira vez)
   ✅ Service sheet created successfully
   🔗 Linking service sheet to work order...
   ✅ Service sheet linked successfully
   📝 Creating status history entry...
   ✅ Status history recorded successfully
   ```

5. **No Client Portal**, verificar:
   - Status da folha de serviço está correto
   - Timeline mostra o histórico de mudanças
   - Notificações foram criadas

## 📊 Endpoints Relevantes

### Backend (`/supabase/functions/server/`)

**Integration Routes** (`integration_routes.tsx`):
- `POST /service-sheets` - Criar Service Sheet
- `PUT /service-sheets/:id` - Atualizar Service Sheet
- `GET /service-sheets/:id` - Obter Service Sheet
- `GET /servicesheets` - Listar Service Sheets (sem hífen)
- `POST /servicesheets` - Criar Service Sheet (sem hífen)
- `PUT /servicesheets/:id` - Atualizar Service Sheet (sem hífen)

**Main Server** (`index.tsx`):
- `POST /service-sheet-status-history` - Criar entrada no histórico
- `GET /service-sheet-status-history/:serviceSheetId` - Obter histórico
- `GET /client/service-sheet-status/:workOrderId` - Status para cliente
- `GET /client/notifications` - Notificações do cliente

## ⚠️ Importante

- Os dois formatos de endpoint (`/service-sheets` e `/servicesheets`) agora funcionam
- Sempre verificar os logs do browser para debug
- O endpoint `/service-sheet-status-history` já existia e está funcional
- A busca automática no KV evita duplicações

## 🎯 Resultado Esperado

Após este fix:
1. ✅ Service Sheet é criado corretamente na primeira mudança de status
2. ✅ Service Sheet é atualizado (não duplicado) nas mudanças seguintes  
3. ✅ Histórico é registado para cada mudança de status
4. ✅ Cliente vê o status correto no portal
5. ✅ Timeline mostra todas as transições de status
6. ✅ Notificações são criadas automaticamente

## 📝 Próximos Passos

Se o problema persistir, verificar:
1. Logs do browser (DevTools Console)
2. Logs do servidor (Supabase Functions Logs)
3. Dados no KV Store (usar endpoint debug)
4. Autenticação e tokens de acesso

---
**Data**: 2025-11-05  
**Autor**: AI Assistant  
**Status**: ✅ Implementado e pronto para teste
