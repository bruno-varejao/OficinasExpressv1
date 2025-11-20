#!/bin/bash
# Script de Inicialização - Bridge Server PRODUÇÃO
# Integração REAL com Middleware Autenticação.Gov
# Para Mac/Linux

echo ""
echo "============================================================"
echo "   BRIDGE SERVER PRODUÇÃO - LEITURA REAL DE CARTÃO"
echo "============================================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado!"
    echo ""
    echo "Instale: https://nodejs.org"
    echo ""
    exit 1
fi

echo "✅ [OK] Node.js: $(node --version)"

# Verificar dependências
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Instalando dependências..."
    echo "(express, cors, node-fetch)"
    echo ""
    npm install express cors node-fetch@2
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ ERRO: Falha ao instalar dependências"
        exit 1
    fi
fi

# Verificar arquivo do servidor
if [ -f "bridge-server-production.js" ]; then
    SERVER_FILE="bridge-server-production.js"
else
    echo ""
    echo "❌ ERRO: bridge-server-production.js não encontrado!"
    echo ""
    echo "Certifique-se que o arquivo existe nesta pasta."
    exit 1
fi

echo ""
echo "============================================================"
echo "   VERIFICANDO MIDDLEWARE AUTENTICAÇÃO.GOV"
echo "============================================================"
echo ""

# Verificar se middleware está rodando (Mac/Linux)
if pgrep -f "pteidmw\|autenticacao" > /dev/null; then
    echo "✅ [OK] Processo do middleware detectado"
else
    echo "⚠️  [!] Middleware não detectado"
    echo ""
    echo "ATENÇÃO:"
    echo "  O middleware Autenticação.Gov não parece estar rodando."
    echo "  O servidor iniciará em MODO SIMULAÇÃO."
    echo ""
    echo "  Para usar leitura REAL:"
    echo "  1. Instalar middleware: https://www.autenticacao.gov.pt"
    echo "  2. Conectar leitor USB"
    echo "  3. Inserir Cartão de Cidadão"
    echo "  4. Abrir aplicação Autenticação.Gov"
    echo "  5. Reiniciar este script"
    echo ""
fi

echo ""
echo "============================================================"
echo "   INICIANDO SERVIDOR"
echo "============================================================"
echo ""
echo "Arquivo: $SERVER_FILE"
echo ""
echo "IMPORTANTE:"
echo "  - Mantenha este terminal aberto"
echo "  - Logs aparecem em tempo real"
echo "  - Para parar: Ctrl+C"
echo "  - URL: http://127.0.0.1:38000"
echo ""
echo "============================================================"
echo ""

# Iniciar servidor
node "$SERVER_FILE"

# Se parar
echo ""
echo ""
echo "Servidor encerrado."
