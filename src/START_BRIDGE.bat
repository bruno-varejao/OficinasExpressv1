@echo off
REM Script de Inicialização Rápida do Bridge Server
REM Para Windows
REM
REM USO: Duplo-clique neste arquivo para iniciar o servidor

title Bridge Server - Cartao de Cidadao
color 0A

echo.
echo ============================================================
echo    BRIDGE SERVER - CARTAO DE CIDADAO
echo ============================================================
echo.
echo Inicializando servidor...
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js:
    echo https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version

REM Verificar se as dependências estão instaladas
if not exist "node_modules\" (
    echo.
    echo Instalando dependencias pela primeira vez...
    echo Isto pode levar alguns minutos...
    echo.
    call npm install express cors
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependencias
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas com sucesso
)

REM Verificar qual arquivo usar
if exist "bridge-server-example.js" (
    set SERVER_FILE=bridge-server-example.js
) else if exist "server.js" (
    set SERVER_FILE=server.js
) else (
    echo.
    echo ERRO: Arquivo do servidor nao encontrado!
    echo.
    echo Certifique-se que existe:
    echo   - bridge-server-example.js
    echo   ou
    echo   - server.js
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo    SERVIDOR PRONTO
echo ============================================================
echo.
echo Iniciando: %SERVER_FILE%
echo.
echo IMPORTANTE:
echo   - Mantenha esta janela aberta enquanto usa a OficinasExpress
echo   - Para parar o servidor, pressione Ctrl+C
echo   - O servidor estara disponivel em http://127.0.0.1:38000
echo.
echo ============================================================
echo.

REM Iniciar o servidor
node %SERVER_FILE%

REM Se o servidor parar, aguardar input do usuário
echo.
echo.
echo Servidor encerrado.
pause
