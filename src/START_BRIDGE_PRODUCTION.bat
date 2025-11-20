@echo off
REM Script de Inicialização - Bridge Server PRODUÇÃO
REM Integração REAL com Middleware Autenticação.Gov
REM Para Windows

title Bridge Server PRODUCAO - Cartao de Cidadao REAL
color 0A

echo.
echo ============================================================
echo    BRIDGE SERVER PRODUCAO - LEITURA REAL DE CARTAO
echo ============================================================
echo.

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Instale: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js: 
node --version

REM Verificar dependências
if not exist "node_modules\" (
    echo.
    echo Instalando dependencias...
    echo (express, cors, node-fetch)
    echo.
    call npm install express cors node-fetch@2
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependencias
        pause
        exit /b 1
    )
)

REM Verificar arquivo do servidor
if exist "bridge-server-production.js" (
    set SERVER_FILE=bridge-server-production.js
) else (
    echo.
    echo ERRO: bridge-server-production.js nao encontrado!
    echo.
    echo Certifique-se que o arquivo existe nesta pasta.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo    VERIFICANDO MIDDLEWARE AUTENTICACAO.GOV
echo ============================================================
echo.

REM Verificar se middleware está rodando
tasklist /FI "IMAGENAME eq pteidmw.exe" 2>NUL | find /I /N "pteidmw.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Processo do middleware detectado
) else (
    echo [!] Middleware nao detectado no Gestor de Tarefas
    echo.
    echo ATENCAO:
    echo   O middleware Autenticacao.Gov nao parece estar rodando.
    echo   O servidor iniciara em MODO SIMULACAO.
    echo.
    echo   Para usar leitura REAL:
    echo   1. Instalar middleware: https://www.autenticacao.gov.pt
    echo   2. Conectar leitor USB
    echo   3. Inserir Cartao de Cidadao
    echo   4. Abrir aplicacao Autenticacao.Gov
    echo   5. Reiniciar este script
    echo.
)

echo.
echo ============================================================
echo    INICIANDO SERVIDOR
echo ============================================================
echo.
echo Arquivo: %SERVER_FILE%
echo.
echo IMPORTANTE:
echo   - Mantenha esta janela aberta
echo   - Logs aparecem em tempo real
echo   - Para parar: Ctrl+C
echo   - URL: http://127.0.0.1:38000
echo.
echo ============================================================
echo.

REM Iniciar servidor
node %SERVER_FILE%

REM Se parar
echo.
echo.
echo Servidor encerrado.
pause
