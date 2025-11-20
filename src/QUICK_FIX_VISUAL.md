# 🎯 QUICK FIX VISUAL - Leitor de Cartão

## Problema: "Já tenho o middleware mas não faz leitura"

### 🔴 SOLUÇÃO IMEDIATA (2 minutos)

```
┌─────────────────────────────────────────────────────┐
│  PASSO 1: Diagnóstico Automático                  │
└─────────────────────────────────────────────────────┘

1. Abrir OficinasExpress
2. Clicar em [Clientes]
3. Clicar em [Leitor de Cartão]
4. Clicar em [🔧 Testar Conexão ao Middleware]
5. Aguardar 15 segundos
6. Pressionar F12 (abrir Console do Browser)


┌─────────────────────────────────────────────────────┐
│  RESULTADO A: ✅ MIDDLEWARE ENCONTRADO             │
└─────────────────────────────────────────────────────┘

Viu esta mensagem no console:
"✅ MIDDLEWARE ENCONTRADO!"

➜ Middleware está OK mas precisa configuração
➜ VER: MIDDLEWARE_HTTP_SETUP.md
➜ OU: Usar modo demonstração (automático)


┌─────────────────────────────────────────────────────┐
│  RESULTADO B: ❌ MIDDLEWARE NÃO ENCONTRADO         │
└─────────────────────────────────────────────────────┘

Viu esta mensagem:
"❌ MIDDLEWARE NÃO ENCONTRADO!"

➜ Middleware não está em execução OU
➜ Não tem API HTTP disponível

PROSSEGUIR PARA PASSO 2 ⬇
```

---

### 🔵 PASSO 2: Verificação Manual (1 minuto)

```
┌─────────────────────────────────────────────────────┐
│  WINDOWS: Verificar se está em execução           │
└─────────────────────────────────────────────────────┘

1. Pressionar: Ctrl + Shift + Esc
2. Ver processos/detalhes
3. Procurar: pteidmw, pteid, ou eidmw

   ✅ ENCONTROU → Ir para PASSO 3
   ❌ NÃO ENCONTROU → Ir para SOLUÇÃO A


┌─────────────────────────────────────────────────────┐
│  MACINTOSH: Verificar processo                    │
└─────────────────────────────────────────────────────┘

Terminal:
ps aux | grep pteid

   ✅ Retornou processo → Ir para PASSO 3
   ❌ Nada retornado → Ir para SOLUÇÃO A


┌─────────────────────────────────────────────────────┐
│  LINUX: Verificar serviço                         │
└─────────────────────────────────────────────────────┘

systemctl status pteid

   ✅ Active (running) → Ir para PASSO 3
   ❌ Inactive / not found → Ir para SOLUÇÃO A
```

---

### 🟢 PASSO 3: Teste no Browser (30 segundos)

```
┌─────────────────────────────────────────────────────┐
│  Testar URL Diretamente                           │
└─────────────────────────────────────────────────────┘

1. Abrir browser (Chrome, Firefox, Edge)
2. Digitar: http://localhost:38000
3. Pressionar Enter


  ┌───────────────────────────────────────────┐
  │ Resultado A: Página carrega (qualquer)   │
  └───────────────────────────────────────────┘
  
  ✅ MIDDLEWARE ESTÁ EM EXECUÇÃO!
  
  Problema: API não está acessível ou CORS
  
  📋 SOLUÇÃO:
  ➜ Criar Bridge Server (5 min)
  ➜ Ver: BRIDGE_SERVER_README.md
  ➜ Ficheiro pronto: bridge-server-example.js


  ┌───────────────────────────────────────────┐
  │ Resultado B: "Site não pode ser          │
  │              alcançado"                   │
  └───────────────────────────────────────────┘
  
  ❌ MIDDLEWARE NÃO TEM API HTTP
  
  📋 ESCOLHA UMA OPÇÃO:
  
  Opção 1 (RÁPIDA): Usar modo demonstração
  ➜ Continue usando OficinasExpress normalmente
  ➜ Dados simulados carregam automaticamente
  ➜ Funciona para testes
  
  Opção 2 (MELHOR): Bridge Server (5 min setup)
  ➜ Ver: BRIDGE_SERVER_README.md
  ➜ Depois funcionará com leitor real
  
  Opção 3 (TÉCNICA): SDK Nativo
  ➜ Ver: MIDDLEWARE_HTTP_SETUP.md
  ➜ Requer conhecimentos técnicos
```

---

## 📊 FLUXOGRAMA DE DECISÃO

```
                    MIDDLEWARE INSTALADO
                            │
                            ▼
                   ┌────────────────┐
                   │ Testar Conexão │
                   │   (Integrado)  │
                   └────────┬───────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      ✅ ENCONTRADO                ❌ NÃO ENCONTRADO
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │ Middleware OK   │         │ Verificar se    │
    │ API diferente   │         │ está em         │
    │                 │         │ execução        │
    └────────┬────────┘         └────────┬────────┘
             │                           │
             ▼                           │
    ┌─────────────────┐         ┌───────┴────────┐
    │ Criar Bridge    │         │                │
    │ Server          │         ▼                ▼
    │ (5 min)         │    ✅ Sim           ❌ Não
    └─────────────────┘         │                │
                                │                ▼
                                │      ┌──────────────┐
                                │      │ Iniciar App  │
                                │      │ Middleware   │
                                │      └──────────────┘
                                │
                                ▼
                      ┌──────────────────┐
                      │ Middleware SEM   │
                      │ API HTTP         │
                      └────────┬─────────┘
                               │
                    ┌──────────┴─────────┐
                    │                    │
                    ▼                    ▼
           ┌────────────────┐   ┌────────────────┐
           │ Bridge Server  │   │ Modo Demo      │
           │ (Recomendado)  │   │ (Temporário)   │
           └────────────────┘   └────────────────┘
```

---

## 🎯 SOLUÇÕES RÁPIDAS

### SOLUÇÃO A: Middleware Não Está em Execução

```
Windows:
1. Menu Iniciar → "Autenticação.Gov"
2. Executar aplicação
3. Deve aparecer ícone na bandeja

Mac:
1. Applications → Autenticação.Gov
2. Executar
3. Aparece na barra de menu

Linux:
sudo systemctl start pteid
```

### SOLUÇÃO B: Bridge Server (RECOMENDADO)

```bash
# 1. Criar pasta
mkdir cc-bridge
cd cc-bridge

# 2. Copiar ficheiro bridge-server-example.js para aqui

# 3. Criar package.json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}

# 4. Instalar
npm install

# 5. Executar
node bridge-server-example.js

# ✅ Deve ver: "Servidor em execução em http://127.0.0.1:38000"
```

### SOLUÇÃO C: Usar Modo Demonstração

```
1. Ignorar erros de conexão
2. Clicar "Ler Cartão" normalmente
3. Sistema carrega dados simulados automaticamente
4. Preencher telefone manualmente
5. Criar cliente

⚠️ Dados são sempre os mesmos (João Pedro Silva Santos)
✅ Útil para testes e desenvolvimento
```

---

## 🚀 ORDEM RECOMENDADA

```
1️⃣ AGORA (0 min):
   → Usar modo demonstração
   → Continuar trabalhando

2️⃣ HOJE (5 min):
   → Setup Bridge Server
   → Testar leitura real

3️⃣ ESTA SEMANA (30 min):
   → Integrar SDK real (se disponível)
   → Testes completos
```

---

## 📞 PRECISA DE AJUDA?

```
┌─────────────────────────────────────────────┐
│  Não conseguiu resolver?                   │
└─────────────────────────────────────────────┘

1. Recolha informações:
   • Screenshot do teste de conexão
   • Versão do middleware (Ajuda > Acerca de)
   • Sistema operativo
   • Mensagens de erro (Console F12)

2. Consulte guias:
   📄 LEIA-ME_PRIMEIRO.md
   📄 CARD_READER_TROUBLESHOOTING.md
   📄 BRIDGE_SERVER_README.md

3. Contacte suporte:
   📧 info.cidadao@ama.pt
   ☎️  (+351) 211 509 509
```

---

## ✅ CHECKLIST VISUAL

```
┌─────────────────────────────────────────────┐
│  Antes de pedir ajuda, confirme:           │
└─────────────────────────────────────────────┘

□ Middleware está instalado
□ Aplicação do middleware está aberta
□ Testou conexão integrada (F12 console)
□ Leitor USB está conectado
□ Cartão está inserido
□ Testou http://localhost:38000 no browser
□ Verificou processos em execução
□ Leu LEIA-ME_PRIMEIRO.md

Se TODOS marcados e ainda não funciona:
➜ Criar Bridge Server (solução definitiva)
```

---

**TL;DR**: 
- ✅ Middleware instalado mas sem API HTTP é **normal**
- 🎯 Use modo demo AGORA, setup bridge server HOJE
- 📖 Guia completo: LEIA-ME_PRIMEIRO.md
