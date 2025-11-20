# Debug: Erro ao Criar Cliente

## Problema Identificado

O erro ao criar cliente ocorre quando o **perfil do utilizador não existe no KV Store**, mesmo que o utilizador esteja autenticado no Supabase Auth.

## Causa Raiz

O sistema tem duas bases de dados:
1. **Supabase Auth** - Armazena credenciais de login
2. **KV Store** - Armazena perfis de utilizador com `workshopId` e outras informações

Quando o `requireAuth` middleware processa um pedido:
1. Valida o token no Supabase Auth ✅
2. Busca o perfil no KV Store usando `user:${userId}` ❌ (pode não existir)
3. Se o perfil não existir, retorna erro 404

## Diagnóstico

### Sistema de Logging Implementado

Agora o sistema tem logging detalhado em todas as etapas:

**Frontend (ClientsModule.tsx):**
- ✅ Log dos dados enviados
- ✅ Log do status da resposta
- ✅ Verificação automática do perfil ao carregar o módulo
- ✅ Toast de erro se perfil não existir

**Backend (index.tsx):**
- ✅ Log no middleware `requireAuth` com todas as validações
- ✅ Log na rota POST `/clients` com todos os dados
- ✅ Verificação explícita do `workshopId`

### Como Verificar o Problema

1. **Abra o Console do Navegador** (F12)
2. **Vá ao módulo de Clientes**
3. **Procure por estas mensagens:**
   - `🔍 Verificando perfil do utilizador...`
   - `📊 Diagnóstico do perfil:` - Mostra se o perfil existe
   - Se vir `❌ PROBLEMA ENCONTRADO`, o perfil não existe

4. **Tente criar um cliente**
5. **Observe os logs:**
   - `📝 Criando cliente:` - Dados enviados
   - `📡 Resposta recebida - Status:` - Status HTTP
   - Se for 401/404, há problema com auth/perfil

### Rota de Debug Criada

Nova rota disponível: `GET /debug/check-profile`

**Como usar:**
```javascript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/check-profile`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

**Retorna:**
```json
{
  "authUser": {
    "id": "uuid",
    "email": "user@example.com",
    "metadata": {...}
  },
  "profileInKV": { ... } ou null,
  "profileFoundByEmail": { ... } ou null,
  "totalProfilesInKV": 5,
  "diagnosis": "✅ Profile exists" ou "❌ Profile not found"
}
```

## Soluções

### Solução 1: Criar Perfil Manualmente (Temporário)

Se um utilizador está bloqueado, pode criar o perfil via API:

```javascript
// No console do navegador ou através de uma rota de administração
const userId = "uuid-do-utilizador";
const workshopId = "uuid-da-oficina";

await kv.set(`user:${userId}`, {
  id: userId,
  email: "user@example.com",
  name: "Nome do Utilizador",
  role: "administrador",
  workshopId: workshopId,
  workshopName: "Nome da Oficina",
  createdAt: new Date().toISOString()
});
```

### Solução 2: Implementar Auto-Criação de Perfil

Podemos modificar o Login para verificar e criar o perfil se não existir:

```typescript
// No Login.tsx após autenticação bem-sucedida
const checkAndCreateProfile = async (user, accessToken) => {
  const response = await fetch(
    `${apiUrl}/debug/check-profile`,
    { headers: { 'Authorization': `Bearer ${accessToken}` }}
  );
  
  const data = await response.json();
  
  if (!data.profileInKV) {
    // Criar perfil automaticamente
    // Ou redirecionar para página de configuração inicial
  }
}
```

### Solução 3: Fazer Novo Signup (Recomendado)

A forma mais segura é fazer novo signup:
1. Logout do sistema
2. Clicar em "Registar"
3. Preencher todos os dados (incluindo nome da oficina)
4. O signup cria automaticamente o perfil no KV

## Prevenção

Para evitar este problema no futuro:

1. **Sincronização Auth ↔ KV**: Sempre criar perfil no KV após criar utilizador no Auth
2. **Validação no Login**: Verificar se perfil existe antes de permitir acesso
3. **Migração de Dados**: Criar script para sincronizar utilizadores do Auth para o KV
4. **Setup Wizard**: Criar wizard de configuração inicial para novos utilizadores

## Mensagens de Erro Comuns

| Erro | Significado | Solução |
|------|------------|---------|
| `User profile not found` | Perfil não existe no KV | Fazer novo signup ou criar perfil manualmente |
| `Workshop ID not found` | Perfil existe mas sem workshopId | Atualizar perfil com workshopId válido |
| `Unauthorized: No token provided` | Token não enviado | Verificar se accessToken está sendo passado |
| `Unauthorized: Invalid token` | Token expirou ou é inválido | Fazer logout e login novamente |

## Monitorização

Agora pode monitorizar os logs do servidor através do dashboard do Supabase:
1. Aceder ao projeto no Supabase Dashboard
2. Ir para "Edge Functions" > "Logs"
3. Ver todos os logs do servidor em tempo real

Os logs agora incluem emojis para fácil identificação:
- ✅ Sucesso
- ❌ Erro
- 🔍 Verificação
- 📋 Informação
- 💡 Dica
- 🏢 Workshop
- 👤 Utilizador
