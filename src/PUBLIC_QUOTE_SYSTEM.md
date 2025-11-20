# Sistema Público de Pedidos de Orçamento

## 📋 Visão Geral

O sistema foi expandido com uma **página pública** que permite a qualquer pessoa pedir orçamentos de serviços automóveis sem necessidade de login prévio. O sistema procura automaticamente por oficinas na localidade especificada e cria pedidos de orçamento em todas elas.

## 🌐 Arquitetura do Sistema

### Frontend Público (Sem Autenticação)
1. **PublicLandingPage** - Página inicial com formulário de pedido
2. **ClientLogin** - Login/Registo para clientes
3. **ClientPortal** - Área do cliente para acompanhar pedidos

### Frontend Oficinas (Com Autenticação)
- Mantém toda a estrutura existente
- Adiciona novo módulo "Gestão Pedidos Plataforma" para ver pedidos públicos

### Backend Público (Rotas sem Auth)
- `/public/services` - Lista de serviços predefinidos
- `/public/workshops` - Lista de oficinas por localidade
- `/public/workshops/:id` - Perfil público de oficina
- `/public/quote-requests` - Criar pedido de orçamento
- `/public/client-signup` - Registo de clientes
- `/public/postal-code/:code` - Validar código postal

## 🎯 Fluxo do Utilizador

### 1. Cliente Anónimo Pede Orçamento

```
Cliente acede à página pública
    ↓
Preenche formulário:
  - Matrícula do veículo
  - Localidade de intervenção
  - Tipo de serviço
  - Dados de contacto
    ↓
Sistema procura oficinas na localidade
    ↓
Cria pedido em todas as oficinas encontradas
    ↓
Mostra lista de oficinas com preços estimados
```

### 2. Cliente Registado Acompanha Pedidos

```
Cliente cria conta
    ↓
Faz login na Área de Cliente
    ↓
Visualiza todos os seus pedidos de orçamento
    ↓
Pode atualizar dados pessoais
```

### 3. Oficina Recebe e Gere Pedidos

```
Oficina recebe pedido automático
    ↓
Aparece no módulo "Gestão Pedidos Plataforma"
    ↓
Pode aprovar, ajustar preço ou rejeitar
    ↓
Contacta cliente diretamente
```

## 📊 Serviços Predefinidos

O sistema inclui 10 serviços predefinidos:

| Serviço | Preço Base | Duração |
|---------|------------|---------|
| Mudança de Óleo | €45 | 30 min |
| Mudança de Pneus | €80 | 60 min |
| Revisão de Travões | €120 | 90 min |
| Ar Condicionado | €60 | 45 min |
| Substituição de Bateria | €100 | 30 min |
| Inspeção Geral | €35 | 45 min |
| Alinhamento de Rodas | €40 | 45 min |
| Correia de Distribuição | €250 | 180 min |
| Diagnóstico Eletrónico | €50 | 60 min |
| Mudança de Filtros | €35 | 30 min |

**Nota:** Os preços são valores base. Cada oficina pode ajustar conforme necessário.

## 🗺️ Sistema de Localização

### Pesquisa por Localidade

O sistema filtra oficinas por:
- **Concelho** (ex: Lisboa, Porto, Coimbra)
- **Localidade** (ex: Benfica, Foz, Baixa)
- **Morada** (pesquisa na morada completa)

### Estrutura de Morada das Oficinas

As oficinas agora têm campos detalhados de morada:

```typescript
{
  rua: "Rua das Flores",
  numeroPorta: "123",
  codigoPostal: "1000-123",
  concelho: "Lisboa",
  localidade: "Baixa"
}
```

### Validação de Código Postal

Endpoint: `GET /public/postal-code/:code`

- Formato: `XXXX-XXX`
- Retorna concelho e localidade automaticamente
- Integração futura com API de Códigos Postais de Portugal

**Exemplo:**
```bash
GET /public/postal-code/1000-001
Response: {
  "postalCode": "1000-001",
  "concelho": "Lisboa",
  "localidade": "Lisboa"
}
```

## 🔐 Sistema de Contas

### Tipos de Utilizador

1. **Cliente Público** (novo)
   - Regista-se via página pública
   - Pode acompanhar seus pedidos
   - Não tem acesso ao painel de oficinas

2. **Utilizador de Oficina** (existente)
   - Funcionário de oficina específica
   - Acesso ao painel completo de gestão
   - Roles: Administrador, Técnico, Rececionista

3. **Administrador Global** (existente)
   - Gestão de todas as oficinas
   - Criação de novas oficinas
   - Visualização global do sistema

### Diferenciação de Contas

No backend, as contas são diferenciadas por:

```typescript
// Cliente público
{
  role: 'client',
  isPublicClient: true,
  // Não tem workshopId
}

// Utilizador de oficina
{
  role: 'administrador' | 'tecnico' | 'rececionista',
  workshopId: 'uuid-da-oficina'
}

// Admin global
{
  role: 'admin',
  workshopId: 'super-admin'
}
```

## 🎨 Interface Pública

### Página Inicial (PublicLandingPage)

**Componentes:**
- Header com botões de login (Cliente e Oficina)
- Hero section com call-to-action
- Formulário de pedido de orçamento
- Secção de benefícios (cards informativos)
- Resultados com lista de oficinas
- Footer com links úteis

**Características:**
- Design moderno com gradientes
- Responsivo (mobile-first)
- Ícones lucide-react
- Feedback visual com toasts

### Área do Cliente (ClientPortal)

**Funcionalidades:**
- Visualizar histórico de pedidos
- Ver status de cada pedido (Pendente/Aprovado/Rejeitado)
- Atualizar dados pessoais (nome, telefone)
- Gestão de perfil

## 📡 API Endpoints

### Públicos (Sem Autenticação)

```typescript
// Listar serviços
GET /make-server-6971b43c/public/services

// Listar oficinas por localidade
GET /make-server-6971b43c/public/workshops?location=Lisboa

// Perfil público de oficina
GET /make-server-6971b43c/public/workshops/:id

// Criar pedido de orçamento
POST /make-server-6971b43c/public/quote-requests
Body: {
  licensePlate: string
  location: string
  serviceId: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  notes?: string
}

// Registar cliente
POST /make-server-6971b43c/public/client-signup
Body: {
  email: string
  password: string
  name: string
  phone?: string
}

// Validar código postal
GET /make-server-6971b43c/public/postal-code/:code
```

### Cliente (Requer Autenticação de Cliente)

```typescript
// Listar pedidos do cliente
GET /make-server-6971b43c/client/quote-requests

// Atualizar perfil
PUT /make-server-6971b43c/client/profile
Body: {
  name?: string
  phone?: string
}
```

## 💾 Estrutura de Dados

### Public Quote Request

```typescript
{
  id: string
  licensePlate: string
  location: string
  serviceId: string
  serviceName: string
  basePrice: number
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

Guardado como: `public_quote:{id}`

### Budget (Pedido na Oficina)

```typescript
{
  id: string
  workshopId: string
  workshopName: string
  publicQuoteRequestId: string  // Link para pedido público
  licensePlate: string
  serviceName: string
  serviceId: string
  basePrice: number
  estimatedPrice: number
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}
```

Guardado como: `budget:{id}`

### Public Client Profile

```typescript
{
  id: string  // userId do Supabase Auth
  clientId: string  // UUID separado
  email: string
  name: string
  phone: string
  role: 'client'
  isPublicClient: true
  createdAt: string
}
```

Guardado como: `public_client:{userId}`

## 🔄 Navegação do Sistema

### Rotas Principais

1. **Página Pública** → `/` (view: 'public')
2. **Login Oficina** → `/workshop-login` (view: 'workshop-login')
3. **Login Cliente** → `/client-login` (view: 'client-login')
4. **Painel Oficina** → `/workshop` (view: 'workshop-app')
5. **Portal Cliente** → `/client` (view: 'client-portal')
6. **Painel Admin** → `/admin` (view: 'admin')

### Fluxo de Navegação

```
┌─────────────────┐
│  Página Pública │ (Início)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│Oficina │ │Cliente │
│ Login  │ │ Login  │
└───┬────┘ └───┬────┘
    │          │
    ▼          ▼
┌────────┐ ┌────────┐
│ Painel │ │ Portal │
│Oficina │ │Cliente │
└────────┘ └────────┘
```

## 🚀 Melhorias Futuras

### 1. Sistema de Notificações
- Email para cliente quando oficina responde
- SMS para confirmações
- WhatsApp Business API

### 2. Avaliações e Reviews
- Cliente pode avaliar oficina após serviço
- Sistema de estrelas
- Comentários públicos

### 3. Comparador de Preços
- Ordenar oficinas por preço
- Filtros avançados (distância, avaliação, preço)
- Gráfico comparativo

### 4. Agendamento Online
- Cliente escolhe oficina e agenda direto
- Calendário integrado
- Confirmação automática

### 5. Pagamento Online
- Integração com Stripe/PayPal
- Pagamento antecipado ou no local
- Faturação automática

### 6. Geolocalização
- Mapa com oficinas próximas
- Cálculo de distância
- Direções Google Maps

### 7. Chat em Tempo Real
- Cliente pode tirar dúvidas com oficina
- Suporte automatizado (chatbot)
- Histórico de conversas

### 8. API de Códigos Postais
- Integração com base de dados oficial
- Preenchimento automático completo
- Validação de moradas

## 🔍 Troubleshooting

### Cliente não encontra oficinas

**Problema:** Ao pesquisar, não aparecem oficinas.

**Causas possíveis:**
1. Nenhuma oficina cadastrada naquela localidade
2. Oficinas desativadas (isActive: false)
3. Campo concelho/localidade não preenchido

**Solução:**
1. Verifique se há oficinas ativas no Admin Panel
2. Certifique-se que oficinas têm concelho preenchido
3. Tente pesquisar por localidades diferentes

### Pedido não aparece na oficina

**Problema:** Cliente criou pedido mas oficina não vê.

**Causas:**
1. Filtro de workshopId incorreto
2. Oficina não estava na localidade pesquisada

**Solução:**
1. Verifique logs do backend
2. Confirme que budget foi criado com workshopId correto
3. Use módulo "Gestão Pedidos Plataforma"

### Cliente não consegue fazer login

**Problema:** Conta criada mas login falha.

**Causas:**
1. Conta não é de cliente (é de oficina)
2. Password incorreta
3. Email não confirmado (não deve acontecer)

**Solução:**
1. Verifique se `isPublicClient: true` no perfil
2. Tente reset de password
3. Crie nova conta com outro email

## ✅ Checklist de Implementação

- [x] Backend - Rotas públicas criadas
- [x] Backend - Sistema de serviços predefinidos
- [x] Backend - Registo e login de clientes
- [x] Frontend - PublicLandingPage completa
- [x] Frontend - ClientLogin funcional
- [x] Frontend - ClientPortal com histórico
- [x] App.tsx - Navegação entre views
- [x] Estrutura de morada detalhada
- [x] Validação de código postal (básica)
- [ ] Integração com API real de códigos postais
- [ ] Sistema de notificações
- [ ] Geolocalização e mapas
- [ ] Sistema de avaliações

## 📞 Suporte

Para questões sobre o sistema público:

1. Verifique os logs do navegador (F12 → Console)
2. Verifique os logs do Edge Function
3. Consulte este documento
4. Contacte suporte técnico

---

**Versão:** 1.0 - Sistema Público de Orçamentos  
**Data:** 1 de Novembro de 2025  
**Status:** ✅ Implementado e Funcional
