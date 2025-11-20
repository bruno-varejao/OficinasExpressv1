/**
 * Sistema de Lembretes Inteligentes
 * Envia notificações proativas baseadas em padrões e dados
 */

export interface MaintenanceReminder {
  id: string
  vehicleId: string
  clientId: string
  workshopId: string
  type: 'mileage' | 'time' | 'seasonal' | 'inspection' | 'recall'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  serviceType: string
  dueDate: string
  currentStatus: {
    mileage?: number
    lastServiceDate?: string
    nextServiceDue?: number | string
  }
  estimatedCost: number
  message: string
  sent: boolean
  sentAt?: string
}

export interface SeasonalReminder {
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  services: Array<{
    name: string
    description: string
    optimalMonth: number
    importance: 'essential' | 'recommended' | 'optional'
  }>
}

export class SmartReminders {
  // Intervalos de manutenção padrão (em km)
  static readonly MAINTENANCE_INTERVALS = {
    oil_change: 15000,
    oil_filter: 15000,
    air_filter: 20000,
    cabin_filter: 20000,
    spark_plugs: 30000,
    brake_fluid: 30000,
    brake_pads: 40000,
    timing_belt: 100000,
    transmission_oil: 60000,
    coolant: 40000,
    battery: 50000, // ou 3-5 anos
    tires_rotation: 10000,
    tires_replacement: 40000
  }

  // Manutenção baseada em tempo (meses)
  static readonly TIME_BASED_MAINTENANCE = {
    inspection: 12, // Inspeção anual
    oil_change_time: 12, // Se não atingir km, fazer anualmente
    battery_check: 12,
    ac_service: 24,
    brake_fluid: 24
  }

  // Serviços sazonais
  static readonly SEASONAL_SERVICES: SeasonalReminder[] = [
    {
      season: 'spring',
      services: [
        {
          name: 'Verificação de Ar Condicionado',
          description: 'Prepare o AC para o verão',
          optimalMonth: 4, // Abril
          importance: 'recommended'
        },
        {
          name: 'Troca de Pneus (Verão)',
          description: 'Se usar pneus sazonais',
          optimalMonth: 3, // Março
          importance: 'optional'
        }
      ]
    },
    {
      season: 'summer',
      services: [
        {
          name: 'Verificação de Líquido de Arrefecimento',
          description: 'Evite sobreaquecimento',
          optimalMonth: 6, // Junho
          importance: 'essential'
        },
        {
          name: 'Inspeção de Bateria',
          description: 'Calor pode afetar a bateria',
          optimalMonth: 7, // Julho
          importance: 'recommended'
        }
      ]
    },
    {
      season: 'autumn',
      services: [
        {
          name: 'Verificação de Iluminação',
          description: 'Dias mais curtos chegando',
          optimalMonth: 10, // Outubro
          importance: 'recommended'
        },
        {
          name: 'Inspeção de Travões',
          description: 'Chuva e folhas afetam travagem',
          optimalMonth: 9, // Setembro
          importance: 'essential'
        }
      ]
    },
    {
      season: 'winter',
      services: [
        {
          name: 'Troca de Pneus (Inverno)',
          description: 'Se usar pneus sazonais',
          optimalMonth: 11, // Novembro
          importance: 'optional'
        },
        {
          name: 'Verificação de Bateria',
          description: 'Frio reduz capacidade',
          optimalMonth: 11, // Novembro
          importance: 'essential'
        },
        {
          name: 'Anticongelante',
          description: 'Proteção contra temperaturas baixas',
          optimalMonth: 11, // Novembro
          importance: 'recommended'
        }
      ]
    }
  ]

  /**
   * Calcular próximo serviço baseado em quilometragem
   */
  static calculateNextServiceByMileage(
    lastServiceMileage: number,
    currentMileage: number,
    serviceType: keyof typeof SmartReminders.MAINTENANCE_INTERVALS
  ): {
    isDue: boolean
    dueAt: number
    remaining: number
    percentageUsed: number
  } {
    const interval = this.MAINTENANCE_INTERVALS[serviceType]
    const nextServiceMileage = lastServiceMileage + interval
    const remaining = nextServiceMileage - currentMileage
    const used = currentMileage - lastServiceMileage
    const percentageUsed = (used / interval) * 100

    return {
      isDue: remaining <= 0,
      dueAt: nextServiceMileage,
      remaining: Math.max(0, remaining),
      percentageUsed: Math.min(100, percentageUsed)
    }
  }

  /**
   * Calcular próximo serviço baseado em tempo
   */
  static calculateNextServiceByTime(
    lastServiceDate: string,
    serviceType: keyof typeof SmartReminders.TIME_BASED_MAINTENANCE
  ): {
    isDue: boolean
    dueDate: string
    daysRemaining: number
  } {
    const lastService = new Date(lastServiceDate)
    const interval = this.TIME_BASED_MAINTENANCE[serviceType]
    const nextService = new Date(lastService)
    nextService.setMonth(nextService.getMonth() + interval)

    const today = new Date()
    const daysRemaining = Math.floor((nextService.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return {
      isDue: daysRemaining <= 0,
      dueDate: nextService.toISOString(),
      daysRemaining: Math.max(0, daysRemaining)
    }
  }

  /**
   * Verificar inspeção anual
   */
  static checkAnnualInspection(lastInspectionDate: string): {
    isDue: boolean
    expiryDate: string
    daysUntilExpiry: number
    urgency: 'ok' | 'warning' | 'urgent' | 'expired'
  } {
    const lastInspection = new Date(lastInspectionDate)
    const expiryDate = new Date(lastInspection)
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)

    const today = new Date()
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    let urgency: 'ok' | 'warning' | 'urgent' | 'expired' = 'ok'
    if (daysUntilExpiry < 0) urgency = 'expired'
    else if (daysUntilExpiry <= 7) urgency = 'urgent'
    else if (daysUntilExpiry <= 30) urgency = 'warning'

    return {
      isDue: daysUntilExpiry <= 30,
      expiryDate: expiryDate.toISOString(),
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      urgency
    }
  }

  /**
   * Obter serviços sazonais para o mês atual
   */
  static getSeasonalServicesForMonth(month: number): Array<{
    season: string
    service: string
    description: string
    importance: string
  }> {
    const services: Array<any> = []

    this.SEASONAL_SERVICES.forEach(seasonal => {
      seasonal.services.forEach(service => {
        if (service.optimalMonth === month) {
          services.push({
            season: seasonal.season,
            service: service.name,
            description: service.description,
            importance: service.importance
          })
        }
      })
    })

    return services
  }

  /**
   * Gerar mensagem de lembrete personalizada
   */
  static generateReminderMessage(reminder: Partial<MaintenanceReminder>): string {
    const templates = {
      mileage: `🚗 Olá! O seu veículo está a aproximar-se de ${reminder.currentStatus?.nextServiceDue}km. É hora de agendar ${reminder.serviceType}!`,
      
      time: `📅 Lembrete: Já passou ${reminder.currentStatus?.lastServiceDate} desde o último ${reminder.serviceType}. Agende já!`,
      
      seasonal: `🌡️ ${reminder.serviceType} é recomendado nesta época do ano. Prepare o seu veículo!`,
      
      inspection: `⚠️ IMPORTANTE: A inspeção do seu veículo expira em breve! Agende para evitar multas.`,
      
      recall: `🔔 AVISO: Existe um recall para o seu veículo. Contacte-nos urgentemente.`
    }

    return templates[reminder.type as keyof typeof templates] || 'Lembrete de manutenção'
  }

  /**
   * Determinar prioridade do lembrete
   */
  static determinePriority(
    type: MaintenanceReminder['type'],
    daysOrKmRemaining: number
  ): 'low' | 'medium' | 'high' | 'urgent' {
    if (type === 'recall') return 'urgent'
    if (type === 'inspection' && daysOrKmRemaining <= 7) return 'urgent'
    if (daysOrKmRemaining <= 0) return 'urgent'
    if (daysOrKmRemaining <= 500 || daysOrKmRemaining <= 14) return 'high'
    if (daysOrKmRemaining <= 2000 || daysOrKmRemaining <= 30) return 'medium'
    return 'low'
  }

  /**
   * Criar lembrete completo
   */
  static createReminder(data: {
    vehicleId: string
    clientId: string
    workshopId: string
    type: MaintenanceReminder['type']
    serviceType: string
    currentMileage?: number
    lastServiceDate?: string
    estimatedCost: number
  }): MaintenanceReminder {
    let dueDate = new Date()
    let priority: MaintenanceReminder['priority'] = 'medium'
    let currentStatus: any = {}

    // Calcular baseado no tipo
    if (data.type === 'mileage' && data.currentMileage) {
      const service = this.calculateNextServiceByMileage(
        data.currentMileage - 15000, // simplificado
        data.currentMileage,
        'oil_change'
      )
      currentStatus = {
        mileage: data.currentMileage,
        nextServiceDue: service.dueAt
      }
      priority = this.determinePriority(data.type, service.remaining)
    } else if (data.type === 'time' && data.lastServiceDate) {
      const service = this.calculateNextServiceByTime(data.lastServiceDate, 'inspection')
      currentStatus = {
        lastServiceDate: data.lastServiceDate,
        nextServiceDue: service.dueDate
      }
      dueDate = new Date(service.dueDate)
      priority = this.determinePriority(data.type, service.daysRemaining)
    }

    const message = this.generateReminderMessage({
      type: data.type,
      serviceType: data.serviceType,
      currentStatus
    })

    return {
      id: crypto.randomUUID(),
      vehicleId: data.vehicleId,
      clientId: data.clientId,
      workshopId: data.workshopId,
      type: data.type,
      priority,
      serviceType: data.serviceType,
      dueDate: dueDate.toISOString(),
      currentStatus,
      estimatedCost: data.estimatedCost,
      message,
      sent: false
    }
  }

  /**
   * Agrupar lembretes por cliente
   */
  static groupRemindersByClient(reminders: MaintenanceReminder[]): Map<string, MaintenanceReminder[]> {
    const grouped = new Map<string, MaintenanceReminder[]>()

    reminders.forEach(reminder => {
      const existing = grouped.get(reminder.clientId) || []
      existing.push(reminder)
      grouped.set(reminder.clientId, existing)
    })

    return grouped
  }

  /**
   * Formatar email de lembrete
   */
  static formatReminderEmail(clientName: string, reminders: MaintenanceReminder[]): string {
    const urgentReminders = reminders.filter(r => r.priority === 'urgent')
    const highReminders = reminders.filter(r => r.priority === 'high')
    const otherReminders = reminders.filter(r => r.priority === 'medium' || r.priority === 'low')

    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0D80DF;">Olá ${clientName}! 👋</h2>
        <p>Temos alguns lembretes importantes sobre a manutenção do seu veículo:</p>
    `

    if (urgentReminders.length > 0) {
      html += `
        <div style="background: #fee; border-left: 4px solid #f00; padding: 15px; margin: 20px 0;">
          <h3 style="color: #c00; margin-top: 0;">⚠️ URGENTE</h3>
          ${urgentReminders.map(r => `
            <div style="margin: 10px 0;">
              <strong>${r.serviceType}</strong><br/>
              <span style="color: #666;">${r.message}</span><br/>
              <span style="color: #999; font-size: 12px;">Estimativa: €${r.estimatedCost}</span>
            </div>
          `).join('')}
        </div>
      `
    }

    if (highReminders.length > 0) {
      html += `
        <div style="background: #ffeaa7; border-left: 4px solid #fdcb6e; padding: 15px; margin: 20px 0;">
          <h3 style="color: #d63031; margin-top: 0;">⏰ Em Breve</h3>
          ${highReminders.map(r => `
            <div style="margin: 10px 0;">
              <strong>${r.serviceType}</strong><br/>
              <span style="color: #666;">${r.message}</span><br/>
              <span style="color: #999; font-size: 12px;">Estimativa: €${r.estimatedCost}</span>
            </div>
          `).join('')}
        </div>
      `
    }

    if (otherReminders.length > 0) {
      html += `
        <div style="background: #dfe6e9; border-left: 4px solid #0D80DF; padding: 15px; margin: 20px 0;">
          <h3 style="color: #0D80DF; margin-top: 0;">📋 Para Planear</h3>
          ${otherReminders.map(r => `
            <div style="margin: 10px 0;">
              <strong>${r.serviceType}</strong><br/>
              <span style="color: #666;">${r.message}</span><br/>
              <span style="color: #999; font-size: 12px;">Estimativa: €${r.estimatedCost}</span>
            </div>
          `).join('')}
        </div>
      `
    }

    html += `
        <div style="text-align: center; margin: 30px 0;">
          <a href="#" style="background: linear-gradient(to right, #0D80DF, #FF893E); color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Agendar Agora
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Esta é uma mensagem automática do sistema de lembretes inteligentes da OficinasExpress.
        </p>
      </div>
    `

    return html
  }
}
