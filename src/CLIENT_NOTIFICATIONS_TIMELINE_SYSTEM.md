# Sistema de Notificações, Timeline e Estimativas - Área de Clientes

## ✅ Funcionalidades Implementadas

### 1. **Sistema de Notificações Automáticas**

Notificações em tempo real para clientes quando o estado do "Fluxo da Obra" muda.

#### Backend (index.tsx)
- **Endpoint**: `POST /make-server-6971b43c/service-sheet-status-history`
  - Registra mudanças de status automaticamente
  - Cria notificações para o cliente associado
  
- **Endpoint**: `GET /make-server-6971b43c/client/notifications`
  - Busca todas as notificações do cliente
  - Retorna contador de notificações não lidas
  
- **Endpoint**: `POST /make-server-6971b43c/client/notifications/:notificationId/read`
  - Marca uma notificação como lida
  
- **Endpoint**: `POST /make-server-6971b43c/client/notifications/read-all`
  - Marca todas as notificações como lidas

#### Frontend (ClientPortal.tsx)
- **Bell Icon** no header com badge de contagem de não lidas
- **Modal de Notificações** com lista ordenada por data
- **Click para marcar como lida** individualmente
- **Botão "Marcar todas como lidas"**
- **Formatação de timestamps** amigável (ex: "Há 2 horas", "Há 3 dias")

#### Mensagens de Notificação por Status
```javascript
{
  'reception': 'O seu veículo foi recebido na oficina',
  'diagnosis': 'Iniciámos o diagnóstico do seu veículo',
  'ordering': 'Estamos a encomendar as peças necessárias',
  'parts_arrival': 'As peças chegaram e vamos iniciar a reparação',
  'execution': 'Estamos a trabalhar no seu veículo',
  'delivery': 'O seu veículo está pronto para levantamento!',
  'completed': 'O serviço foi concluído com sucesso',
  'cancelled': 'O serviço foi cancelado'
}
```

---

### 2. **Timeline Visual Detalhada**

Mostra o histórico completo de mudanças de status do serviço.

#### Backend (index.tsx)
- **Endpoint**: `GET /make-server-6971b43c/service-sheet-status-history/:serviceSheetId`
  - Retorna todas as mudanças de status ordenadas por data
  - Inclui timestamp, status anterior e novo status

#### Frontend (ClientPortal.tsx)
- **Botão "Ver Histórico Completo"** em cada card de serviço
- **Modal com Timeline Visual**:
  - Linha temporal vertical com gradiente colorido
  - Cada mudança de status com:
    - Ícone e badge do status antigo → novo status
    - Timestamp formatado (relativo e absoluto)
    - Card com hover effect
  - Design moderno com shadow e transições suaves

#### Estrutura da Timeline
```
┌─────────────────────────────────────┐
│  Histórico do Serviço - FO #12345  │
│  VW Golf • AB-12-CD                 │
├─────────────────────────────────────┤
│  ● ─────────────────────────────   │
│  │  De: Diagnóstico → Execução     │
│  │  Há 2 horas • 05/11/2025 14:30  │
│  ●                                   │
│  │  De: Receção → Diagnóstico       │
│  │  Há 5 horas • 05/11/2025 11:15  │
│  ●                                   │
└─────────────────────────────────────┘
```

---

### 3. **Sistema de Estimativa de Tempo de Conclusão**

Calcula e exibe o tempo estimado restante para conclusão do serviço.

#### Lógica de Estimativa
```javascript
const estimatedDurations = {
  reception: 0.5,      // 30 minutos
  diagnosis: 2,        // 2 horas
  ordering: 24,        // 1 dia
  parts_arrival: 48,   // 2 dias
  execution: 4,        // 4 horas
  delivery: 0.5,       // 30 minutos
}
```

#### Cálculo
1. Identifica o status atual do serviço
2. Soma os tempos estimados das fases restantes
3. Formata o output:
   - Menos de 24h: "~4 horas"
   - Mais de 24h: "~2 dias"
   - Pronto para entrega: "Pronto para levantamento"

#### Exibição no Frontend
- Badge azul claro com ícone de relógio
- Aparece abaixo do "Fluxo da Obra"
- Apenas para serviços em andamento (não completed/cancelled)

---

### 4. **Auto-save de Mudanças de Status**

Registro automático quando o técnico muda o status no ServiceSheetModule.

#### ServiceSheetModule.tsx
- Função `updateWorkflowStatus()` atualizada
- Ao mudar status:
  1. Atualiza Work Order
  2. Registra mudança no histórico (POST /service-sheet-status-history)
  3. Sistema cria notificação automaticamente para o cliente
  
#### Fluxo Completo
```
Técnico muda status
      ↓
ServiceSheetModule registra mudança
      ↓
Backend cria entrada no histórico
      ↓
Backend cria notificação para cliente
      ↓
Cliente vê notificação + timeline atualizada
```

---

## 🎨 Design & UX

### Notificações
- **Não lidas**: Background azul claro + ponto azul
- **Lidas**: Background branco
- **Hover**: Transição suave de cores
- **Click**: Marca como lida automaticamente

### Timeline
- **Gradiente visual**: Azul → Roxo → Verde
- **Cards elevados**: Shadow e hover effects
- **Timestamps duplos**: Relativo + absoluto
- **Badges coloridos**: Por tipo de status

### Estimativas
- **Badge inline**: Integrado no card do serviço
- **Ícone de relógio**: Visual claro
- **Cores suaves**: Azul claro não invasivo

---

## 📊 Endpoints Criados

### Histórico de Status
- `POST /make-server-6971b43c/service-sheet-status-history`
- `GET /make-server-6971b43c/service-sheet-status-history/:serviceSheetId`

### Notificações de Clientes
- `GET /make-server-6971b43c/client/notifications`
- `POST /make-server-6971b43c/client/notifications/:notificationId/read`
- `POST /make-server-6971b43c/client/notifications/read-all`

---

## 🗄️ Estrutura de Dados

### Status History Entry
```typescript
{
  id: string
  serviceSheetId: string
  workOrderId: string
  clientId: string
  workshopId: string
  oldStatus: string
  newStatus: string
  changedBy: string
  timestamp: string
}
```

### Client Notification
```typescript
{
  id: string
  clientId: string
  workshopId: string
  workOrderId: string
  workOrderNumber: string
  type: 'status_change'
  title: string
  message: string
  newStatus: string
  read: boolean
  timestamp: string
}
```

---

## 🔄 Fluxo de Trabalho Completo

### Quando Técnico Muda Status (ex: Diagnóstico → Execução)

1. **ServiceSheetModule**
   - Técnico clica no badge de status
   - `updateWorkflowStatus('execution')` é chamado

2. **Backend - Service Sheet Update**
   - Work Order atualizada com novo status
   - Timer iniciado/parado conforme necessário

3. **Backend - History Recording**
   - Entrada criada em `ss_status_history:*`
   - Dados: oldStatus=diagnosis, newStatus=execution

4. **Backend - Notification Creation**
   - Busca clientId do Work Order
   - Cria notificação em `client_notification:*`
   - Mensagem: "Estamos a trabalhar no seu veículo"

5. **Cliente - Real-time Update**
   - Bell icon mostra contador (unreadCount++)
   - Timeline atualizada com nova entrada
   - Estimativa de tempo recalculada

6. **Cliente - Interação**
   - Clica no bell icon → vê notificação nova
   - Clica na notificação → marca como lida
   - Clica em "Ver Histórico" → vê timeline completa

---

## 🎯 Benefícios

### Para Clientes
✅ **Transparência total** no processo de reparação
✅ **Notificações em tempo real** de progresso
✅ **Estimativas realistas** de conclusão
✅ **Histórico completo** acessível a qualquer momento

### Para Oficinas
✅ **Comunicação automatizada** com clientes
✅ **Redução de chamadas telefónicas** para pedir atualizações
✅ **Profissionalismo aumentado** com transparência
✅ **Rastreabilidade completa** de todas as mudanças

### Para a Plataforma
✅ **Diferencial competitivo** vs. outros sistemas
✅ **Satisfação do cliente** aumentada
✅ **Dados valiosos** sobre tempos de serviço
✅ **Base para futuras features** (SLAs, alertas, etc.)

---

## 🚀 Próximas Melhorias Sugeridas

1. **Push Notifications** via browser/email quando status muda
2. **Chat direto** entre cliente e oficina
3. **Fotos do progresso** anexadas à timeline
4. **SLA tracking** com alertas se ultrapassar tempo estimado
5. **Avaliação do serviço** ao completar
6. **Previsão ML** de tempos baseada em histórico real

---

## 📱 Compatibilidade

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile (responsive design)
- ✅ Todos os browsers modernos

---

## 🔐 Segurança

- ✅ Autenticação obrigatória em todos os endpoints
- ✅ Clientes só veem seus próprios dados
- ✅ Filtro por email/userId para multi-tenant
- ✅ Validação de permissões em todas as operações

---

## ✨ Status

**IMPLEMENTADO E FUNCIONAL** ✅

Todas as 3 funcionalidades solicitadas foram implementadas com sucesso:
1. ✅ Notificações automáticas quando status muda
2. ✅ Timeline visual detalhada com histórico completo
3. ✅ Sistema de estimativa de tempo de conclusão

O sistema está pronto para uso em produção!
