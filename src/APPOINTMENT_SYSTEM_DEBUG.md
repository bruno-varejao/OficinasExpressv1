# 🔧 DEBUG: Sistema de Pedidos de Agendamento

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Fluxo Completo Cliente → Oficina**

```
Cliente (Portal Público)
   ↓
Escolhe oficina e agenda
   ↓
Backend cria:
   • appointment_request:ID
   • workshop_appointment_requests:workshopId (array)
   • notification:workshop:workshopId:notificationId
   ↓
Oficina (Painel Admin)
   • Menu: "Pedidos de Agendamento"
   • Vê pedidos pendentes
   • Confirma/Reagenda/Rejeita
   ↓
Cliente recebe notificação da resposta
```

---

## 🧪 COMO TESTAR AGORA

### **PASSO 1: Cliente Escolhe Oficina**

1. **Abrir Portal do Cliente**
2. **Login como cliente** (criar conta se necessário)
3. **Criar pedido de orçamento**
4. **Esperar respostas das oficinas**
5. **Clicar "Escolher"** numa oficina
6. **Preencher data/hora preferida**
7. **Clicar "Confirmar Agendamento"**

**Na Consola do Browser (Cliente):**
```javascript
🏭 CLIENT: Opening appointment dialog for workshop: {...}
📅 CLIENT: Confirming appointment: {...}
📡 CLIENT: Appointment response status: 200
✅ Toast: "Pedido de agendamento enviado..."
```

---

### **PASSO 2: Backend Processa**

**Na Consola do Servidor (Ver logs do Supabase):**
```javascript
👍 Client approving workshop: {...}
📝 Creating appointment request: {...}
📋 Current appointment requests for workshop: X
✅ Added appointment to workshop list. Total now: X+1
🔔 Creating notification: {...}
✅ Workshop approved successfully (NEW SYSTEM)
```

---

### **PASSO 3: Oficina Vê Pedido**

1. **Login no Painel Admin da Oficina**
2. **Clicar no menu "Pedidos de Agendamento"**
3. **Deve aparecer o novo pedido na tab "Pendentes"**

**Se NÃO aparecer:**

#### **A. Clicar no botão "Debug"** (novo botão ao lado de "Atualizar")

**Na Consola do Browser (Oficina):**
```javascript
📅 WORKSHOP: Loading appointment requests...
📡 WORKSHOP: Response status: 200
✅ WORKSHOP: Loaded appointments: X
📋 WORKSHOP: First appointment: {...}

🐛 ==================== DEBUG START ====================
🔍 DEBUG DATA: {
  workshopId: "...",
  appointmentIdsCount: X,
  appointmentsForThisWorkshop: X,
  workshopAppointmentDetails: [...],
  notificationsCount: X
}
🐛 ==================== DEBUG END ====================
```

---

## 🔍 ANÁLISE DOS LOGS DE DEBUG

### **Se `appointmentIdsCount = 0`**
❌ **Problema:** Array de IDs não está a ser criado
→ Verificar logs do backend ao criar pedido

### **Se `appointmentIdsCount > 0` mas `appointmentsForThisWorkshop = 0`**
❌ **Problema:** IDs existem mas dados não foram salvos
→ Bug na criação do `appointment_request:ID`

### **Se `appointmentsForThisWorkshop > 0` mas módulo não mostra**
❌ **Problema:** Endpoint não está a retornar corretamente
→ Verificar logs: `📅 Loading appointment requests for workshop`

### **Se tudo tem dados mas módulo vazio**
❌ **Problema:** Frontend não está a renderizar
→ Verificar React state e rendering

---

## 📍 ENDPOINTS CRIADOS

### **Cliente:**
- `POST /client/approve-workshop` - Cliente escolhe oficina e agenda

### **Oficina:**
- `GET /workshop/appointment-requests` - Carregar pedidos
- `POST /workshop/respond-appointment` - Confirmar/Reagendar/Rejeitar
- `GET /debug/workshop-appointments` - Debug completo

---

## 🎯 ESTRUTURA DE DADOS

### **appointment_request:ID**
```json
{
  "id": "appt_req_1731234567890_abc123",
  "quoteRequestId": "qr_...",
  "workshopId": "uuid-da-oficina",
  "clientName": "João Silva",
  "clientEmail": "joao@example.com",
  "clientPhone": "912345678",
  "licensePlate": "AB-12-CD",
  "serviceName": "Mudança de Óleo",
  "serviceId": "service-123",
  "preferredDate": "2025-01-15",
  "preferredTime": "10:00",
  "notes": "Observações opcionais",
  "status": "pending_confirmation",
  "createdAt": "2025-01-10T10:00:00.000Z"
}
```

### **workshop_appointment_requests:workshopId**
```json
[
  "appt_req_1731234567890_abc123",
  "appt_req_1731234567891_def456",
  "appt_req_1731234567892_ghi789"
]
```

### **notification:workshop:workshopId:notificationId**
```json
{
  "id": "notif_1731234567890_xyz",
  "type": "client_chose_workshop",
  "workshopId": "uuid-da-oficina",
  "appointmentRequestId": "appt_req_...",
  "clientName": "João Silva",
  "serviceName": "Mudança de Óleo",
  "preferredDate": "2025-01-15",
  "preferredTime": "10:00",
  "read": false,
  "createdAt": "2025-01-10T10:00:00.000Z"
}
```

---

## 🚨 POSSÍVEIS PROBLEMAS

### **1. Módulo não aparece no menu**
✅ **Solução:** Ativar módulo nas configurações da oficina
- Ir a "Configurações" → "Módulos Ativos"
- Ativar "appointmentrequests"

### **2. Erro 404 ao carregar pedidos**
✅ **Solução:** Endpoint pode não estar registado
- Verificar se servidor reiniciou após adicionar rotas

### **3. Notificação não aparece**
✅ **Solução:** Sistema de notificações usa outra estrutura
- Verificar `NotificationBell` component
- Click na notificação deve redirecionar para módulo

### **4. WorkshopId incorreto**
✅ **Solução:** Verificar `user.user_metadata.workshopId`
- Fazer login novamente
- Verificar token de autenticação

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Endpoint `/client/approve-workshop` criado
- [x] Cria `appointment_request:ID`
- [x] Adiciona ID ao array `workshop_appointment_requests:workshopId`
- [x] Cria notificação `notification:workshop:...`
- [x] Endpoint `/workshop/appointment-requests` criado
- [x] Carrega array de IDs
- [x] Busca cada `appointment_request:ID`
- [x] Retorna lista completa
- [x] Componente `WorkshopAppointmentRequestsModule` criado
- [x] Import no `App.tsx`
- [x] Adicionado ao menu lateral
- [x] Adicionado ao switch de navegação
- [x] Tabs: Pendentes / Confirmados / Rejeitados
- [x] Dialog de resposta (Confirmar/Reagendar/Rejeitar)
- [x] Endpoint `/workshop/respond-appointment` criado
- [x] Atualiza status do pedido
- [x] Cria notificação para cliente
- [x] Logs detalhados em todo o fluxo
- [x] Botão de debug no frontend
- [x] Endpoint de debug `/debug/workshop-appointments`

---

## 📝 PRÓXIMOS PASSOS

1. **Testar fluxo completo** seguindo os passos acima
2. **Verificar logs** em cada etapa
3. **Usar botão Debug** se necessário
4. **Reportar resultados** com prints dos logs
5. **Corrigir bugs** específicos encontrados

---

## 🎓 COMO INTERPRETAR OS LOGS

### **✅ Sucesso:**
```
📝 Creating appointment request: {...}
✅ Added appointment to workshop list. Total now: 1
🔔 Creating notification: {...}
✅ Workshop approved successfully

📅 WORKSHOP: Loading appointment requests...
   🔑 Looking for key: workshop_appointment_requests:uuid
   📋 Found 1 appointment request IDs: ["appt_req_..."]
   🔍 Loading appointment: appt_req_...
      ✅ Loaded: {...}
✅ Returning 1 appointment requests
```

### **❌ Problema - Array vazio:**
```
📅 WORKSHOP: Loading appointment requests...
   🔑 Looking for key: workshop_appointment_requests:uuid
   📋 Found 0 appointment request IDs: []
✅ Returning 0 appointment requests
```
→ Nenhum pedido foi criado OU workshopId diferente

### **❌ Problema - ID existe mas dados não:**
```
📅 WORKSHOP: Loading appointment requests...
   📋 Found 1 appointment request IDs: ["appt_req_..."]
   🔍 Loading appointment: appt_req_...
      ❌ Not found!
✅ Returning 0 appointment requests
```
→ ID foi adicionado ao array mas `appointment_request:ID` não foi criado

---

**TESTE AGORA E REPORTE OS RESULTADOS! 🚀**
