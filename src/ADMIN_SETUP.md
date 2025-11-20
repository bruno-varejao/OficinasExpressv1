# Configuração Inicial do Administrador

## 🎉 Conta de Administrador Pré-Configurada

O sistema OficinasExpress já vem com uma conta de administrador pré-configurada e criada automaticamente:

### Credenciais de Administrador:
- **Email**: `inscricoes@oficinasexpress.com`
- **Password**: `123456789`

### Como Aceder ao Painel de Administração:

1. No ecrã de login, clique no botão **"Acesso de Administração"** (com ícone de escudo) no rodapé
2. Insira as credenciais acima
3. Será automaticamente redirecionado para o Painel de Administração

**⚠️ IMPORTANTE**: Por questões de segurança, recomenda-se alterar a password desta conta após o primeiro acesso.

---

## Criar Contas Adicionais de Administrador

### Opção 1: Através do Painel de Administração (Recomendado)

Depois de aceder com a conta principal:

1. Aceda ao Painel de Administração
2. Clique em "Criar Nova Conta"
3. Preencha os dados:
   - Nome da Oficina
   - Nome do Responsável
   - Email
   - Password
   - Função: Selecione **"Admin (Super Utilizador)"**
4. Clique em "Criar Conta"

### Opção 2: Criar Diretamente no Backend

Se tiver acesso direto ao backend Supabase, pode criar a conta de admin diretamente:

1. Aceda ao Supabase Dashboard
2. Vá para Authentication > Users
3. Crie um novo utilizador com os dados desejados
4. Copie o User ID
5. No console SQL ou através de Edge Functions, execute:

```sql
-- Nota: Adapte para o sistema KV que está a usar
INSERT INTO kv_store_6971b43c (key, value) 
VALUES (
  'user:USER_ID_AQUI',
  '{
    "id": "USER_ID_AQUI",
    "email": "admin@oficinasexpress.pt",
    "name": "Super Admin",
    "role": "admin",
    "workshopName": "OficinasExpress",
    "createdAt": "2025-10-28T00:00:00.000Z"
  }'::jsonb
);
```

## Acesso ao Painel de Administração

Depois de criar a conta de administrador:

1. No ecrã de login, clique no botão "Acesso de Administração" (com ícone de escudo) no rodapé
2. Insira as credenciais de administrador
3. Você será redirecionado para o Painel de Administração

## Funcionalidades do Painel de Administração

O painel de administração permite:

- ✅ Criar novas contas de oficinas
- ✅ Editar contas existentes (nome, email, password, função, oficina)
- ✅ Bloquear/Desbloquear logins
- ✅ Eliminar contas
- ✅ Ver histórico de atividade (última autenticação)
- ✅ Gerir diferentes níveis de acesso (Rececionista, Técnico, Administrador, Admin)

## Níveis de Acesso

- **Rececionista**: Acesso básico à plataforma
- **Técnico**: Acesso para técnicos de oficina
- **Administrador**: Acesso completo à gestão da oficina
- **Admin**: Super utilizador com acesso ao painel de administração

## Segurança

- Apenas utilizadores com role "admin" podem aceder ao painel de administração
- As passwords devem ter no mínimo 6 caracteres
- Os utilizadores bloqueados não podem fazer login
- A eliminação de contas é permanente

## Suporte

Para questões relacionadas com a administração do sistema, contacte o suporte técnico.
