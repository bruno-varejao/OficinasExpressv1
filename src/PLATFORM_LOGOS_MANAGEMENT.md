# 🎨 Sistema de Gestão de Logotipos da Plataforma

## 📋 Descrição

Sistema completo de gestão de logotipos, ícones e favicon da plataforma OficinasExpress através do painel de administração. Permite carregar, substituir e remover imagens que são aplicadas automaticamente no portal público.

## ✨ Funcionalidades

### 1. **Gestão de Três Tipos de Imagens**

#### 📷 Logotipo Principal
- **Local de exibição:** Cabeçalho do portal público
- **Uso:** Logo principal da plataforma (horizontal)
- **Dimensões recomendadas:** Flexível, altura máxima 48px
- **Formatos aceites:** JPEG, PNG, WEBP, SVG
- **Tamanho máximo:** 2MB

#### 🔷 Icon (Ícone da Aplicação)
- **Local de exibição:** Cabeçalho e rodapé do portal público
- **Uso:** Ícone/símbolo da marca (quadrado)
- **Dimensões recomendadas:** 128x128 ou 256x256 pixels
- **Formatos aceites:** JPEG, PNG, WEBP, SVG
- **Tamanho máximo:** 2MB

#### 🌐 Favicon
- **Local de exibição:** Separador do navegador (tab)
- **Uso:** Ícone pequeno que aparece no browser
- **Dimensões recomendadas:** 16x16, 32x32 ou 64x64 pixels
- **Formatos aceites:** JPEG, PNG, WEBP, SVG, ICO
- **Tamanho máximo:** 2MB

### 2. **Interface de Administração**

**Localização:** Painel Admin → Tab "Gestão de Logotipos"

**Funcionalidades por imagem:**
- ✅ Upload de novas imagens
- ✅ Pré-visualização antes de guardar
- ✅ Substituição de imagens existentes
- ✅ Remoção de imagens
- ✅ Validação de formato e tamanho
- ✅ Indicador de estado (configurado/não configurado)

### 3. **Aplicação Automática**

As imagens carregadas são aplicadas automaticamente em:

**Portal Público (`PublicLandingPage.tsx`):**
- **Cabeçalho:** Logo ou Icon (prioridade ao Logo)
- **Rodapé:** Icon
- **Fallback:** Ícone gradiente padrão se nenhuma imagem configurada

**Toda a Plataforma (`App.tsx`):**
- **Favicon:** Aplicado dinamicamente no `<head>` do documento
- **Carregamento:** Ao iniciar a aplicação

## 🗂️ Arquitetura

### Frontend

#### Componente Principal
**Arquivo:** `/components/LogoManagementModule.tsx`

**Estados:**
```tsx
- logos: { logo?, icon?, favicon? }
- uploading: { logo, icon, favicon }
- [type]Preview: Pré-visualização da imagem
- [type]File: Ficheiro selecionado
```

**Funções principais:**
- `loadLogos()` - Carrega logotipos do backend
- `handleFileSelect()` - Processa seleção de ficheiro
- `validateImage()` - Valida formato e tamanho
- `handleUpload()` - Envia ficheiro para o backend
- `handleDelete()` - Remove imagem

#### Integração no Portal Público
**Arquivo:** `/components/PublicLandingPage.tsx`

**Carregamento:**
```tsx
useEffect(() => {
  loadPlatformLogos()
}, [])
```

**Exibição condicional:**
```tsx
{platformLogos.logo ? (
  <img src={platformLogos.logo} alt="Logo" />
) : platformLogos.icon ? (
  <img src={platformLogos.icon} alt="Icon" />
) : (
  <DefaultIcon />
)}
```

#### Favicon Dinâmico
**Arquivo:** `/App.tsx`

```tsx
useEffect(() => {
  const loadPlatformLogos = async () => {
    const data = await fetch('/public/platform-logos')
    if (data.logos.favicon) {
      let link = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = data.logos.favicon
    }
  }
  loadPlatformLogos()
}, [])
```

### Backend

#### Endpoints

**1. GET /admin/platform-logos** (Requer Admin)
- **Descrição:** Obter logotipos atuais
- **Resposta:** `{ logos: { logo?, icon?, favicon?, ...Path, ...UpdatedAt } }`
- **Storage:** KV Store - chave `platform:logos`

**2. POST /admin/platform-logos/:type** (Requer Admin)
- **Parâmetros:** `type` = 'logo' | 'icon' | 'favicon'
- **Body:** FormData com ficheiro
- **Validações:**
  - Tipo de ficheiro (JPEG, PNG, WEBP, SVG)
  - Tamanho máximo (2MB)
- **Processamento:**
  1. Valida ficheiro
  2. Cria bucket se não existe (`make-6971b43c-platform-assets`)
  3. Remove ficheiro antigo se existe
  4. Upload para Supabase Storage
  5. Obtém URL público
  6. Atualiza KV Store
- **Resposta:** `{ success: true, url: string, type: string }`

**3. DELETE /admin/platform-logos/:type** (Requer Admin)
- **Parâmetros:** `type` = 'logo' | 'icon' | 'favicon'
- **Processamento:**
  1. Remove ficheiro do Storage
  2. Remove entradas do KV Store
- **Resposta:** `{ success: true }`

**4. GET /public/platform-logos** (Público)
- **Descrição:** Obter logotipos para uso público
- **Resposta:** `{ logos: { logo?, icon?, favicon? } }`
- **Sem autenticação requerida**

#### Storage

**Bucket:** `make-6971b43c-platform-assets`
- **Tipo:** Público
- **Estrutura:** `/platform/[type]-[timestamp].[ext]`
- **Limite de tamanho:** 2MB por ficheiro
- **MIME types permitidos:** image/jpeg, image/png, image/webp, image/svg+xml

**Exemplo de caminho:**
```
platform/logo-1731001234567.png
platform/icon-1731001234567.svg
platform/favicon-1731001234567.ico
```

#### KV Store

**Chave:** `platform:logos`

**Estrutura:**
```json
{
  "logo": "https://[...]/platform/logo-[timestamp].png",
  "logoPath": "platform/logo-[timestamp].png",
  "logoUpdatedAt": "2024-11-07T14:30:00.000Z",
  "icon": "https://[...]/platform/icon-[timestamp].svg",
  "iconPath": "platform/icon-[timestamp].svg",
  "iconUpdatedAt": "2024-11-07T14:35:00.000Z",
  "favicon": "https://[...]/platform/favicon-[timestamp].ico",
  "faviconPath": "platform/favicon-[timestamp].ico",
  "faviconUpdatedAt": "2024-11-07T14:40:00.000Z"
}
```

## 🔄 Fluxo de Trabalho

### Upload de Logotipo

```mermaid
1. Admin seleciona ficheiro
   ↓
2. Frontend valida (tipo, tamanho)
   ↓
3. Mostra pré-visualização
   ↓
4. Admin clica "Guardar"
   ↓
5. Upload para backend via FormData
   ↓
6. Backend valida novamente
   ↓
7. Remove ficheiro antigo (se existe)
   ↓
8. Upload para Supabase Storage
   ↓
9. Obtém URL público
   ↓
10. Atualiza KV Store
    ↓
11. Retorna URL ao frontend
    ↓
12. Frontend atualiza estado e limpa preview
```

### Exibição no Portal Público

```mermaid
1. Página carrega
   ↓
2. useEffect dispara loadPlatformLogos()
   ↓
3. Fetch /public/platform-logos
   ↓
4. Armazena em estado local
   ↓
5. Renderiza condicionalmente:
   - Logo (se disponível)
   - ou Icon (se disponível)
   - ou Fallback padrão
```

### Aplicação de Favicon

```mermaid
1. App.tsx monta
   ↓
2. useEffect carrega logos
   ↓
3. Se favicon existe:
   - Procura <link rel="icon">
   - Se não existe, cria
   - Define href com URL do favicon
   ↓
4. Browser atualiza favicon automaticamente
```

## 📁 Arquivos Modificados/Criados

### Novos Arquivos
- ✨ `/components/LogoManagementModule.tsx` - Componente de gestão
- ✨ `/PLATFORM_LOGOS_MANAGEMENT.md` - Esta documentação

### Arquivos Modificados
- 🔧 `/components/AdminPanel.tsx`
  - Adicionada tab "Gestão de Logotipos"
  - Import do LogoManagementModule
  
- 🔧 `/components/PublicLandingPage.tsx`
  - Estado para platformLogos
  - loadPlatformLogos()
  - Renderização condicional de logo/icon no header
  - Renderização condicional de icon no footer
  
- 🔧 `/App.tsx`
  - useEffect para carregar e aplicar favicon
  
- 🔧 `/supabase/functions/server/index.tsx`
  - GET /admin/platform-logos
  - POST /admin/platform-logos/:type
  - DELETE /admin/platform-logos/:type
  - GET /public/platform-logos

## 🎯 Casos de Uso

### 1. Configuração Inicial
**Admin configura pela primeira vez os logotipos da plataforma**

1. Acessa Painel Admin
2. Navega para tab "Gestão de Logotipos"
3. Carrega Logotipo (logo principal)
4. Carrega Icon (ícone quadrado)
5. Carrega Favicon (16x16 ou 32x32)
6. Todos aparecem automaticamente no portal público

### 2. Rebranding
**Empresa muda identidade visual**

1. Admin acessa "Gestão de Logotipos"
2. Clica "Substituir Imagem" em cada tipo
3. Seleciona novos ficheiros
4. Pré-visualiza antes de guardar
5. Guarda cada um
6. Portal público atualiza automaticamente
7. Favicon atualiza no browser

### 3. Remoção Temporária
**Admin precisa remover temporariamente um logotipo**

1. Admin acessa gestão
2. Clica botão "Remover" no logotipo
3. Sistema volta ao fallback padrão
4. Pode recarregar a qualquer momento

## ✅ Validações

### Frontend
- ✓ Formato de ficheiro válido
- ✓ Tamanho máximo (2MB)
- ✓ Preview antes de upload
- ✓ Feedback visual de loading
- ✓ Mensagens de erro claras

### Backend
- ✓ Autenticação Admin requerida
- ✓ Tipo de parâmetro válido
- ✓ Re-validação de formato
- ✓ Re-validação de tamanho
- ✓ Tratamento de erros de Storage
- ✓ Logs detalhados

## 🔒 Segurança

### Controle de Acesso
- ✅ Apenas admins podem fazer upload/delete
- ✅ Middleware `requireAdmin` em todas rotas de gestão
- ✅ Endpoint público READ-ONLY para exibição

### Validação de Ficheiros
- ✅ Whitelist de MIME types
- ✅ Limite de tamanho de 2MB
- ✅ Validação no frontend E backend
- ✅ Sanitização de nomes de ficheiros

### Storage
- ✅ Bucket público (somente para leitura)
- ✅ Ficheiros não podem ser sobrescritos (timestamp único)
- ✅ Limpeza automática de ficheiros antigos

## 📊 Estado da Implementação

| Funcionalidade | Status | Notas |
|----------------|--------|-------|
| Interface Admin | ✅ Completo | Tab "Gestão de Logotipos" |
| Upload Logo | ✅ Completo | Com validação e preview |
| Upload Icon | ✅ Completo | Com validação e preview |
| Upload Favicon | ✅ Completo | Com validação e preview |
| Delete Logos | ✅ Completo | Com confirmação |
| Backend Endpoints | ✅ Completo | CRUD completo |
| Storage Integration | ✅ Completo | Supabase Storage |
| Portal Público Logo | ✅ Completo | Header com fallback |
| Portal Público Icon | ✅ Completo | Header e footer |
| Favicon Dinâmico | ✅ Completo | Aplicação automática |
| Validações | ✅ Completo | Frontend + Backend |
| Documentação | ✅ Completo | Este ficheiro |

## 🚀 Como Usar

### Para Administradores

1. **Aceder ao Painel Admin:**
   - Login como admin
   - Email: `inscricoes@oficinasexpress.com`

2. **Navegar para Gestão:**
   - Clicar na tab "Gestão de Logotipos"

3. **Carregar Imagens:**
   - Clicar em "Carregar Imagem" para cada tipo
   - Selecionar ficheiro do computador
   - Visualizar pré-visualização
   - Clicar "Guardar [Tipo]"

4. **Verificar no Portal:**
   - Abrir portal público
   - Verificar logo no header
   - Verificar icon no footer
   - Verificar favicon no separador do browser

### Para Developers

**Obter logotipos programaticamente:**

```typescript
const response = await fetch(
  `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`
)
const { logos } = await response.json()

console.log(logos.logo)    // URL do logo
console.log(logos.icon)    // URL do icon
console.log(logos.favicon) // URL do favicon
```

**Usar em componentes:**

```tsx
const [logos, setLogos] = useState({})

useEffect(() => {
  fetch('/public/platform-logos')
    .then(r => r.json())
    .then(data => setLogos(data.logos))
}, [])

// Renderizar
{logos.logo && <img src={logos.logo} alt="Logo" />}
```

## 🎨 Design Guidelines

### Logotipo Principal
- **Orientação:** Horizontal preferencial
- **Proporção:** Recomendado 3:1 ou 4:1
- **Fundo:** Transparente (PNG/SVG) preferencial
- **Uso:** Header, emails, documentos oficiais

### Icon
- **Proporção:** 1:1 (quadrado)
- **Tamanho:** 256x256 ou 512x512 pixels
- **Simplicidade:** Deve ser reconhecível em tamanhos pequenos
- **Uso:** Avatar, placeholder, branding secundário

### Favicon
- **Tamanho:** 32x32 pixels (standard)
- **Alternativas:** 16x16, 64x64
- **Formato:** ICO, PNG ou SVG
- **Simplicidade:** Extremamente simples (poucos detalhes)
- **Uso:** Browser tab, bookmarks

## 🐛 Troubleshooting

### Erro: "Erro ao carregar ficheiro"
**Possíveis causas:**
- Ficheiro muito grande (>2MB)
- Formato inválido
- Problema de rede
- Backend não disponível

**Solução:**
1. Verificar tamanho do ficheiro
2. Verificar formato (JPEG, PNG, WEBP, SVG)
3. Tentar novamente
4. Verificar console do browser para detalhes

### Logotipo não aparece no portal
**Possíveis causas:**
- Cache do browser
- URL inválida no Storage
- Problema de permissões no bucket

**Solução:**
1. Forçar refresh (Ctrl+F5)
2. Limpar cache do browser
3. Verificar URL no admin panel
4. Recarregar logotipo

### Favicon não atualiza
**Possíveis causas:**
- Cache agressivo do browser para favicons
- Link tag não atualizado

**Solução:**
1. Fechar e reabrir browser
2. Limpar cache completamente
3. Abrir em janela anónima/privada
4. Aguardar alguns minutos

## 📈 Melhorias Futuras

### Possíveis Enhancements
- [ ] Suporte para múltiplos tamanhos de favicon (favicon bundle)
- [ ] Compressão automática de imagens
- [ ] Conversão automática para formatos otimizados (WebP)
- [ ] Preview em tempo real no portal público
- [ ] Histórico de versões de logotipos
- [ ] Crop/resize integrado no upload
- [ ] Logos por tema (claro/escuro)
- [ ] CDN integration para melhor performance

## 🎉 Conclusão

Sistema completo de gestão de identidade visual da plataforma, permitindo personalização total através do painel de administração. As imagens são aplicadas automaticamente em toda a plataforma, proporcionando uma experiência de marca consistente.

**Status:** ✅ **TOTALMENTE FUNCIONAL**

---

**Data de Implementação:** 07/11/2024  
**Versão:** 1.0  
**Autor:** Sistema OficinasExpress
