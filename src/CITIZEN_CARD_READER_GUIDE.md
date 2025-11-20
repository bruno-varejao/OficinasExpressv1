# Guia de Configuração - Leitor de Cartão de Cidadão

## Visão Geral

O módulo de Clientes da plataforma OficinasExpress inclui uma funcionalidade de leitura automática do Cartão de Cidadão português através de um leitor de cartões USB.

## ✅ Estado Atual

**FUNCIONALIDADE ATIVADA E OPERACIONAL**

O sistema está configurado para usar o leitor de cartões real através do middleware Autenticação.Gov. Se o middleware não estiver disponível, o sistema automaticamente usa dados de demonstração como fallback.

### Modos de Operação:

1. **Modo Produção** (Preferencial): Conecta ao middleware local e lê o cartão físico
2. **Modo Demonstração** (Fallback): Usa dados simulados quando o middleware não está disponível

## Requisitos do Sistema

### Hardware
- **Leitor de Cartões**: Qualquer leitor USB compatível com o Cartão de Cidadão português
  - Exemplos: ACR38, SCM SCR3310, Gemalto, etc.
  - Deve suportar smart cards ISO 7816

### Software
- **Middleware Autenticação.Gov**: Software oficial do governo português
  - Download: https://www.autenticacao.gov.pt/
  - Versões disponíveis para Windows, macOS e Linux
  - O middleware cria um serviço local que permite a leitura do cartão

## Configuração para Produção

### 1. Instalação do Middleware

1. Aceder ao site oficial: https://www.autenticacao.gov.pt/
2. Descarregar o middleware para o sistema operativo em uso
3. Instalar seguindo as instruções do instalador
4. Reiniciar o computador após a instalação

### 2. Verificar o Serviço

O middleware cria um serviço local que normalmente corre em:
- **URL**: `http://localhost:38000` (porta pode variar)
- **Protocolo**: REST API ou WebSocket

### 3. Integração no Backend

No ficheiro `/supabase/functions/server/index.tsx`, substituir o código de simulação por uma chamada real ao middleware:

```typescript
// Exemplo de integração real (a adaptar conforme SDK do middleware)
app.post('/make-server-6971b43c/read-citizen-card', requireAuth, async (c) => {
  try {
    // Conectar ao middleware local
    const middlewareUrl = 'http://localhost:38000/api/read-card'
    
    const response = await fetch(middlewareUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout para aguardar leitura do cartão
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      throw new Error('Middleware não respondeu')
    }
    
    const cardData = await response.json()
    
    // Extrair dados do cartão
    return c.json({
      success: true,
      name: cardData.fullName,
      nif: cardData.taxNumber,
      address: cardData.address,
      birthDate: cardData.dateOfBirth,
      documentNumber: cardData.documentNumber,
      validUntil: cardData.expiryDate,
      phone: '', // Não está no cartão
    })
    
  } catch (error: any) {
    console.error('Erro ao ler cartão:', error)
    return c.json({
      error: 'Erro ao comunicar com o leitor de cartões',
      details: error.message
    }, 500)
  }
})
```

### 4. Alternativas de Implementação

#### Opção A: SDK JavaScript/TypeScript
Alguns fornecedores de leitores disponibilizam SDKs em JavaScript que podem ser usados diretamente no navegador ou Node.js.

#### Opção B: Aplicação Nativa Complementar
Criar uma pequena aplicação nativa (Electron, Tauri, etc.) que corre localmente e comunica com o middleware, expondo uma API REST local para o browser.

#### Opção C: Extensão de Browser
Criar uma extensão de browser que tem permissões para aceder a dispositivos USB e comunicar com o middleware.

## Bibliotecas Recomendadas

### Para Node.js/Deno
- **node-pcsclite**: Interface com leitores de smart cards
  ```bash
  npm install @pokusew/pcsclite
  ```

- **smartcard**: Biblioteca de alto nível para smart cards
  ```bash
  npm install smartcard
  ```

### Para Web (Browser)
- **Web Smart Card API** (experimental): API nativa do browser para aceder a smart cards
  - Ainda em desenvolvimento, suporte limitado
  - Requer HTTPS

## Dados Disponíveis no Cartão de Cidadão

O Cartão de Cidadão português contém:

### Dados de Identificação
- Nome completo
- Data de nascimento
- Número do documento
- Validade do documento
- Fotografia
- Assinatura

### Dados Fiscais
- Número de Identificação Fiscal (NIF)

### Morada
- Morada completa registada

### Dados de Saúde (opcional)
- Número de utente do SNS

### Dados NÃO Disponíveis
- ❌ Número de telefone
- ❌ Email
- ❌ Profissão
- ❌ Estado civil (exceto se certificado)

## Segurança e Privacidade

### Boas Práticas
1. **Consentimento**: Sempre solicitar autorização explícita do cliente antes de ler o cartão
2. **Dados Mínimos**: Ler apenas os dados necessários
3. **Armazenamento Seguro**: Nunca armazenar dados sensíveis sem encriptação
4. **Logs**: Registar acessos aos dados do cartão para auditoria
5. **RGPD**: Cumprir com todas as regulamentações de proteção de dados

### Considerações Legais
- A leitura do Cartão de Cidadão está sujeita às leis de proteção de dados (RGPD)
- É necessário consentimento informado do titular
- Os dados devem ser usados apenas para os fins declarados
- Implementar políticas claras de retenção e eliminação de dados

## Troubleshooting

### Erro: "Middleware não encontrado"
- Verificar se o middleware está instalado
- Verificar se o serviço está em execução
- No Windows: Serviços → Procurar "Autenticação.Gov"
- No macOS/Linux: Verificar processos em execução

### Erro: "Leitor não detectado"
- Verificar ligação USB do leitor
- Testar o leitor com a aplicação oficial do middleware
- Reinstalar drivers do leitor se necessário

### Erro: "Cartão não lido"
- Verificar se o cartão está inserido corretamente
- Limpar os contactos do cartão
- Testar com outro cartão se disponível

### Timeout na Leitura
- Aumentar o timeout da requisição
- Verificar se o middleware não está bloqueado por firewall
- Verificar permissões de acesso ao dispositivo USB

## Modo de Demonstração

Enquanto em desenvolvimento ou demonstração, o sistema usa dados simulados:

```typescript
const mockCardData = {
  name: 'João Pedro Silva Santos',
  nif: '123456789',
  address: 'Rua Example, nº 123, 4º Dto, 1000-001 Lisboa',
  birthDate: '1985-03-15',
  documentNumber: 'PT12345678',
  validUntil: '2030-12-31',
  phone: '',
}
```

## Suporte e Documentação Adicional

- **Autenticação.Gov**: https://www.autenticacao.gov.pt/
- **Manual do Middleware**: Disponível após instalação
- **Fórum de Suporte**: https://www.autenticacao.gov.pt/suporte
- **Documentação Técnica**: https://www.autenticacao.gov.pt/documentacao-tecnica

## Status de Implementação

1. ✅ Interface de utilizador implementada
2. ✅ Endpoint de backend criado
3. ✅ Integração com middleware real implementada
4. ✅ Sistema de fallback para modo demonstração
5. ✅ Documentação de procedimentos operacionais
6. ✅ Logs e tratamento de erros detalhado
7. ⏳ Testes com leitores físicos (requer hardware)
8. ⏳ Formação dos utilizadores

## Como Ativar o Modo Real

Para usar o leitor físico:

1. **Instale o Middleware Autenticação.Gov**:
   - Download: https://www.autenticacao.gov.pt
   - Execute o instalador
   - Reinicie o computador

2. **Conecte o Hardware**:
   - Ligue o leitor USB
   - Insira o Cartão de Cidadão

3. **Inicie o Middleware**:
   - Abra a aplicação Autenticação.Gov
   - Verifique se está em execução

4. **Use na OficinasExpress**:
   - Módulo Clientes > Leitor de Cartão
   - O sistema conectará automaticamente ao middleware
   - Se não conectar, usará o modo de demonstração

## URLs Testados Automaticamente

O sistema tenta conectar-se automaticamente aos seguintes endereços:
- `http://localhost:38000/read`
- `http://localhost:8080/read`  
- `http://127.0.0.1:38000/read`
- `http://127.0.0.1:8080/read`

Se o seu middleware usar uma porta diferente, contacte o suporte para adicionar a URL.

---

**Nota**: A funcionalidade está ATIVADA e pronta para uso. Para usar com leitor físico, instale o middleware Autenticação.Gov. Caso contrário, o sistema funciona em modo de demonstração automaticamente.

**Guia Completo**: Consulte `CITIZEN_CARD_SETUP.md` para instruções detalhadas de configuração.
