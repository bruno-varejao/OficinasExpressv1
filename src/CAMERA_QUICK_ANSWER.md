# ⚡ Resposta Rápida - Câmara OCR

## ❓ Pergunta

> "O navegador não pede permissão para aceder à câmara. Porquê?"

---

## ✅ Resposta

**Você está testando no Figma Make Preview** (dentro de um iframe).

Navegadores **bloqueiam câmara em iframes** por segurança. Isto é **NORMAL e ESPERADO**!

---

## 🎯 O Que Fazer AGORA

### Opção 1: Continuar Testando (Recomendado)

**Use "Upload Ficheiro"**:
1. Sistema já mudou automaticamente ✅
2. Tire foto com telemóvel
3. Faça upload
4. OCR funciona **exatamente igual**

**Tudo está a funcionar corretamente!**

---

### Opção 2: Testar Câmara (Se Quiser)

**Abrir em nova janela**:
1. Botão direito na preview
2. "Abrir em nova janela"
3. Agora a câmara funcionará! ✅

---

## 📊 Resumo Rápido

| Situação | Câmara | Upload | Porquê |
|----------|--------|--------|--------|
| **Preview Figma Make** | ❌ Bloqueada | ✅ Funciona | Iframe = sem câmara |
| **Nova janela** | ✅ Funciona | ✅ Funciona | Fora do iframe |
| **Produção (deploy)** | ✅ Funciona | ✅ Funciona | Sem iframe |

---

## 🎉 Conclusão

### ✅ NÃO É UM PROBLEMA!

1. Em **Figma Make**: Use Upload (funciona perfeitamente)
2. Em **Produção**: Câmara funcionará normalmente
3. **Código está correto** e pronto para usar

### 📚 Mais Informações

**Detalhes completos**: [CAMERA_IFRAME_LIMITATION.md](./CAMERA_IFRAME_LIMITATION.md)

---

**TL;DR**: 
🖼️ Iframe = sem câmara (segurança do navegador)  
📤 Upload = funciona sempre  
🚀 Produção = câmara OK  
✅ Tudo normal!
