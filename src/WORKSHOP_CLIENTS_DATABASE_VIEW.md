# Sistema de Visualização de Base de Dados de Clientes das Oficinas

## 📋 Visão Geral

Nova funcionalidade no painel de administração que permite visualizar todos os clientes de todas as oficinas de forma agregada, com identificação automática de clientes duplicados por NIF.

## ✨ Funcionalidades Implementadas

### 1. **Nova Tab "Clientes BD Oficinas" no Admin**

Localização: Painel Admin → Tab "Clientes BD Oficinas" (após a tab "Clientes")

**Características:**
- Visualização agregada de todos os clientes de todas as oficinas
- Agrupamento automático por NIF
- Identificação de clientes duplicados (mesmo NIF em múltiplas oficinas)
- Detalhes expandíveis por NIF

### 2. **Dashboard com Estatísticas**

Três cards informativos no topo:

#### **Card 1: Total de NIFs**
- Mostra o número total de NIFs únicos na base de dados
- Ícone: Database (azul)

#### **Card 2: NIFs Duplicados**
- Mostra quantos NIFs estão registados em mais de uma oficina
- Ícone: AlertCircle (laranja)
- Indica potenciais duplicações de clientes

#### **Card 3: NIFs Únicos**
- Mostra quantos NIFs estão registados apenas numa oficina
- Ícone: Users (verde)

### 3. **Sistema de Pesquisa Avançado**

Campo de pesquisa que permite filtrar por:
- ✅ **NIF**: Pesquisa pelo número de identificação fiscal
- ✅ **Nome**: Pesquisa pelos nomes dos clientes
- ✅ **Email**: Pesquisa pelos emails registados
- ✅ **Nome da Oficina**: Pesquisa pela oficina onde está registado

**Badge de Resultados:**
- Mostra em tempo real quantos resultados foram encontrados

### 4. **Tabela Interativa de Clientes**

#### **Colunas da Tabela:**
1. **NIF**: Código do cliente (formatado como badge)
2. **Nome(s)**: Nome principal + indicação de variações
3. **Email(s)**: Email principal + contador de emails adicionais
4. **Telefone(s)**: Telefone principal + contador de telefones adicionais
5. **Nº Oficinas**: Badge colorido mostrando em quantas oficinas está registado
   - 🟢 Verde: Apenas 1 oficina (único)
   - 🟠 Laranja: 2+ oficinas (duplicado)
6. **Oficinas**: Badges com nomes das oficinas (mostra até 2, depois "+X")

#### **Funcionalidades da Linha:**
- ✅ **Hover**: Linha destaca-se ao passar o rato
- ✅ **Duplicados**: Linhas de NIFs duplicados têm fundo laranja claro
- ✅ **Click**: Expande para mostrar detalhes

### 5. **Visualização Expandida de Detalhes**

Ao clicar numa linha, expande mostrando:

**Cards por Oficina:**
- Nome da oficina (com ícone Building2)
- ID do cliente naquela oficina
- Nome completo do cliente na oficina
- Data de registo
- Formatação em grid responsivo (2 colunas em desktop)

### 6. **Alerta de Duplicados**

**Alert Box Laranja:**
- Aparece apenas quando há NIFs duplicados
- Indica quantos NIFs estão em múltiplas oficinas
- Instrui o utilizador a clicar para ver detalhes

### 7. **Sistema de Cores e Visual**

#### **Cores por Estado:**
- 🔵 **Azul**: Interface principal, headers, badges de oficina
- 🟠 **Laranja**: Duplicados, alertas
- 🟢 **Verde**: Clientes únicos
- ⚪ **Branco/Cinza**: Background, elementos neutros

#### **Gradientes:**
- Headers: Azul → Laranja
- Cards de stats: Do tom principal para branco
- Background: Azul/Laranja com blur

## 🔧 Arquitetura Técnica

### **Backend: Nova Rota Admin**

**Endpoint:**
```
GET /make-server-6971b43c/admin/workshop-clients-database
```

**Autenticação:** Requer `requireAdmin` middleware

**Processo:**
1. Busca todos os clientes de todas as oficinas (prefix `client:`)
2. Carrega dados de todas as oficinas (prefix `workshop:`)
3. Agrupa clientes por NIF
4. Para cada NIF, coleta:
   - Todas as variações de nome
   - Todos os emails únicos
   - Todos os telefones únicos
   - Todos os endereços únicos
   - Todas as ocorrências em oficinas
5. Ordena por número de ocorrências (duplicados primeiro)

**Resposta:**
```json
{
  "clientsByNIF": [
    {
      "nif": "123456789",
      "names": ["João Silva", "João M. Silva"],
      "emails": ["joao@email.com"],
      "phones": ["912345678", "213456789"],
      "addresses": ["Rua Example, 123"],
      "workshops": [
        {
          "id": "workshop-id-1",
          "name": "Oficina A",
          "clientId": "client-id-1",
          "clientName": "João Silva",
          "createdAt": "2025-01-15T10:00:00Z"
        },
        {
          "id": "workshop-id-2",
          "name": "Oficina B",
          "clientId": "client-id-2",
          "clientName": "João M. Silva",
          "createdAt": "2025-02-20T15:30:00Z"
        }
      ],
      "totalOccurrences": 2
    }
  ],
  "stats": {
    "totalNIFs": 1500,
    "duplicates": 45,
    "unique": 1455,
    "totalClients": 1545
  }
}
```

### **Frontend: Componente React**

**Ficheiro:** `/components/WorkshopClientsDatabase.tsx`

**Estados Principais:**
- `loading`: Estado de carregamento
- `clients`: Array de clientes agrupados por NIF
- `searchFilter`: Termo de pesquisa
- `expandedNIF`: NIF atualmente expandido

**Hooks:**
- `useEffect`: Carrega dados ao montar
- `useState`: Gestão de estados

**Funções:**
- `fetchAllClients()`: Busca dados do backend
- `filteredClients`: Computed - filtra clientes pela pesquisa

## 📊 Casos de Uso

### **Caso 1: Identificar Duplicados**
**Problema:** Cliente registado em múltiplas oficinas com NIFs iguais

**Solução:**
1. Aceder a "Clientes BD Oficinas"
2. Verificar card "NIFs Duplicados"
3. Clientes duplicados aparecem no topo (fundo laranja)
4. Clicar para ver em que oficinas está registado

### **Caso 2: Procurar Cliente Específico**
**Problema:** Saber em que oficinas um cliente está registado

**Solução:**
1. Usar barra de pesquisa
2. Digitar NIF, nome, email ou oficina
3. Ver resultados filtrados
4. Clicar para detalhes completos

### **Caso 3: Auditoria de Dados**
**Problema:** Verificar qualidade dos dados das oficinas

**Solução:**
1. Ver estatísticas gerais nos cards
2. Identificar variações de nomes (ex: "João Silva" vs "João M. Silva")
3. Verificar emails e telefones duplicados
4. Validar datas de registo

### **Caso 4: Análise Multi-Oficina**
**Problema:** Cliente usa várias oficinas do grupo

**Solução:**
1. Procurar por NIF
2. Ver histórico de registo em cada oficina
3. Comparar nomes e dados em cada oficina
4. Identificar inconsistências

## 🎯 Benefícios

### **Para Administradores:**
1. ✅ **Visão Global**: Ver todos os clientes de todas as oficinas
2. ✅ **Identificação de Duplicados**: Detetar rapidamente NIFs repetidos
3. ✅ **Auditoria Fácil**: Verificar qualidade e consistência dos dados
4. ✅ **Pesquisa Poderosa**: Encontrar clientes por múltiplos critérios
5. ✅ **Análise Rápida**: Estatísticas instantâneas no dashboard

### **Para a Plataforma:**
1. ✅ **Integridade de Dados**: Monitorizar duplicações
2. ✅ **Compliance**: Verificar NIFs e dados fiscais
3. ✅ **Insights**: Entender padrões de registo
4. ✅ **Suporte**: Responder rapidamente a questões sobre clientes

## 🔍 Logs e Debug

### **Backend Logs:**
```
📋 Fetching all workshop clients database...
📊 Found 1545 total clients in database
✅ Returning 1500 unique NIFs
   Duplicates: 45
   Unique: 1455
```

### **Frontend Logs:**
```
🔍 A buscar todos os clientes de todas as oficinas...
✅ Clientes carregados: 1500
```

## 🚨 Alertas e Notificações

### **Estados de Alerta:**

1. **Sucesso (Verde):** Dados carregados
2. **Info (Azul):** Pesquisa ativa
3. **Warning (Laranja):** Duplicados encontrados
4. **Erro (Vermelho):** Falha ao carregar

### **Mensagens:**
- ✅ "Base de dados carregada com sucesso"
- ⚠️ "X NIF(s) estão registados em múltiplas oficinas"
- ❌ "Erro ao carregar base de dados de clientes"
- ℹ️ "X resultado(s) encontrado(s)"

## 📱 Responsividade

### **Desktop (>768px):**
- Grid de 3 colunas para stats
- Grid de 2 colunas para detalhes expandidos
- Tabela completa com todas as colunas

### **Tablet (768px):**
- Grid de 2-3 colunas para stats
- Grid de 2 colunas para detalhes
- Tabela scroll horizontal se necessário

### **Mobile (<768px):**
- Grid de 1 coluna para stats
- Grid de 1 coluna para detalhes
- Tabela adaptada ou scroll horizontal

## 🔐 Segurança

### **Controlo de Acesso:**
- ✅ Apenas utilizadores com role `admin` ou `administrador`
- ✅ Requer token de autenticação válido
- ✅ Middleware `requireAdmin` no backend

### **Proteção de Dados:**
- ✅ Dados sensíveis (NIF, emails, telefones) visíveis apenas a admins
- ✅ IDs de clientes ofuscados (mostra apenas primeiros 8 caracteres)
- ✅ Logs não expõem dados pessoais completos

## 📝 Dados Agregados

### **Por NIF, o sistema coleta:**

| Campo | Descrição | Tratamento |
|-------|-----------|------------|
| `nif` | NIF do cliente | Chave primária de agrupamento |
| `names` | Array de nomes | Deduplicados |
| `emails` | Array de emails | Deduplicados |
| `phones` | Array de telefones | Deduplicados |
| `addresses` | Array de moradas | Deduplicados |
| `workshops` | Array de oficinas | Todos mantidos |
| `totalOccurrences` | Contador | Calculado |

### **Exemplo de Agregação:**

**Cliente em 2 Oficinas:**
```json
{
  "nif": "123456789",
  "names": ["João Silva"],
  "emails": ["joao@email.com", "joao.silva@work.com"],
  "phones": ["912345678", "213456789"],
  "workshops": [
    { "name": "Oficina A", ... },
    { "name": "Oficina B", ... }
  ],
  "totalOccurrences": 2
}
```

## 🚀 Melhorias Futuras Sugeridas

1. **Export de Dados**: Permitir export para CSV/Excel
2. **Merge de Clientes**: Ferramenta para unificar clientes duplicados
3. **Histórico de Alterações**: Ver quando e quem criou cada registo
4. **Filtros Avançados**: Filtrar por oficina, data, região
5. **Gráficos**: Visualizações de distribuição de clientes
6. **Notificações**: Alertar admins quando novos duplicados são criados
7. **Comparação de Dados**: Diff entre dados do mesmo NIF em oficinas diferentes
8. **Bulk Operations**: Operações em lote sobre clientes selecionados

## 📚 Ficheiros Criados/Modificados

### **Novos Ficheiros:**
- `/components/WorkshopClientsDatabase.tsx` - Componente principal
- `/WORKSHOP_CLIENTS_DATABASE_VIEW.md` - Esta documentação

### **Ficheiros Modificados:**
- `/components/AdminPanel.tsx`
  - Importação do componente
  - Nova TabsTrigger "workshop-clients"
  - Novo TabsContent com o componente
  - Importação do ícone Database
  
- `/supabase/functions/server/index.tsx`
  - Nova rota: `GET /admin/workshop-clients-database`
  - Lógica de agrupamento por NIF
  - Deduplicação de dados

## ✅ Testes Recomendados

1. **Teste de Carregamento**: Verificar que dados carregam corretamente
2. **Teste de Pesquisa**: Testar pesquisa por NIF, nome, email, oficina
3. **Teste de Expansão**: Clicar em linhas e verificar detalhes
4. **Teste de Duplicados**: Verificar que duplicados aparecem corretamente
5. **Teste de Performance**: Verificar com muitos clientes (>1000)
6. **Teste de Permissões**: Verificar que apenas admins têm acesso
7. **Teste Responsivo**: Verificar em diferentes tamanhos de ecrã
8. **Teste de Refresh**: Clicar em atualizar e verificar recarregamento

## 💡 Dicas de Uso

### **Para Encontrar Duplicados Rapidamente:**
1. Aceder à tab "Clientes BD Oficinas"
2. Observar o card "NIFs Duplicados"
3. Duplicados aparecem no topo da tabela (fundo laranja)
4. Clicar para ver detalhes completos

### **Para Procurar um Cliente:**
1. Usar a barra de pesquisa no topo
2. Digitar qualquer informação (NIF, nome, email, oficina)
3. Resultados filtram em tempo real
4. Badge mostra quantos foram encontrados

### **Para Ver Histórico de um NIF:**
1. Procurar pelo NIF
2. Clicar na linha do resultado
3. Ver cards de cada oficina onde está registado
4. Comparar datas de registo e nomes

## 📞 Suporte

Para questões ou problemas:
- Verificar logs do backend (console servidor)
- Verificar logs do frontend (browser console)
- Consultar documentação de importação: `CLIENT_IMPORT_DUPLICATE_CHECK.md`
- Consultar arquitetura multi-tenant: `MULTI_TENANT_ARCHITECTURE.md`

---

**Última atualização:** Novembro 2025  
**Versão:** 1.0  
**Status:** ✅ Implementado e Funcional  
**Requer:** Role de Admin/Administrador
