# Guia de Integração - OficinasExpress

## Funcionalidades de Envio de Orçamentos

A plataforma OficinasExpress agora inclui funcionalidades para imprimir e enviar orçamentos através de múltiplos canais:

### ✅ Funcionalidades Implementadas

1. **Impressão/PDF** - ✅ Totalmente funcional
   - Gera uma pré-visualização do orçamento formatada
   - Permite impressão direta ou salvamento como PDF através do navegador
   - Layout profissional com informações completas do orçamento

2. **WhatsApp** - ✅ Totalmente funcional
   - Abre o WhatsApp Web/App com mensagem pré-formatada
   - Inclui resumo do orçamento e valores
   - Não requer configuração adicional

### 🔧 Funcionalidades que Requerem Configuração

#### 3. Envio por Email

**Status:** Estrutura implementada, requer integração com serviço de email

**Serviços Recomendados:**
- **SendGrid** (https://sendgrid.com/)
- **Resend** (https://resend.com/)
- **AWS SES** (https://aws.amazon.com/ses/)
- **Mailgun** (https://www.mailgun.com/)

**Passos para Configurar (exemplo com SendGrid):**

1. Criar conta no SendGrid e obter API Key
2. Adicionar a variável de ambiente no Supabase:
   ```bash
   SENDGRID_API_KEY=sua_chave_aqui
   ```
3. Descomentar e atualizar o código no arquivo `/supabase/functions/server/index.tsx` na rota:
   ```typescript
   app.post('/make-server-6971b43c/budgets/:id/send-email', ...)
   ```
4. Substituir o código comentado pela integração real com SendGrid

**Exemplo de Código (SendGrid):**
```typescript
const emailApiKey = Deno.env.get('SENDGRID_API_KEY')
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${emailApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{ 
      to: [{ email: to }],
      subject: subject
    }],
    from: { 
      email: 'geral@oficinasexpress.pt', 
      name: 'OficinasExpress' 
    },
    content: [{ 
      type: 'text/html', 
      value: message 
    }]
  })
})
```

#### 4. Envio por SMS

**Status:** Estrutura implementada, requer integração com serviço de SMS

**Serviços Recomendados:**
- **Twilio** (https://www.twilio.com/) - Recomendado
- **Vonage (Nexmo)** (https://www.vonage.com/)
- **AWS SNS** (https://aws.amazon.com/sns/)

**Passos para Configurar (exemplo com Twilio):**

1. Criar conta no Twilio e obter credenciais
2. Adicionar as variáveis de ambiente no Supabase:
   ```bash
   TWILIO_ACCOUNT_SID=seu_account_sid
   TWILIO_AUTH_TOKEN=seu_auth_token
   TWILIO_PHONE_NUMBER=+351xxxxxxxxx
   ```
3. Descomentar e atualizar o código no arquivo `/supabase/functions/server/index.tsx` na rota:
   ```typescript
   app.post('/make-server-6971b43c/budgets/:id/send-sms', ...)
   ```

**Exemplo de Código (Twilio):**
```typescript
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

const response = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, 
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: phone,
      From: twilioPhoneNumber,
      Body: message
    })
  }
)
```

## Detalhes da Viatura no Menu Lateral

### ✅ Funcionalidade Implementada

Quando uma folha de obra é selecionada (clicando no ícone de informação ℹ️), um painel lateral é aberto mostrando todos os detalhes da viatura:

**Informações Exibidas:**
- Matrícula (em formato visual)
- Imagem ilustrativa do veículo
- **Informação Básica:** Marca, Modelo, Ano, Cor, VIN/Chassis
- **Especificações Técnicas:** Combustível, Cilindrada, Transmissão, Tamanho dos Pneus
- **Manutenção:** Quilometragem, Data de Registo, Próxima Inspeção, Próxima Mudança de Óleo, Próxima Correia de Distribuição
- **Notas:** Observações sobre o veículo
- **Proprietário:** Nome do cliente

**Como Usar:**
1. Aceda ao módulo "Folha de Obra"
2. Clique no ícone ℹ️ (Info) no canto superior direito de qualquer folha de obra
3. O painel lateral abre automaticamente com todos os detalhes da viatura
4. Clique em "Fechar" ou fora do painel para fechar

## Custos Estimados dos Serviços Externos

### Email (SendGrid)
- **Plano Gratuito:** 100 emails/dia
- **Plano Essentials:** €15/mês - 50,000 emails/mês
- **Plano Pro:** €90/mês - 1,500,000 emails/mês

### SMS (Twilio)
- **Custo por SMS (Portugal):** ~€0.08 por mensagem
- **Sem custos fixos mensais**
- Recomenda-se carregar créditos conforme necessário

## Notas Importantes

1. **Segurança:** Nunca exponha as API keys no frontend. Todas as chamadas devem ser feitas através do backend (já implementado)
2. **Compliance:** Certifique-se de ter consentimento dos clientes para enviar SMS e emails (RGPD)
3. **Testes:** Use os modos de teste/sandbox dos serviços antes de ativar em produção
4. **Monitorização:** Configure alertas para monitorizar o uso e custos dos serviços

## Suporte

Para dúvidas sobre a implementação destas integrações, consulte:
- Documentação do SendGrid: https://docs.sendgrid.com/
- Documentação do Twilio: https://www.twilio.com/docs/
- Documentação do Supabase Edge Functions: https://supabase.com/docs/guides/functions
