# ✅ PEDIDO DE REAGENDAMENTO - FLUXO COMPLETO

## 🎯 PROBLEMA RESOLVIDO

**ANTES:** Quando o cliente solicitava alteração de data de um agendamento já confirmado, o pedido não aparecia na área "Pedidos Pendentes" da oficina.

**DEPOIS:** Pedidos de reagendamento agora aparecem corretamente na tab "Pendentes" com destaque visual especial mostrando data atual vs nova data solicitada.

---

## 🔄 FLUXO COMPLETO

### **1. CLIENTE SOLICITA REAGENDAMENTO**

```
Cliente Portal → Tab "Agendamentos"
  → Ver Detalhes de agendamento confirmado
  → Escolhe nova data (ex: 20 Jan, 14:00)
  → Adiciona motivo (opcional)
  → Clica "Enviar Pedido de Reagendamento"
```

**Sistema atualiza:**
```javascript
appointment_request:appt_123 = {
  status: 'pending_reschedule',  // ⭐ Mudou de 'confirmed'
  confirmedDate: '2025-01-15',   // Data original mantida
  confirmedTime: '10:00',
  rescheduleRequest: {           // ⭐ Novo campo
    requestedDate: '2025-01-20',
    requestedTime: '14:00',
    notes: 'Tenho um compromisso às 10:00',
    requestedAt: '2025-01-10T15:30:00Z'
  }
}
```

---

### **2. OFICINA VÊ PEDIDO NA TAB "PENDENTES"**

O pedido agora **aparece automaticamente** porque o filtro foi atualizado:

```typescript
// ANTES:
const pendingAppointments = appointments.filter(
  a => a.status === 'pending_confirmation'
)

// DEPOIS:
const pendingAppointments = appointments.filter(
  a => a.status === 'pending_confirmation' || a.status === 'pending_reschedule'
)
```

---

## 🎨 VISUALIZAÇÃO NA OFICINA

### **Card na Tab "Pendentes":**

```
┌─────────────────────────────────────────────────────┐
│ [🔄 Pedido de Reagendamento]    10 jan 15:30       │
│ Mudança de Óleo                                     │
├─────────────────────────────────────────────────────┤
│ 🚗 12-AB-34                                         │
│ 👤 João Silva | ☎️ 912345678 | ✉️ joao@email.com   │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 📅 Data Atual (Confirmada anteriormente)       │ │
│ │ 📅 15 de janeiro de 2025  🕐 10:00             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🔄 Nova Data Solicitada pelo Cliente          │ │
│ │ 📅 20 de janeiro de 2025  🕐 14:00 ⭐          │ │
│ │ ─────────────────────────────────────────────  │ │
│ │ Motivo: Tenho um compromisso às 10:00         │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ 📝 Notas do Cliente: Trazer manual do veículo      │
│                                                     │
│ [✅ Responder ao Pedido]                            │
└─────────────────────────────────────────────────────┘
```

---

## 🖥️ DIALOG DE RESPOSTA

Ao clicar "Responder ao Pedido", abre dialog:

```
┌─────────────────────────────────────────────────┐
│ 🔄 Pedido de Reagendamento                      │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌───────────────────────────────────────────┐   │
│ │ Cliente: João Silva                       │   │
│ │ Matrícula: 12-AB-34                       │   │
│ │ Serviço: Mudança de Óleo                  │   │
│ │ ───────────────────────────────────────── │   │
│ │ 📅 Data Atual (Confirmada):               │   │
│ │ 15 de janeiro de 2025 às 10:00            │   │
│ │ ───────────────────────────────────────── │   │
│ │ 🔄 Nova Data Solicitada pelo Cliente:     │   │
│ │ 20 de janeiro de 2025 às 14:00 ⭐         │   │
│ │ Motivo: Tenho um compromisso às 10:00     │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Ação:                                            │
│ [✅ Confirmar] [📅 Reagendar] [❌ Rejeitar]      │
│                                                  │
│ Data e Hora: [20/01/2025] [14:00] ⭐ Pré-preenchido
│                                                  │
│ Notas: [________________________]                │
│                                                  │
│ [Cancelar]           [✅ Enviar Resposta]       │
└─────────────────────────────────────────────────┘
```

**Campo de data/hora é PRÉ-PREENCHIDO com a nova data solicitada!**

---

## 🔧 MUDANÇAS IMPLEMENTADAS

### **1. Interface Atualizada**

```typescript
interface AppointmentRequest {
  // ... campos existentes
  status: 'pending_confirmation' | 'confirmed' | 'rescheduled' | 'rejected' | 'pending_reschedule'  // ⭐ Novo status
  rescheduleRequest?: {  // ⭐ Novo campo
    requestedDate: string
    requestedTime: string
    notes?: string
    requestedAt: string
  }
}
```

---

### **2. Badge Novo Status**

```typescript
case 'pending_reschedule':
  return <Badge className="bg-orange-100 text-orange-800">
    <RefreshCw className="h-3 w-3 mr-1" />
    Pedido de Reagendamento
  </Badge>
```

---

### **3. Filtro Atualizado**

```typescript
// Agora inclui pedidos de reagendamento
const pendingAppointments = appointments.filter(
  a => a.status === 'pending_confirmation' || a.status === 'pending_reschedule'
)
```

---

### **4. Visualização Condicional no Card**

```typescript
{appointment.status === 'pending_reschedule' && appointment.rescheduleRequest ? (
  <>
    {/* Mostra data atual (cinza) */}
    <div className="bg-gray-100">
      📅 Data Atual: 15 jan às 10:00
    </div>
    
    {/* Mostra nova data solicitada (laranja) */}
    <div className="bg-orange-50 border-2 border-orange-400">
      🔄 Nova Data: 20 jan às 14:00
      Motivo: ...
    </div>
  </>
) : (
  {/* Visualização normal para pedidos iniciais */}
  <div className="bg-blue-50">
    Data Solicitada: 15 jan às 10:00
  </div>
)}
```

---

### **5. Pré-preenchimento Inteligente**

```typescript
const handleOpenResponse = (appointment: AppointmentRequest) => {
  // Para pedidos de reagendamento, preenche com a NOVA data solicitada
  if (appointment.status === 'pending_reschedule' && appointment.rescheduleRequest) {
    setSelectedDate(new Date(appointment.rescheduleRequest.requestedDate))
    setSelectedTime(appointment.rescheduleRequest.requestedTime)
  } else {
    // Para pedidos iniciais, preenche com data preferida
    setSelectedDate(new Date(appointment.preferredDate))
    setSelectedTime(appointment.preferredTime)
  }
}
```

---

### **6. Dialog com Contexto Visual**

```typescript
<DialogTitle>
  {appointment.status === 'pending_reschedule' ? (
    <>
      <RefreshCw className="h-5 w-5 text-orange-600" />
      Pedido de Reagendamento
    </>
  ) : (
    <>
      <CalendarCheck className="h-5 w-5 text-blue-600" />
      Responder ao Pedido de Agendamento
    </>
  )}
</DialogTitle>
```

---

## 📊 CORES E BADGES

| Status | Badge | Cor de Fundo | Ícone |
|--------|-------|--------------|-------|
| `pending_confirmation` | Pendente | Amarelo 🟡 | Clock |
| `pending_reschedule` | Pedido de Reagendamento | Laranja 🟠 | RefreshCw |
| `confirmed` | Confirmado | Verde 🟢 | CheckCircle |
| `rescheduled` | Reagendado | Azul 🔵 | CalendarCheck |
| `rejected` | Rejeitado | Vermelho 🔴 | XCircle |

---

## 🧪 COMO TESTAR

### **TESTE COMPLETO:**

1. **Login como Cliente** (que tem agendamento confirmado)

2. **Portal do Cliente → Tab "Agendamentos"**
   - Ver card com agendamento confirmado
   - Badge verde "Confirmado"

3. **Clicar "Ver Detalhes"**
   - Dialog abre com informações completas

4. **Solicitar Reagendamento:**
   - Escolher nova data (ex: 25 Jan)
   - Escolher nova hora (ex: 15:00)
   - Adicionar motivo: "Preciso mudar por compromisso"
   - Clicar "Enviar Pedido de Reagendamento"

5. **Verificar Toast:**
   - ✅ "Pedido de reagendamento enviado!"

6. **Verificar Card Atualizado:**
   - Badge muda para amarelo "Reagendamento Pendente"
   - Mostra aviso: "Nova data solicitada: 25 jan às 15:00"

7. **Login como Oficina**

8. **Pedidos de Agendamento → Tab "Pendentes"**
   - ⭐ **PEDIDO APARECE AQUI!**
   - Badge laranja "Pedido de Reagendamento"
   - Card mostra DUAS datas:
     - Data atual (cinza): 15 jan às 10:00
     - Nova data (laranja): 25 jan às 15:00
     - Motivo: "Preciso mudar por compromisso"

9. **Clicar "Responder ao Pedido"**
   - Dialog abre com título "🔄 Pedido de Reagendamento"
   - Resumo mostra ambas as datas
   - Campo de data/hora PRÉ-PREENCHIDO com 25 jan, 15:00 ⭐
   - Oficina pode:
     - ✅ Confirmar (aceita nova data)
     - 📅 Reagendar (propõe data alternativa)
     - ❌ Rejeitar

10. **Confirmar nova data:**
    - Clicar "Confirmar"
    - Enviar resposta
    - Pedido sai de "Pendentes"
    - Vai para "Confirmados" com nova data

---

## 🔔 NOTIFICAÇÕES

### **Cliente recebe:**
- ✅ Ao solicitar: "Pedido de reagendamento enviado!"

### **Oficina recebe:**
- 🔔 Notificação: "João Silva solicitou reagendamento para 25/01/2025 às 15:00"
- 📅 Pedido aparece automaticamente em "Pendentes"

---

## 📝 LOGS PARA DEBUG

### **Cliente solicita reagendamento:**
```javascript
📅 CLIENT: Reschedule request: {
  clientEmail: "joao@email.com",
  appointmentId: "appt_req_123",
  requestedDate: "2025-01-25",
  requestedTime: "15:00"
}
✅ CLIENT: Reschedule request created for appointment appt_req_123
```

### **Oficina carrega pedidos:**
```javascript
📅 WORKSHOP: Loading appointment requests...
📡 WORKSHOP: Response status: 200
✅ WORKSHOP: Loaded appointments: 3
📋 WORKSHOP: First appointment: {
  id: "appt_req_123",
  status: "pending_reschedule",
  rescheduleRequest: { ... }
}
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

- [x] Cliente pode solicitar reagendamento
- [x] Status muda para `pending_reschedule`
- [x] Campo `rescheduleRequest` é criado
- [x] Notificação enviada para oficina
- [x] Pedido aparece em "Pendentes" da oficina ⭐
- [x] Badge laranja "Pedido de Reagendamento"
- [x] Card mostra data atual + nova data solicitada
- [x] Dialog mostra título diferenciado
- [x] Dialog pré-preenche com nova data
- [x] Oficina pode confirmar/reagendar/rejeitar
- [x] Após resposta, cria entrada na Agenda Avançada

---

## 🎯 BENEFÍCIOS

### **Para o Cliente:**
- ✅ Pode solicitar mudança de data facilmente
- ✅ Vê status "Reagendamento Pendente" claramente
- ✅ Oficina recebe notificação automática

### **Para a Oficina:**
- ✅ Pedido aparece automaticamente em "Pendentes"
- ✅ Visualização clara: data atual vs nova data
- ✅ Campo pré-preenchido com nova data solicitada
- ✅ Pode aceitar, propor alternativa ou rejeitar
- ✅ Integração automática com Agenda Avançada

---

## 🚀 PRÓXIMOS PASSOS

1. **Testar fluxo completo end-to-end**
2. **Verificar integração com Agenda Avançada**
3. **Confirmar notificações bidirecionais**
4. **Validar histórico de alterações**

---

**FUNCIONALIDADE COMPLETA E TESTÁVEL! 🎉**

Os pedidos de reagendamento agora aparecem corretamente na área de "Pedidos Pendentes" da oficina com destaque visual especial.
