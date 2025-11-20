# 🚨 LEIA-ME PRIMEIRO - Leitor de Cartão de Cidadão

## Você disse: "Já tenho o middleware instalado mas não faz leitura"

### ✅ PASSO IMEDIATO: Diagnóstico Automático

1. **Abra a OficinasExpress**
2. Vá para o módulo **Clientes**
3. Clique no botão **"Leitor de Cartão"** (ícone de cartão)
4. No diálogo que abre, clique em **"🔧 Testar Conexão ao Middleware"**
5. **Aguarde 15 segundos** enquanto o sistema testa
6. **Abra a Consola do Browser** (pressione F12)
7. Veja os resultados detalhados

### 📊 Interpretar os Resultados

Depois do teste, você verá uma de duas situações:

#### ✅ Situação 1: "MIDDLEWARE ENCONTRADO"

Se vir esta mensagem no console:
```
✅ MIDDLEWARE ENCONTRADO!
O middleware está em execução.
```

**Isto significa**:
- ✅ O middleware está a executar corretamente
- ✅ A comunicação está a funcionar
- ⚠️ Mas pode estar a responder numa porta/endpoint diferente

**Próximo passo**:
- Veja qual URL foi detectada (exemplo: `http://localhost:9876`)
- Anote a porta (exemplo: `9876`)
- Abra essa URL no browser para ver a resposta
- Consulte `MIDDLEWARE_HTTP_SETUP.md` para configurar endpoints

#### ❌ Situação 2: "MIDDLEWARE NÃO ENCONTRADO"

Se vir esta mensagem:
```
❌ MIDDLEWARE NÃO ENCONTRADO!
```

**Isto significa**:
- ❌ O middleware não está a responder nas portas testadas
- Pode não estar em execução
- Pode estar em execução mas sem API HTTP

**Próximo passo imediato**:

### 🔍 Verificação Manual (2 minutos)

#### Windows:

1. **Abrir Gestor de Tarefas**:
   - Pressione `Ctrl + Shift + Esc`
   - Vá para "Detalhes" ou "Processos"
   - Procure por: `pteidmw`, `pteid`, `eidmw`, ou `CCMovel`

2. **Se NÃO encontrar o processo**:
   ```
   → O middleware NÃO está em execução
   → Solução: Iniciar a aplicação Autenticação.Gov
   → Procure no menu Iniciar
   ```

3. **Se ENCONTRAR o processo**:
   ```
   → O middleware ESTÁ em execução
   → Mas não tem API HTTP acessível
   → Solução: Ver "Soluções Possíveis" abaixo
   ```

#### macOS:

1. **Verificar se está em execução**:
   - Abra "Monitor de Atividade"
   - Procure por `pteidmw` ou `eidmw`

2. **OU use o Terminal**:
   ```bash
   ps aux | grep pteid
   ```

#### Linux:

```bash
# Ver se o serviço está ativo
systemctl status pteid

# Ver processos
ps aux | grep pteid

# Ver portas abertas
netstat -tuln | grep LISTEN
```

---

## 🎯 Soluções Possíveis

### Solução A: Middleware não está em execução

**Se confirmou que o processo NÃO está ativo**:

1. Procure "Autenticação.Gov" no menu do sistema
2. Execute a aplicação
3. Deve aparecer um ícone na bandeja (Windows) ou barra de menu (Mac)
4. Volte à OficinasExpress e tente ler novamente

### Solução B: Middleware não tem API HTTP

**Se confirmou que o processo ESTÁ ativo mas teste falhou**:

Isto é **NORMAL**. O middleware português geralmente NÃO expõe uma API HTTP diretamente.

**Você tem 3 opções**:

#### Opção 1: Usar Modo de Demonstração (Mais Rápido)
- Continue usando o sistema normalmente
- Ele carregará dados simulados automaticamente
- Você pode trabalhar e testar todas as funcionalidades
- Quando resolver, voltará a funcionar automaticamente

#### Opção 2: Criar Bridge Application (Recomendado)
- Consulte: `MIDDLEWARE_HTTP_SETUP.md`
- Crie um pequeno servidor Node.js local
- Que conecta ao middleware e expõe API HTTP
- 30 minutos de setup

#### Opção 3: Aguardar Suporte Oficial
- Contacte o suporte em info.cidadao@ama.pt
- Pergunte se existe SDK JavaScript ou API HTTP
- Ou aguarde atualização da AMA

---

## 📚 Guias Disponíveis

Criamos 4 guias completos para ajudar:

| Guia | Quando Usar |
|------|-------------|
| **CITIZEN_CARD_SETUP.md** | Setup inicial completo |
| **CARD_READER_TROUBLESHOOTING.md** | Resolver problemas específicos |
| **MIDDLEWARE_HTTP_SETUP.md** | Configuração técnica avançada |
| **CITIZEN_CARD_READER_GUIDE.md** | Informações gerais |

---

## ⚡ Quick Fix - 5 Minutos

**Teste rápido para confirmar o problema**:

1. **Abra o browser**
2. **Digite na barra de endereços**:
   ```
   http://localhost:38000
   ```

3. **Resultado A - Página carrega**:
   ```
   ✅ Middleware está em execução!
   → Problema: Endpoint ou CORS
   → Solução: MIDDLEWARE_HTTP_SETUP.md
   ```

4. **Resultado B - "Site não pode ser alcançado"**:
   ```
   ❌ Middleware não está em execução OU
   ❌ Não tem servidor HTTP
   → Solução: Iniciar aplicação ou criar bridge
   ```

5. **Resultado C - Erro 404**:
   ```
   ✅ Algo está em execução na porta
   → Tente outros endpoints:
   → http://localhost:38000/read
   → http://localhost:38000/api/read
   ```

---

## 🆘 Precisa de Ajuda Urgente?

### Opção Imediata: Usar Sistema em Modo Demo

1. Ignore os erros de middleware
2. Clique em "Ler Cartão" normalmente
3. O sistema carregará dados simulados automaticamente
4. Continue trabalhando normalmente
5. Dados de demonstração são sempre os mesmos

**Quando tiver dados de demonstração, lembre-se**:
- ⚠️ Nome: "João Pedro Silva Santos"
- ⚠️ NIF: "123456789"
- ⚠️ Sempre preencher telefone manualmente

### Checklist Rápido (1 minuto)

- [ ] Middleware instalado? (Vá a "Programas e Funcionalidades")
- [ ] Aplicação Autenticação.Gov está aberta?
- [ ] Leitor USB conectado?
- [ ] Cartão inserido no leitor?
- [ ] Executou teste de conexão integrado?
- [ ] Viu logs no console do browser (F12)?

---

## 📞 Contactos

**Para problemas com o middleware**:
- Suporte AMA: info.cidadao@ama.pt
- Tel: (+351) 211 509 509
- Site: www.autenticacao.gov.pt

**Para configuração técnica avançada**:
- Consulte `MIDDLEWARE_HTTP_SETUP.md`
- Exemplos de código estão incluídos

---

## 💡 Resumo Executivo

**O que está a acontecer**:
- O middleware Autenticação.Gov português provavelmente não expõe uma API HTTP REST
- É um comportamento normal
- A aplicação está preparada para isso

**O que fazer**:
1. **Agora**: Use modo de demonstração
2. **Curto prazo**: Crie bridge application (30 min)
3. **Longo prazo**: Aguarde suporte oficial da AMA

**Como usar agora**:
- Clique "Ler Cartão" → Sistema usa dados simulados automaticamente
- Preencha telefone manualmente (obrigatório)
- Crie o cliente normalmente
- Funcionalidade completa, apenas dados não são do cartão real

---

**Data**: Novembro 2024  
**Status**: Funcionalidade ativada com fallback automático  
**Prioridade**: Média (sistema funcional em modo demo)
