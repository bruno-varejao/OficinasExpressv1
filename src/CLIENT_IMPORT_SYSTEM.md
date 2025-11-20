# Sistema de Importação de Clientes

## 📋 Resumo

Foi implementado um sistema completo de importação em lote de clientes no módulo de Clientes da plataforma OficinasExpress, permitindo a importação de múltiplos clientes através de ficheiros CSV ou Excel.

## ✨ Funcionalidades

### 1. **Formatos Suportados**
- ✅ CSV (.csv)
- ✅ Excel (.xlsx)
- ✅ Excel legado (.xls)

### 2. **Detecção Automática de Campos**

O sistema detecta automaticamente os campos do ficheiro importado baseado em nomes comuns em Português e Inglês:

**Padrões de detecção:**
- **Nome:** `nome`, `name`, `cliente`, `client`, `razão social`, `razao social`
- **NIF:** `nif`, `contribuinte`, `tax id`, `vat`, `nipc`
- **Email:** `email`, `e-mail`, `mail`, `email1`, `email 1`, `correio`
- **Telefone:** `telefone`, `phone`, `telemóvel`, `telemóvel`, `contacto`, `phone1`, `tel`, `mobile`
- **Morada:** `morada`, `address`, `rua`, `street`, `endereço`, `endereco`
- **Código Postal:** `código postal`, `codigo postal`, `postal code`, `cp`, `zip`
- **Localidade:** `localidade`, `city`, `cidade`, `locality`, `local`
- **País:** `país`, `pais`, `country`
- **Desconto:** `desconto`, `discount`
- **Dias Crédito:** `dias crédito`, `dias credito`, `credit days`, `prazo`
- **Regime IVA:** `regime iva`, `vat regime`, `iva`

### 3. **Mapeamento Manual**

Caso a detecção automática não seja perfeita, o utilizador pode:
- ✅ Ajustar manualmente o mapeamento de qualquer coluna
- ✅ Ignorar colunas que não são necessárias
- ✅ Mapear para qualquer campo disponível do cliente

**Campos disponíveis para mapeamento:**
- Nome
- NIF
- Email 1
- Email 2
- Telefone 1
- Telefone 2
- Telefone 3
- Morada
- Código Postal
- Localidade
- País
- Desconto (%)
- Dias Crédito
- Regime IVA

**Nota importante:**
- ⚠️ **Número de Cliente:** NÃO deve ser importado. É atribuído automaticamente pelo sistema para evitar conflitos.

### 4. **Validação de Dados**

O sistema valida cada linha antes de importar:
- ✅ **Linhas vazias:** Ignoradas automaticamente
- ✅ **Número de cliente:** Atribuído automaticamente pelo sistema
- ✅ **Código postal:** Automaticamente dividido em cp4 e cp3 se no formato XXXX-XXX
- ✅ **Valores padrão:** País definido como "Portugal" se não especificado
- ✅ **Regime IVA:** Definido como "normal" se não especificado
- ✅ **Campos opcionais:** Todos os campos são opcionais, permitindo importações parciais

### 5. **Feedback em Tempo Real**

Durante a importação:
- 📊 Barra de progresso visual
- 📈 Percentagem de conclusão
- ✅ Contagem de sucessos
- ❌ Contagem de falhas
- 📝 Lista detalhada de erros (até 10 primeiros)

### 6. **Template de Exemplo**

O sistema fornece um botão para **download de template** com:
- Cabeçalhos em Português
- 2 linhas de exemplo preenchidas
- Todos os campos comuns incluídos

**Conteúdo do template:**
```csv
nome,telefone,email,nif,morada,codigo postal,localidade,pais,desconto,dias credito,regime iva
João Silva,+351 912345678,joao@exemplo.pt,123456789,Rua Exemplo 123,1000-001,Lisboa,Portugal,5,30,normal
Maria Santos,+351 987654321,maria@exemplo.pt,987654321,Av. Liberdade 456,4000-123,Porto,Portugal,10,15,normal
António Costa,+351 933444555,antonio@exemplo.pt,111222333,Praça Central 789,3000-456,Coimbra,Portugal,0,0,isento
```

## 🎯 Fluxo de Utilização

### Passo 1: Download do Template (Opcional)
1. Clicar no botão **"Template"**
2. Ficheiro `template_clientes.csv` é descarregado
3. Preencher com os dados dos clientes

### Passo 2: Importar Ficheiro
1. Clicar no botão **"Importar"**
2. Selecionar ficheiro CSV ou Excel
3. Sistema processa e deteta colunas automaticamente

### Passo 3: Verificar Mapeamento
1. Sistema mostra mapeamento automático
2. Verificar se os campos estão corretos
3. Ajustar manualmente se necessário
4. Ver quantas linhas serão importadas

### Passo 4: Confirmar Importação
1. Clicar em **"Importar X Cliente(s)"**
2. Aguardar processamento (barra de progresso)
3. Ver resultados da importação

### Passo 5: Verificar Resultados
1. Ver quantos clientes foram importados com sucesso
2. Ver quantas linhas falharam (se houver)
3. Consultar lista de erros detalhados
4. Clicar em "Fechar" para concluir

## 🔧 Implementação Técnica

### Bibliotecas Utilizadas

**PapaParse** (para CSV):
```typescript
import('papaparse')
```

**XLSX** (para Excel):
```typescript
import('xlsx')
```

### Estados do Componente

```typescript
const [importDialogOpen, setImportDialogOpen] = useState(false)
const [importFile, setImportFile] = useState<File | null>(null)
const [importData, setImportData] = useState<any[]>([])
const [importColumns, setImportColumns] = useState<string[]>([])
const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
const [importing, setImporting] = useState(false)
const [importProgress, setImportProgress] = useState(0)
const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] })
```

### Funções Principais

#### handleFileUpload()
- Lê o ficheiro selecionado
- Detecta o tipo (CSV ou Excel)
- Parseia os dados
- Extrai colunas/cabeçalhos
- Chama autoMapFields()

#### autoMapFields()
- Analisa nomes das colunas
- Compara com padrões conhecidos
- Cria mapeamento automático
- Ignora colunas não reconhecidas

#### handleImport()
- Itera sobre todas as linhas
- Valida campos obrigatórios
- Mapeia dados conforme configuração
- Divide código postal se necessário
- Faz chamada POST para criar cliente
- Atualiza progresso
- Registra sucessos/falhas

#### resetImport()
- Limpa todos os estados
- Fecha o diálogo
- Prepara para nova importação

#### downloadTemplate()
- Cria ficheiro CSV com template
- Inclui cabeçalhos e exemplos
- Inicia download automático

## 📍 Localização no Código

**Ficheiro:** `/components/ClientsModule.tsx`

**Seções adicionadas:**
1. **Imports:** Novos ícones (Upload, FileSpreadsheet, Download, X, Check)
2. **Estados:** 9 novos estados para controlar importação
3. **Funções:** 5 novas funções (handleFileUpload, autoMapFields, handleImport, resetImport, downloadTemplate)
4. **UI:** 3 novos botões no header (Template, Importar, Leitor de Cartão)
5. **Diálogo:** Novo Dialog completo com 4 steps diferentes

## 🎨 Interface do Utilizador

### Botões no Header
```
[Template]  [Importar]  [Leitor de Cartão]  [Novo Cliente]
```

### Diálogo de Importação

**Step 1 - Upload:**
- Área de drag & drop visual
- Input file hidden com label clicável
- Alert informativo sobre formatos

**Step 2 - Mapeamento:**
- Lista de todas as colunas encontradas
- Select dropdown para cada coluna
- Mapeamento automático pré-aplicado
- Alert sobre campos obrigatórios

**Step 3 - Importando:**
- Loader animado
- Barra de progresso
- Percentagem
- Contadores de sucesso/falha em tempo real

**Step 4 - Resultados:**
- Alert de sucesso (verde)
- Resumo numérico
- Lista de erros (se houver)
- Limite de 10 erros visíveis + contador de adicionais

## 🔒 Segurança e Validação

### Validações Implementadas:
1. ✅ Formato de ficheiro verificado (apenas CSV, XLSX, XLS)
2. ✅ Tamanho do ficheiro controlado pelo browser
3. ✅ Parsing com tratamento de erros
4. ✅ Linhas vazias ignoradas automaticamente
5. ✅ Sanitização de strings (trim)
6. ✅ Validação de código postal com regex
7. ✅ Autenticação via accessToken em todas as chamadas API
8. ✅ Erros capturados e mostrados ao utilizador
9. ✅ Número de cliente atribuído automaticamente pelo sistema

### Tratamento de Erros:
- Parse error → Toast error + log no console
- Linha vazia → Ignorada silenciosamente
- API error → Contada como falha + mensagem da API
- Exception genérica → Contada como falha + stack trace
- Campos inválidos → Backend valida e retorna erro específico

## 📊 Métricas e Logs

### Console Logs:
```javascript
console.log('📄 CSV parsed:', results)
console.log('📊 Excel parsed:', { headers, rows })
console.log('🔄 Auto-mapped fields:', mapping)
console.log(`📝 Importing client ${i + 1}/${importData.length}:`, clientData)
console.error(`❌ Error importing row ${i + 1}:`, error)
```

### Toasts:
- ✅ Sucesso: `X cliente(s) importado(s) com sucesso!`
- ❌ Falhas: `X cliente(s) falharam`
- ⚠️ Parse error: `Erro ao ler ficheiro CSV`
- ⚠️ Formato inválido: `Formato de ficheiro não suportado`
- ⚠️ Erro genérico: `Erro ao processar ficheiro`

## 💡 Boas Práticas e Dicas

### Para o Utilizador:
1. **Use o template** - Garante formato correto
2. **Revise o mapeamento** - Verifique antes de importar
3. **Campos flexíveis** - Todos os campos são opcionais, importe apenas os dados que tem
4. **Número de cliente** - Será atribuído automaticamente, não precisa incluir
5. **Código postal** - Use formato XXXX-XXX para divisão automática
6. **Encoding** - Use UTF-8 para caracteres portugueses (á, é, ç, etc.)

### Para Desenvolvimento:
1. **Validação dupla** - Frontend valida, backend também deve validar
2. **Logs detalhados** - Console.log em cada passo importante
3. **Feedback visual** - Loading states e progress bars
4. **Tratamento de erros** - Try-catch em todas as operações async
5. **Reset state** - Limpar estados ao fechar diálogo

## 🚀 Melhorias Futuras (Sugestões)

### Funcionalidades Adicionais:
1. **Preview antes de importar** - Mostrar preview dos primeiros 5-10 registos
2. **Validação de duplicados** - Detectar NIFs ou nomes duplicados
3. **Importação incremental** - Atualizar clientes existentes em vez de criar duplicados
4. **Mais formatos** - Suporte para JSON, XML
5. **Drag & Drop** - Permitir arrastar ficheiro diretamente
6. **Upload em lote** - Permitir múltiplos ficheiros
7. **Histórico de importações** - Log de todas as importações realizadas
8. **Export** - Exportar lista de clientes atual para CSV/Excel
9. **Validação de NIF** - Validar formato e check digit do NIF
10. **Validação de Email** - Validar formato de email com regex

### Performance:
1. **Importação em chunks** - Processar em lotes de 50-100 por vez
2. **Web Workers** - Parsing de ficheiros grandes em background
3. **Async import** - Não bloquear UI durante importação
4. **Cancel operation** - Permitir cancelar importação em progresso

### UX:
1. **Undo import** - Permitir desfazer importação recente
2. **Smart mapping** - Aprender com mapeamentos anteriores
3. **Multi-language** - Suporte para diferentes idiomas nos headers
4. **Color coding** - Campos obrigatórios em cor diferente
5. **Tooltips** - Explicações sobre cada campo

## 🎉 Conclusão

O sistema de importação de clientes está **totalmente funcional** e pronto para uso em produção. Suporta os formatos mais comuns (CSV e Excel), tem detecção automática de campos inteligente, validação robusta, e fornece feedback claro ao utilizador em todas as etapas do processo.

**Principais vantagens:**
- ⚡ Rápido: Importar centenas de clientes em segundos
- 🎯 Flexível: Todos os campos são opcionais
- 🧠 Inteligente: Detecção automática de campos
- 🎨 Intuitivo: Interface clara e guiada
- 📊 Informativo: Feedback detalhado de erros
- 🔒 Seguro: Validações múltiplas e autenticação
- 🔢 Automático: Número de cliente gerado pelo sistema

---

**Versão:** 1.1  
**Data:** 09/11/2025  
**Status:** ✅ Implementado e Testado  
**Última Atualização:** Removidos campos obrigatórios e número de cliente automático
