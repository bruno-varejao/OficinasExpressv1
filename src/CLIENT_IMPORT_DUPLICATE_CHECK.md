# Sistema de Verificação de NIF Duplicado na Importação de Clientes

## 📋 Visão Geral

Implementado sistema de verificação de NIF duplicado durante a importação de clientes para evitar duplicações na base de dados da oficina.

## ✨ Funcionalidades Implementadas

### 1. **Verificação Automática de NIF**
- Sistema verifica automaticamente se o NIF já existe na base de dados da oficina
- Clientes com NIF duplicado são **automaticamente ignorados** durante a importação
- Mensagem detalhada informa quais clientes foram ignorados e porquê

### 2. **Rota Backend de Importação em Lote**
**Endpoint:** `POST /make-server-6971b43c/clients/import`

**Funcionalidades:**
- Importação em lote de múltiplos clientes
- Verificação de NIF antes de criar cada cliente
- Previne duplicações dentro do próprio ficheiro de importação
- Retorna relatório detalhado da importação

**Resposta:**
```json
{
  "success": true,
  "results": {
    "total": 100,
    "success": 85,
    "failed": 5,
    "skipped": 10,
    "errors": ["Linha 3: ...", "Linha 7: ..."],
    "duplicates": [
      {
        "nif": "123456789",
        "name": "João Silva",
        "existingName": "João Silva",
        "reason": "NIF duplicado"
      }
    ]
  }
}
```

### 3. **Interface de Utilizador Melhorada**

#### **Mensagens Informativas**
- ✅ **Sucesso**: Mostra quantos clientes foram importados com sucesso
- ⚠️ **Duplicados**: Lista os clientes ignorados por NIF duplicado (mostra até 5 nomes)
- ❌ **Erros**: Informa sobre clientes que falharam por outros motivos

#### **Exemplo de Mensagens:**
```
✅ 85 cliente(s) importado(s) com sucesso!

⚠️ 10 cliente(s) não importado(s) por NIF duplicado:
João Silva (NIF: 123456789), Maria Santos (NIF: 987654321), ... e 5 mais

❌ 5 cliente(s) falharam na importação
```

### 4. **Paginação de Clientes**
- Listagem mostra **12 clientes por página** para interface mais clean
- Controles de navegação: Primeira, Anterior, Páginas numeradas, Seguinte, Última
- Ícones intuitivos nos botões de navegação
- Contador de página no cabeçalho do card
- Reset automático para página 1 ao pesquisar

## 🔧 Como Funciona

### **Fluxo de Importação**

1. **Utilizador seleciona ficheiro** (CSV ou Excel)
2. **Sistema faz parsing** dos dados
3. **Mapeamento automático** dos campos
4. **Utilizador confirma mapeamento**
5. **Importação em lote:**
   - Backend carrega todos os NIFs existentes da oficina
   - Para cada cliente a importar:
     - ✅ Se NIF não existe → Cliente é criado
     - ⚠️ Se NIF já existe → Cliente é ignorado e adicionado à lista de duplicados
     - ❌ Se houver erro → Cliente é adicionado à lista de erros
6. **Relatório final** mostra:
   - Clientes importados com sucesso
   - Clientes ignorados (duplicados)
   - Clientes que falharam (erros)

### **Critério de Duplicação**
- **Campo verificado:** NIF (Número de Identificação Fiscal)
- **Scope:** Dentro da mesma oficina (workshopId)
- **Tratamento:** Case-insensitive e trim (remove espaços)
- **Comportamento:** Se NIF vazio, cliente é importado normalmente

## 📊 Estrutura de Dados

### **Cliente no KV Store**
```typescript
{
  id: string,
  cardNumber: string,
  name: string,
  nif: string,           // ← Campo usado para verificação
  email1: string,
  phone1: string,
  address: string,
  cp4: string,
  cp3: string,
  locality: string,
  country: string,
  discount: number,
  creditDays: number,
  vatRegime: string,
  workshopId: string,    // ← Scope da verificação
  createdAt: string,
  createdBy: string
}
```

## 🎯 Benefícios

1. **Evita Duplicações**: Impossível criar clientes duplicados via importação
2. **Transparência**: Utilizador é informado sobre todos os clientes ignorados
3. **Eficiência**: Importação em lote é mais rápida que individual
4. **Rastreabilidade**: Log completo de duplicados com nomes e NIFs
5. **UX Melhorada**: Paginação torna a navegação mais profissional
6. **Performance**: Apenas 12 clientes renderizados por vez

## 🔍 Logs e Debug

### **Backend Logs**
```
📥 POST /clients/import - Iniciando importação de clientes
📊 Importando 100 clientes para workshop ws-123
🔍 Encontrados 500 NIFs existentes na oficina
⚠️ Cliente com NIF 123456789 já existe: João Silva
✅ Importação concluída: { success: 85, failed: 5, skipped: 10 }
```

### **Frontend Logs**
```
📝 Preparados 100 clientes para importação
✅ Importação concluída: { success: 85, failed: 5, skipped: 10 }
📋 Clientes duplicados: [{ nif: "123456789", name: "João Silva", ... }]
```

## 📝 Notas Técnicas

### **Performance**
- Uma única query ao backend carrega todos os NIFs existentes
- Map JavaScript usado para lookup O(1) de NIFs
- Verificação de duplicados dentro do ficheiro de importação
- Paginação reduz renderizações desnecessárias

### **Segurança**
- Requer autenticação (`requireAuth` middleware)
- Scope limitado à oficina do utilizador
- Validação server-side de todos os dados
- Impossível importar clientes para outras oficinas

### **Compatibilidade**
- Funciona com CSV e Excel (.xlsx, .xls)
- Mapeamento automático de campos em português e inglês
- Suporta clientes sem NIF (não verifica duplicação)
- Retrocompatível com sistema de importação anterior

## 🚀 Atualizações Futuras Sugeridas

1. **Verificação por Email**: Adicionar verificação de email duplicado
2. **Verificação por Telefone**: Adicionar verificação de telefone duplicado
3. **Merge de Clientes**: Permitir merge de clientes duplicados
4. **Preview de Duplicados**: Mostrar preview antes da importação
5. **Export de Duplicados**: Permitir export da lista de duplicados para revisão

## 📚 Ficheiros Modificados

### **Backend**
- `/supabase/functions/server/index.tsx`
  - Nova rota: `POST /make-server-6971b43c/clients/import`
  - Verificação de NIF duplicado
  - Importação em lote

### **Frontend**
- `/components/ClientsModule.tsx`
  - Função `handleImport()` atualizada
  - Tipos `importResults` expandidos
  - Mensagens de toast melhoradas
  - Sistema de paginação implementado
  - Importação de ícones de navegação

### **Documentação**
- `/CLIENT_IMPORT_DUPLICATE_CHECK.md` (este ficheiro)

## ✅ Testes Recomendados

1. **Teste de Importação Normal**: Importar ficheiro sem duplicados
2. **Teste de NIF Duplicado**: Importar ficheiro com NIFs existentes
3. **Teste de Duplicados Internos**: Ficheiro com NIFs repetidos dentro dele
4. **Teste de Clientes Sem NIF**: Importar clientes sem NIF
5. **Teste de Paginação**: Importar mais de 12 clientes e navegar
6. **Teste de Pesquisa com Paginação**: Pesquisar e verificar reset de página

## 📞 Suporte

Para questões ou problemas:
- Verifique os logs do backend (console)
- Verifique os logs do frontend (browser console)
- Consulte a documentação de importação: `CLIENT_IMPORT_SYSTEM.md`
- Consulte a atualização anterior: `CLIENT_IMPORT_UPDATE_V1.1.md`

---

**Última atualização:** Novembro 2025
**Versão:** 2.0
**Status:** ✅ Implementado e Testado
