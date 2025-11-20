/**
 * Sistema de Cupões Automáticos
 * Gera cupões de desconto em eventos específicos para aumentar conversão
 */

export interface Coupon {
  id: string
  code: string
  type: 'welcome' | 'birthday' | 'apology' | 'referral' | 'winback' | 'seasonal' | 'loyalty' | 'custom'
  discountType: 'percentage' | 'fixed' | 'service'
  discountValue: number | string
  minPurchase?: number
  maxDiscount?: number
  validFrom: string
  validUntil: string
  usageLimit: number
  usageCount: number
  clientId?: string
  workshopId: string
  isActive: boolean
  metadata?: Record<string, any>
}

export interface CouponTemplate {
  type: Coupon['type']
  name: string
  description: string
  discountType: Coupon['discountType']
  discountValue: number | string
  validityDays: number
  emoji: string
  message: string
  color: string
}

export class CouponSystem {
  // Templates de cupões
  static readonly TEMPLATES: CouponTemplate[] = [
    {
      type: 'welcome',
      name: 'Bem-Vindo',
      description: 'Cliente novo',
      discountType: 'percentage',
      discountValue: 15,
      validityDays: 30,
      emoji: '👋',
      message: 'Bem-vindo! Desconto de 15% no primeiro serviço!',
      color: 'blue'
    },
    {
      type: 'birthday',
      name: 'Aniversário',
      description: 'Mês de aniversário',
      discountType: 'percentage',
      discountValue: 20,
      validityDays: 30,
      emoji: '🎂',
      message: 'Parabéns! 🎉 Desconto especial de aniversário!',
      color: 'purple'
    },
    {
      type: 'apology',
      name: 'Pedido de Desculpas',
      description: 'Compensação por problema',
      discountType: 'fixed',
      discountValue: 50,
      validityDays: 60,
      emoji: '🙏',
      message: 'Pedimos desculpa pelo incómodo. Aceite este desconto.',
      color: 'red'
    },
    {
      type: 'referral',
      name: 'Indicação',
      description: 'Por indicar amigo',
      discountType: 'fixed',
      discountValue: 25,
      validityDays: 0, // Sem expiração
      emoji: '💙',
      message: 'Obrigado por nos recomendar!',
      color: 'green'
    },
    {
      type: 'winback',
      name: 'Reativação',
      description: 'Cliente inativo há 90+ dias',
      discountType: 'percentage',
      discountValue: 30,
      validityDays: 15,
      emoji: '💫',
      message: 'Sentimos sua falta! Volte com desconto especial!',
      color: 'orange'
    },
    {
      type: 'seasonal',
      name: 'Sazonal',
      description: 'Promoções de época',
      discountType: 'percentage',
      discountValue: 25,
      validityDays: 30,
      emoji: '🌸',
      message: 'Promoção de temporada! Aproveite!',
      color: 'pink'
    },
    {
      type: 'loyalty',
      name: 'Fidelidade',
      description: 'Resgate de pontos',
      discountType: 'fixed',
      discountValue: 0, // Variável
      validityDays: 90,
      emoji: '⭐',
      message: 'Cupão de fidelidade resgatado!',
      color: 'yellow'
    }
  ]

  /**
   * Gerar código único de cupão
   */
  static generateCode(prefix: string = 'OFEX'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = prefix + '-'
    
    // 4 caracteres aleatórios
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    code += '-'
    
    // 4 caracteres aleatórios
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return code
  }

  /**
   * Criar cupão a partir de template
   */
  static createCouponFromTemplate(
    template: CouponTemplate,
    workshopId: string,
    clientId?: string,
    customValue?: number
  ): Coupon {
    const now = new Date()
    const validUntil = new Date(now)
    
    if (template.validityDays > 0) {
      validUntil.setDate(validUntil.getDate() + template.validityDays)
    } else {
      validUntil.setFullYear(validUntil.getFullYear() + 10) // 10 anos (praticamente sem expiração)
    }

    return {
      id: crypto.randomUUID(),
      code: this.generateCode(template.type.substring(0, 4).toUpperCase()),
      type: template.type,
      discountType: template.discountType,
      discountValue: customValue || template.discountValue,
      validFrom: now.toISOString(),
      validUntil: validUntil.toISOString(),
      usageLimit: 1,
      usageCount: 0,
      clientId,
      workshopId,
      isActive: true,
      metadata: {
        templateName: template.name,
        message: template.message,
        emoji: template.emoji
      }
    }
  }

  /**
   * Criar cupão de boas-vindas
   */
  static createWelcomeCoupon(clientId: string, workshopId: string): Coupon {
    const template = this.TEMPLATES.find(t => t.type === 'welcome')!
    return this.createCouponFromTemplate(template, workshopId, clientId)
  }

  /**
   * Criar cupão de aniversário
   */
  static createBirthdayCoupon(clientId: string, workshopId: string): Coupon {
    const template = this.TEMPLATES.find(t => t.type === 'birthday')!
    return this.createCouponFromTemplate(template, workshopId, clientId)
  }

  /**
   * Criar cupão de reativação
   */
  static createWinbackCoupon(clientId: string, workshopId: string): Coupon {
    const template = this.TEMPLATES.find(t => t.type === 'winback')!
    return this.createCouponFromTemplate(template, workshopId, clientId)
  }

  /**
   * Criar cupão de indicação
   */
  static createReferralCoupon(clientId: string, workshopId: string): Coupon {
    const template = this.TEMPLATES.find(t => t.type === 'referral')!
    return this.createCouponFromTemplate(template, workshopId, clientId)
  }

  /**
   * Criar cupão de pedido de desculpas
   */
  static createApologyCoupon(clientId: string, workshopId: string, value: number = 50): Coupon {
    const template = this.TEMPLATES.find(t => t.type === 'apology')!
    return this.createCouponFromTemplate(template, workshopId, clientId, value)
  }

  /**
   * Validar cupão
   */
  static validateCoupon(coupon: Coupon, purchaseAmount?: number): {
    valid: boolean
    reason?: string
    discountAmount?: number
  } {
    // Verificar se está ativo
    if (!coupon.isActive) {
      return { valid: false, reason: 'Cupão desativado' }
    }

    // Verificar uso
    if (coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, reason: 'Cupão já foi utilizado' }
    }

    // Verificar datas
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validUntil = new Date(coupon.validUntil)

    if (now < validFrom) {
      return { valid: false, reason: 'Cupão ainda não válido' }
    }

    if (now > validUntil) {
      return { valid: false, reason: 'Cupão expirado' }
    }

    // Verificar compra mínima
    if (coupon.minPurchase && purchaseAmount && purchaseAmount < coupon.minPurchase) {
      return { 
        valid: false, 
        reason: `Compra mínima de €${coupon.minPurchase} necessária` 
      }
    }

    // Calcular desconto
    let discountAmount = 0
    
    if (coupon.discountType === 'percentage' && purchaseAmount) {
      discountAmount = (purchaseAmount * Number(coupon.discountValue)) / 100
      
      // Aplicar desconto máximo se existir
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount
      }
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Number(coupon.discountValue)
    }

    return {
      valid: true,
      discountAmount: Math.round(discountAmount * 100) / 100
    }
  }

  /**
   * Aplicar cupão (marca como usado)
   */
  static applyCoupon(coupon: Coupon): Coupon {
    return {
      ...coupon,
      usageCount: coupon.usageCount + 1,
      isActive: coupon.usageCount + 1 >= coupon.usageLimit ? false : coupon.isActive
    }
  }

  /**
   * Formatar desconto para exibição
   */
  static formatDiscount(coupon: Coupon): string {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    } else if (coupon.discountType === 'fixed') {
      return `€${coupon.discountValue}`
    } else {
      return String(coupon.discountValue)
    }
  }

  /**
   * Gerar email de cupão
   */
  static generateCouponEmail(
    clientName: string,
    coupon: Coupon,
    customMessage?: string
  ): string {
    const template = this.TEMPLATES.find(t => t.type === coupon.type)!
    const discount = this.formatDiscount(coupon)
    const expiryDate = new Date(coupon.validUntil).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 20px;">
        <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 60px; margin-bottom: 10px;">${template.emoji}</div>
            <h1 style="color: #0D80DF; margin: 0; font-size: 28px;">
              ${customMessage || template.message}
            </h1>
          </div>

          <!-- Cupão -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
            <p style="color: white; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">
              Seu Código
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 3px dashed #667eea;">
              <code style="font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 3px;">
                ${coupon.code}
              </code>
            </div>
            <p style="color: white; margin: 15px 0 0 0; font-size: 24px; font-weight: bold;">
              ${discount} de Desconto
            </p>
          </div>

          <!-- Detalhes -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">📋 Detalhes do Cupão:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">
                <strong>Válido até:</strong> ${expiryDate}
              </li>
              ${coupon.minPurchase ? `
              <li style="margin: 8px 0;">
                <strong>Compra mínima:</strong> €${coupon.minPurchase}
              </li>
              ` : ''}
              ${coupon.maxDiscount ? `
              <li style="margin: 8px 0;">
                <strong>Desconto máximo:</strong> €${coupon.maxDiscount}
              </li>
              ` : ''}
              <li style="margin: 8px 0;">
                <strong>Utilizações:</strong> ${coupon.usageLimit} vez${coupon.usageLimit > 1 ? 'es' : ''}
              </li>
            </ul>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="#agendar" style="display: inline-block; background: linear-gradient(to right, #0D80DF, #FF893E); color: white; padding: 15px 40px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
              Agendar Serviço Agora
            </a>
          </div>

          <!-- Rodapé -->
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
            Cupão gerado automaticamente pelo sistema OficinasExpress
          </p>
        </div>
      </div>
    `
  }

  /**
   * Automações de cupões
   */
  static readonly AUTO_TRIGGERS = {
    newClient: {
      enabled: true,
      delay: 0, // Imediato
      couponType: 'welcome' as const
    },
    birthday: {
      enabled: true,
      delay: 0, // No dia do aniversário
      couponType: 'birthday' as const
    },
    inactiveClient: {
      enabled: true,
      delay: 90, // 90 dias sem serviço
      couponType: 'winback' as const
    },
    referralSuccess: {
      enabled: true,
      delay: 0, // Quando amigo fizer primeiro serviço
      couponType: 'referral' as const
    },
    serviceIssue: {
      enabled: true,
      delay: 0, // Imediato após problema
      couponType: 'apology' as const
    }
  }

  /**
   * Verificar se cliente deve receber cupão automático
   */
  static shouldTriggerCoupon(
    trigger: keyof typeof CouponSystem.AUTO_TRIGGERS,
    clientData: {
      isNew?: boolean
      daysSinceLastService?: number
      isBirthdayMonth?: boolean
      referredFriend?: boolean
      hadIssue?: boolean
    }
  ): boolean {
    const config = this.AUTO_TRIGGERS[trigger]
    
    if (!config.enabled) return false

    switch (trigger) {
      case 'newClient':
        return !!clientData.isNew
      
      case 'birthday':
        return !!clientData.isBirthdayMonth
      
      case 'inactiveClient':
        return (clientData.daysSinceLastService || 0) >= config.delay
      
      case 'referralSuccess':
        return !!clientData.referredFriend
      
      case 'serviceIssue':
        return !!clientData.hadIssue
      
      default:
        return false
    }
  }
}
