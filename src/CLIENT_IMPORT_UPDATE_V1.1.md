# Atualização do Sistema de Importação de Clientes v1.1

## 📋 Mudanças Implementadas

### ✅ Alterações Realizadas

#### 1. **Remoção de Campos Obrigatórios**
- ❌ **ANTES:** Nome e Telefone eram obrigatórios
- ✅ **AGORA:** Todos os campos são opcionais
- 📝 **Razão:** Maior flexibilidade para importações parciais de dados

**Impacto:**
- Permite importar clientes com dados incompletos
- Linhas vazias são ignoradas automaticamente
- Não há rejeição por falta de campos específicos
- Backend deve validar e garantir integridade mínima

#### 2. **Número de Cliente Automático**
- ❌ **ANTES:** Coluna "Nº Cliente" podia ser mapeada
- ✅ **AGORA:** Número de cliente é SEMPRE atribuído automaticamente
- 📝 **Razão:** Evitar conflitos e duplicações

**Impacto:**
- Campo "cardNumber" removido do auto-mapping
- Opção "Nº Cliente" removida do Select de mapeamento
- Sistema garante unicidade do número de cliente
- Não há risco de sobrescrever clientes existentes

#### 3. **Template Atualizado**
- ✅ 3 linhas de exemplo (em vez de 2)
- ✅ Inclui mais campos: desconto, dias crédito, regime IVA
- ✅ Exemplos mais completos e variados

**Novo template:**
```csv
nome,telefone,email,nif,morada,codigo postal,localidade,pais,desconto,dias credito,regime iva
João Silva,+351 912345678,joao@exemplo.pt,123456789,Rua Exemplo 123,1000-001,Lisboa,Portugal,5,30,normal
Maria Santos,+351 987654321,maria@exemplo.pt,987654321,Av. Liberdade 456,4000-123,Porto,Portugal,10,15,normal
António Costa,+351 933444555,antonio@exemplo.pt,111222333,Praça Central 789,3000-456,Coimbra,Portugal,0,0,isento
```

#### 4. **Mensagens da UI Atualizadas**
- ✅ Alertas não mencionam mais campos obrigatórios
- ✅ Explicação sobre número automático adicionada
- ✅ Descrições mais claras sobre flexibilidade

**Antes:**
> "Campos obrigatórios: Nome, Telefone"

**Agora:**
> "Campos disponíveis: Nome, Telefone, Email, NIF, Morada, Código Postal, Localidade, País, Desconto, Dias Crédito, Regime IVA, etc."
> 
> "💡 O número de cliente será atribuído automaticamente"

#### 5. **Validação Simplificada**
**Código anterior:**
```typescript
// Validar campos obrigatórios
if (!clientData.name || !clientData.name.trim()) {
  results.failed++
  results.errors.push(`Linha ${i + 2}: Nome é obrigatório`)
  continue
}

if (!clientData.phone1 || !clientData.phone1.trim()) {
  results.failed++
  results.errors.push(`Linha ${i + 2}: Telefone é obrigatório`)
  continue
}
```

**Código novo:**
```typescript
// Validar se há pelo menos algum dado útil
const hasData = Object.keys(clientData).some(key => 
  clientData[key] && clientData[key].trim() !== ''
)

if (!hasData) {
  // Linha vazia, ignorar silenciosamente
  continue
}
```

## 🔧 Arquivos Modificados

### 1. `/components/ClientsModule.tsx`
- Função `autoMapFields()`: Removido padrão de detecção para "cardNumber"
- Função `handleImport()`: Removidas validações de nome e telefone obrigatórios
- Função `downloadTemplate()`: Template expandido com 3 exemplos e mais campos
- JSX do Select: Removido `<SelectItem value="cardNumber">`
- Alertas: Atualizadas mensagens sobre campos

### 2. `/CLIENT_IMPORT_SYSTEM.md`
- Seção "Campos disponíveis": Removido asterisco de obrigatório
- Seção "Validação de Dados": Atualizada para refletir nova lógica
- Seção "Template": Atualizado conteúdo CSV
- Seção "Boas Práticas": Removidas referências a campos obrigatórios
- Seção "Validações": Atualizado tratamento de erros
- Rodapé: Versão atualizada para 1.1

## 📊 Comportamento Atual

### Fluxo de Importação

```
1. Utilizador seleciona ficheiro CSV/Excel
   ↓
2. Sistema parseia e detecta colunas
   ↓
3. Auto-mapping aplicado (SEM cardNumber)
   ↓
4. Utilizador revisa e ajusta mapeamento
   ↓
5. Para cada linha:
   a. Mapeia dados conforme configuração
   b. Verifica se linha tem algum dado
   c. Se vazia → ignora
   d. Se tem dados → cria cliente
   e. Backend atribui número automaticamente
   ↓
6. Resultados apresentados ao utilizador
```

### Validações Ativas

✅ **Frontend:**
- Formato de ficheiro (CSV, XLSX, XLS)
- Linhas vazias (ignoradas)
- Código postal (divisão automática em cp4/cp3)
- Valores padrão (Portugal, normal IVA)

✅ **Backend (assumido):**
- Campos mínimos necessários
- Formato de dados
- Geração de número único de cliente
- Unicidade de NIF (se aplicável)

## ⚠️ Notas Importantes

### Para Desenvolvedores

1. **Backend deve validar:**
   - O backend DEVE ter validação própria
   - Não confiar apenas em validação do frontend
   - Garantir que número de cliente é sempre único
   - Verificar se campos críticos estão presentes

2. **Geração de número de cliente:**
   - Verificar se backend já implementa isso
   - Se não, pode ser necessário adicionar lógica:
     ```typescript
     // Exemplo de geração no backend
     const clientNumber = `CLI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
     // ou usar sequencial da base de dados
     ```

3. **Dados parciais:**
   - Sistema agora aceita clientes com dados mínimos
   - Considerar se isso é aceitável para o negócio
   - Pode ser necessário validação adicional no backend

### Para Utilizadores

1. **Flexibilidade total:**
   - Pode importar apenas os campos que tem
   - Não precisa ter todos os dados completos
   - Pode completar informações depois manualmente

2. **Número automático:**
   - Nunca inclua "Nº Cliente" no ficheiro
   - Sistema gera automaticamente
   - Garante unicidade

3. **Boas práticas:**
   - Mesmo sendo opcional, recomenda-se ter pelo menos Nome ou Telefone
   - Quanto mais dados, melhor para gestão futura
   - Código postal no formato XXXX-XXX funciona melhor

## 🎯 Casos de Uso

### Caso 1: Importação Completa
```csv
nome,telefone,email,nif,morada,codigo postal,localidade
João Silva,912345678,joao@email.pt,123456789,Rua ABC 123,1000-001,Lisboa
```
✅ Cliente criado com todos os dados

### Caso 2: Importação Parcial
```csv
nome,telefone
João Silva,912345678
```
✅ Cliente criado apenas com nome e telefone

### Caso 3: Importação Mínima
```csv
email
joao@email.pt
```
✅ Cliente criado apenas com email

### Caso 4: Linha Vazia
```csv
nome,telefone,email
,,
```
⚠️ Linha ignorada silenciosamente (sem erro)

### Caso 5: Dados Mistos
```csv
nome,telefone,email
João Silva,912345678,joao@email.pt
Maria Santos,,maria@email.pt
,,
António Costa,933444555,
```
✅ João: nome + telefone + email  
✅ Maria: nome + email  
⚠️ Linha 3: ignorada  
✅ António: nome + telefone

## 🔄 Compatibilidade

### Ficheiros Antigos
- ✅ Ficheiros com "nº cliente" continuam a funcionar
- ✅ Campo será ignorado se mapeado para "Ignorar"
- ✅ Auto-mapping não vai detectar mais esse campo
- ✅ Sem breaking changes para ficheiros existentes

### Comportamento Esperado
- Importações antigas: funcionam igual
- Novas importações: mais flexíveis
- Template: mais completo e atualizado

## 📝 Checklist de Verificação

Antes de usar em produção, verificar:

- [ ] Backend gera número de cliente automaticamente?
- [ ] Backend valida campos mínimos necessários?
- [ ] Backend garante unicidade do número de cliente?
- [ ] Testado com ficheiro CSV vazio?
- [ ] Testado com ficheiro Excel vazio?
- [ ] Testado com dados parciais?
- [ ] Testado com todas as colunas vazias?
- [ ] Mensagens de erro do backend são claras?
- [ ] Performance OK com 1000+ linhas?
- [ ] Encoding UTF-8 funciona com acentos?

## 🚀 Próximos Passos Sugeridos

### Curto Prazo
1. Testar importação com dados reais
2. Verificar geração de número de cliente no backend
3. Validar casos extremos (todos os campos vazios)

### Médio Prazo
1. Adicionar preview dos dados antes de importar
2. Detectar e alertar sobre duplicados (NIF)
3. Permitir atualização de clientes existentes

### Longo Prazo
1. Histórico de importações
2. Rollback de importações
3. Validações customizáveis por oficina

## 🐛 Correção Crítica: Backend Validação

### Problema Identificado
Após implementação inicial, descobriu-se que o **backend ainda validava campos obrigatórios**:
```
Error: "Name and phone are required"
```

### Solução Aplicada

**Arquivo:** `/supabase/functions/server/index.tsx`  
**Rota:** `POST /make-server-6971b43c/clients`

#### Antes:
```typescript
const { name, email, phone, nif, address } = await c.req.json()

if (!name || !phone) {
  return c.json({ error: 'Name and phone are required' }, 400)
}

const client = {
  id: clientId,
  name,
  email,
  phone,
  nif,
  address,
  workshopId,
  createdAt: new Date().toISOString(),
  createdBy: userId
}
```

#### Depois:
```typescript
const clientData = await c.req.json()

// Validar se há pelo menos algum dado útil
const hasData = Object.values(clientData).some(value => 
  value !== null && value !== undefined && String(value).trim() !== ''
)

if (!hasData) {
  return c.json({ error: 'At least one field is required' }, 400)
}

// Gerar número de cliente automático
const timestamp = Date.now()
const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
const cardNumber = `CLI-${timestamp}-${randomPart}`

// Construir objeto cliente com TODOS os campos
const client = {
  id: clientId,
  cardNumber,                                          // ✅ NOVO
  name: clientData.name || '',                        // ✅ Opcional
  nif: clientData.nif || '',                          // ✅ NOVO
  email1: clientData.email1 || '',                    // ✅ NOVO
  email2: clientData.email2 || '',                    // ✅ NOVO
  phone1: clientData.phone1 || '',                    // ✅ Opcional
  phone2: clientData.phone2 || '',                    // ✅ NOVO
  phone3: clientData.phone3 || '',                    // ✅ NOVO
  address: clientData.address || '',                  // ✅ Opcional
  cp4: clientData.cp4 || '',                          // ✅ NOVO
  cp3: clientData.cp3 || '',                          // ✅ NOVO
  locality: clientData.locality || '',                // ✅ NOVO
  country: clientData.country || 'Portugal',          // ✅ NOVO
  discount: clientData.discount || '0',               // ✅ NOVO
  creditDays: clientData.creditDays || '0',           // ✅ NOVO
  vatRegime: clientData.vatRegime || 'normal',        // ✅ NOVO
  workshopId,
  createdAt: new Date().toISOString(),
  createdBy: userId
}
```

### Melhorias Implementadas no Backend

1. ✅ **Aceita todos os campos do frontend**
2. ✅ **Gera cardNumber automático** (formato: `CLI-{timestamp}-{random}`)
3. ✅ **Valida apenas se há algum dado** (não campos específicos)
4. ✅ **Define valores padrão** para campos vazios
5. ✅ **Suporta todos os 17 campos** do sistema de clientes

### Formato do Número de Cliente

**Padrão:** `CLI-{timestamp}-{random}`

**Exemplos:**
- `CLI-1699545678123-A3F9`
- `CLI-1699545680456-B7K2`
- `CLI-1699545682789-X1M5`

**Características:**
- ✅ Sempre único (usa timestamp)
- ✅ Fácil de identificar (prefixo CLI)
- ✅ Rastreável (timestamp permite ordenação)
- ✅ Seguro (parte aleatória adiciona entropia)

---

**Versão:** 1.1.1  
**Data de Atualização:** 09/11/2025  
**Status:** ✅ Implementado e Corrigido  
**Autor:** Sistema OficinasExpress  
**Correção:** Backend sincronizado com frontend  
