# 🧪 Teste Agora - Detecção de Iframe

## 📋 O Que Fazer

1. **Recarregue a página** (F5)
2. **Abra o Console** (F12)
3. **Vá ao módulo Veículos**
4. **Clique "Capturar Matrícula"**

---

## ✅ Logs Esperados (NOVO)

Agora deve ver isto no console:

```
📷 Dialog estado mudou para: true
🔄 Dialog aberto - resetando para modo câmara
🎥 Tentando iniciar câmara...
   cameraDialogOpen: true
   capturedImage: null
   useFileUpload: false
🎬 startCamera() chamada
🌐 URL atual: https://485b2470-93c8-4392-8048-f73daa2c9ad2-figmaiframepreview.figma.site/preview_page.html
🔒 Protocolo: https:
🏠 Hostname: 485b2470-93c8-4392-8048-f73daa2c9ad2-figmaiframepreview.figma.site
🖼️ Em iframe? true  ← NOVA LINHA!
⚠️ DETECTADO: Aplicação em iframe (Figma Make Preview)  ← NOVO!
ℹ️ Navegadores bloqueiam câmara em iframes por segurança  ← NOVO!
```

---

## ✅ Toast Esperado (NOVO)

Na interface, deve ver este toast:

**Título**:
> Câmara não disponível em preview. A usar modo Upload.

**Descrição**:
> Em produção (fora do Figma Make), a câmara funcionará normalmente.

---

## ✅ Comportamento Esperado

1. ✅ Toast aparece automaticamente
2. ✅ Sistema muda para "Upload Ficheiro"
3. ✅ Botão "Upload Ficheiro" fica selecionado
4. ✅ Área de upload está visível
5. ✅ Pode continuar a usar normalmente

---

## 🎯 Próximo Passo

**Para testar a câmara de verdade**:

1. Botão direito na preview
2. "Abrir em nova janela"
3. Console deve mostrar:
   ```
   🖼️ Em iframe? false  ← Não está em iframe!
   🔐 Pedindo permissão de câmara ao utilizador...
   ```
4. **Popup de permissões aparecerá!** ✅

---

## 📝 Reporte os Resultados

Por favor, confirme se vê:
- [ ] Log `🖼️ Em iframe? true`
- [ ] Log `⚠️ DETECTADO: Aplicação em iframe`
- [ ] Toast "Câmara não disponível em preview"
- [ ] Sistema mudou para "Upload Ficheiro"

Se SIM → ✅ **Tudo está a funcionar perfeitamente!**

---

**Teste agora e partilhe os logs!** 🔬
