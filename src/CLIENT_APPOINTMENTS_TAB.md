# ✅ TAB AGENDAMENTOS NO PAINEL DO CLIENTE

## 🎯 FUNCIONALIDADE IMPLEMENTADA

Adicionada nova tab **"Agendamentos"** no Portal do Cliente que permite:

1. ✅ **Visualizar** todos os agendamentos confirmados (grid compacto 2 colunas)
2. ✅ **Ver detalhes completos** em dialog max-w-3xl (padrão da plataforma)
3. ✅ **Solicitar alteração de data** diretamente para a oficina
4. ✅ **Acompanhar status** do pedido de reagendamento
5. ✅ **Interface consistente** com resto da plataforma OficinasExpress

### 🎨 **DESIGN PATTERN:**
- **Cards Compactos:** Grid 2 colunas com informações essenciais
- **Dialog Grande:** max-w-3xl com scroll para detalhes completos
- **Botões de Ação:** "Ver Detalhes" + "Reagendar" lado a lado
- **Gradient Oficial:** `from-blue-600 to-orange-500` nos botões principais

---

## 📋 INTERFACE DO CLIENTE

### **Nova Tab "Agendamentos"**

Localização: Portal do Cliente → Tab "Agendamentos" (ícone de calendário)

```
┌─────────────────────────────────────────────────────┐
│  📄 Meus Pedidos | ▶️ Serviços | ✅ Terminados       │
│  💬 Mensagens | 📅 AGENDAMENTOS | 👤 Perfil          │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 VISUALIZAÇÃO DE AGENDAMENTOS

### **Card Compacto de Agendamento (Grid 2 colunas):**

```
┌─────────────────────────────────────────────┐
│ 🔧 Mudança de Óleo          [📅 Agendado]   │
│ 🏢 AutoOficina Lisboa                       │
├─────────────────────────────────────────────┤
│ 📅 15 jan  🕐 10:00  •  🚗 12-AB-34        │
│                                             │
│ [📄 Ver Detalhes]   [🕐 Reagendar]         │
└─────────────────────────────────────────────┘
```

### **Dialog de Detalhes Completos (max-w-3xl):**

Ao clicar "Ver Detalhes", abre dialog grande com TODAS as informações:

```
┌──────────────────────────────────────────────────────┐
│ 📅 Detalhes do Agendamento                           │
│ Informações completas e opções de reagendamento      │
├──────────────────────────────────────────────────────┤
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔧 Mudança de Óleo       [🟢 Confirmado]       │ │
│ │ 🏢 AutoOficina Lisboa                          │ │
│ │ ─────────────────────────────────────────────  │ │
│ │ 📅 Data: 15 de janeiro de 2025                │ │
│ │ 🕐 Hora: 10:00                                │ │
│ │ 🚗 Veículo: 12-AB-34                          │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📝 Observações do Cliente                      │ │
│ │ Trazer manual do veículo                       │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ℹ️ Mensagem da Oficina                         │ │
│ │ Agendamento confirmado. Não se esqueça do      │ │
│ │ documento de identificação.                     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ──────────────────────────────────────────────────  │
│                                                       │
│ 🕐 Solicitar Alteração de Data                       │
│                                                       │
│ [Calendário]           Nova Hora: [▼ 14:00]          │
│                        Motivo: [____________]         │
│                                                       │
│ ℹ️ A oficina será notificada do seu pedido          │
│                                                       │
│ [Fechar]    [🕐 Enviar Pedido de Reagendamento]     │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 SOLICITAR ALTERAÇÃO DE DATA

### **Botão:** "Solicitar Alteração de Data"

Ao clicar, abre dialog:

```
┌─────────────────────────────────────────────┐
│ 🕐 Solicitar Alteração de Data              │
│ Propor nova data e hora para o agendamento  │
├─────────────────────────────────────────────┤
│                                              │
│ Agendamento Atual:                           │
│ ┌─────────────────────────────────────────┐ │
│ │ 📅 15 de janeiro de 2025  🕐 10:00      │ │
│ │ 🔧 Mudança de Óleo                      │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ Nova Data Desejada:                          │
│ [Calendário interativo]                      │
│                                              │
│ Nova Hora Desejada:                          │
│ [▼ Selecione a hora]                         │
│   09:00                                      │
│   09:30                                      │
│   10:00                                      │
│   ...                                        │
│                                              │
│ Motivo da Alteração (Opcional):             │
│ ┌─────────────────────────────────────────┐ │
│ │ Ex: Tenho um compromisso nesse horário  │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ℹ️ A oficina será notificada do seu pedido │
│    e entrará em contacto para confirmar a   │
│    nova data.                                │
│                                              │
│ [Cancelar]         [🕐 Enviar Pedido]       │
└─────────────────────────────────────────────┘
```

---

## 📊 ESTADOS DO AGENDAMENTO

### **Badge de Status:**

| Status | Badge | Descrição |
|--------|-------|-----------|
| `scheduled` | 🔵 Agendado | Agendamento confirmado pela oficina |
| `confirmed` | 🟢 Confirmado | Oficina confirmou a data |
| `rescheduled` | 🟠 Reagendado | Agendamento foi reagendado |
| `pending_reschedule` | 🟡 Reagendamento Pendente | Cliente solicitou nova data |

---

## 🔄 FLUXO DE REAGENDAMENTO

### **1. Cliente Solicita:**

```
Cliente → Clica "Solicitar Alteração de Data"
       → Escolhe nova data e hora
       → Adiciona motivo (opcional)
       → Clica "Enviar Pedido"
```

### **2. Sistema Processa:**

```
✅ Atualiza appointment_request:
   - rescheduleRequest: { requestedDate, requestedTime, notes }
   - status: 'pending_reschedule'

✅ Cria notificação para oficina:
   - "João Silva solicitou reagendamento para 20/01/2025 às 14:00"

✅ Cliente vê aviso amarelo:
   - "Pedido de Reagendamento Enviado"
   - "Nova data solicitada: 20 de janeiro às 14:00"
```

### **3. Oficina Responde:**

A oficina recebe notificação e pode:
- ✅ Aceitar nova data → Status volta para 'confirmed'
- 🔄 Propor data alternativa → Status 'rescheduled'
- ❌ Recusar → Cliente é notificado

---

## 🗄️ ESTRUTURA DE DADOS

### **appointment_request com reschedule:**

```typescript
{
  id: "appt_req_123",
  clientEmail: "cliente@email.com",
  clientName: "João Silva",
  workshopId: "workshop_uuid",
  serviceName: "Mudança de Óleo",
  licensePlate: "12-AB-34",
  
  // Data confirmada
  confirmedDate: "2025-01-15",
  confirmedTime: "10:00",
  status: "pending_reschedule",  // ⭐ Mudou de 'confirmed' para 'pending_reschedule'
  
  // ⭐ Novo campo
  rescheduleRequest: {
    requestedDate: "2025-01-20",
    requestedTime: "14:00",
    notes: "Tenho um compromisso às 10:00",
    requestedAt: "2025-01-10T15:30:00.000Z"
  },
  
  notes: "Trazer manual do veículo",
  responseNotes: "Agendamento confirmado",
  createdAt: "2025-01-05T10:00:00.000Z",
  updatedAt: "2025-01-10T15:30:00.000Z"
}
```

### **Notificação para Oficina:**

```typescript
notification:workshop:workshopId:notif_123 = {
  id: "notif_123",
  type: "reschedule_request",
  appointmentId: "appt_req_123",
  clientName: "João Silva",
  clientEmail: "cliente@email.com",
  serviceName: "Mudança de Óleo",
  
  // Dados atuais
  currentDate: "2025-01-15",
  currentTime: "10:00",
  
  // Dados solicitados
  requestedDate: "2025-01-20",
  requestedTime: "14:00",
  notes: "Tenho um compromisso às 10:00",
  
  title: "Pedido de Reagendamento",
  message: "João Silva solicitou reagendamento para 2025-01-20 às 14:00",
  createdAt: "2025-01-10T15:30:00.000Z",
  read: false
}
```

---

## 🔧 ENDPOINTS CRIADOS

### **1. GET /client/appointments**

Carrega todos os agendamentos do cliente.

**Request:**
```bash
GET /make-server-6971b43c/client/appointments
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "appointments": [
    {
      "id": "appt_req_123",
      "workshopName": "AutoOficina Lisboa",
      "serviceName": "Mudança de Óleo",
      "licensePlate": "12-AB-34",
      "confirmedDate": "2025-01-15",
      "confirmedTime": "10:00",
      "status": "confirmed",
      "notes": "Trazer manual",
      "responseNotes": "Confirmado",
      "rescheduleRequest": null
    }
  ]
}
```

**Logs:**
```javascript
📅 CLIENT: Loading appointments for: cliente@email.com
   Found 3 appointment requests
   2 are confirmed/rescheduled
✅ CLIENT: Returning 2 appointments
```

---

### **2. POST /client/appointments/reschedule-request**

Cliente solicita reagendamento.

**Request:**
```bash
POST /make-server-6971b43c/client/appointments/reschedule-request
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "appointmentId": "appt_req_123",
  "requestedDate": "2025-01-20",
  "requestedTime": "14:00",
  "notes": "Tenho um compromisso às 10:00"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pedido de reagendamento enviado com sucesso"
}
```

**Logs:**
```javascript
📅 CLIENT: Reschedule request: {
  clientEmail: "cliente@email.com",
  appointmentId: "appt_req_123",
  requestedDate: "2025-01-20",
  requestedTime: "14:00"
}
✅ CLIENT: Reschedule request created for appointment appt_req_123
```

---

## 🧪 COMO TESTAR

### **TESTE 1: Ver Agendamentos**

1. **Login como Cliente**
   - Email que já tem agendamento confirmado

2. **Ir para Tab "Agendamentos"**
   - Deve aparecer na barra de tabs

3. **Verificar Lista**
   - Cards com todos os agendamentos
   - Status correto (Agendado, Confirmado, etc.)
   - Data, hora, serviço visíveis

**Verificar logs:**
```javascript
📅 CLIENT: Loading appointments for: cliente@email.com
   Found X appointment requests
   Y are confirmed/rescheduled
✅ CLIENT: Returning Y appointments
```

---

### **TESTE 2: Solicitar Alteração**

1. **Cliente:** Clica "Solicitar Alteração de Data"

2. **Dialog Abre:**
   - Mostra agendamento atual
   - Calendário para nova data
   - Dropdown para nova hora

3. **Preencher:**
   - Escolher nova data (ex: 20 Jan)
   - Escolher nova hora (ex: 14:00)
   - Adicionar motivo (opcional)

4. **Enviar Pedido:**
   - Toast: "✅ Pedido de reagendamento enviado!"
   - Card atualiza com aviso amarelo
   - Badge muda para "Reagendamento Pendente"

5. **Verificar Notificação da Oficina:**
   - Login como oficina
   - Deve ter notificação nova
   - Tipo: "Pedido de Reagendamento"

**Verificar logs:**
```javascript
📅 CLIENT: Reschedule request: {...}
✅ CLIENT: Reschedule request created for appointment appt_req_123
```

---

### **TESTE 3: Aviso no Card**

Após solicitar reagendamento, o card deve mostrar:

```
┌─────────────────────────────────────────────┐
│ ⚠️ Pedido de Reagendamento Enviado          │
│ Nova data solicitada: 20 de janeiro às 14:00│
│ Motivo: Tenho um compromisso às 10:00       │
└─────────────────────────────────────────────┘
```

---

## 🎨 COMPONENTES UTILIZADOS

### **Importações Adicionadas:**

```typescript
import { Calendar as CalendarComponent } from './ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { DialogFooter } from './ui/dialog'
```

### **Ícones:**

- `Calendar` - Tab e cards de agendamento
- `Clock` - Hora e botão de reagendamento
- `Wrench` - Serviço
- `Building2` - Oficina
- `Car` - Veículo
- `FileText` - Observações
- `AlertCircle` - Avisos
- `CheckCircle` - Status confirmado

---

## 📊 ESTADOS E VALIDAÇÕES

### **Estado do Dialog:**

```typescript
const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
const [rescheduleTime, setRescheduleTime] = useState('')
const [rescheduleNotes, setRescheduleNotes] = useState('')
```

### **Validações:**

1. ✅ Data deve ser futura (calendário bloqueia datas passadas)
2. ✅ Hora deve ser selecionada
3. ✅ Motivo é opcional
4. ✅ Botão "Enviar" desabilitado se falta data ou hora

### **Horários Disponíveis:**

Gerados automaticamente de 09:00 às 18:00 em intervalos de 30 minutos:
- 09:00, 09:30, 10:00, 10:30, ...
- Até 18:00

---

## 🔔 NOTIFICAÇÕES

### **Cliente recebe toast:**

✅ Sucesso:
```
"✅ Pedido de reagendamento enviado! A oficina será notificada."
```

❌ Erro:
```
"Preencha a data e hora desejadas"
"Erro ao solicitar reagendamento"
```

### **Oficina recebe notificação:**

```
🔔 Pedido de Reagendamento
João Silva solicitou reagendamento para 20/01/2025 às 14:00
```

---

## 🔄 INTEGRAÇÃO COM SISTEMA EXISTENTE

### **Compatível com:**

✅ Sistema de Pedidos de Agendamento
✅ WorkshopAppointmentRequestsModule
✅ Agenda Avançada da Oficina
✅ Sistema de Notificações

### **Fluxo Completo:**

```
1. Cliente solicita orçamento
   ↓
2. Escolhe 3 oficinas
   ↓
3. Oficinas respondem
   ↓
4. Cliente escolhe oficina
   ↓
5. Cliente agenda serviço
   ↓
6. Oficina confirma → Aparece em "Agendamentos" do Cliente ⭐ NOVO
   ↓
7. Cliente pode solicitar alteração ⭐ NOVO
   ↓
8. Oficina recebe notificação
   ↓
9. Oficina aceita/propõe nova data
   ↓
10. Cria entrada na Agenda Avançada automaticamente
```

---

## 🎯 BENEFÍCIOS

### **Para o Cliente:**

- ✅ **Visibilidade** total dos agendamentos
- ✅ **Autonomia** para solicitar mudanças
- ✅ **Transparência** no processo
- ✅ **Facilidade** de acompanhamento

### **Para a Oficina:**

- ✅ **Organização** centralizada
- ✅ **Comunicação** clara com cliente
- ✅ **Flexibilidade** de reagendamento
- ✅ **Histórico** completo

### **Para o Sistema:**

- ✅ **Rastreabilidade** total
- ✅ **Notificações** bidirecionais
- ✅ **Integração** perfeita
- ✅ **Logs** detalhados

---

## 📝 NOTAS IMPORTANTES

### **❗ Botão só aparece para agendamentos válidos:**

```typescript
{(appointment.status === 'scheduled' || appointment.status === 'confirmed') 
  && !appointment.rescheduleRequest && (
  <Button onClick={() => handleRequestReschedule(appointment)}>
    Solicitar Alteração de Data
  </Button>
)}
```

- ✅ Mostra se: status é 'scheduled' ou 'confirmed'
- ❌ Esconde se: já existe pedido de reagendamento pendente

### **❗ Calendário bloqueia datas passadas:**

```typescript
<CalendarComponent
  disabled={(date) => date < new Date()}
/>
```

### **❗ Apenas agendamentos confirmados aparecem:**

```typescript
const confirmedAppointments = clientAppointmentRequests.filter(
  (req: any) => req.status === 'confirmed' || req.status === 'rescheduled'
)
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Nova tab "Agendamentos" adicionada
- [x] Ícone Calendar no TabsTrigger
- [x] Interface de visualização de agendamentos
- [x] Cards com informações completas
- [x] Badges de status (Agendado, Confirmado, etc.)
- [x] Botão "Solicitar Alteração de Data"
- [x] Dialog de reagendamento
- [x] Calendário interativo
- [x] Dropdown de horários
- [x] Campo de motivo (opcional)
- [x] Endpoint GET /client/appointments
- [x] Endpoint POST /client/appointments/reschedule-request
- [x] Notificação para oficina
- [x] Aviso no card após solicitar
- [x] Validações de data e hora
- [x] Logs detalhados
- [x] Toast notifications
- [x] Refresh automático após envio

---

## 🚀 PRÓXIMOS PASSOS

1. **Testar fluxo completo:**
   - Cliente vê agendamentos
   - Solicita alteração
   - Oficina recebe notificação

2. **Verificar integração:**
   - Notificação aparece no painel da oficina
   - Oficina pode responder ao pedido

3. **Melhorias futuras:**
   - Permitir cancelamento de agendamento
   - Histórico de alterações
   - Chat direto com oficina sobre o agendamento

---

**FUNCIONALIDADE COMPLETA E TESTÁVEL! 🎉**

O cliente agora tem controle total sobre seus agendamentos e pode solicitar alterações de forma simples e intuitiva.
