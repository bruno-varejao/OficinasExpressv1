# Debug: Cliente Portal - Fluxo da Obra

## 🐛 Problema Reportado

Os dados do "Fluxo da Obra" na área de cliente não estão a ser apresentados corretamente.

## 📊 Como Funciona (Fluxo Completo)

### 1️⃣ Técnico Atualiza o Status (ServiceSheetModule)

**Quando**: Técnico clica num botão do "Fluxo da Obra" (ex: "Serviço em Execução")

**O que acontece**:
```
1. Atualiza Work Order (workflowStatus)
   ↓
2. Cria/Atualiza Service Sheet (status mapeado)
   ↓
3. Cria entrada no histórico
   ↓
4. Cria notificação para o cliente
```

**Endpoints chamados**:
- `PUT /workorders/{id}` - Atualiza workflowStatus
- `POST /service-sheets` (se não existir) OU `PUT /service-sheets/{id}` (se já existe)
- `POST /service-sheet-status-history` - Cria histórico + notificação

**Mapeamento de Status** (Workflow → Service Sheet):
```typescript
{
  'reception-complete': 'reception',
  'diagnosis': 'diagnosis',
  'budgeting': 'diagnosis',
  'waiting-approval': 'diagnosis',
  'waiting-parts': 'ordering',
  'execution': 'execution',
  'paused': 'execution',
  'delivery': 'delivery',
  'completed': 'completed'
}
```

---

### 2️⃣ Cliente Acede ao Portal (ClientPortal)

**Quando**: Cliente faz login e acede à tab "Serviços em Execução"

**O que acontece**:
```
1. Busca work orders do cliente
   ↓
2. Para cada work order, busca service sheet status
   ↓
3. Para cada service sheet, busca histórico
   ↓
4. Renderiza cards com status + timeline
```

**Endpoints chamados**:
- `GET /client/workorders` - Lista work orders do cliente
- `GET /client/service-sheet-status/:workOrderId` - Busca service sheet por work order
- `GET /service-sheet-status-history/:serviceSheetId` - Busca histórico de mudanças

---

## 🔍 Como Diagnosticar

### Passo 1: Verificar se Service Sheet foi Criado

**No Console do Browser** (quando técnico muda status):

```javascript
// ServiceSheetModule - updateWorkflowStatus()
console.log('📝 Creating service sheet for work order:', workOrderId)
console.log('✅ Service sheet created:', serviceSheetId)
console.log('✅ Service sheet status updated:', mappedNewStatus)
```

**Se NÃO aparecer**:
- ❌ Service sheet não foi criado
- Verificar erro no network tab
- Verificar se work order tem dados corretos

**Se aparecer**:
- ✅ Service sheet foi criado com sucesso
- Anotar o `serviceSheetId`

---

### Passo 2: Verificar se Histórico foi Criado

**No Console do Browser** (quando técnico muda status):

```javascript
console.log('✅ Status history recorded:', { 
  workflowOldStatus: oldStatus, 
  workflowNewStatus: newStatus,
  mappedOldStatus, 
  mappedNewStatus 
})
```

**Se NÃO aparecer**:
- ❌ Histórico não foi criado
- Verificar se `serviceSheetId` existe
- Verificar se status realmente mudou

**Se aparecer**:
- ✅ Histórico foi criado com sucesso

---

### Passo 3: Verificar se Cliente Recebe os Dados

**No Console do Browser** (quando cliente acede ao portal):

```javascript
// ClientPortal - fetchWorkOrders()
console.log('🔍 CLIENT PORTAL: Fetching service sheet statuses for work orders:', count)
console.log('📊 Service sheet data for WO ${woNumber}:', data)
console.log('✅ Service sheet status stored: ${status}')
console.log('📜 CLIENT PORTAL: Fetching status history...')
console.log('📊 History data for SS ${ssId}:', data)
```

**Se aparecer "No service sheet found"**:
- ❌ Service sheet não existe no DB
- Voltar ao Passo 1

**Se aparecer "No history entries"**:
- ❌ Histórico não existe no DB
- Voltar ao Passo 2

**Se aparecer os dados**:
- ✅ Dados estão a ser recebidos corretamente
- Problema pode ser na renderização

---

### Passo 4: Verificar Endpoint no Backend

**Logs do Servidor** (Supabase Functions):

```javascript
// Quando cliente busca service sheet status
console.log('📊 Fetching service sheet status for work order:', workOrderId)
console.log('🔍 Total service sheets in DB:', count)
console.log('  Sheet 1: ID=..., workOrderId=..., status=...')
console.log('✅ Found service sheet with status:', status)

// Quando cliente busca histórico
console.log('📖 Fetching status history for service sheet:', serviceSheetId)
console.log('✅ Found X history entries')
```

---

## 🧪 Teste Completo (Passo a Passo)

### 1. Como Técnico

1. Login como técnico da oficina
2. Ir para "Folha de Serviço"
3. Selecionar uma viatura com Work Order
4. **Abrir Console do Browser** (F12)
5. No card "Fluxo da Obra", clicar em **"Diagnóstico"**
6. **Verificar logs**:
   ```
   ✅ Service sheet created: ss-xxx
   ✅ Service sheet status updated: diagnosis
   ✅ Status history recorded: { ... }
   ```

7. Clicar em **"Serviço em Execução"**
8. **Verificar logs**:
   ```
   ✅ Service sheet status updated: execution
   ✅ Status history recorded: { oldStatus: 'diagnosis', newStatus: 'execution' }
   ```

### 2. Como Cliente

1. Login como cliente (email do proprietário da viatura)
2. Ir para tab **"Serviços em Execução"**
3. **Abrir Console do Browser** (F12)
4. **Verificar logs**:
   ```
   🔍 CLIENT PORTAL: Fetching service sheet statuses for work orders: 1
   📡 Fetching service sheet status for WO: wo-xxx (FO-2024-0001)
   📊 Service sheet data for WO FO-2024-0001: { serviceSheet: { id: 'ss-xxx', status: 'execution', ... } }
   ✅ Service sheet status stored: execution
   📜 CLIENT PORTAL: Fetching status history...
   📡 Fetching history for service sheet: ss-xxx
   📊 History data for SS ss-xxx: { history: [ { oldStatus: 'diagnosis', newStatus: 'execution', ... } ] }
   ✅ History stored: 1 entries
   ```

5. **Ver card do serviço**:
   - Badge "Fluxo da Obra: Em Execução" deve aparecer
   - Tempo estimado deve aparecer
   - Botão "Ver Histórico Completo" deve estar visível

6. **Clicar em "Ver Histórico Completo"**:
   - Modal deve abrir
   - Timeline visual deve mostrar: "Diagnóstico → Em Execução"
   - Timestamp deve estar correto

---

## ❓ Problemas Comuns

### Problema 1: Service Sheet não é criado

**Sintoma**: No console aparece `⚠️ Failed to create service sheet`

**Causa**: Work Order não tem `clientId` ou `vehicleId`

**Solução**:
1. Verificar se Work Order tem todos os campos obrigatórios
2. Verificar se `selectedWorkOrder` tem `id`, `clientId`, `vehicleId`

---

### Problema 2: WorkOrderId não corresponde

**Sintoma**: Backend diz "Service sheet not found for work order"

**Causa**: WorkOrderId no service sheet é diferente do work order

**Debug**:
```javascript
// No backend, verificar:
console.log('All service sheets:', allServiceSheets.map(ss => ({
  id: ss.id,
  workOrderId: ss.workOrderId
})))

// Comparar com work order ID que o cliente está a pedir
console.log('Looking for work order:', workOrderId)
```

**Solução**: 
- Verificar se `workOrderId` está a ser guardado corretamente quando cria service sheet
- Verificar se não há prefixos ou sufixos diferentes (ex: `workshop:wo-123` vs `wo-123`)

---

### Problema 3: Cliente não vê nenhum serviço

**Sintoma**: Tab "Serviços em Execução" aparece vazia

**Causa**: Cliente não tem work orders ou work orders não estão linkados ao email correto

**Debug**:
1. Verificar endpoint `/client/workorders`
2. Ver logs:
   ```
   ✅ Found X workshop client records for email: cliente@example.com
   ✅ Found Y work orders matching client
   ```

**Solução**:
- Verificar se cliente foi importado para o módulo Clientes da oficina
- Verificar se email do cliente está correto
- Verificar se work order tem `clientId` correto

---

### Problema 4: Histórico não aparece

**Sintoma**: Modal "Ver Histórico Completo" aparece vazio

**Causa**: Histórico não foi criado ou serviceSheetId está errado

**Debug**:
```javascript
// Verificar se histórico foi criado
console.log('📖 Fetching status history for service sheet:', serviceSheetId)

// No backend
SELECT * FROM kv_store WHERE key LIKE 'ss_status_history:%'
```

**Solução**:
- Verificar se `serviceSheetId` está correto
- Verificar se endpoint `/service-sheet-status-history/:id` está a retornar dados
- Forçar criação de novo histórico mudando status novamente

---

## 🔧 Fix Manual (Emergency)

Se nada funcionar, criar dados manualmente:

### 1. Criar Service Sheet manualmente

**Via Thunder Client / Postman**:
```http
POST /make-server-6971b43c/service-sheets
Authorization: Bearer {workshopUserToken}

{
  "workOrderId": "wo-123",
  "vehicleId": "vehicle:workshop-abc:veh-123",
  "clientId": "client:workshop-abc:client-456",
  "status": "execution",
  "symptoms": "Teste",
  "clientObservations": "",
  "interventionNotes": "",
  "hasKey": true,
  "hasManual": false,
  "hasDocuments": false
}
```

### 2. Criar histórico manualmente

```http
POST /make-server-6971b43c/service-sheet-status-history
Authorization: Bearer {workshopUserToken}

{
  "serviceSheetId": "ss-123",
  "workOrderId": "wo-123",
  "clientId": "client:workshop-abc:client-456",
  "workshopId": "workshop-abc",
  "oldStatus": "reception",
  "newStatus": "execution"
}
```

### 3. Verificar se foi criado

```http
GET /make-server-6971b43c/client/service-sheet-status/{workOrderId}
Authorization: Bearer {clientToken}
```

---

## ✅ Checklist de Verificação

Antes de reportar bug, verificar:

- [ ] Service sheet foi criado? (ver logs no console quando técnico muda status)
- [ ] Service sheet tem `workOrderId` correto?
- [ ] Histórico foi criado? (ver logs no console)
- [ ] Cliente está a receber work orders? (ver logs `/client/workorders`)
- [ ] Cliente está a receber service sheet status? (ver logs no console)
- [ ] Cliente está a receber histórico? (ver logs no console)
- [ ] Modal de histórico abre?
- [ ] Timeline visual aparece?
- [ ] Badges de status estão corretos?

---

## 📞 Onde Pedir Ajuda

Se depois de todos os passos o problema persistir:

1. **Fornecer logs completos** do console (técnico E cliente)
2. **Fornecer logs do servidor** (Supabase Functions)
3. **Fornecer screenshots** do que aparece vs o que deveria aparecer
4. **Fornecer IDs**: workOrderId, serviceSheetId, clientId
5. **Descrever passos** exatos que foram feitos

---

## 🎯 Status Atual

✅ **Endpoints criados**:
- POST `/service-sheet-status-history` ✅
- GET `/service-sheet-status-history/:id` ✅
- GET `/client/notifications` ✅
- POST `/client/notifications/:id/read` ✅
- POST `/client/notifications/read-all` ✅

✅ **Código implementado**:
- ServiceSheetModule cria/atualiza service sheet ✅
- ServiceSheetModule cria histórico ✅
- ClientPortal busca service sheet status ✅
- ClientPortal busca histórico ✅
- ClientPortal renderiza timeline ✅

✅ **Logs de debug adicionados**:
- ServiceSheetModule ✅
- ClientPortal ✅
- Backend endpoints ✅

🔍 **Próximo passo**: Testar com dados reais e verificar logs
