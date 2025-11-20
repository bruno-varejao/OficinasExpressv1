/**
 * WhatsApp Business API Integration
 * Comunicação automática via WhatsApp com clientes
 * 98% taxa de abertura vs 20% email
 */

export interface WhatsAppMessage {
  to: string // Número de telefone (formato internacional: +351912345678)
  type: 'text' | 'template' | 'image' | 'document' | 'video' | 'location'
  content: string | WhatsAppTemplate | WhatsAppMedia
  workshopId: string
  clientId?: string
  metadata?: Record<string, any>
}

export interface WhatsAppTemplate {
  name: string
  language: string
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button'
    parameters?: Array<{ type: 'text' | 'currency' | 'date_time', text?: string }>
  }>
}

export interface WhatsAppMedia {
  mediaType: 'image' | 'document' | 'video'
  url: string
  caption?: string
  filename?: string
}

export interface WhatsAppContact {
  phoneNumber: string
  name: string
  workshopId: string
  tags?: string[]
  lastMessageAt?: string
  conversationStatus: 'active' | 'archived' | 'blocked'
}

export class WhatsAppService {
  private static apiUrl = 'https://graph.facebook.com/v18.0'
  private static phoneNumberId = '' // Configurar com ID do WhatsApp Business

  /**
   * Templates pré-aprovados do WhatsApp
   */
  static readonly TEMPLATES = {
    // Confirmação de agendamento
    appointment_confirmation: {
      name: 'appointment_confirmation',
      language: 'pt_PT',
      description: 'Confirmação de agendamento com data, hora e serviço',
      example: `Olá {{1}}! 👋

Confirmação de agendamento:
📅 {{2}} às {{3}}
🔧 Serviço: {{4}}
💰 Estimativa: {{5}}

Para confirmar, responda SIM
Para remarcar, responda REMARCAR`
    },

    // Veículo pronto
    vehicle_ready: {
      name: 'vehicle_ready',
      language: 'pt_PT',
      description: 'Notificação de veículo pronto',
      example: `Boa notícia! 🎉

O seu {{1}} {{2}} está pronto!
✅ Serviço concluído
💳 Valor: {{3}}

Pode vir buscar quando quiser!
Horário: Seg-Sex 9h-18h`
    },

    // Lembrete de manutenção
    maintenance_reminder: {
      name: 'maintenance_reminder',
      language: 'pt_PT',
      description: 'Lembrete de manutenção programada',
      example: `Olá {{1}}! 🚗

O seu {{2}} precisa de manutenção:
🔧 {{3}}
📊 Quilometragem: {{4}}km

Agende já e evite problemas!
Estimativa: {{5}}`
    },

    // Orçamento aprovado
    quote_approved: {
      name: 'quote_approved',
      language: 'pt_PT',
      description: 'Orçamento foi aprovado',
      example: `Obrigado {{1}}! ✅

Orçamento #{{2}} aprovado!
💰 Valor: {{3}}

Vamos iniciar o trabalho.
Previsão de conclusão: {{4}}`
    },

    // Trabalho em progresso
    work_in_progress: {
      name: 'work_in_progress',
      language: 'pt_PT',
      description: 'Atualização de progresso',
      example: `Atualização do seu veículo 🔧

{{1}} em andamento
✅ Progresso: {{2}}%

Estimativa de conclusão: {{3}}`
    },

    // Problema encontrado
    issue_found: {
      name: 'issue_found',
      language: 'pt_PT',
      description: 'Problema adicional encontrado',
      example: `⚠️ Atenção {{1}}

Encontramos: {{2}}

💰 Custo adicional: {{3}}
⏱️ Tempo extra: {{4}}

Podemos proceder? Responda SIM ou NÃO`
    },

    // Cupão de desconto
    discount_coupon: {
      name: 'discount_coupon',
      language: 'pt_PT',
      description: 'Envio de cupão de desconto',
      example: `{{1}} 🎁

Código: {{2}}
💰 Desconto: {{3}}
📅 Válido até: {{4}}

Use no próximo serviço!`
    },

    // Aniversário
    birthday_greeting: {
      name: 'birthday_greeting',
      language: 'pt_PT',
      description: 'Parabéns de aniversário',
      example: `Parabéns {{1}}! 🎂🎉

Desejamos um excelente dia!

🎁 Presente especial:
Código: {{2}}
Desconto: {{3}}

Válido todo o mês!`
    },

    // Satisfação pós-serviço
    satisfaction_survey: {
      name: 'satisfaction_survey',
      language: 'pt_PT',
      description: 'Pesquisa de satisfação',
      example: `Olá {{1}}! ⭐

Como foi sua experiência?

Responda de 1 a 5:
1 - Muito insatisfeito
5 - Muito satisfeito

Sua opinião é importante!`
    }
  }

  /**
   * Enviar mensagem de texto simples
   */
  static async sendTextMessage(
    phoneNumber: string,
    message: string,
    workshopId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Formatar número (remover caracteres especiais)
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      
      // Garantir que tem código do país
      const internationalPhone = formattedPhone.startsWith('351') 
        ? formattedPhone 
        : `351${formattedPhone}`

      // Simular envio (em produção, usar WhatsApp Business API)
      console.log('📱 Sending WhatsApp message:', {
        to: `+${internationalPhone}`,
        message,
        workshopId
      })

      // Em produção, fazer request real:
      /*
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `+${internationalPhone}`,
          type: 'text',
          text: { body: message }
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message')
      }

      return {
        success: true,
        messageId: data.messages[0].id
      }
      */

      // Simular sucesso
      return {
        success: true,
        messageId: `wamid.${Date.now()}`
      }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enviar template (mensagem pré-aprovada)
   */
  static async sendTemplate(
    phoneNumber: string,
    templateName: keyof typeof WhatsAppService.TEMPLATES,
    parameters: string[],
    workshopId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const internationalPhone = formattedPhone.startsWith('351') 
        ? formattedPhone 
        : `351${formattedPhone}`

      const template = this.TEMPLATES[templateName]

      console.log('📱 Sending WhatsApp template:', {
        to: `+${internationalPhone}`,
        template: templateName,
        parameters,
        workshopId
      })

      // Em produção:
      /*
      const response = await fetch(`${this.apiUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `+${internationalPhone}`,
          type: 'template',
          template: {
            name: template.name,
            language: { code: template.language },
            components: [
              {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: p }))
              }
            ]
          }
        })
      })

      const data = await response.json()
      return {
        success: true,
        messageId: data.messages[0].id
      }
      */

      return {
        success: true,
        messageId: `wamid.${Date.now()}`
      }
    } catch (error: any) {
      console.error('WhatsApp template send error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enviar imagem com legenda
   */
  static async sendImage(
    phoneNumber: string,
    imageUrl: string,
    caption: string,
    workshopId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const internationalPhone = formattedPhone.startsWith('351') 
        ? formattedPhone 
        : `351${formattedPhone}`

      console.log('📱 Sending WhatsApp image:', {
        to: `+${internationalPhone}`,
        imageUrl,
        caption,
        workshopId
      })

      // Em produção, enviar via API

      return {
        success: true,
        messageId: `wamid.${Date.now()}`
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Enviar documento (PDF, etc)
   */
  static async sendDocument(
    phoneNumber: string,
    documentUrl: string,
    filename: string,
    workshopId: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const formattedPhone = phoneNumber.replace(/\D/g, '')
      const internationalPhone = formattedPhone.startsWith('351') 
        ? formattedPhone 
        : `351${formattedPhone}`

      console.log('📱 Sending WhatsApp document:', {
        to: `+${internationalPhone}`,
        documentUrl,
        filename,
        workshopId
      })

      return {
        success: true,
        messageId: `wamid.${Date.now()}`
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Fluxos automáticos pré-configurados
   */
  static async sendAppointmentConfirmation(data: {
    phoneNumber: string
    clientName: string
    date: string
    time: string
    service: string
    price: string
    workshopId: string
  }) {
    return this.sendTemplate(
      data.phoneNumber,
      'appointment_confirmation',
      [data.clientName, data.date, data.time, data.service, data.price],
      data.workshopId
    )
  }

  static async sendVehicleReady(data: {
    phoneNumber: string
    brand: string
    model: string
    totalPrice: string
    workshopId: string
  }) {
    return this.sendTemplate(
      data.phoneNumber,
      'vehicle_ready',
      [data.brand, data.model, data.totalPrice],
      data.workshopId
    )
  }

  static async sendMaintenanceReminder(data: {
    phoneNumber: string
    clientName: string
    vehicleName: string
    serviceType: string
    currentMileage: string
    estimatedCost: string
    workshopId: string
  }) {
    return this.sendTemplate(
      data.phoneNumber,
      'maintenance_reminder',
      [data.clientName, data.vehicleName, data.serviceType, data.currentMileage, data.estimatedCost],
      data.workshopId
    )
  }

  static async sendBirthdayGreeting(data: {
    phoneNumber: string
    clientName: string
    couponCode: string
    discount: string
    workshopId: string
  }) {
    return this.sendTemplate(
      data.phoneNumber,
      'birthday_greeting',
      [data.clientName, data.couponCode, data.discount],
      data.workshopId
    )
  }

  static async sendIssueFound(data: {
    phoneNumber: string
    clientName: string
    issue: string
    additionalCost: string
    extraTime: string
    workshopId: string
  }) {
    return this.sendTemplate(
      data.phoneNumber,
      'issue_found',
      [data.clientName, data.issue, data.additionalCost, data.extraTime],
      data.workshopId
    )
  }

  /**
   * Processar resposta do cliente
   */
  static processClientResponse(message: string): {
    type: 'confirmation' | 'rejection' | 'reschedule' | 'rating' | 'other'
    value?: any
  } {
    const normalized = message.toLowerCase().trim()

    // Confirmações
    if (['sim', 's', 'confirmo', 'ok', 'confirmar', 'yes'].includes(normalized)) {
      return { type: 'confirmation', value: true }
    }

    // Rejeições
    if (['não', 'nao', 'n', 'cancelar', 'no'].includes(normalized)) {
      return { type: 'rejection', value: true }
    }

    // Remarcar
    if (normalized.includes('remarcar') || normalized.includes('reagendar')) {
      return { type: 'reschedule', value: true }
    }

    // Rating (1-5)
    const rating = parseInt(normalized)
    if (!isNaN(rating) && rating >= 1 && rating <= 5) {
      return { type: 'rating', value: rating }
    }

    return { type: 'other', value: message }
  }

  /**
   * Estatísticas de mensagens
   */
  static async getMessageStats(workshopId: string, days: number = 30) {
    // Em produção, buscar do banco de dados
    return {
      sent: 450,
      delivered: 445,
      read: 437,
      replied: 328,
      deliveryRate: 98.9,
      readRate: 97.1,
      replyRate: 72.9,
      averageResponseTime: '4.2 minutos',
      topTemplates: [
        { name: 'appointment_confirmation', count: 180 },
        { name: 'vehicle_ready', count: 120 },
        { name: 'maintenance_reminder', count: 85 }
      ]
    }
  }

  /**
   * Criar link de chat direto
   */
  static createChatLink(phoneNumber: string, message?: string): string {
    const formattedPhone = phoneNumber.replace(/\D/g, '')
    const internationalPhone = formattedPhone.startsWith('351') 
      ? formattedPhone 
      : `351${formattedPhone}`
    
    const encodedMessage = message ? encodeURIComponent(message) : ''
    
    return `https://wa.me/${internationalPhone}${message ? `?text=${encodedMessage}` : ''}`
  }

  /**
   * Criar botão de WhatsApp
   */
  static createWhatsAppButton(phoneNumber: string, message?: string): string {
    const link = this.createChatLink(phoneNumber, message)
    
    return `
      <a href="${link}" 
         target="_blank" 
         style="display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        WhatsApp
      </a>
    `
  }
}
