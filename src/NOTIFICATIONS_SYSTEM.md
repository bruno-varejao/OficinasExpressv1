# Sistema de Notificações - OficinasExpress

## Visão Geral

Sistema completo de notificações implementado no painel de administração oficinal com sininho no canto superior direito.

## Funcionalidades

### 1. Sininho de Notificações
- **Localização**: Canto superior direito do header do painel oficinal
- **Indicador visual**: Badge com contagem de notificações não lidas (até 9+)
- **Polling automático**: Atualiza a cada 30 segundos
- **Design**: Integrado com o design da plataforma (gradiente azul-laranja)

### 2. Tipos de Notificações

#### 📬 Novo Pedido de Orçamento (`new_quote_request`)
- **Trigger**: Quando um cliente cria um pedido através do Portal Público
- **Título**: "Novo Pedido de Orçamento"
- **Mensagem**: "Novo pedido de orçamento do portal público: [Serviço] para [Matrícula]"
- **Ação**: Ao clicar, redireciona para página "Pedidos Plataforma"

#### ✅ Orçamento Aceite (`quote_accepted`)
- **Trigger**: Quando o cliente aceita/escolhe a oficina no seu portal
- **Título**: "Orçamento Aceite pelo Cliente"
- **Mensagem**: "O cliente [Nome] aceitou o seu orçamento para [Matrícula]"
- **Ação**: Ao clicar, redireciona para página "Orçamentos"

### 3. Popup de Notificações
- **Apresentação**: Lista ordenada por data (mais recentes primeiro)
- **Estados visuais**: 
  - Notificações não lidas: fundo azul claro + ponto azul
  - Notificações lidas: fundo branco + ponto cinza
- **Botão "Marcar todas como lidas"**: Marca todas de uma vez
- **Timestamp relativo**: "agora mesmo", "há 5 min", "há 2h", "ontem", etc.
- **Scroll**: Área rolável até 400px de altura

## Arquitetura Técnica

### Frontend

#### Componente: `NotificationBell.tsx`
```typescript
interface Notification {
  id: string
  type: 'new_quote_request' | 'quote_accepted'
  title: string
  message: string
  budgetId?: string
  read: boolean
  createdAt: string
}
```

**Props:**
- `accessToken`: Token de autenticação
- `workshopId`: ID da oficina
- `onNotificationClick`: Callback quando notificação é clicada

**Funcionalidades:**
- `fetchNotifications()`: Carrega notificações do servidor
- `markAsRead(id)`: Marca notificação individual como lida
- `markAllAsRead()`: Marca todas como lidas
- Polling automático a cada 30 segundos

### Backend

#### Rotas de API

**1. GET** `/make-server-6971b43c/workshops/:workshopId/notifications`
- Retorna lista de notificações da oficina
- Retorna contagem de não lidas
- Requer autenticação

**2. POST** `/make-server-6971b43c/workshops/:workshopId/notifications/:notificationId/read`
- Marca notificação específica como lida
- Requer autenticação

**3. POST** `/make-server-6971b43c/workshops/:workshopId/notifications/read-all`
- Marca todas as notificações como lidas
- Requer autenticação

#### Função Helper

```typescript
async function createNotification(
  workshopId: string, 
  type: 'new_quote_request' | 'quote_accepted', 
  title: string, 
  message: string, 
  budgetId?: string
)
```

**Armazenamento**: KV Store com chave `notification:{workshopId}:{notificationId}`

#### Pontos de Integração

**1. Criação de Pedido Público** (`/public/quote-requests`)
```typescript
// Após criar orçamento para cada oficina
await createNotification(
  workshop.id,
  'new_quote_request',
  'Novo Pedido de Orçamento',
  `Novo pedido de orçamento do portal público: ${service.name} para ${licensePlate}`,
  quoteId
)
```

**2. Aprovação de Orçamento** (`/client/approve-workshop`)
```typescript
// Após cliente escolher oficina
await createNotification(
  workshopId,
  'quote_accepted',
  'Orçamento Aceite pelo Cliente',
  `O cliente ${publicQuote.clientName} aceitou o seu orçamento para ${publicQuote.licensePlate}`,
  workshopBudget.id
)
```

## Como Testar

### 1. Testar Notificação de Novo Pedido

1. **Criar Oficina**
   - Login como workshop ou criar nova oficina
   - Configurar zona de intervenção em "Pedidos Plataforma" > "Perfil Público"

2. **Criar Pedido Público**
   - Ir ao Portal Público (logout da oficina)
   - Preencher formulário de pedido de orçamento
   - Selecionar localidade que corresponda à zona de intervenção da oficina

3. **Verificar Notificação**
   - Login novamente na oficina
   - Verificar sininho no canto superior direito com badge "1"
   - Clicar no sininho para ver detalhes
   - Clicar na notificação para ir para "Pedidos Plataforma"

### 2. Testar Notificação de Orçamento Aceite

1. **Cliente Registar-se**
   - No Portal Público, clicar "Área de Cliente"
   - Criar conta de cliente

2. **Ver Pedidos e Orçamentos**
   - Login como cliente
   - Ver pedido de orçamento criado anteriormente
   - Esperar oficina responder com preço (ou responder manualmente como oficina)

3. **Escolher Oficina**
   - Como cliente, clicar botão "Escolher" na oficina desejada
   - Confirmar seleção

4. **Verificar Notificação**
   - Login como oficina
   - Verificar sininho com nova notificação
   - Clicar para ver "Orçamento Aceite pelo Cliente"
   - Clicar na notificação para ir para "Orçamentos"

### 3. Testar Funcionalidades do Popup

- **Marcar como lida**: Clicar numa notificação automaticamente marca como lida
- **Marcar todas**: Usar botão "Marcar todas como lidas" no topo do popup
- **Polling**: Deixar painel aberto e criar novo pedido - em até 30 segundos deve aparecer
- **Timestamp**: Verificar formatação correta ("agora mesmo", "há X min", etc.)

## Troubleshooting

### Notificações Não Aparecem

1. **Verificar Console do Browser**
   ```javascript
   // Deve ver:
   ✅ Fetched X notifications for workshop [ID], Y unread
   ```

2. **Verificar Backend Logs**
   ```
   🔔 Notification created: new_quote_request for workshop [ID]
   ```

3. **Verificar Autenticação**
   - Confirmar que `accessToken` é válido
   - Confirmar que `workshopId` corresponde ao usuário logado

### Badge Não Atualiza

- Verificar se polling está ativo (deve atualizar a cada 30 segundos)
- Verificar rede no Developer Tools
- Confirmar que rota `/notifications` retorna `unreadCount`

### Redirecionamento Não Funciona

- Verificar se `onNotificationClick` está sendo chamado
- Verificar se módulos "budgets" e "platform-requests" estão ativos
- Ver console para mensagens de redirecionamento

## Estrutura de Dados

### KV Store Keys

```
notification:{workshopId}:{notificationId}
```

### Exemplo de Notificação

```json
{
  "id": "uuid-v4",
  "workshopId": "workshop-123",
  "type": "new_quote_request",
  "title": "Novo Pedido de Orçamento",
  "message": "Novo pedido de orçamento do portal público: Mudança de Óleo para AB-12-CD",
  "budgetId": "budget-456",
  "read": false,
  "createdAt": "2024-11-02T10:30:00.000Z"
}
```

## Próximas Melhorias

- [ ] Notificações em tempo real com WebSockets
- [ ] Sons de notificação (opcional, configurável)
- [ ] Filtros por tipo de notificação
- [ ] Histórico de notificações antigas (arquivamento)
- [ ] Notificações por email (opcional)
- [ ] Configuração de preferências de notificação
- [ ] Notificações para outros eventos (ex: pagamento recebido, folha de obra concluída)

## Notas Importantes

- As notificações são específicas por oficina (multi-tenant)
- Cada oficina só vê suas próprias notificações
- Notificações são armazenadas no KV Store (persistentes)
- Polling de 30s é um compromisso entre performance e atualização
- Para produção, considerar WebSockets para notificações instantâneas
