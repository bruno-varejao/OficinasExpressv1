# 🧪 Guia de Teste - Painel de Administração

## 📝 Credenciais de Acesso Admin

```
Email: inscricoes@oficinasexpress.com
Password: 123456789
```

## ✅ Cenários de Teste

### 1️⃣ Criar Conta com Oficina Existente

**Passos:**
1. Fazer login como admin
2. Clicar em "Criar Nova Conta"
3. Selecionar "Selecionar oficina existente"
4. Escolher uma oficina da lista dropdown
5. Preencher:
   - Nome: João Silva
   - Email: joao@exemplo.com
   - Password: senha123
   - Função: Rececionista
6. Clicar "Criar Conta"

**Resultado Esperado:**
✅ Mensagem "Conta criada com sucesso!"
✅ Nova conta aparece na tabela
✅ Oficina associada corretamente

---

### 2️⃣ Criar Conta com Nova Oficina

**Passos:**
1. Fazer login como admin
2. Clicar em "Criar Nova Conta"
3. Selecionar "Criar nova oficina"
4. Inserir nome da oficina: "Oficina Norte Porto"
5. Preencher:
   - Nome: Maria Santos
   - Email: maria@exemplo.com
   - Password: senha456
   - Função: Administrador
6. Clicar "Criar Conta"

**Resultado Esperado:**
✅ Oficina criada automaticamente
✅ Conta criada e associada à nova oficina
✅ Mensagem "Conta criada com sucesso!"
✅ Próxima criação de conta mostra nova oficina na lista

---

### 3️⃣ Validações de Erro

**Teste A: Sem Selecionar Oficina**
1. Criar Nova Conta
2. Deixar "Selecionar oficina existente" marcado
3. NÃO selecionar oficina
4. Tentar submeter

**Resultado:** ⚠️ "Selecione uma oficina ou crie uma nova"

**Teste B: Nova Oficina Sem Nome**
1. Criar Nova Conta
2. Marcar "Criar nova oficina"
3. Deixar campo vazio
4. Tentar submeter

**Resultado:** ⚠️ "Nome da oficina é obrigatório"

---

### 4️⃣ Editar Conta Existente

**Passos:**
1. Clicar no ícone de editar (lápis) numa conta
2. Alterar nome: "João Silva Atualizado"
3. Alterar função: "Técnico"
4. (Opcional) Inserir nova password
5. Clicar "Guardar Alterações"

**Resultado Esperado:**
✅ Mensagem "Conta atualizada com sucesso!"
✅ Dados atualizados na tabela
⚠️ Nota: Oficina NÃO pode ser alterada (integridade)

---

### 5️⃣ Bloquear/Desbloquear Conta

**Passos:**
1. Clicar no ícone de bloqueio numa conta ativa
2. Verificar mudança de estado
3. Clicar novamente para desbloquear

**Resultado Esperado:**
✅ Badge muda de "Ativo" para "Bloqueado"
✅ Utilizador não consegue fazer login quando bloqueado

---

### 6️⃣ Eliminar Conta

**Passos:**
1. Clicar no ícone de lixo (trash) numa conta
2. Confirmar eliminação no diálogo
3. Verificar remoção da lista

**Resultado Esperado:**
✅ Mensagem "Conta eliminada com sucesso!"
✅ Conta removida da tabela
⚠️ Não é possível eliminar se tiver dados associados

---

## 🔍 Verificações de Console

Abrir DevTools (F12) e verificar logs:

### Criação de Conta com Nova Oficina
```
📝 Creating new workshop: Oficina Norte Porto
✅ Workshop created: [uuid]
✅ Workshops fetched: X
📝 Creating user with workshopId: [uuid]
✅ Users fetched successfully: X users
```

### Criação de Conta com Oficina Existente
```
📝 Creating user with workshopId: [uuid]
✅ Users fetched successfully: X users
```

---

## 🐛 Troubleshooting

### Erro: "User profile not found"
**Causa:** Token de admin inválido
**Solução:** Fazer logout e login novamente

### Erro: "Workshop not found"
**Causa:** WorkshopId inválido no backend
**Solução:** Recriar oficina

### Lista vazia de oficinas
**Causa:** Nenhuma oficina criada ainda
**Solução:** Use "Criar nova oficina" na primeira conta

---

## 📊 Estatísticas Esperadas

Após criar algumas contas, a tabela deve mostrar:
- ✅ Nome da Oficina com ícone
- ✅ Nome do utilizador
- ✅ Email
- ✅ Função (com badge colorido)
- ✅ Estado (Ativo/Bloqueado)
- ✅ Data de criação
- ✅ Ações (Editar, Bloquear, Eliminar)

---

## 🎯 Teste de Isolamento Multi-Tenant

1. Criar duas oficinas diferentes
2. Criar utilizadores em cada uma
3. Fazer login com utilizador da Oficina A
4. Verificar que só vê dados da Oficina A
5. Fazer login com utilizador da Oficina B
6. Verificar que só vê dados da Oficina B
7. Fazer login como admin
8. Verificar que admin vê tudo

---

## ✨ Funcionalidades Implementadas

- ✅ Criação de contas multi-tenant
- ✅ Seleção de oficina existente
- ✅ Criação automática de nova oficina
- ✅ Edição de dados de utilizador
- ✅ Bloqueio/desbloqueio de contas
- ✅ Eliminação de contas
- ✅ Validações completas
- ✅ Reset automático de formulários
- ✅ Feedback visual com toasts
- ✅ Logs de debug detalhados
- ✅ Lista de oficinas com estatísticas

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar console do navegador (F12)
2. Verificar logs do servidor
3. Consultar `/ADMIN_FIX_NOTES.md`
4. Verificar `/TROUBLESHOOTING.md`
