# Guia de Integração - Novos Módulos

## Como adicionar os novos módulos ao App.tsx

### 1. Imports Necessários

Adicionar ao topo do `/App.tsx`:

```typescript
import { AgendaModule } from './components/AgendaModule'
import { WorkshopQuoteRequestsModule } from './components/WorkshopQuoteRequestsModule'
```

### 2. Adicionar ao Menu da Oficina

Localizar a seção de menu da oficina e adicionar:

```typescript
// Dentro do array de items do menu de oficina
{
  icon: <FileText className="h-5 w-5" />,
  label: 'Pedidos de Orçamento',
  value: 'quote-requests',
  badge: pendingQuoteRequests > 0 ? pendingQuoteRequests : undefined
},
{
  icon: <Calendar className="h-5 w-5" />,
  label: 'Agenda',
  value: 'agenda'
},
```

### 3. Adicionar Cases no Switch

Dentro do switch que renderiza os módulos:

```typescript
case 'quote-requests':
  return <WorkshopQuoteRequestsModule accessToken={accessToken!} />

case 'agenda':
  return <AgendaModule accessToken={accessToken!} />
```

### 4. Substituir AppointmentsModule (Opcional)

Se quiser **substituir completamente** o módulo de agendamentos antigo:

1. Remover `case 'appointments':`
2. Renomear o menu item de "Agendamentos" para "Agenda"
3. Mudar o value de `'appointments'` para `'agenda'`

**OU**

Manter ambos durante período de transição:
- `'appointments'` → Módulo antigo (pode ser removido depois)
- `'agenda'` → Novo módulo reformulado

---

## Exemplo Completo

```typescript
// No array de menuItems da oficina
const workshopMenuItems = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: 'Dashboard',
    value: 'dashboard'
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: 'Pedidos de Orçamento',  // ✨ NOVO
    value: 'quote-requests',
    badge: pendingQuoteRequests > 0 ? pendingQuoteRequests : undefined
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: 'Agenda',  // ✨ NOVO (ou renomeado)
    value: 'agenda'
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: 'Clientes',
    value: 'clients'
  },
  // ... outros items
]

// No switch de renderização
switch (currentModule) {
  case 'dashboard':
    return <DashboardKPIs accessToken={accessToken!} />
  
  case 'quote-requests':  // ✨ NOVO
    return <WorkshopQuoteRequestsModule accessToken={accessToken!} />
  
  case 'agenda':  // ✨ NOVO
    return <AgendaModule accessToken={accessToken!} />
  
  case 'clients':
    return <ClientsModule accessToken={accessToken!} />
  
  // ... outros cases
}
```

---

## Badge de Pedidos Pendentes (Opcional)

Para mostrar um badge com o número de pedidos pendentes no menu:

### 1. Adicionar State

```typescript
const [pendingQuoteRequests, setPendingQuoteRequests] = useState(0)
```

### 2. Carregar Contagem

```typescript
useEffect(() => {
  if (userType === 'workshop' && accessToken) {
    loadPendingQuoteRequestsCount()
  }
}, [userType, accessToken])

const loadPendingQuoteRequestsCount = async () => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop-requests/pending`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      setPendingQuoteRequests(data.requests?.length || 0)
    }
  } catch (error) {
    console.error('Error loading pending requests count:', error)
  }
}
```

### 3. Aplicar Badge no Menu Item

```typescript
{
  icon: <FileText className="h-5 w-5" />,
  label: 'Pedidos de Orçamento',
  value: 'quote-requests',
  badge: pendingQuoteRequests > 0 ? pendingQuoteRequests : undefined
}
```

---

## Imports Necessários para Icons

```typescript
import { 
  Calendar,
  FileText,
  // ... outros icons
} from 'lucide-react'
```

---

## Notas Importantes

1. **Ordem dos Items:** Sugerimos colocar "Pedidos de Orçamento" logo após o Dashboard, pois é uma funcionalidade crítica.

2. **Mobile:** Os módulos já são responsivos, mas certifique-se de que o menu lateral também funciona bem em mobile.

3. **Permissões:** Ambos os módulos requerem `accessToken`, portanto só devem ser visíveis para utilizadores autenticados.

4. **Transição:** Se quiser fazer transição gradual:
   - Semana 1-2: Manter ambos (Agendamentos antigo + Agenda novo)
   - Avisar utilizadores do novo módulo
   - Semana 3+: Remover módulo antigo

---

## Verificação Rápida

Após integrar, verificar:
- [ ] Menu mostra "Pedidos de Orçamento"
- [ ] Menu mostra "Agenda"
- [ ] Clicar em cada um renderiza o módulo correto
- [ ] Não há erros no console
- [ ] Badge de pedidos pendentes funciona (se implementado)
- [ ] Layout com 10px de espaçamento está aplicado

---

## Exemplo Visual do Menu

```
┌─────────────────────────────────┐
│  📊 Dashboard                   │
│  📄 Pedidos de Orçamento     [3]│ ← Novo, com badge
│  📅 Agenda                      │ ← Novo
│  👥 Clientes                    │
│  🚗 Veículos                    │
│  💰 Orçamentos                  │
│  📋 Folhas de Obra              │
│  🔧 Stock                       │
│  ⚙️  Definições                 │
└─────────────────────────────────┘
```

---

## Troubleshooting

### Módulo não aparece
- Verificar se imports estão corretos
- Verificar se case está no switch
- Verificar se userType === 'workshop'

### Erro "accessToken is undefined"
- Verificar se está a passar `accessToken={accessToken!}`
- Verificar se utilizador está autenticado

### Layout não está com 10px
- Verificar se o módulo tem o style aplicado
- Verificar se não há CSS conflitante

---

## Resultado Final

Após integração completa, as oficinas terão:
- ✅ Novo sistema de gestão de pedidos de orçamento
- ✅ Sistema de agenda com configuração avançada
- ✅ Layout melhorado (tela cheia com 10px)
- ✅ UX moderna e intuitiva

🎉 **Integração completa!**
