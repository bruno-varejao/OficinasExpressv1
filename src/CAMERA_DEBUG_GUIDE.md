# 🔍 Guia de Debug - Câmara OCR

## 🎯 Problema: Navegador não pede permissão de câmara

### ✅ Logs Adicionados

Adicionei logs detalhados no código. Agora quando abrir o dialog de "Capturar Matrícula", verá no **Console do navegador** (F12):

```
📷 Dialog estado mudou para: true
🔄 Dialog aberto - resetando para modo câmara
🎥 Tentando iniciar câmara...
   cameraDialogOpen: true
   capturedImage: null
   useFileUpload: false
🎬 startCamera() chamada
🌐 URL atual: [URL do site]
🔒 Protocolo: https: (ou http:)
🏠 Hostname: [nome do host]
✅ navigator.mediaDevices disponível
🔐 Pedindo permissão de câmara ao utilizador...
```

**Neste ponto, o popup de permissões DEVE aparecer!**

---

## 📋 Passos para Debug

### 1. Abrir Console do Navegador

**Chrome/Edge**:
- Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
- Ou `Cmd+Option+I` (Mac)
- Vá para a aba **Console**

**Firefox**:
- Pressione `F12` ou `Ctrl+Shift+K` (Windows/Linux)
- Ou `Cmd+Option+K` (Mac)
- Vá para a aba **Console**

### 2. Testar Captura de Matrícula

1. No sistema, vá ao módulo **Veículos**
2. Clique no botão **"Capturar Matrícula"**
3. **OBSERVE O CONSOLE** - deve aparecer logs começando com emojis

### 3. Cenários Possíveis

#### ✅ Cenário A: Logs aparecem e popup aparece

**Logs esperados**:
```
📷 Dialog estado mudou para: true
🔄 Dialog aberto - resetando para modo câmara
🎥 Tentando iniciar câmara...
🎬 startCamera() chamada
🔐 Pedindo permissão de câmara ao utilizador...
✅ Permissão concedida! Stream obtido: [MediaStream]
```

**Popup de permissões**:
```
┌─────────────────────────────────────┐
│ [SITE] quer usar a sua câmara      │
│ [ Bloquear ]  [ Permitir ]          │
└─────────────────────────────────────┘
```

**Status**: ✅ **FUNCIONANDO NORMAL**

---

#### ⚠️ Cenário B: Logs aparecem mas popup NÃO aparece

**Logs esperados**:
```
📷 Dialog estado mudou para: true
🎬 startCamera() chamada
🔐 Pedindo permissão de câmara ao utilizador...
❌ Erro ao aceder à câmara
   Nome do erro: NotAllowedError
```

**Possíveis causas**:
1. **Já bloqueou permanentemente** a câmara antes
2. **Navegador está em modo privado** com restrições
3. **Extensão de privacidade** bloqueou automaticamente

**Solução**: Ver [Como Desbloquear](#como-desbloquear-permissões) abaixo

---

#### ❌ Cenário C: Logs NÃO aparecem

**Nenhum log no console**

**Possíveis causas**:
1. Console não está aberto corretamente
2. Filtros do console ativos
3. JavaScript com erro antes

**Solução**:
1. Verificar se está na aba **Console** (não Network/Elements)
2. Limpar filtros (botão 🗑️ ou "Clear")
3. Recarregar página (F5)
4. Tentar novamente

---

#### ⚠️ Cenário D: Erro de contexto não seguro

**Logs**:
```
🌐 URL atual: http://example.com
🔒 Protocolo: http:
⚠️ AVISO: Não está em contexto seguro (HTTPS)
```

**Toast no sistema**:
> "Para usar a câmara, é necessário HTTPS ou localhost"

**Causa**: Navegador exige HTTPS para aceder à câmara (segurança)

**Solução**:
- Usar HTTPS em vez de HTTP
- OU usar em `localhost` ou `127.0.0.1` para testes
- OU usar "Upload Ficheiro" como alternativa

---

#### ❌ Cenário E: MediaDevices não disponível

**Logs**:
```
🎬 startCamera() chamada
❌ navigator.mediaDevices não disponível
```

**Toast no sistema**:
> "A câmara não está disponível neste dispositivo"

**Possíveis causas**:
1. Navegador muito antigo
2. Dispositivo sem câmara (PC desktop sem webcam)
3. Driver da câmara não instalado

**Solução**:
- Atualizar navegador
- Conectar webcam USB
- Instalar drivers da câmara
- Usar "Upload Ficheiro"

---

## 🔧 Como Desbloquear Permissões

### Se já bloqueou antes e agora quer permitir:

#### Chrome / Edge

**Método 1 - Ícone da barra**:
1. Clique no **ícone de cadeado** (🔒) ou câmara (📷) na barra de endereços
2. Procure **"Câmara"**
3. Altere de "Bloqueado" para **"Permitir"**
4. Recarregue a página (F5)

**Método 2 - Definições do site**:
1. Clique no cadeado → **"Definições do site"**
2. Procure **"Câmara"**
3. Altere para **"Permitir"**
4. Recarregar página

**Método 3 - Limpar tudo**:
1. Chrome → Definições (⋮)
2. Privacidade e segurança → **Limpar dados de navegação**
3. Escolha **"Definições do site"**
4. Limpar
5. Tentar novamente (pedirá permissão de novo)

#### Firefox

1. Clique no **ícone de escudo/cadeado**
2. Clique na **seta ▶** ao lado de "Permissões"
3. Procure **"Usar a câmara"**
4. Se bloqueado, clique no **❌** para remover bloqueio
5. Recarregar página
6. Deve pedir permissão novamente

#### Safari (Mac)

1. Safari → **Preferências** (Cmd+,)
2. Aba **Websites**
3. Menu lateral → **Câmara**
4. Procure o site da OficinasExpress
5. Altere para **"Permitir"**
6. Recarregar página

---

## 🧪 Teste Manual - Verificar Se Câmara Funciona

### Testar câmara diretamente no Console:

1. Abrir Console (F12)
2. Colar este código:

```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ CÂMARA FUNCIONOU!', stream)
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(error => {
    console.log('❌ ERRO:', error.name, error.message)
  })
```

3. Pressionar Enter

**Resultado esperado**:
- Popup de permissões aparece
- Se permitir: `✅ CÂMARA FUNCIONOU!`
- Se negar: `❌ ERRO: NotAllowedError`

---

## 📊 Tabela de Diagnóstico

| Sintoma | Logs no Console | Causa Provável | Solução |
|---------|-----------------|----------------|---------|
| Popup não aparece | ❌ Nenhum log | Console não aberto | Abrir Console (F12) |
| Popup não aparece | ❌ "não disponível" | Sem câmara/driver | Conectar webcam |
| Popup não aparece | ⚠️ "contexto não seguro" | HTTP (não HTTPS) | Usar HTTPS ou localhost |
| Popup não aparece | ❌ "NotAllowedError" | Já bloqueou antes | Desbloquear (ver acima) |
| Popup aparece OK | ✅ Logs normais | Tudo funcional | Permitir e usar |
| Câmara não inicia | ✅ "Permissão concedida" | Outra app usando | Fechar Zoom/Teams |

---

## 🆘 Se Nada Funcionar

### Informações para Reportar

Se após seguir este guia ainda não funcionar, reporte com:

1. **Screenshot do Console** (com todos os logs visíveis)
2. **Navegador e versão**:
   - Chrome: `chrome://version`
   - Firefox: `about:support`
   - Edge: `edge://version`
3. **Sistema operativo**
4. **URL completo** onde está a testar
5. **Protocolo** (HTTP ou HTTPS)
6. **Tem webcam/câmara?** Funciona em outras apps?
7. **Teste manual** (código acima) funcionou?

### Email de Suporte

**Para**: inscricoes@oficinasexpress.com

**Assunto**: Debug - Câmara OCR não pede permissões

**Incluir**:
- Todas as informações acima
- Logs do console (copiar texto)
- Screenshots se possível

---

## 💡 Dicas Importantes

### Antes de Testar

- [ ] Recarregar página (F5) - limpa estado
- [ ] Limpar cache do navegador
- [ ] Fechar outras abas/apps que usam câmara
- [ ] Verificar se tem webcam conectada (se desktop)
- [ ] Testar em modo privado/anónimo (para descartar extensões)

### Durante o Teste

- [ ] Console aberto ANTES de clicar "Capturar Matrícula"
- [ ] Observar logs em tempo real
- [ ] Ler mensagens de erro completas
- [ ] Copiar logs para análise posterior

### Se Funcionar

- [ ] Permitir câmara quando pedir
- [ ] Testar captura de foto
- [ ] Testar OCR
- [ ] Documentar que funcionou (para futura referência)

### Se Não Funcionar

- [ ] **NÃO ENTRAR EM PÂNICO** 😊
- [ ] Usar "Upload Ficheiro" como alternativa
- [ ] Reportar com informações completas
- [ ] Aguardar suporte

---

## 🎓 Entender os Logs

### Emojis dos Logs

| Emoji | Significado | Severidade |
|-------|-------------|------------|
| 📷 | Dialog/UI | Info |
| 🎥 | Tentativa de acesso | Info |
| 🎬 | Função chamada | Info |
| 🌐 | Informação de URL | Info |
| 🔒 | Informação de segurança | Info |
| ✅ | Sucesso | Sucesso |
| 🔐 | Pedido de permissão | Info |
| ⚠️ | Aviso (não crítico) | Warning |
| ❌ | Erro | Erro |

### Exemplos de Logs Normais

**Sucesso completo**:
```
📷 Dialog estado mudou para: true
🔄 Dialog aberto - resetando para modo câmara
🎥 Tentando iniciar câmara...
   cameraDialogOpen: true
   capturedImage: null
   useFileUpload: false
🎬 startCamera() chamada
🌐 URL atual: https://oficinasexpress.com
🔒 Protocolo: https:
🏠 Hostname: oficinasexpress.com
✅ navigator.mediaDevices disponível
🔐 Pedindo permissão de câmara ao utilizador...
[POPUP APARECE AQUI]
✅ Permissão concedida! Stream obtido: MediaStream {...}
📹 Tracks: [MediaStreamTrack {...}]
✅ Stream atribuído ao elemento <video>
```

**Negado pelo utilizador (normal)**:
```
📷 Dialog estado mudou para: true
🎬 startCamera() chamada
🔐 Pedindo permissão de câmara ao utilizador...
[POPUP APARECE]
[UTILIZADOR CLICA "BLOQUEAR"]
❌ Erro ao aceder à câmara
   Nome do erro: NotAllowedError
   Mensagem: Permission denied
```

---

## ✅ Checklist de Debug

### Verificações Básicas

- [ ] Console do navegador está aberto (F12)
- [ ] Aba "Console" está selecionada
- [ ] Filtros do console limpos
- [ ] Página recarregada recentemente
- [ ] Navegador atualizado

### Teste Passo-a-Passo

1. [ ] Abrir Console (F12)
2. [ ] Ir para módulo Veículos
3. [ ] Clicar "Capturar Matrícula"
4. [ ] Observar logs aparecerem
5. [ ] Copiar logs do console
6. [ ] Ver se popup aparece
7. [ ] Se aparecer → clicar "Permitir"
8. [ ] Se não aparecer → verificar logs

### Análise dos Logs

- [ ] Logs começam com 📷?
- [ ] Aparecem logs com 🎬?
- [ ] Há mensagem 🔐 "Pedindo permissão"?
- [ ] Há erro ❌ ou sucesso ✅?
- [ ] Qual o nome do erro (se houver)?

### Próximos Passos

Se logs corretos mas popup não aparece:
- [ ] Verificar permissões do navegador
- [ ] Testar código manual (ver acima)
- [ ] Limpar cache e cookies
- [ ] Testar em navegador diferente
- [ ] Reportar com logs completos

---

## 📞 Contacto

**Suporte Técnico**: inscricoes@oficinasexpress.com

**Quando contactar**:
- Após seguir este guia completo
- Com logs do console copiados
- Com informações do navegador
- Com resultado do teste manual

---

**Versão**: 1.0  
**Data**: 9 de Novembro de 2024  
**Sistema**: OficinasExpress - Debug Câmara OCR
