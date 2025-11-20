# 🔧 Guia Rápido de Diagnóstico - OficinasExpress

## Como Usar o Painel de Diagnóstico

### Acesso Rápido
1. Faça login na plataforma OficinasExpress
2. No Dashboard, procure o botão **"Diagnóstico do Sistema"** (com ícone de atividade ⚡)
3. Clique nele para abrir o painel

### Executar Testes
1. No painel aberto, clique em **"Executar Diagnóstico"**
2. Aguarde alguns segundos enquanto os testes são executados
3. Veja os resultados de cada teste

## O Que Cada Teste Verifica

### ✅ Health Check (GET)
- **Verifica:** Se o servidor está online e respondendo
- **Sucesso:** Badge verde "Sucesso" + mensagem "Servidor está online"
- **Falha:** Badge vermelho "Erro" + detalhes do problema

### ✅ PATCH Test (sem autenticação)
- **Verifica:** Se o método PATCH está funcionando e o CORS está configurado
- **Sucesso:** Badge verde + "Método PATCH está funcionando"
- **Falha:** Indica problema de CORS ou configuração do servidor

### ✅ PATCH Test (com autenticação)
- **Verifica:** Se a autenticação está funcionando com PATCH
- **Sucesso:** Badge verde + detalhes do userId e workshopId
- **Falha:** Problema com o token ou middleware de autenticação

### ✅ GET Budgets
- **Verifica:** Se consegue buscar orçamentos da oficina
- **Sucesso:** Badge verde + número de orçamentos encontrados
- **Falha:** Problema na rota ou permissões

### ✅ Token de Acesso
- **Verifica:** Se o token está presente e válido
- **Sucesso:** Badge verde + preview do token
- **Falha:** Token ausente ou inválido

## Interpretando Resultados

### 🟢 Todos os Testes Passaram
**Situação:** Sistema funcionando perfeitamente!
**Ação:** Nenhuma ação necessária

### 🟡 Alguns Testes Falharam
**Situação:** Problema parcial detectado
**Ação:** 
1. Verifique qual teste falhou
2. Leia a mensagem de erro específica
3. Consulte a seção de troubleshooting abaixo

### 🔴 Todos os Testes Falharam
**Situação:** Servidor pode estar offline
**Ação:**
1. Verifique sua conexão com a internet
2. Verifique se a Edge Function está deployed no Supabase
3. Contacte o suporte técnico

## Troubleshooting por Teste

### Health Check Falhou
**Possíveis Causas:**
- Edge Function não está deployed
- URL do projeto está incorreta
- Problemas de rede

**Soluções:**
1. Verifique o Supabase Dashboard → Edge Functions
2. Certifique-se que a função `make-server-6971b43c` está deployed
3. Verifique o arquivo `/utils/supabase/info.tsx` - projectId correto?

### PATCH Test Falhou
**Possíveis Causas:**
- CORS não configurado corretamente
- Método PATCH não permitido

**Soluções:**
1. Verifique `/supabase/functions/server/index.tsx`
2. Confirme que `allowMethods` inclui `'PATCH'`
3. Re-deploy da Edge Function

### PATCH com Auth Falhou
**Possíveis Causas:**
- Token inválido ou expirado
- Middleware requireAuth com problema
- Perfil de usuário não existe

**Soluções:**
1. Faça logout e login novamente
2. Verifique os logs do servidor no Supabase
3. Execute `/init-admin` novamente se for admin

### GET Budgets Falhou
**Possíveis Causas:**
- Problema de permissões
- WorkshopId não configurado
- Rota não existe

**Soluções:**
1. Verifique se o usuário tem workshopId associado
2. Consulte os logs do backend
3. Verifique se a rota `/budgets` existe

### Token de Acesso Ausente
**Possíveis Causas:**
- Sessão expirada
- Logout não realizado corretamente

**Soluções:**
1. Faça logout
2. Faça login novamente
3. Limpe o cache do browser se necessário

## Logs da Consola

Durante os testes, abra a **Consola do Browser** (F12) para ver logs detalhados:

```javascript
// Exemplo de logs durante diagnóstico
🔄 Testing health endpoint...
✅ Health check passed
🔄 Testing PATCH method...
✅ PATCH test passed
🔄 Testing PATCH with auth...
✅ PATCH with auth passed
```

## Quando Usar o Diagnóstico

### Use quando:
- ❌ Erro "Failed to fetch" ao aprovar/rejeitar orçamentos
- ❌ Qualquer erro de conexão com o servidor
- ❌ Problemas de autenticação
- ❌ Após fazer deploy de novas alterações
- ✅ Para verificação preventiva do sistema

### Não precisa usar quando:
- ✓ Sistema funcionando normalmente
- ✓ Apenas consultando dados (não há erros)

## Compartilhar Resultados com Suporte

Se precisar de ajuda do suporte técnico:

1. Execute o diagnóstico
2. Tire um screenshot dos resultados
3. Abra a Consola do Browser (F12)
4. Copie todos os logs da consola
5. Envie ambos para o suporte

## Dicas Profissionais

💡 **Execute após cada deploy** de novas funcionalidades

💡 **Compare resultados** antes e depois de mudanças

💡 **Mantenha logs** - podem ajudar a identificar padrões

💡 **Teste regularmente** - identifique problemas antes dos usuários

## Perguntas Frequentes

**P: O diagnóstico afeta os dados reais?**
R: Não! Os testes apenas leem informações e usam endpoints de teste dedicados.

**P: Quanto tempo leva?**
R: Normalmente 2-5 segundos para todos os testes.

**P: Posso executar enquanto outros usam o sistema?**
R: Sim! Não interfere com operações normais.

**P: Com que frequência devo executar?**
R: Sempre que houver suspeita de problema ou após deploys.

## Contato para Suporte

Se após o diagnóstico o problema persistir:
1. Documente todos os testes que falharam
2. Copie as mensagens de erro exatas
3. Tire screenshots dos resultados
4. Contacte o suporte técnico

---

**Última atualização:** 28 de Outubro de 2025
**Versão do Diagnóstico:** 1.0
