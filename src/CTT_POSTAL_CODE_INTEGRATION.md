# Integração API CTT - Códigos Postais de Portugal

## 📋 Resumo das Implementações

Foi implementada a integração completa com a API de Códigos Postais CTT de Portugal nos módulos de **Clientes** e **Configurações** da plataforma OficinasExpress.

## ✅ Implementações Realizadas

### 1. Backend - Nova Rota API

**Localização:** `/supabase/functions/server/index.tsx`

**Rota criada:**
```typescript
GET /make-server-6971b43c/postal-code/:postalCode
```

**Funcionalidades:**
- ✅ Validação do formato do código postal (XXXX-XXX)
- ✅ Integração com API CTT externa
- ✅ Tratamento de erros completo
- ✅ Retorna array de moradas encontradas
- ✅ Logs detalhados para debugging

**Resposta da API:**
```json
{
  "success": true,
  "addresses": [
    {
      "morada": "Rua Exemplo",
      "porta": "",
      "localidade": "Lisboa",
      "freguesia": "Santa Maria Maior",
      "concelho": "Lisboa",
      "distrito": "Lisboa",
      "latitude": "38.7223",
      "longitude": "-9.1393",
      "codigo-postal": "1100-001",
      "info-local": "Informação adicional",
      "codigo-arteria": "123456",
      "concelho-codigo": 11,
      "distrito-codigo": 11
    }
  ],
  "count": 1
}
```

### 2. Módulo de Clientes - Pesquisa CTT

**Localização:** `/components/ClientsModule.tsx`

**Implementações:**
- ✅ Interface `CttAddress` para tipagem TypeScript
- ✅ Estados para controle do diálogo de seleção de moradas
- ✅ Função `searchPostalCode()` atualizada para usar API CTT
- ✅ Função `applyAddressToForm()` para preencher automaticamente os campos
- ✅ Diálogo de seleção quando há múltiplas moradas
- ✅ Preenchimento automático quando há apenas uma morada
- ✅ Atualização da função `createClientFromCard()` para dividir código postal

**Experiência do Utilizador:**
1. Utilizador preenche cp4 (4 dígitos) e cp3 (3 dígitos)
2. Clica no botão de pesquisa (ícone de mapa)
3. Sistema consulta API CTT
4. **Se 1 morada encontrada:** Preenche automaticamente todos os campos
5. **Se múltiplas moradas:** Abre diálogo para seleção
6. Utilizador clica na morada desejada
7. Campos preenchidos: Morada completa, Localidade, País

**Campos preenchidos automaticamente:**
- ✅ Morada (inclui rua, info-local e porta)
- ✅ Localidade
- ✅ País (Portugal)

### 3. Módulo de Configurações - Pesquisa CTT

**Localização:** `/components/SettingsModule.tsx`

**Implementações:**
- ✅ Interface `CttAddress` para tipagem TypeScript
- ✅ Estados para controle do diálogo de seleção de moradas
- ✅ Função `searchPostalCode()` atualizada para usar API CTT
- ✅ Função `applyAddressToWorkshop()` para atualizar dados da oficina
- ✅ Diálogo de seleção quando há múltiplas moradas
- ✅ Preenchimento automático quando há apenas uma morada

**Campos da Oficina preenchidos:**
- ✅ Morada (address)
- ✅ Localidade (locality)
- ✅ País (country)

### 4. Fix: Salvamento de Dados da Oficina

**Problema Identificado:**
Os campos editados em "Gestão Dados Oficina" não estavam sendo guardados porque a rota PUT `/workshop/profile` não estava a receber/salvar todos os campos.

**Solução Implementada:**
Atualização da rota PUT para incluir TODOS os campos:
- ✅ name
- ✅ address
- ✅ **postalCode** (novo)
- ✅ **cp4** (novo)
- ✅ **cp3** (novo)
- ✅ **locality** (novo)
- ✅ **country** (novo)
- ✅ phone
- ✅ **phone2** (novo)
- ✅ email
- ✅ nif
- ✅ **iban** (novo)
- ✅ **website** (novo)
- ✅ **defaultVatRate** (novo)
- ✅ **appDisplayName** (novo)
- ✅ **nifApiKey** (novo)
- ✅ logoUrl

### 5. Leitor de Cartão de Cidadão - Divisão de Código Postal

**Implementação:**
Quando o utilizador cria um cliente a partir do Cartão de Cidadão, o código postal é automaticamente dividido em cp4 e cp3 antes de criar o cliente.

**Código:**
```typescript
// Dividir código postal em cp4 e cp3 se disponível
let cp4 = ''
let cp3 = ''
let postalCodeFull = ''

if (cardData.postalCode) {
  const postalCodeMatch = cardData.postalCode.match(/^(\d{4})-?(\d{3})$/)
  if (postalCodeMatch) {
    cp4 = postalCodeMatch[1]
    cp3 = postalCodeMatch[2]
    postalCodeFull = `${cp4}-${cp3}`
  }
}
```

## 🎨 Interface de Utilizador

### Diálogo de Seleção de Moradas

**Componentes:**
- Card clicável para cada morada
- Hover effect para melhor UX
- Display de todos os dados relevantes:
  - Morada completa
  - Informação local (se disponível)
  - Localidade (destacada)
  - Freguesia
  - Concelho
  - Distrito
  - Porta (se disponível)

**Ícones utilizados:**
- `MapPinCheck` - Título do diálogo
- `MapPin` - Cada morada individual
- `MapPinned` - Botão de pesquisa

## 🔐 Variável de Ambiente

**Nome:** `CTT_POSTAL_CODE_API_KEY`

**Status:** ✅ Configurada pelo utilizador através do sistema

**Utilização:**
```typescript
const apiKey = Deno.env.get('CTT_POSTAL_CODE_API_KEY')
```

## 📊 Fluxo de Dados

```
1. Utilizador → Preenche CP4 e CP3
2. Utilizador → Clica botão pesquisa
3. Frontend → Chama /postal-code/:postalCode
4. Backend → Valida formato
5. Backend → Chama API CTT
6. API CTT → Retorna moradas
7. Backend → Retorna para Frontend
8. Frontend → Mostra diálogo (se múltiplas) OU preenche automaticamente (se única)
9. Utilizador → Seleciona morada (se múltiplas)
10. Frontend → Preenche campos do formulário
```

## 🐛 Debugging

**Logs implementados:**
- `🔍 Pesquisando código postal CTT:` - Início da pesquisa
- `✅ Resposta da API CTT:` - Dados recebidos
- `📍 Aplicando morada ao formulário:` - Preenchimento de campos
- `✅ Campos preenchidos:` - Confirmação dos dados aplicados

**Erros tratados:**
- Código postal inválido
- Código postal não encontrado
- Erro de conexão com API
- API key não configurada

## 📝 Notas Importantes

1. **Formato obrigatório:** XXXX-XXX (4 dígitos, hífen, 3 dígitos)
2. **API key:** Deve ser configurada antes de usar a funcionalidade
3. **Múltiplas moradas:** É comum um código postal ter várias moradas (diferentes ruas)
4. **Campos automáticos:** Morada, Localidade e País são preenchidos automaticamente
5. **Compatibilidade:** Funciona tanto no módulo Clientes quanto em Configurações

## ✨ Benefícios

- ⚡ **Rapidez:** Preenchimento automático de moradas
- ✅ **Precisão:** Dados oficiais dos CTT
- 🎯 **UX melhorada:** Menos digitação, menos erros
- 🇵🇹 **Específico para Portugal:** Base de dados completa de códigos postais portugueses
- 🔄 **Sincronização:** Dados sempre atualizados via API

## 🚀 Como Usar

### No Módulo de Clientes:
1. Abrir diálogo "Novo Cliente" ou "Editar Cliente"
2. Preencher CP4 (4 dígitos) e CP3 (3 dígitos)
3. Clicar no ícone de mapa ao lado dos campos
4. Selecionar morada (se múltiplas) ou confirmar (se única)
5. Campos preenchidos automaticamente!

### No Módulo de Configurações → Gestão Dados Oficina:
1. Ir para "Configurações" → Tab "Dados Oficina"
2. Preencher CP4 (4 dígitos) e CP3 (3 dígitos)
3. Clicar no ícone de mapa ao lado dos campos
4. Selecionar morada (se múltiplas) ou confirmar (se única)
5. Clicar em "Guardar Alterações"

## 🔧 Manutenção

**Ficheiros principais:**
- `/supabase/functions/server/index.tsx` - Rota API
- `/components/ClientsModule.tsx` - Interface de clientes
- `/components/SettingsModule.tsx` - Interface de configurações

**Testes recomendados:**
- Código postal com 1 morada
- Código postal com múltiplas moradas
- Código postal inválido
- Código postal não existente
- API key inválida

---

**Versão:** 1.0  
**Data:** 09/11/2025  
**Status:** ✅ Implementado e Testado
