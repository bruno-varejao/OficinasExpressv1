# Integração TecDoc API - OficinasExpress

## Visão Geral

O módulo Stock da plataforma OficinasExpress está integrado com a API TecDoc da TecAlliance para permitir a busca automática de dados de peças por referência.

## Funcionalidades

✅ **Busca automática por referência**: Digite a referência da peça e clique no botão 🗄️ para buscar dados no TecDoc

✅ **Preenchimento automático de campos**:
- Nome da peça
- Descrição detalhada
- Fabricante
- Código EAN
- Preços (compra e venda)
- Imagem do produto
- Dados técnicos

✅ **Indicador visual**: Badge "Dados TecDoc" aparece quando dados são importados com sucesso

## Configuração

### 1. Obter Credenciais TecDoc

1. Acesse https://www.tecalliance.net/
2. Contrate um plano de subscrição TecDoc
3. Obtenha a sua chave de API (API Key)
4. Identifique o endpoint correto da API para o seu plano

### 2. Configurar Variável de Ambiente

No painel Supabase:

1. Vá para **Project Settings** → **Edge Functions** → **Secrets**
2. Adicione a variável: `TECDOC_API_KEY`
3. Cole a sua chave de API TecDoc
4. Guarde as alterações

### 3. Adaptar o Endpoint (Se Necessário)

Dependendo da sua subscrição TecDoc, pode ser necessário adaptar o endpoint da API:

Edite o arquivo `/supabase/functions/server/tecdoc_routes.tsx`:

```typescript
// Linha 38 - Adapte este URL para o seu endpoint TecDoc
const tecdocUrl = 'https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatalog.jsonEndpoint'
```

Endpoints comuns:
- **Pegasus 3.0**: `https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatalog.jsonEndpoint`
- **Reference Data**: `https://webservice.tecalliance.services/reference-data/`
- **Catalog**: `https://webservice.tecalliance.services/catalog/`

### 4. Verificar Estrutura de Request

A estrutura do pedido pode variar. Adapte se necessário:

```typescript
const requestBody = {
  articleNumber: reference.trim(),
  provider: 3,  // TecAlliance provider ID
  lang: 'PT',   // Portuguese
  // Adicione outros parâmetros conforme a sua API
}
```

### 5. Testar a Integração

1. Aceda ao módulo **Stock** na plataforma
2. Clique em **Novo Item**
3. Insira uma referência conhecida (ex: "0450906262" - Filtro Bosch)
4. Clique no botão 🗄️ ao lado do campo Referência
5. Verifique se os dados são importados automaticamente

## Estrutura de Dados

### Dados Recebidos do TecDoc

O backend normaliza a resposta TecDoc para esta estrutura:

```typescript
{
  found: boolean,
  reference: string,
  name: string,
  description: string,
  manufacturer: string,
  categoryName: string,
  eanCode: string,
  imageUrl: string,
  purchasePrice: number | null,
  salePrice: number | null,
  recommendedPrice: number | null,
  oem: string[],
  crossReferences: string[],
  technicalData: any[],
  specifications: object
}
```

### Campos Preenchidos Automaticamente

No formulário de Stock, os seguintes campos são preenchidos:

| Campo | Origem TecDoc |
|-------|---------------|
| Nome | `name` ou `genericArticleName` |
| Descrição | `description` ou `articleDescription` |
| Fabricante | `manufacturer` ou `brandName` |
| Código EAN | `eanCode` ou `eanNumber` |
| Código de Barras | `eanCode` (duplicado) |
| Preço Compra | `purchasePrice` ou `tradePrice` ou `recommendedPrice` |
| Preço Venda | `salePrice` ou `retailPrice` ou `recommendedPrice` |
| URL Imagem | `imageUrl` ou primeira imagem do array |

## Resolução de Problemas

### ❌ "API TecDoc não está configurada"

**Solução**: Configure a variável de ambiente `TECDOC_API_KEY` no Supabase.

### ⚠️ "Nenhum resultado encontrado"

**Causas possíveis**:
1. Referência não existe na base de dados TecDoc
2. Referência foi digitada incorretamente
3. O seu plano TecDoc não tem acesso a essa marca/categoria

**Solução**: Verifique a referência e tente novamente com uma referência conhecida.

### ❌ "Erro ao consultar TecDoc (400/401/403)"

**Causas**:
- `400`: Estrutura de request incorreta
- `401`: API Key inválida ou expirada
- `403`: Sem permissões para esse endpoint/categoria

**Solução**: 
1. Verifique se a API Key está correta
2. Confirme que o endpoint está correto para o seu plano
3. Verifique a estrutura do request no código

### 🔄 Loading infinito

**Causa**: Timeout ou erro de rede

**Solução**: 
1. Verifique a sua conexão à internet
2. Verifique se o endpoint TecDoc está acessível
3. Consulte os logs do servidor no Supabase

## Versões da API TecDoc

A TecAlliance oferece várias versões da API:

### TecDoc Catalog 3.0 (Pegasus)
- Endpoint: `/pegasus-3-0/`
- Funcionalidades: Busca de artigos, dados técnicos, imagens
- Recomendado para: Oficinas e revendedores

### Reference Data API
- Endpoint: `/reference-data/`
- Funcionalidades: Dados mestre de veículos e peças
- Recomendado para: Plataformas de e-commerce

### TecRMI
- Endpoint: `/tecrmi/`
- Funcionalidades: Informações de reparação e manutenção
- Recomendado para: Oficinas com serviços de diagnóstico

## Estruturas de Resposta Alternativas

Dependendo da API, a estrutura pode variar. O código já contempla várias possibilidades:

```typescript
// Arrays de artigos podem estar em:
tecdocData.articles       // Padrão
tecdocData.data           // Alternativa 1
tecdocData.array          // Alternativa 2
tecdocData                // Array direto

// Campos de artigo podem ser:
article.articleNumber || article.partNumber || article.reference
article.articleName || article.genericArticleName || article.name
article.brandName || article.manufacturer || article.brand
```

## Suporte

Para questões relacionadas com a API TecDoc:
- Documentação oficial: https://www.tecalliance.net/en/solutions/tecdoc/
- Suporte TecAlliance: support@tecalliance.services

Para questões da plataforma OficinasExpress:
- Email: inscricoes@oficinasexpress.com

## Próximas Funcionalidades

🔄 **Em desenvolvimento**:
- Busca de peças por veículo (matrícula/VIN)
- Importação de dados técnicos detalhados
- Listagem de OEM e referências cruzadas
- Cache local de consultas TecDoc
- Sincronização automática de preços
- Integração com fornecedores através de TecDoc

---

**Última atualização**: Novembro 2025
**Versão**: 1.0.0
