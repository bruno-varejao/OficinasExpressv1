# 📷 Guia de Permissões da Câmara - OCR de Matrículas

## 🎯 Sobre a Funcionalidade

A OficinasExpress inclui um sistema de **OCR (Reconhecimento Ótico de Caracteres)** para ler matrículas automaticamente usando a câmara do dispositivo ou upload de ficheiros.

---

## ✅ Comportamento Normal

### Quando Abre o Dialog "Capturar Matrícula"

**1. O sistema tenta aceder à câmara**

**2. O navegador mostra um popup de permissões:**
```
┌─────────────────────────────────────────┐
│  [NOME DO SITE] quer usar a sua câmara │
│                                          │
│  [ Bloquear ]  [ Permitir ]             │
└─────────────────────────────────────────┘
```

**3. Tem duas opções:**

#### ✅ Opção A: Permitir
- Clique em **"Permitir"**
- A câmara ativa
- Pode tirar foto da matrícula
- Sistema faz OCR automaticamente

#### ❌ Opção B: Bloquear
- Clique em **"Bloquear"**
- Verá mensagem: *"Permissão de câmara negada"*
- **Sistema muda automaticamente para "Upload Ficheiro"**
- Pode fazer upload de imagem da matrícula
- Sistema faz OCR da mesma forma

---

## 📊 Fluxo Completo

```
┌─────────────────────────┐
│ Clica "Capturar         │
│ Matrícula"              │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Navegador pede          │
│ permissão de câmara     │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
    ▼                ▼
┌─────────┐    ┌──────────┐
│PERMITIR │    │ BLOQUEAR │
└────┬────┘    └─────┬────┘
     │               │
     │               ▼
     │         ┌──────────────┐
     │         │Sistema muda  │
     │         │para "Upload  │
     │         │Ficheiro"     │
     │         └─────┬────────┘
     │               │
     ▼               ▼
┌──────────────────────────┐
│ Câmara    │   Upload     │
│ ativa     │   disponível │
└─────┬─────┴──────┬───────┘
      │            │
      ▼            ▼
┌──────────────────────────┐
│ Tirar foto │ Selecionar  │
│            │ ficheiro    │
└─────┬──────┴─────┬───────┘
      │            │
      └─────┬──────┘
            │
            ▼
┌─────────────────────────┐
│ OCR processa imagem     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Matrícula detectada ✅  │
└─────────────────────────┘
```

---

## 🔧 Como Permitir a Câmara

### Google Chrome

**Se bloqueou por engano**:

1. Clique no **ícone de cadeado** (🔒) na barra de endereços
2. Procure **"Câmara"** ou **"Camera"**
3. Altere para **"Permitir"**
4. Recarregue a página (F5)
5. Tente novamente "Capturar Matrícula"

**Ou nas definições**:

1. Chrome → Definições (⋮)
2. Privacidade e segurança → Definições do site
3. Câmara
4. Procure o site da OficinasExpress
5. Altere para "Permitir"

### Firefox

1. Clique no **ícone de escudo** na barra de endereços
2. **Permissões** → **Câmara**
3. Remover bloqueio
4. Recarregar página
5. Tentar novamente

### Safari (Mac)

1. Safari → Preferências
2. Websites → Câmara
3. Procure o site
4. Altere para "Permitir"

### Edge

1. Clique no **ícone de cadeado** na barra
2. Permissões do site
3. Câmara → Permitir
4. Recarregar

---

## 💡 Mensagens Que Pode Ver

### ✅ Mensagens Normais

#### "A iniciar câmara..."
- **O que significa**: Sistema está a pedir acesso à câmara
- **O que fazer**: Aguardar popup de permissões do navegador

#### "Posicione a matrícula aqui"
- **O que significa**: Câmara está ativa
- **O que fazer**: Apontar câmara para a matrícula

#### "Matrícula detectada: AB-12-CD"
- **O que significa**: OCR funcionou com sucesso
- **O que fazer**: Nada, dados já foram preenchidos

---

### ⚠️ Mensagens de Aviso (Esperadas)

#### "Permissão de câmara negada"
- **O que significa**: Clicou "Bloquear" no popup
- **É normal?**: ✅ SIM - Escolha do utilizador
- **O que acontece**: Sistema muda para "Upload Ficheiro"
- **Pode continuar?**: ✅ SIM - Upload funciona igual

#### "Se a câmara não iniciar, use 'Upload Ficheiro'"
- **O que significa**: Lembrete que há alternativa
- **É normal?**: ✅ SIM - Mensagem informativa
- **O que fazer**: Aguardar ou clicar "Upload Ficheiro"

---

### ❌ Mensagens de Erro (Precisam Atenção)

#### "Nenhuma câmara encontrada"
- **O que significa**: Dispositivo não tem câmara
- **Solução**: Usar "Upload Ficheiro"

#### "A câmara está a ser usada por outra aplicação"
- **O que significa**: Outra app (Zoom, Teams, etc.) está a usar a câmara
- **Solução**: Fechar a outra aplicação e tentar novamente

#### "Erro ao aceder à câmara"
- **O que significa**: Erro genérico (driver, hardware, etc.)
- **Solução**: Usar "Upload Ficheiro" ou reiniciar navegador

---

## 🎓 Perguntas Frequentes

### 1. É obrigatório usar a câmara?

**Não!** Pode sempre usar "Upload Ficheiro" em vez da câmara.

### 2. Porque pede permissão?

**Segurança.** Navegadores modernos exigem permissão explícita para aceder à câmara, microfone, localização, etc.

### 3. Os dados da câmara são enviados para algum servidor?

**Não durante a captura.** A imagem só é enviada quando clica "Processar" para fazer OCR. O processamento OCR é feito no servidor backend.

### 4. Posso revogar a permissão depois?

**Sim!** Siga os passos em "Como Permitir a Câmara" mas escolha "Bloquear" em vez de "Permitir".

### 5. A mensagem de erro é um problema?

**Depende.**
- ❌ "Permissão negada" → **Normal** se clicou "Bloquear"
- ✅ "Câmara encontrada" → **Normal**, não há problema
- ⚠️ "Erro ao aceder" → **Problema**, mas pode usar upload

### 6. Qual a diferença entre câmara e upload?

**Nenhuma!** Ambos fazem OCR da mesma forma:
- **Câmara**: Mais rápido (tira foto direto)
- **Upload**: Usa foto já existente

### 7. Posso usar foto do telemóvel?

**Sim!**
1. Tire foto da matrícula no telemóvel
2. No computador, clique "Upload Ficheiro"
3. Selecione a foto
4. OCR processará automaticamente

---

## 🔒 Segurança e Privacidade

### O que a OficinasExpress faz com a câmara?

1. ✅ **Acede à câmara** quando permitir
2. ✅ **Mostra preview** em tempo real
3. ✅ **Captura foto** quando clica "Capturar"
4. ✅ **Envia para OCR** quando clica "Processar"
5. ✅ **Detecta matrícula** e preenche campo
6. ❌ **NÃO grava** vídeos
7. ❌ **NÃO armazena** fotos (exceto temporariamente para OCR)
8. ❌ **NÃO partilha** com terceiros

### Dados Processados

- **Imagem**: Enviada para API de OCR
- **Matrícula detectada**: Armazenada no sistema
- **Imagem original**: Descartada após OCR

---

## 📱 Compatibilidade

### Navegadores Suportados

| Navegador | Desktop | Mobile | Câmara | Upload |
|-----------|---------|--------|--------|--------|
| Chrome | ✅ | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ | ✅ |
| Opera | ✅ | ✅ | ✅ | ✅ |

### Dispositivos

| Dispositivo | Câmara | Upload |
|-------------|--------|--------|
| PC Desktop | ⚠️ Se tiver webcam | ✅ |
| Laptop | ✅ Webcam integrada | ✅ |
| Tablet | ✅ Câmara traseira/frontal | ✅ |
| Smartphone | ✅ Câmara traseira preferida | ✅ |

---

## 💼 Para Administradores

### Configurar Política de Empresa

Se gerir vários computadores e quer pré-autorizar:

**Chrome (via Group Policy)**:
```
Política: DefaultMediaStreamSetting
Valor: 1 (Permitir)
Domínio: [seu-dominio.com]
```

**Firefox (via about:config)**:
```
permissions.default.camera = 1
```

### Firewall / Proxy

Certifique-se que permite:
- ✅ HTTPS (porta 443)
- ✅ WebRTC (câmara em browsers)
- ✅ Acesso ao domínio da API de OCR

---

## 🆘 Resolução de Problemas

### Problema: Popup de permissões não aparece

**Causas**:
1. Já bloqueou permanentemente
2. Navegador em modo privado restrito
3. Extensões de privacidade

**Soluções**:
1. Limpar permissões (ver acima)
2. Tentar em janela normal (não privada)
3. Desativar extensões temporariamente

### Problema: Câmara não inicia mesmo com permissão

**Causas**:
1. Outra app está a usar
2. Driver com problema
3. Hardware com defeito

**Soluções**:
1. Fechar Teams, Zoom, Skype, etc.
2. Reiniciar navegador
3. Testar câmara noutro programa
4. **Usar "Upload Ficheiro"**

### Problema: OCR não detecta matrícula

**Causas**:
1. Foto desfocada
2. Matrícula suja/danificada
3. Iluminação má

**Soluções**:
1. Tirar foto mais nítida
2. Limpar matrícula antes
3. Melhorar iluminação
4. Digitar manualmente se persistir

---

## ✅ Checklist de Uso

### Primeira Vez

- [ ] Ler este guia
- [ ] Abrir "Capturar Matrícula"
- [ ] Aguardar popup de permissões
- [ ] Clicar "Permitir" (ou escolher Upload)
- [ ] Testar captura
- [ ] Verificar OCR funciona

### Uso Diário

- [ ] Abrir dialog
- [ ] Escolher Câmara ou Upload
- [ ] Capturar/Selecionar imagem
- [ ] Clicar "Processar"
- [ ] Verificar matrícula detectada
- [ ] Confirmar dados do veículo

### Se Houver Problemas

- [ ] Verificar permissões do navegador
- [ ] Tentar "Upload Ficheiro"
- [ ] Verificar se câmara funciona noutras apps
- [ ] Limpar cache do navegador
- [ ] Reiniciar navegador
- [ ] Contactar suporte se persistir

---

## 📞 Suporte

**Se tiver problemas**:

1. **Consultar este guia** primeiro
2. **Testar "Upload Ficheiro"** como alternativa
3. **Verificar logs** do navegador (F12 → Console)
4. **Contactar suporte**: inscricoes@oficinasexpress.com

**Incluir quando contactar**:
- Navegador e versão
- Sistema operativo
- Mensagem de erro exata
- Screenshot se possível
- Se tem webcam/câmara

---

## 📝 Notas Técnicas

### Para Desenvolvedores

A funcionalidade usa:
- **MediaDevices API** (`navigator.mediaDevices.getUserMedia`)
- **Canvas API** (para capturar frame do vídeo)
- **File API** (para upload)
- **Fetch API** (para enviar ao OCR)

**Código relevante**: `/components/VehiclesModule.tsx`

**Erros tratados**:
- `NotAllowedError` - Permissão negada (esperado)
- `NotFoundError` - Câmara não encontrada
- `NotReadableError` - Câmara em uso
- Genérico - Outros erros

**Fallback automático**:
Quando permissão negada → muda para `useFileUpload = true`

---

## 🎉 Conclusão

O sistema de captura de matrículas é **robusto e flexível**:

- ✅ Funciona com ou sem câmara
- ✅ Respeita escolhas do utilizador
- ✅ Fornece alternativas claras
- ✅ Trata erros graciosamente
- ✅ Mensagens em português claro

**A mensagem "Permissão de câmara negada" é NORMAL quando escolhe bloquear.**

**Use "Upload Ficheiro" se preferir não usar a câmara.**

---

**Versão**: 1.0  
**Data**: 9 de Novembro de 2024  
**Sistema**: OficinasExpress - Módulo de Veículos  
**Funcionalidade**: OCR de Matrículas
