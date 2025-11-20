# 🚗 OficinasExpress

Plataforma completa de gestão oficinal com identificação automática de veículos, orçamentos rápidos, CRM, faturação e **Leitor de Cartão de Cidadão integrado**. - Plataforma de Gestão de Oficinas

Plataforma web completa para gestão de oficinas com funcionalidades integradas de orçamentação, agendamento, folhas de obra, faturação e CRM.

## 🚀 Funcionalidades Principais

### Módulos Disponíveis

- ✅ **Dashboard** - KPIs e visão geral do negócio
- ✅ **Inteligência de Negócio** - Analytics e relatórios detalhados
- ✅ **Orçamentos** - Criação e gestão de orçamentos com OCR e preços automatizados
- ✅ **Agendamento** - Planeamento de serviços e gestão de horários
- ✅ **Folhas de Obra** - Acompanhamento detalhado dos serviços
- ✅ **Faturação** - Sistema integrado de emissão de faturas
- ✅ **Clientes** - CRM completo com histórico
- ✅ **Veículos** - Gestão de viaturas e histórico de serviços
- ✅ **Viaturas de Cortesia** - Gestão de viaturas de substituição

### Funcionalidades Especiais

- 🔍 **OCR de Matrículas** - Identificação automática de veículos (câmara ou upload)
- 🆔 **Leitor de Cartão de Cidadão** - Leitura automática de dados do CC português ⭐ NOVO
- 📱 **Notificações Multi-Canal** - SMS, Email e WhatsApp
- 🖨️ **Impressão de Documentos** - PDF otimizado para orçamentos, folhas e faturas
- 💶 **Multi-Moeda** - Sistema configurado para Euro (€)
- 👥 **Gestão de Utilizadores** - Diferentes níveis de acesso
- 📊 **Relatórios Avançados** - Analytics de negócio em tempo real

**⚠️ IMPORTANTE - OCR de Matrículas**: 
- **No Figma Make Preview** (iframe): Câmara bloqueada automaticamente pelo navegador. Sistema usa "Upload Ficheiro". **Isto é normal!**
- **Em Produção** (deploy real): Câmara funciona perfeitamente com popup de permissões.
- Ver [CAMERA_IFRAME_LIMITATION.md](./CAMERA_IFRAME_LIMITATION.md) para detalhes completos.

---

## 🆔 Leitor de Cartão de Cidadão

### ⚡ Início Rápido

A OficinasExpress inclui um sistema completo de leitura automática do **Cartão de Cidadão Português**.

**Modo de Demonstração** (sem instalação):
1. Vá ao módulo **Clientes**
2. Clique em **"Leitor de Cartão"**
3. Clique em **"Ler Cartão"**
4. Preencha o telefone e crie o cliente

**Com Bridge Server** (teste realista):
1. Instale Node.js: https://nodejs.org
2. Execute o script de instalação (veja documentação abaixo)
3. O sistema detectará automaticamente o bridge

**Com Leitura REAL do Cartão** ⭐ NOVO:
1. Instale middleware: https://www.autenticacao.gov.pt/web/guest/cc-aplicacao
2. Conecte leitor USB e insira o cartão
3. Execute `bridge-server-production.js`
4. Sistema detecta automaticamente e usa dados REAIS

### 📚 Documentação Completa

| Documento | Descrição | Tempo |
|-----------|-----------|-------|
| **[GUIA_RAPIDO_3_PASSOS.md](./GUIA_RAPIDO_3_PASSOS.md)** ⭐ | 3 passos para começar | 2 min |
| **[INTEGRACAO_SDK_REAL.md](./INTEGRACAO_SDK_REAL.md)** 🆕 | **Leitura REAL do cartão** | 10 min |
| **[COMO_USAR_LEITOR_CARTAO.md](./COMO_USAR_LEITOR_CARTAO.md)** | Guia completo de uso | 5 min |
| **[BRIDGE_SERVER_SETUP_COMPLETO.md](./BRIDGE_SERVER_SETUP_COMPLETO.md)** | Instalação do bridge server | 15 min |
| **[CARD_READER_TROUBLESHOOTING.md](./CARD_READER_TROUBLESHOOTING.md)** | Resolução de problemas | Variável |
| **[INDICE_DOCUMENTACAO_CARTAO.md](./INDICE_DOCUMENTACAO_CARTAO.md)** | Índice completo | - |

### 🚀 Quick Start

**Modo Simulação** (testes):
```bash
# 1. Criar pasta
mkdir cc-bridge && cd cc-bridge

# 2. Copiar bridge-server-example.js para aqui

# 3. Instalar e executar
npm install express cors
node bridge-server-example.js
```

**Modo Produção** (leitura real) ⭐ NOVO:
```bash
# 1. Instalar middleware oficial
# https://www.autenticacao.gov.pt/web/guest/cc-aplicacao

# 2. Criar pasta
mkdir cc-bridge-prod && cd cc-bridge-prod

# 3. Copiar bridge-server-production.js para aqui

# 4. Instalar e executar
npm install express cors node-fetch@2
node bridge-server-production.js

# 5. Sistema detecta automaticamente o middleware
# Se encontrado: usa dados REAIS do cartão
# Se não: fallback para simulação
```

### 🎯 Recursos Incluídos

- ✅ Sistema de diagnóstico integrado
- ✅ Fallback automático para modo demonstração
- ✅ Logs detalhados para troubleshooting
- ✅ Scripts de inicialização automática (Windows/Mac/Linux)
- ✅ Testes automatizados do bridge server
- ✅ Documentação completa em português

---

## 🔐 Acesso de Administrador

### Credenciais Padrão

A plataforma vem com uma conta de administrador pré-configurada:

```
Email:    inscricoes@oficinasexpress.com
Password: 123456789
```

### 📖 Guias Disponíveis

- **[Início Rápido](./QUICK_START_ADMIN.md)** ⚡ - Guia rápido para fazer login (COMECE AQUI)
- **[Resolução de Problemas](./TROUBLESHOOTING.md)** 🔧 - Se encontrar erros de login
- **[Configuração Detalhada](./ADMIN_SETUP.md)** 📚 - Guia completo de administração

### Como Aceder

1. No ecrã de login, clique no botão **"Acesso de Administração"** (ícone de escudo no rodapé)
2. Insira as credenciais acima
3. Se tiver problemas, use os botões de debug disponíveis:
   - 🔍 **Verificar Status do Admin** - Diagnostica problemas
   - 🔧 **Forçar Criação do Admin** - Resolve problemas automaticamente

⚠️ **Importante**: Altere a password após o primeiro acesso por questões de segurança.

---

## 👥 Níveis de Acesso

A plataforma suporta 4 níveis de utilizadores:

| Nível | Descrição | Acesso |
|-------|-----------|--------|
| **Rececionista** | Atendimento e criação de orçamentos | Básico |
| **Técnico** | Execução de serviços e folhas de obra | Médio |
| **Administrador** | Gestão completa da oficina | Completo |
| **Admin** | Super utilizador com painel de administração | Total |

---

## 🛠️ Painel de Administração

O painel de administração permite:

### Gestão de Contas
- ➕ Criar novas contas de oficinas
- ✏️ Editar informações de contas existentes
- 🔒 Bloquear/Desbloquear acesso
- 🗑️ Eliminar contas permanentemente

### Informações Geridas
- Nome da oficina
- Dados do responsável
- Email e password
- Nível de acesso
- Estado da conta (ativo/bloqueado)
- Data de criação e última autenticação

### Segurança
- Apenas utilizadores com role "admin" podem aceder
- Autenticação obrigatória
- Logs de atividade
- Bloqueio de conta em vez de eliminação (quando apropriado)

---

## 📋 Estrutura do Projeto

```
oficinasexpress/
├── components/           # Componentes React
│   ├── AdminPanel.tsx   # Painel de administração
│   ├── Login.tsx        # Sistema de autenticação
│   ├── DashboardKPIs.tsx
│   ├── BudgetsModule.tsx
│   ├── ClientsModule.tsx
│   └── ...
├── supabase/
│   └── functions/
│       └── server/      # Backend API
│           ├── index.tsx
│           └── kv_store.tsx
├── styles/
│   └── globals.css
└── utils/
    └── supabase/        # Configuração Supabase
```

---

## 🔧 Tecnologias Utilizadas

### Frontend
- **React** - Framework principal
- **TypeScript** - Linguagem
- **Tailwind CSS** - Estilização
- **Shadcn/UI** - Componentes
- **Lucide React** - Ícones

### Backend
- **Supabase** - Backend as a Service
- **Edge Functions** - API serverless
- **Hono** - Framework web
- **PostgreSQL** - Base de dados

### Integrações
- TecDoc API - Catálogo de peças
- OCR API - Reconhecimento de matrículas
- SMS/Email/WhatsApp - Notificações

---

## 📚 Documentação Adicional

- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Guia completo de configuração de administrador
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Guia de integração de APIs
- [Guidelines.md](./guidelines/Guidelines.md) - Diretrizes de desenvolvimento

---

## 🆘 Suporte

### Problemas com Login de Administrador?

Se não conseguir fazer login como administrador, consulte o **[Guia de Resolução de Problemas](./TROUBLESHOOTING.md)** que inclui:

- ✅ Verificação automática do status da conta
- 🔧 Ferramenta para forçar criação da conta
- 📋 Checklist completo de verificação
- 🔍 Logs detalhados para debug

**Ferramentas de Debug Disponíveis:**
No ecrã de login de administrador, você encontrará dois botões úteis:
- **🔍 Verificar Status do Admin** - Verifica se a conta existe
- **🔧 Forçar Criação do Admin** - Cria/recria a conta automaticamente

### Contacto
- Email: inscricoes@oficinasexpress.com
- Acesse o painel de administração para gestão de contas

---

## 📝 Notas de Versão

### v1.0.0 - Release Inicial
- ✅ Sistema completo de gestão de oficinas
- ✅ Painel de administração integrado
- ✅ Multi-utilizador com roles
- ✅ Integração com Supabase
- ✅ Módulos completos (Dashboard, Orçamentos, Agendamento, Faturação, etc.)
- ✅ Sistema de notificações
- ✅ Impressão de documentos

---

**OficinasExpress** © 2025 - Todos os direitos reservados
