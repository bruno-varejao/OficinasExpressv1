# Guia de Resolução de Problemas - OficinasExpress

## 🔐 Problema: Não consigo fazer login como administrador

### Credenciais Padrão
```
Email:    inscricoes@oficinasexpress.com
Password: 123456789
```

### Passos para Resolver

#### 1. Verificar o Status da Conta
1. Aceda ao ecrã de login
2. Clique em **"Acesso de Administração"** (botão com ícone de escudo)
3. Clique no botão **"🔍 Verificar Status do Admin"**
4. Verifique a consola do navegador (F12) para ver os logs

O que procurar:
- `existsInKV: true` - Conta existe na base de dados
- `existsInAuth: true` - Conta existe no sistema de autenticação
- Ambos devem ser `true`

#### 2. Forçar a Criação da Conta
Se a verificação mostrar que a conta não existe:

1. No mesmo ecrã de login de admin
2. Clique em **"🔧 Forçar Criação do Admin"**
3. Aguarde a mensagem de confirmação
4. Tente fazer login novamente

#### 3. Verificar Logs do Backend
Abra a consola do navegador (F12) e procure por:

✅ **Mensagens de sucesso:**
```
✅ Admin account created successfully: inscricoes@oficinasexpress.com
✅ Admin profile stored in KV
🎉 Admin account fully created: inscricoes@oficinasexpress.com
```

⚠️ **Mensagens de aviso:**
```
⚠️ User exists in Auth but not in KV. Fetching user...
```
Isto significa que o sistema irá sincronizar automaticamente.

❌ **Mensagens de erro:**
```
❌ Error creating admin user: [detalhes do erro]
```
Anote o erro e consulte as soluções abaixo.

### Erros Comuns e Soluções

#### Erro: "User already registered"
**Solução:** A conta já existe mas pode não estar sincronizada.
1. Clique em "Verificar Status do Admin"
2. O sistema irá detectar e sincronizar automaticamente
3. Tente fazer login novamente

#### Erro: "Invalid login credentials"
**Possíveis causas:**
1. Password incorreta - verifique se está usando `123456789`
2. Email incorreto - verifique se está usando `inscricoes@oficinasexpress.com`
3. Conta não confirmada

**Solução:**
1. Clique em "Forçar Criação do Admin"
2. Aguarde a confirmação
3. Tente novamente

#### Erro: "Forbidden: Admin access required"
**Causa:** A conta existe mas não tem o role "admin"

**Solução:**
1. Verifique os logs com "Verificar Status do Admin"
2. Se `kvData.role` não for "admin", clique em "Forçar Criação do Admin"
3. Isto irá atualizar o role corretamente

#### Erro: "User profile not found"
**Causa:** A conta existe na autenticação mas não na base de dados

**Solução:**
1. Clique em "Forçar Criação do Admin"
2. O sistema irá criar o perfil automaticamente

### Verificação Manual via Supabase

Se os métodos acima não funcionarem:

1. Aceda ao dashboard do Supabase
2. Vá para **Authentication > Users**
3. Procure por `inscricoes@oficinasexpress.com`
4. Se não existir, use o botão "Forçar Criação do Admin"
5. Se existir, anote o User ID

#### Verificar o KV Store
1. No dashboard Supabase, vá para **SQL Editor**
2. Execute:
```sql
SELECT * FROM kv_store_6971b43c WHERE key LIKE 'user:%';
```
3. Procure pela entrada com o email `inscricoes@oficinasexpress.com`
4. Verifique se o campo `role` é `"admin"`

### Logs Detalhados

Para ativar logs detalhados no navegador:

1. Abra a consola (F12)
2. Vá para a tab "Console"
3. Clique em "Forçar Criação do Admin"
4. Observe as mensagens que aparecem:

```
🔍 Checking for existing admin account...
📊 Found X users in KV store
✅ Admin account already exists: inscricoes@oficinasexpress.com
```

OU

```
📝 Creating new admin user in Supabase Auth...
✅ Admin user created in Auth, ID: [user-id]
✅ Admin profile stored in KV
🎉 Admin account fully created: inscricoes@oficinasexpress.com
```

### Reset Completo (Último Recurso)

Se nada funcionar, pode fazer um reset completo:

⚠️ **ATENÇÃO:** Isto irá eliminar TODOS os utilizadores do sistema!

1. Aceda ao dashboard do Supabase
2. Vá para **SQL Editor**
3. Execute:
```sql
DELETE FROM kv_store_6971b43c WHERE key LIKE 'user:%';
```
4. Vá para **Authentication > Users**
5. Elimine manualmente o utilizador `inscricoes@oficinasexpress.com` se existir
6. Volte à aplicação
7. Clique em "Forçar Criação do Admin"
8. Aguarde a confirmação
9. Tente fazer login

---

## 🆘 Ainda com Problemas?

Se nenhuma das soluções acima funcionou:

1. **Capture os logs completos:**
   - Abra a consola do navegador (F12)
   - Vá para a tab "Console"
   - Clique em "Verificar Status do Admin"
   - Copie todas as mensagens
   - Clique em "Forçar Criação do Admin"
   - Copie todas as mensagens

2. **Verifique a consola do Supabase:**
   - Aceda ao dashboard Supabase
   - Vá para **Edge Functions > server > Logs**
   - Verifique se há erros recentes

3. **Informações úteis para debug:**
   - Que erro aparece exatamente?
   - O que aparece em "Verificar Status do Admin"?
   - A conta existe na tabela Authentication?
   - A conta existe no KV Store?

---

## 📋 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Estou usando o email correto: `inscricoes@oficinasexpress.com`
- [ ] Estou usando a password correta: `123456789`
- [ ] Cliquei em "Acesso de Administração" e não no login normal
- [ ] Executei "Verificar Status do Admin"
- [ ] Tentei "Forçar Criação do Admin"
- [ ] Verifiquei os logs da consola do navegador
- [ ] A aplicação está atualizada (recarreguei a página com Ctrl+F5)

---

**Última atualização:** Outubro 2025
