# Sistema de Agendamento Integrado - OficinasExpress

## ✅ Implementado

### Backend - Endpoints Criados

1. **POST `/client/approve-workshop`** (Atualizado)
   - Agora aceita `preferredDate`, `preferredTime`, `notes`
   - Cria `appointment_request` com dados do agendamento
   - Status: `pending_confirmation`, `confirmed`, `rejected`, `rescheduled`
   - Notificação automática para oficina

2. **GET `/workshop/appointment-requests`**
   - Lista pedidos de agendamento da oficina
   - Requer autenticação da oficina

3. **POST `/workshop/appointment-requests/:requestId/respond`**
   - Oficina pode: `confirm`, `reschedule`, `reject`
   - Cria notificação para cliente com resposta

### Frontend - Componentes Criados

1. **`AppointmentSchedulingDialog.tsx`** ✅
   - Diálogo para cliente escolher data/hora
   - Calendário interativo (bloqueia domingos e passado)
   - Seleção de hora (slots de 30min, 9h-18h)
   - Campo de notas adicionais

2. **`ClientPortal.tsx`** ✅ (Atualizado)
   - Função `handleApproveWorkshop` abre diálogo
   - Função `handleConfirmAppointment` envia dados
   - Estados para controlar diálogo

## 📋 Próximos Passos - A Implementar

### 1. Componente de Gestão de Agendamentos (Oficina)

Criar `/components/WorkshopAppointmentRequestsModule.tsx`:

```tsx
interface AppointmentRequest {
  id: string
  quoteRequestId: string
  workshopId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  licensePlate: string
  serviceName: string
  preferredDate: string
  preferredTime: string
  notes?: string
  status: 'pending_confirmation' | 'confirmed' | 'rescheduled' | 'rejected'
  confirmedDate?: string
  confirmedTime?: string
  responseNotes?: string
  createdAt: string
  respondedAt?: string
}
```

**Features**:
- Lista de pedidos pendentes
- Cards com:
  - Dados do cliente (nome, telefone, email)
  - Veículo (matrícula)
  - Serviço
  - Data/hora preferida pelo cliente
  - Notas do cliente
- Ações:
  - ✅ **Confirmar** (mesma data/hora)
  - 📅 **Reagendar** (propor nova data/hora)
  - ❌ **Rejeitar** (com motivo)
- Histórico de agendamentos confirmados

### 2. Integração com Módulo de Agenda

**Quando oficina confirma agendamento**:
- Criar slot automaticamente no `AgendaModule`
- Criar booking na agenda
- Verificar disponibilidade antes de confirmar
- Marcar slot como ocupado

**Campos a sincronizar**:
```tsx
{
  date: confirmedDate,
  time: confirmedTime,
  clientName,
  licensePlate,
  serviceName,
  serviceId,
  duration: estimatedDuration, // do workshop_request
  source: 'instant_quote'
}
```

### 3. Sistema de Notificações Atualizado

**Para Cliente**:
- 🔔 "Oficina confirmou agendamento para DD/MM às HH:MM"
- 🔔 "Oficina propôs reagendamento para DD/MM às HH:MM"  
- 🔔 "Oficina rejeitou agendamento: [motivo]"

**Para Oficina**:
- 🔔 "Novo pedido de agendamento de [Cliente] para DD/MM às HH:MM"
- 🔔 "Cliente aceitou reagendamento"
- 🔔 "Cliente rejeitou reagendamento"

### 4. Fluxo Cliente Aceita/Rejeita Reagendamento

**Se oficina propõe nova data**:
- Cliente recebe notificação
- Pode aceitar ou rejeitar
- Se rejeitar, pode propor nova data
- Máximo 3 iterações, depois contacto direto

## 🎯 Fluxo Completo

```
1. Cliente solicita orçamento instantâneo
2. Recebe quotes de várias oficinas
3. Cliente seleciona oficina
4. 📅 NOVO: Cliente escolhe data/hora preferida no diálogo
5. 🔔 Oficina recebe notificação com pedido de agendamento
6. Oficina vê pedido no módulo de agendamentos
7. Oficina pode:
   a) Confirmar → Cria evento na agenda
   b) Reagendar → Cliente recebe nova proposta
   c) Rejeitar → Cliente informado
8. 🔔 Cliente recebe resposta
9. Se confirmado → Aparece na agenda da oficina
10. Cliente recebe lembrete 24h antes
```

## 🔧 Código a Adicionar

### ClientPortal.tsx - Adicionar no JSX (antes do fechamento)

```tsx
{/* Appointment Scheduling Dialog */}
{selectedWorkshopForAppointment && (
  <AppointmentSchedulingDialog
    open={showAppointmentDialog}
    onOpenChange={setShowAppointmentDialog}
    workshopName={selectedWorkshopForAppointment.workshopName}
    serviceName={selectedWorkshopForAppointment.serviceName}
    onConfirm={handleConfirmAppointment}
    loading={approvingWorkshop === selectedWorkshopForAppointment.workshopId}
  />
)}
```

### WorkshopQuoteRequestsModule.tsx - Atualizar Escolhidos Tab

Adicionar botão "Ver Agendamento" para pedidos escolhidos que já têm data/hora confirmada.

## 📊 Base de Dados (KV Store)

### Novas Keys:

- `appointment_request:{id}` - Dados do pedido de agendamento
- `workshop_appointment_requests:{workshopId}` - Array de IDs de pedidos
- `notification:workshop:{workshopId}:{notifId}` - Notificações de agendamento

### Estrutura AppointmentRequest:

```json
{
  "id": "appt_req_...",
  "quoteRequestId": "qr_...",
  "workshopId": "ws_...",
  "clientName": "...",
  "clientEmail": "...",
  "clientPhone": "...",
  "licensePlate": "...",
  "serviceName": "...",
  "serviceId": "...",
  "preferredDate": "2025-01-15",
  "preferredTime": "10:30",
  "notes": "...",
  "status": "pending_confirmation",
  "createdAt": "2025-01-10T10:00:00Z",
  "respondedAt": null,
  "confirmedDate": null,
  "confirmedTime": null,
  "responseNotes": null
}
```

## Status

- [x] Backend endpoints criados
- [x] Dialog de agendamento criado
- [x] ClientPortal atualizado (estados e funções)
- [ ] ClientPortal - Adicionar JSX do diálogo
- [ ] Atualizar chamadas handleApproveWorkshop (adicionar serviceName)
- [x] Criar WorkshopAppointmentRequestsModule
- [x] ✅ **INTEGRADO COM AGENDAMODULE** - Confirmação automática cria entrada na agenda!
- [ ] Testar fluxo completo
