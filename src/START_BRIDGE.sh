#!/bin/bash
# Script de Inicialização Rápida do Bridge Server
# Para Mac/Linux
#
# USO: 
#   chmod +x START_BRIDGE.sh
#   ./START_BRIDGE.sh

echo ""
echo "============================================================"
echo "   BRIDGE SERVER - CARTÃO DE CIDADÃO"
echo "============================================================"
echo ""
echo "Inicializando servidor..."
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado!"
    echo ""
    echo "Por favor, instale o Node.js:"
    echo "https://nodejs.org"
    echo ""
    exit 1
fi

echo "✅ [OK] Node.js encontrado"
node --version

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo ""
    echo "Instalando dependências pela primeira vez..."
    echo "Isto pode levar alguns minutos..."
    echo ""
    npm install express cors
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ ERRO: Falha ao instalar dependências"
        echo ""
        exit 1
    fi
    echo ""
    echo "✅ [OK] Dependências instaladas com sucesso"
fi

# Verificar qual arquivo usar
if [ -f "bridge-server-example.js" ]; then
    SERVER_FILE="bridge-server-example.js"
elif [ -f "server.js" ]; then
    SERVER_FILE="server.js"
else
    echo ""
    echo "❌ ERRO: Arquivo do servidor não encontrado!"
    echo ""
    echo "Certifique-se que existe:"
    echo "  - bridge-server-example.js"
    echo "  ou"
    echo "  - server.js"
    echo ""
    exit 1
fi

echo ""
echo "============================================================"
echo "   SERVIDOR PRONTO"
echo "============================================================"
echo ""
echo "Iniciando: $SERVER_FILE"
echo ""
echo "IMPORTANTE:"
echo "  - Mantenha este terminal aberto enquanto usa a OficinasExpress"
echo "  - Para parar o servidor, pressione Ctrl+C"
echo "  - O servidor estará disponível em http://127.0.0.1:38000"
echo ""
echo "============================================================"
echo ""

# Iniciar o servidor
node "$SERVER_FILE"

# Se o servidor parar
echo ""
echo ""
echo "Servidor encerrado."
