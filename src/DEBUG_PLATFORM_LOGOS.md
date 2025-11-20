# 🔍 DEBUG: Platform Logos não aparecem

## 🎯 Passos para Diagnosticar

### 1. **Verificar Console do Browser**

Após carregar os logos e acessar o portal público, abra o **Console do Browser** (F12 → Console) e procure por:

#### Logs esperados ao carregar a página:
```
🎨 Loading platform logos...
📡 Platform logos response status: 200
✅ Platform logos loaded: {logos: {...}}
📦 Logos object: {logo: "https://...", icon: "https://...", ...}
🖼️ Platform logos state updated: {logo: "https://...", icon: "https://..."}
  - Logo: https://...
  - Icon: https://...
  - Favicon: https://...
```

#### Se aparecer o logo/icon:
```
✅ Logo image loaded successfully
```
ou
```
✅ Icon image loaded successfully
```

#### Se NÃO aparecer:
```
❌ Error loading logo image: [URL]
```
ou
```
❌ Error loading icon image: [URL]
```

### 2. **Verificar Logs do Backend**

Na consola do servidor/Supabase Edge Functions, procure por:

#### Ao fazer upload:
```
📤 POST /admin/platform-logos/logo - Uploading logo
📄 File received: logo.png, size: 123456, type: image/png
✅ logo uploaded successfully: platform/logo-1731001234567.png
💾 Saving to KV - Key: platform:logos
📦 Updated logos object: {logo: "https://...", logoPath: "...", ...}
✅ Platform logos updated in KV with logo
🔍 Verification - Logos after save: {logo: "https://...", ...}
```

#### Ao acessar o portal público:
```
🌐 GET /public/platform-logos - Public request for logos
📦 Logos from KV: {logo: "https://...", icon: "https://...", ...}
🔑 Logo keys: ['logo', 'logoPath', 'logoUpdatedAt', 'icon', ...]
🖼️ Logo URL: https://...
🔷 Icon URL: https://...
🌐 Favicon URL: https://...
```

### 3. **Testar o Endpoint Manualmente**

Abra uma nova tab do browser e acesse:

```
https://[seu-project-id].supabase.co/functions/v1/make-server-6971b43c/public/platform-logos
```

**Resposta esperada:**
```json
{
  "logos": {
    "logo": "https://[project-id].supabase.co/storage/v1/object/public/make-6971b43c-platform-assets/platform/logo-1731001234567.png",
    "logoPath": "platform/logo-1731001234567.png",
    "logoUpdatedAt": "2024-11-07T...",
    "icon": "https://...",
    "iconPath": "...",
    "iconUpdatedAt": "...",
    "favicon": "https://...",
    "faviconPath": "...",
    "faviconUpdatedAt": "..."
  }
}
```

**Se retornar objeto vazio:**
```json
{
  "logos": {}
}
```
→ **Problema:** Os logos não foram salvos no KV Store

### 4. **Verificar URLs das Imagens**

Copie a URL de um dos logos da resposta acima e abra diretamente no browser:

**URL exemplo:**
```
https://[project-id].supabase.co/storage/v1/object/public/make-6971b43c-platform-assets/platform/logo-1731001234567.png
```

**Se a imagem abrir:** ✅ Storage está OK  
**Se der erro 404:** ❌ Ficheiro não foi carregado corretamente  
**Se der erro de permissões:** ❌ Bucket não está público

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: "logos: {}" (objeto vazio)

**Causa:** Os logos não foram salvos no KV Store

**Solução:**
1. Volte ao painel admin
2. Recarregue os logos
3. Verifique os logs do backend para confirmar que `kv.set('platform:logos', ...)` foi executado
4. Verifique a mensagem de sucesso no frontend

### Problema 2: URL retorna mas imagem não carrega (404)

**Causa:** Ficheiro não foi carregado no Storage ou bucket não existe

**Solução:**
1. Acesse o Supabase Dashboard
2. Vá em **Storage**
3. Verifique se o bucket `make-6971b43c-platform-assets` existe
4. Verifique se há ficheiros dentro da pasta `platform/`
5. Se não existir, recarregue as imagens

### Problema 3: Erro de permissões ao acessar URL

**Causa:** Bucket não está configurado como público

**Solução:**
1. No Supabase Dashboard → Storage
2. Selecione o bucket `make-6971b43c-platform-assets`
3. Vá em Settings
4. Marque como **Public**
5. Salve as alterações

### Problema 4: Logos carregam mas não aparecem na página

**Causa:** Problema de renderização ou cache

**Solução:**
1. Limpe cache do browser (Ctrl+Shift+Del)
2. Faça hard refresh (Ctrl+F5)
3. Abra em janela anónima/privada
4. Verifique console do browser para erros de carregamento de imagem

### Problema 5: Favicon não aparece

**Causa:** Cache muito agressivo do browser para favicons

**Solução:**
1. Feche completamente o browser
2. Reabra
3. Limpe todo o histórico/cache
4. Aguarde alguns minutos (cache de DNS)
5. Tente em outro browser

---

## 🔧 Comandos de Debug Rápido

### Verificar KV Store manualmente (no backend):

Adicione temporariamente este endpoint ao servidor:

```typescript
// DEBUG ENDPOINT - REMOVER DEPOIS
app.get('/make-server-6971b43c/debug/platform-logos', async (c) => {
  const logos = await kv.get('platform:logos')
  return c.json({ 
    logos,
    exists: !!logos,
    keys: logos ? Object.keys(logos) : [],
    logoUrl: logos?.logo,
    iconUrl: logos?.icon,
    faviconUrl: logos?.favicon
  })
})
```

Depois acesse:
```
https://[project-id].supabase.co/functions/v1/make-server-6971b43c/debug/platform-logos
```

### Verificar Storage no Supabase:

1. Dashboard Supabase
2. Storage
3. `make-6971b43c-platform-assets`
4. Pasta `platform/`
5. Devem aparecer os ficheiros: `logo-[timestamp].ext`, `icon-[timestamp].ext`, `favicon-[timestamp].ext`

---

## ✅ Checklist de Verificação

Marque cada item conforme verifica:

- [ ] Logos foram carregados com sucesso (mensagem verde no admin)
- [ ] Console do backend mostra "✅ Platform logos updated in KV with [type]"
- [ ] Endpoint `/public/platform-logos` retorna objeto com URLs
- [ ] URLs das imagens abrem no browser (não dão 404)
- [ ] Console do browser mostra "✅ Platform logos loaded: {logos: {...}}"
- [ ] Console do browser mostra "🖼️ Platform logos state updated: {logo: ..., icon: ...}"
- [ ] Console do browser mostra "✅ Logo/Icon image loaded successfully"
- [ ] Bucket `make-6971b43c-platform-assets` existe no Supabase Storage
- [ ] Bucket está marcado como **Public**
- [ ] Ficheiros existem dentro da pasta `platform/` no Storage
- [ ] Cache do browser foi limpo
- [ ] Hard refresh foi feito (Ctrl+F5)

---

## 📞 O que Reportar

Se o problema persistir, reporte:

1. **Status de cada item do checklist acima**
2. **Logs do console do browser** (copie e cole)
3. **Resposta do endpoint** `/public/platform-logos` (copie e cole)
4. **Screenshots** do Supabase Storage mostrando o bucket e ficheiros
5. **Mensagens de erro** específicas do console

---

## 🎯 Teste Rápido Final

Execute este teste completo:

1. **Limpe tudo:**
   - Limpe cache do browser
   - Recarregue os 3 logos no admin
   - Aguarde mensagem de sucesso para cada um

2. **Verifique o Storage:**
   - Abra Supabase Dashboard
   - Storage → `make-6971b43c-platform-assets` → `platform/`
   - Confirme que os 3 ficheiros estão lá
   - Copie a URL de um ficheiro e abra no browser

3. **Teste o endpoint:**
   - Abra: `https://[project-id].supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`
   - Confirme que retorna as 3 URLs

4. **Teste o portal:**
   - Abra o portal público (janela anónima)
   - Pressione F12 → Console
   - Recarregue a página
   - Verifique os logs
   - Verifique se o logo/icon aparece

Se **TODOS** os passos acima passarem e mesmo assim não aparecer, há um problema de renderização específico que precisaremos investigar mais a fundo.

---

**Data:** 07/11/2024  
**Status:** Logs de debug adicionados - Aguardando feedback do utilizador
