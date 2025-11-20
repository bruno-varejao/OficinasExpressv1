# Integração Automática: Portal Público → Módulo de Orçamentos

## 📋 Resumo

Implementada a integração automática entre o sistema de pedidos de orçamento do Portal Público e o módulo de Orçamentos da oficina. Quando um cliente aceita um orçamento e agenda um serviço, o sistema cria automaticamente:

1. **Cliente** na base de dados da oficina (se não existir)
2. **Veículo** na base de dados da oficina (se não existir)
3. **Orçamento** no módulo de orçamentos com o serviço e valor aceite

## 🔄 Fluxo Completo

### 1. Cliente no Portal Público
- Insere dados do veículo (matrícula)
- Seleciona serviço pretendido
- Recebe orçamentos instantâneos de todas as oficinas da localidade (CP4)
- Escolhe até 3 oficinas para validação

### 2. Oficina Valida/Retifica
- Recebe pedido na tab "Gestão de Plataforma"
- Valida ou modifica o orçamento
- Envia resposta ao cliente

### 3. Cliente Agenda Serviço
- Vê respostas das oficinas
- Escolhe a oficina pretendida
- Agenda data e hora para o serviço
- **🆕 NESTE PONTO ACONTECE A INTEGRAÇÃO AUTOMÁTICA**

### 4. Sistema Cria Automaticamente (Backend)

#### A) Verificação e Criação de Cliente
```javascript
// Verifica se cliente existe (por email)
const client = allClients.find(c => 
  c.email?.toLowerCase() === clientEmail?.toLowerCase()
)

// Se não existe, cria automaticamente
if (!client) {
  const newClient = {
    id: clientId,
    workshopId: workshopId,
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
    source: 'instant_quote',
    createdAt: new Date().toISOString()
  }
  await kv.set(`client:${workshopId}:${clientId}`, newClient)
}
```

#### B) Verificação e Criação de Veículo
```javascript
// Verifica se veículo existe (por matrícula)
const vehicle = allVehicles.find(v => 
  v.licensePlate?.toUpperCase() === licensePlate?.toUpperCase()
)

// Se não existe, cria automaticamente
if (!vehicle) {
  const newVehicle = {
    id: vehicleId,
    workshopId: workshopId,
    licensePlate: licensePlate.toUpperCase(),
    clientId: clientId,
    source: 'instant_quote',
    createdAt: new Date().toISOString()
  }
  await kv.set(`vehicle:${workshopId}:${vehicleId}`, newVehicle)
}
```

#### C) Criação Automática de Orçamento
```javascript
const budget = {
  id: budgetId,
  number: `ORC-${Date.now()}`,
  workshopId: workshopId,
  clientId: clientId,
  vehicleId: vehicleId,
  items: [
    {
      partNumber: serviceId,
      description: serviceName,
      quantity: 1,
      price: finalPrice
    }
  ],
  partsTotal: finalPrice,
  laborHours: 0,
  laborTotal: 0,
  subtotal: finalPrice,
  tax: finalPrice * 0.23, // IVA 23%
  total: finalPrice * 1.23,
  status: 'pending',
  notes: 'Orçamento criado automaticamente a partir do pedido público',
  publicQuoteRequestId: quoteRequestId,
  licensePlate: licensePlate,
  serviceName: serviceName,
  clientName: clientName,
  clientEmail: clientEmail,
  clientPhone: clientPhone,
  source: 'instant_quote',
  createdAt: new Date().toISOString()
}
```

#### D) Criação de Agendamento
```javascript
const appointment = {
  id: appointmentId,
  workshopId: workshopId,
  budgetId: budgetId, // 🔗 Ligação ao orçamento
  clientId: clientId,
  vehicleId: vehicleId,
  date: preferredDate,
  startTime: preferredTime,
  status: 'scheduled',
  source: 'instant_quote'
}
```

## 🎯 Campos Importantes do Orçamento

### Campos Específicos do Portal Público
- `publicQuoteRequestId`: ID do pedido de orçamento público original
- `source`: "instant_quote" (identifica origem)
- `licensePlate`: Matrícula do veículo
- `serviceName`: Nome do serviço solicitado
- `clientName`: Nome do cliente (visível antes de aprovação)
- `clientEmail`: Email do cliente
- `clientPhone`: Telefone do cliente

### Campos Padrão do Orçamento
- `clientId`: ID do cliente criado automaticamente
- `vehicleId`: ID do veículo criado automaticamente
- `items`: Array com o serviço como item
- `status`: "pending" (aguarda aprovação/processamento)
- `total`: Valor calculado com IVA (23%)

## 📊 Visualização na Oficina

### Módulo de Orçamentos
O orçamento aparece com:
- Badge "Portal Público" (identifica origem)
- Dados completos do cliente e veículo
- Serviço e valor do pedido público
- Ligação ao agendamento criado

### Módulo de Agenda
O agendamento aparece com:
- Referência ao orçamento (`budgetId`)
- Referência ao cliente (`clientId`)
- Referência ao veículo (`vehicleId`)
- Origem: "instant_quote"

### Módulo de Clientes
O cliente aparece com:
- Tag "Portal Público" (campo `source`)
- Histórico completo:
  - Orçamentos
  - Agendamentos
  - Veículos associados

### Módulo de Veículos
O veículo aparece com:
- Associação ao cliente
- Tag "Portal Público"
- Histórico de serviços

## ✅ Vantagens

1. **Zero Duplicação**: Sistema verifica existência antes de criar
2. **Dados Completos**: Toda informação do pedido público é preservada
3. **Rastreabilidade**: Campo `publicQuoteRequestId` permite rastrear origem
4. **Workflow Integrado**: Cliente → Veículo → Orçamento → Agendamento
5. **Automação Total**: Oficina não precisa criar manualmente nada

## 🔍 Verificações de Segurança

### Cliente Duplicado
```javascript
// Verifica por email (case-insensitive)
const exists = allClients.find(c => 
  c.email?.toLowerCase() === email?.toLowerCase()
)
```

### Veículo Duplicado
```javascript
// Verifica por matrícula (case-insensitive, convertido para uppercase)
const exists = allVehicles.find(v => 
  v.licensePlate?.toUpperCase() === plate?.toUpperCase()
)
```

### Orçamento Duplicado
```javascript
// Verifica se já existe orçamento para este pedido de orçamento público
const existingBudget = existingBudgets.find((b: any) => 
  b.publicQuoteRequestId === workshopRequest.quoteRequestId &&
  b.workshopId === workshopRequest.workshopId
)
// Se existe, reutiliza; se não, cria novo
```

### Ligação Cliente-Veículo
```javascript
// Se veículo existe mas não tem cliente associado
if (vehicle && !vehicle.clientId) {
  vehicle.clientId = clientId
  await kv.set(`vehicle:${workshopId}:${vehicleId}`, vehicle)
}
```

## 🔗 Endpoint da Integração

**Rota**: `POST /make-server-6971b43c/public/book-appointment`

**Localização**: `/supabase/functions/server/quote_agenda_routes.tsx` (linhas 1564-1753)

**Input**:
```json
{
  "workshopRequestId": "wr_xxx",
  "preferredDate": "2025-11-15",
  "preferredTime": "10:00",
  "notes": "Observações adicionais"
}
```

**Output**:
```json
{
  "success": true,
  "appointment": { /* dados do agendamento */ },
  "budget": { /* dados do orçamento criado */ },
  "clientId": "client_xxx",
  "vehicleId": "vehicle_xxx",
  "message": "Agendamento confirmado e orçamento criado automaticamente"
}
```

## 📝 Logs do Sistema

O sistema gera logs detalhados de todo o processo:

```
📅 Booking appointment for request: wr_xxx
🔍 Checking if client exists...
✅ Client created automatically: client_xxx
🔍 Checking if vehicle exists...
✅ Vehicle created automatically: vehicle_xxx
💰 Creating budget automatically...
✅ Budget created automatically: budget_xxx
✅ Appointment booked: apt_xxx
✅ Integration complete - Client, Vehicle, and Budget created
```

## 🎨 Interface do Módulo de Orçamentos

### Identificação Visual
- Orçamentos do portal público têm badge **"Portal Público"**
- Antes da aprovação do cliente, dados sensíveis ficam protegidos
- Após aprovação, todos os dados ficam visíveis

### Status do Orçamento
1. **pending**: Criado automaticamente, aguarda processamento
2. **approved**: Cliente aprovou (pode gerar ordem de trabalho)
3. **rejected**: Cliente rejeitou
4. **canceled**: Cancelado

## 🔔 Sistema de Notificações

A oficina recebe notificações automáticas em dois momentos:

### 1. Orçamento Criado Automaticamente
```json
{
  "type": "budget_auto_created",
  "budgetId": "budget_xxx",
  "clientName": "João Silva",
  "licensePlate": "AA-00-BB",
  "serviceName": "Mudança de Óleo",
  "total": "55.35",
  "message": "Novo orçamento criado automaticamente: Mudança de Óleo - AA-00-BB"
}
```

**Ação ao clicar**: Redireciona para o módulo de Orçamentos

### 2. Agendamento Criado
```json
{
  "type": "appointment_scheduled",
  "appointmentId": "apt_xxx",
  "budgetId": "budget_xxx",
  "clientName": "João Silva",
  "licensePlate": "AA-00-BB",
  "serviceName": "Mudança de Óleo",
  "date": "2025-11-15",
  "time": "10:00",
  "message": "Novo agendamento: Mudança de Óleo - 2025-11-15 às 10:00"
}
```

**Ação ao clicar**: Redireciona para o módulo de Agenda

### Componentes Atualizados
- `/components/NotificationBell.tsx`: Adicionados handlers para novos tipos
- `/App.tsx`: Adicionada navegação automática ao clicar nas notificações

## 🚀 Próximos Passos Sugeridos

1. ~~**Notificações**: Avisar oficina quando novo orçamento automático é criado~~ ✅ **IMPLEMENTADO**
2. **Dashboard**: Mostrar estatísticas de conversão portal público → orçamentos
3. **Email**: Enviar confirmação ao cliente com detalhes do orçamento
4. **Workflow**: Criar ordem de trabalho automática quando agendamento é confirmado

## ⚠️ Notas Importantes

- A integração acontece **apenas** quando cliente agenda via portal público
- Orçamentos manuais da oficina continuam funcionando normalmente
- Sistema **nunca duplica** clientes ou veículos existentes
- Todos os registos têm campo `source: 'instant_quote'` para rastreamento
- O preço usado é sempre o da resposta validada pela oficina (não o preço base)

## 🔧 Manutenção

Para modificar a lógica de criação de orçamentos, editar:
- Arquivo: `/supabase/functions/server/quote_agenda_routes.tsx`
- Função: `app.post('/make-server-6971b43c/public/book-appointment')`
- Linhas: 1598-1700 (criação do budget)

## 🧪 Como Testar

### Passo 1: Portal Público
1. Aceder ao portal público
2. Inserir matrícula, código postal (4 dígitos), e selecionar serviço
3. Clicar em "Obter Orçamentos"
4. Verificar lista de oficinas disponíveis

### Passo 2: Selecionar Oficinas
1. Selecionar até 3 oficinas (checkboxes)
2. Clicar em "Enviar Pedido às Oficinas Selecionadas"
3. Sistema mostra mensagem de sucesso

### Passo 3: Oficina Valida
1. Login na oficina
2. Ir para "Gestão de Plataforma" → Tab "Pedidos de Orçamento"
3. Ver pedido na lista de pendentes
4. Clicar "Validar" ou "Modificar"
5. Inserir preço e duração (se modificar)
6. Enviar resposta

### Passo 4: Cliente Agenda
1. Voltar ao portal público ou área de cliente
2. Ver respostas das oficinas
3. Clicar "Agendar" na oficina desejada
4. Selecionar data e hora
5. Adicionar observações (opcional)
6. Confirmar agendamento

### Passo 5: Verificar Criação Automática
Na oficina, verificar que foram criados automaticamente:

#### Módulo de Clientes
- Ir para "Clientes"
- Procurar pelo email/nome do cliente
- Verificar tag "Portal Público"

#### Módulo de Veículos
- Ir para "Veículos"
- Procurar pela matrícula
- Verificar associação ao cliente
- Verificar tag "Portal Público"

#### Módulo de Orçamentos
- Ir para "Orçamentos"
- Verificar orçamento criado com:
  - Badge "Portal Público"
  - Cliente e veículo associados
  - Item com o serviço solicitado
  - Valor calculado com IVA
  - Status "Pendente"

#### Módulo de Agenda
- Ir para "Agenda"
- Verificar agendamento na data selecionada
- Verificar ligação ao orçamento (`budgetId`)

#### Notificações
- Verificar sino de notificações (canto superior direito)
- Ver 2 notificações não lidas:
  1. "💰 Orçamento Criado Automaticamente"
  2. "📅 Novo Agendamento"
- Clicar em cada notificação para testar navegação

### Passo 6: Logs do Sistema
No terminal do servidor (se tiver acesso), verificar logs:
```
📅 Booking appointment for request: wr_xxx
🔍 Checking if client exists...
✅ Client created automatically: client_xxx
🔍 Checking if vehicle exists...
✅ Vehicle created automatically: vehicle_xxx
💰 Creating budget automatically...
✅ Budget created automatically: budget_xxx
🔔 Notification created for budget: notif_xxx
✅ Notification created for appointment: notif_xxx
✅ Appointment booked: apt_xxx
✅ Integration complete - Client, Vehicle, and Budget created
```

## 🐛 Troubleshooting

### Cliente/Veículo não criados
- Verificar se já existem na base de dados (sistema evita duplicados)
- Verificar logs do servidor para erros
- Confirmar que `workshopId` está correto

### Orçamento não aparece
- Verificar se `budgetId` foi retornado na resposta do agendamento
- Ir para módulo de Orçamentos e procurar por matrícula
- Verificar tab "Todos" (não apenas "Pendentes")

### Notificações não aparecem
- Aguardar até 30 segundos (polling automático)
- Fazer refresh manual da página
- Verificar se websocket está ativo

### Valor do Orçamento errado
- Sistema usa o valor da resposta da oficina (`workshopResponse.price`)
- Se oficina não respondeu, preço pode ser 0
- Verificar que oficina validou/modificou o orçamento antes do cliente agendar

---

**Data de Implementação**: 10 de Novembro de 2025  
**Versão**: 1.0  
**Status**: ✅ Completamente Implementado e Funcional  
**Última Atualização**: 10 de Novembro de 2025

## 📝 Change Log

### v1.0.2 - 10 de Novembro de 2025 (Correção de Confidencialidade)
**Correção Crítica de Privacidade:**
1. ✅ **Proteção de dados do cliente no módulo "Gestão de Plataforma Pública"**: Enquanto o pedido de orçamento está pendente (antes da oficina responder), os dados pessoais do cliente (nome, email, telefone) ficam ocultos, mostrando apenas "Dados confidenciais - Visível após resposta"
2. ✅ **Apenas matrícula visível em pedidos pendentes**: A oficina vê apenas a matrícula do veículo, localização e serviço solicitado até validar/modificar o orçamento
3. ✅ **Dados revelados após resposta**: Após a oficina responder ao pedido (validar, modificar ou rejeitar), os dados completos do cliente ficam visíveis
4. ✅ **Diálogo de resposta protegido**: No diálogo onde a oficina responde ao pedido, o nome do cliente foi removido, mostrando apenas "Veículo: [matrícula] - [serviço]"

**Razão da Mudança:**
- Proteger a privacidade do cliente enquanto o pedido está sendo avaliado por múltiplas oficinas
- Evitar que oficinas não escolhidas tenham acesso aos dados pessoais do cliente
- Apenas após responder, a oficina demonstra interesse e pode ver os dados completos
- Mesmo ao responder, a oficina não precisa ver o nome do cliente imediatamente - apenas a matrícula é suficiente

---

### v1.0.1 - 10 de Novembro de 2025 (Correções)
**Correções de Bugs:**
1. ✅ **Interface TypeScript atualizada**: Adicionados tipos 'budget_auto_created' e 'appointment_scheduled' na interface `Notification`
2. ✅ **Prevenção de duplicação de orçamentos**: Sistema agora verifica se já existe um orçamento para o mesmo `publicQuoteRequestId` antes de criar um novo
3. ✅ **Campos adicionados à interface**: Adicionados campos `appointmentId`, `date`, `time`, `total` à interface `Notification` para suportar todos os dados das notificações

**Melhorias:**
- Logs mais detalhados quando orçamento já existe
- Notificação só é criada quando orçamento é realmente novo (não quando reutilizado)
- Melhor tratamento de casos onde cliente tenta agendar múltiplas vezes

---

### v1.0.0 - 10 de Novembro de 2025 (Lançamento Inicial)
- Implementação completa da integração automática Portal Público → Orçamentos
- Criação automática de Cliente, Veículo e Orçamento
- Sistema de notificações para oficina
- Navegação automática ao clicar em notificações