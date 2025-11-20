# Sistema de Mensagens Oficina-Cliente na Folha de Serviço

## Implementação Completa

### Backend (index.tsx)

#### Novos Endpoints Criados:

1. **GET `/workshop/messages/:workOrderId`**
   - Busca todas as mensagens de uma folha de obra específica
   - Retorna mensagens ordenadas por timestamp
   - Conta mensagens não lidas do cliente
   - Requer autenticação e verifica propriedade da folha de obra

2. **POST `/workshop/messages/:workOrderId/read-all`**
   - Marca todas as mensagens do cliente como lidas
   - Atualiza o campo `read` e adiciona `readAt`
   - Requer autenticação e verifica propriedade da folha de obra

#### Alterações em Endpoints Existentes:

- **POST `/client/messages`** - Atualizado tipo de notificação para `'client_message'` (anteriormente usava 'new_quote_request')
- Ao cliente enviar mensagem, cria notificação para a oficina com:
  - `type: 'client_message'`
  - `workOrderId` incluído na notificação

### Frontend - ServiceSheetModule

#### Novos Estados Adicionados:
```typescript
const [messages, setMessages] = useState<any[]>([])
const [newMessage, setNewMessage] = useState('')
const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
const [isMessagesOpen, setIsMessagesOpen] = useState(false)
const [sendingMessage, setSendingMessage] = useState(false)
const [showMessageHistory, setShowMessageHistory] = useState(false)
```

#### Novas Funções:

1. **`loadMessages(workOrderId)`**
   - Carrega mensagens de uma folha de obra
   - Atualiza contagem de mensagens não lidas
   - Polling automático a cada 30 segundos

2. **`sendMessage()`**
   - Envia mensagem da oficina para o cliente
   - Limpa campo de input após envio
   - Recarrega mensagens após envio

3. **`markMessagesAsRead(workOrderId)`**
   - Marca todas as mensagens do cliente como lidas
   - Atualiza UI automaticamente

#### Nova Área de Interface:

**Secção "Mensagens/Comunicação Cliente"**
- Posicionada ANTES da secção "Sintomas/Requisitos do Cliente"
- Card colapsável com indicador visual (azul)
- Funcionalidades:
  - ✅ Exibe última mensagem quando fechado
  - ✅ Badge com contagem de mensagens não lidas (vermelho)
  - ✅ Badge com total de mensagens
  - ✅ Histórico completo de mensagens (expandível)
  - ✅ Diferenciação visual entre mensagens do cliente (azul) e oficina (verde)
  - ✅ Timestamp em cada mensagem
  - ✅ Botão para marcar todas como lidas
  - ✅ Campo de texto para enviar novas mensagens
  - ✅ Suporte para Ctrl+Enter para envio rápido
  - ✅ Auto-refresh a cada 30 segundos

### Frontend - NotificationBell

#### Alterações:

1. **Tipo de Notificação Atualizado:**
```typescript
type: 'new_quote_request' | 'quote_accepted' | 'client_message'
workOrderId?: string  // Adicionado
```

2. **Funcionalidade:** 
   - Já estava preparado para receber o `onNotificationClick`
   - Não foram necessárias alterações adicionais

### Frontend - App.tsx

#### Handler de Notificações Atualizado:

```typescript
handleNotificationClick = (notification) => {
  if (notification.type === 'client_message' && notification.workOrderId) {
    // Navega para página de folha de serviço
    setActivePage('servicesheet')
    
    // Usa o sistema de integração para abrir a folha de obra específica
    setTimeout(() => {
      integration.navigateToServiceSheet?.(notification.workOrderId)
    }, 300)
  }
  // ... outros tipos de notificação
}
```

## Fluxo Completo

### Cliente Envia Mensagem:
1. Cliente envia mensagem pelo ClientPortal
2. Backend cria mensagem no KV store
3. Backend cria notificação para a oficina (`type: 'client_message'`)
4. Notificação aparece no sininho da oficina

### Oficina Recebe e Responde:
1. Oficina clica na notificação
2. Sistema navega para Folha de Serviço
3. Sistema abre automaticamente a folha de obra correspondente
4. Área de mensagens carrega automaticamente
5. Última mensagem do cliente fica visível
6. Badge vermelho mostra mensagens não lidas
7. Oficina pode:
   - Ver histórico completo
   - Marcar como lida
   - Responder ao cliente
8. Cliente recebe notificação da resposta no portal

### Auto-Refresh:
- Mensagens são atualizadas automaticamente a cada 30 segundos
- Notificações são verificadas a cada 30 segundos
- Sistema mantém sincronização bidirecional

## Características Principais

✅ **Comunicação Bidirecional**: Cliente ↔ Oficina
✅ **Notificações em Tempo Real**: Sininho com badge
✅ **Histórico Completo**: Todas as mensagens ficam guardadas
✅ **Mensagens Contextualizadas**: Por folha de obra
✅ **Visual Intuitivo**: Cores diferentes para cliente/oficina
✅ **Navegação Automática**: Clique na notificação → Abre folha de serviço
✅ **Marcação de Lidas**: Sistema de controlo de mensagens não lidas
✅ **Auto-Refresh**: Polling a cada 30 segundos
✅ **Atalhos de Teclado**: Ctrl+Enter para envio rápido
