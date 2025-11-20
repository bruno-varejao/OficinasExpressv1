# 🏗️ Arquitetura Multi-Tenant - OficinasExpress

## 📋 Visão Geral

O OficinasExpress é uma plataforma **multi-tenant** onde cada oficina possui:
- ✅ Painel de gestão independente
- ✅ Dados completamente isolados (clientes, veículos, orçamentos, etc.)
- ✅ Mesma interface e funcionalidades
- ✅ Atualizações automáticas de layout e features

## 🔐 Modelo de Dados

### Workshops (Oficinas)
```typescript
interface Workshop {
  id: string              // UUID único
  name: string            // Nome da oficina
  address?: string        // Morada
  phone?: string          // Telefone
  email?: string          // Email de contacto
  nif?: string            // NIF/NIPC
  isActive: boolean       // Oficina ativa/inativa
  createdAt: string       // Data de criação
}
```

**Armazenamento:** `workshop:{id}` no KV store

---

### Users (Utilizadores)
```typescript
interface User {
  id: string              // UUID (do Supabase Auth)
  email: string           // Email de login
  name: string            // Nome completo
  role: string            // admin | administrador | tecnico | rececionista
  workshopId: string      // ID da oficina (FK)
  workshopName: string    // Nome da oficina (cache)
  createdAt: string       // Data de criação
}
```

**Armazenamento:** `user:{id}` no KV store

**Roles disponíveis:**
- `admin` - Super administrador (acesso total, todas oficinas)
- `administrador` - Administrador da oficina
- `tecnico` - Técnico da oficina
- `rececionista` - Rececionista da oficina

---

### Clients (Clientes)
```typescript
interface Client {
  id: string              // UUID único
  name: string            // Nome do cliente
  email?: string          // Email
  phone: string           // Telefone
  nif?: string            // NIF
  address?: string        // Morada
  workshopId: string      // 🔒 ID da oficina
  createdAt: string
  createdBy: string       // User ID
}
```

**Armazenamento:** `client:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

### Vehicles (Veículos)
```typescript
interface Vehicle {
  id: string              // UUID único
  clientId: string        // ID do cliente (FK)
  workshopId: string      // 🔒 ID da oficina
  licensePlate: string    // Matrícula
  brand: string           // Marca
  model: string           // Modelo
  year?: number           // Ano
  // ... outros campos técnicos
  createdAt: string
  createdBy: string
}
```

**Armazenamento:** `vehicle:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

### Budgets (Orçamentos)
```typescript
interface Budget {
  id: string
  workshopId: string      // 🔒 ID da oficina
  // ... outros campos
}
```

**Armazenamento:** `budget:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

### Appointments (Agendamentos)
```typescript
interface Appointment {
  id: string
  workshopId: string      // 🔒 ID da oficina
  // ... outros campos
}
```

**Armazenamento:** `appointment:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

### Work Orders (Folhas de Obra)
```typescript
interface WorkOrder {
  id: string
  workshopId: string      // 🔒 ID da oficina
  // ... outros campos
}
```

**Armazenamento:** `workorder:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

### Invoices (Faturas)
```typescript
interface Invoice {
  id: string
  workshopId: string      // 🔒 ID da oficina
  // ... outros campos
}
```

**Armazenamento:** `invoice:{id}` no KV store
**Isolamento:** Filtrado por `workshopId`

---

## 🔒 Segurança e Isolamento

### Middleware de Autenticação (`requireAuth`)

```typescript
const requireAuth = async (c, next) => {
  // 1. Validar token de acesso
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  const { data: { user } } = await supabase.auth.getUser(accessToken)
  
  // 2. Buscar perfil do utilizador
  const userProfile = await kv.get(`user:${user.id}`)
  
  // 3. Injetar workshopId no contexto
  c.set('workshopId', userProfile.workshopId)
  c.set('userRole', userProfile.role)
  c.set('userId', user.id)
  
  await next()
}
```

### Filtragem de Dados

**Todas as rotas filtram por `workshopId`:**

```typescript
// ✅ Correto - Filtra por oficina
app.get('/clients', requireAuth, async (c) => {
  const workshopId = c.get('workshopId')
  const allClients = await kv.getByPrefix('client:')
  const clients = allClients.filter(c => c.workshopId === workshopId)
  return c.json({ clients })
})

// ❌ Errado - Retorna dados de todas oficinas
app.get('/clients', requireAuth, async (c) => {
  const allClients = await kv.getByPrefix('client:')
  return c.json({ clients: allClients })
})
```

---

## 👤 Fluxos de Utilizador

### Fluxo de Cadastro (Signup)

1. Utilizador acede `/signup`
2. Preenche dados (nome, email, password)
3. Sistema cria:
   - ✅ Nova oficina com UUID único
   - ✅ Novo utilizador com `workshopId`
   - ✅ Armazena em Supabase Auth + KV store
4. Utilizador recebe acesso à sua oficina

### Fluxo de Login

1. Utilizador faz login (email + password)
2. Supabase Auth valida credenciais
3. Sistema busca perfil com `workshopId`
4. Frontend armazena token + dados do utilizador
5. Todas as requisições incluem token
6. Backend filtra dados por `workshopId` do token

### Fluxo Admin

1. Admin faz login com credenciais especiais
2. Role = `admin` e `workshopId` = `super-admin`
3. Admin tem acesso a:
   - ✅ Gestão de todas oficinas
   - ✅ Gestão de todos utilizadores
   - ✅ Criação de novas oficinas
   - ✅ Visualização de estatísticas globais

---

## 🎯 Regras de Negócio

### Criação de Utilizadores

**Por Admin:**
- Pode criar utilizadores para qualquer oficina
- Pode criar novas oficinas
- Pode atribuir qualquer role

**Por Signup:**
- Cria automaticamente nova oficina
- Primeiro utilizador é sempre `administrador`
- Utilizadores subsequentes precisam ser criados pelo admin da oficina

### Transferência de Dados

**Não permitido:**
- ❌ Mover cliente entre oficinas
- ❌ Mover veículo entre oficinas
- ❌ Partilhar orçamentos entre oficinas

**Permitido:**
- ✅ Duplicar template de orçamento (sem dados cliente)
- ✅ Exportar relatórios
- ✅ Admin visualizar dados de qualquer oficina

### Eliminação

**Oficina:**
- ❌ Não pode eliminar se tiver utilizadores
- ✅ Pode desativar (`isActive: false`)

**Utilizador:**
- ❌ Não pode eliminar se tiver dados associados
- ✅ Pode bloquear (`banned: true`)

**Cliente:**
- ❌ Não pode eliminar se tiver veículos
- ✅ Pode marcar como inativo

---

## 🔄 Atualizações Globais

Quando uma nova funcionalidade é adicionada:

1. **Backend:**
   - Adicionar nova rota com `requireAuth`
   - Garantir filtragem por `workshopId`
   - Testar isolamento

2. **Frontend:**
   - Adicionar novo componente/página
   - Usar `accessToken` nas chamadas
   - Não precisa código específico por oficina

3. **Deployment:**
   - ✅ Todas as oficinas recebem atualização automaticamente
   - ✅ Sem necessidade de configuração individual
   - ✅ Zero downtime

---

## 📊 Estatísticas e KPIs

### Por Oficina
```typescript
// Dashboard da oficina mostra apenas seus dados
const stats = {
  totalClients: clients.filter(c => c.workshopId === myWorkshopId).length,
  totalVehicles: vehicles.filter(v => v.workshopId === myWorkshopId).length,
  // ...
}
```

### Admin Global
```typescript
// Admin vê estatísticas de todas oficinas
const globalStats = {
  totalWorkshops: workshops.length,
  totalUsers: users.length,
  totalClients: clients.length,
  // Agregação por oficina
  workshopStats: workshops.map(w => ({
    name: w.name,
    users: users.filter(u => u.workshopId === w.id).length,
    clients: clients.filter(c => c.workshopId === w.id).length
  }))
}
```

---

## 🚀 Escalabilidade

### Performance

**Atual (KV Store):**
- ✅ Adequado para até ~1000 oficinas
- ✅ Filtragem em memória
- ✅ Resposta rápida (<100ms)

**Futuro (Database SQL):**
- Migrar para PostgreSQL quando necessário
- Índices em `workshopId`
- Queries otimizadas com `WHERE workshopId = ?`

### Limites

**Por Oficina:**
- Clientes: Ilimitado
- Veículos: Ilimitado
- Utilizadores: Recomendado <50

**Global:**
- Oficinas: Ilimitado
- Total de utilizadores: Escala com infraestrutura

---

## 🛡️ Compliance e Privacidade

### RGPD

- ✅ Dados isolados por oficina
- ✅ Cada oficina é controlador dos seus dados
- ✅ Utilizador pode solicitar eliminação
- ✅ Logs de acesso disponíveis

### Auditoria

```typescript
// Todas as ações registam:
{
  action: 'CREATE_CLIENT',
  userId: 'abc-123',
  workshopId: 'workshop-456',
  timestamp: '2025-01-01T12:00:00Z',
  data: { clientId: 'client-789' }
}
```

---

## 📚 Referências

- `/supabase/functions/server/index.tsx` - Backend multi-tenant
- `/components/AdminPanel.tsx` - Gestão de oficinas e utilizadores
- `/ADMIN_FIX_NOTES.md` - Notas sobre correções
- `/TESTE_ADMIN.md` - Guia de testes
