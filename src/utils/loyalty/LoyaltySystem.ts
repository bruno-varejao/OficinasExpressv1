/**
 * Sistema de Fidelização e Pontos
 * Gamificação para aumentar retenção e engagement
 */

export interface LoyaltyPoints {
  clientId: string
  workshopId: string
  totalPoints: number
  lifetimePoints: number
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  pointsToNextTier: number
  history: PointTransaction[]
}

export interface PointTransaction {
  id: string
  type: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment'
  points: number
  reason: string
  metadata?: Record<string, any>
  timestamp: string
  expiresAt?: string
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum'
  minPoints: number
  benefits: string[]
  discountPercentage: number
  icon: string
  color: string
  bgColor: string
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'service' | 'product' | 'perk'
  value: number | string
  available: boolean
  imageUrl?: string
  expiryDays?: number
}

export class LoyaltySystem {
  // Configuração de tiers
  static readonly TIERS: LoyaltyTier[] = [
    {
      name: 'bronze',
      minPoints: 0,
      benefits: ['5% desconto em serviços', 'Pontos em compras'],
      discountPercentage: 5,
      icon: '🥉',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'silver',
      minPoints: 1000,
      benefits: ['10% desconto', 'Prioridade agendamento', 'Ofertas exclusivas'],
      discountPercentage: 10,
      icon: '🥈',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      name: 'gold',
      minPoints: 5000,
      benefits: ['15% desconto', 'Veículo cortesia grátis', 'Inspeção anual grátis'],
      discountPercentage: 15,
      icon: '🥇',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'platinum',
      minPoints: 10000,
      benefits: ['20% desconto', 'Gestor dedicado', 'Manutenção prioritária', 'Brindes exclusivos'],
      discountPercentage: 20,
      icon: '💎',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  // Configuração de recompensas
  static readonly REWARDS: Reward[] = [
    {
      id: 'discount_5',
      name: 'Desconto €5',
      description: 'Vale de desconto de €5 em qualquer serviço',
      pointsCost: 100,
      type: 'discount',
      value: 5,
      available: true,
      expiryDays: 30
    },
    {
      id: 'discount_30',
      name: 'Desconto €30',
      description: 'Vale de desconto de €30 em qualquer serviço',
      pointsCost: 500,
      type: 'discount',
      value: 30,
      available: true,
      expiryDays: 60
    },
    {
      id: 'discount_70',
      name: 'Desconto €70',
      description: 'Vale de desconto de €70 em qualquer serviço',
      pointsCost: 1000,
      type: 'discount',
      value: 70,
      available: true,
      expiryDays: 90
    },
    {
      id: 'free_wash',
      name: 'Lavagem Grátis',
      description: 'Lavagem completa do veículo',
      pointsCost: 200,
      type: 'service',
      value: 'Lavagem completa',
      available: true,
      expiryDays: 30
    },
    {
      id: 'courtesy_car',
      name: 'Veículo de Cortesia',
      description: 'Veículo de cortesia prioritário (1 dia)',
      pointsCost: 300,
      type: 'perk',
      value: '1 dia',
      available: true,
      expiryDays: 60
    },
    {
      id: 'free_inspection',
      name: 'Inspeção Grátis',
      description: 'Inspeção completa do veículo',
      pointsCost: 1500,
      type: 'service',
      value: 'Inspeção completa',
      available: true,
      expiryDays: 90
    }
  ]

  /**
   * Calcular pontos ganhos por valor gasto
   */
  static calculatePointsEarned(amountSpent: number, multiplier: number = 1): number {
    // 1 ponto por cada €1 gasto
    const basePoints = Math.floor(amountSpent)
    return Math.floor(basePoints * multiplier)
  }

  /**
   * Determinar tier baseado em pontos totais
   */
  static getTier(totalPoints: number): LoyaltyTier {
    const sortedTiers = [...this.TIERS].sort((a, b) => b.minPoints - a.minPoints)
    return sortedTiers.find(tier => totalPoints >= tier.minPoints) || this.TIERS[0]
  }

  /**
   * Calcular pontos para próximo tier
   */
  static getPointsToNextTier(currentPoints: number): number {
    const currentTier = this.getTier(currentPoints)
    const currentIndex = this.TIERS.findIndex(t => t.name === currentTier.name)
    
    if (currentIndex === this.TIERS.length - 1) {
      return 0 // Já está no tier máximo
    }
    
    const nextTier = this.TIERS[currentIndex + 1]
    return nextTier.minPoints - currentPoints
  }

  /**
   * Registar pontos ganhos
   */
  static createEarnTransaction(
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): PointTransaction {
    return {
      id: crypto.randomUUID(),
      type: 'earn',
      points,
      reason,
      metadata,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
    }
  }

  /**
   * Registar pontos resgatados
   */
  static createRedeemTransaction(
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): PointTransaction {
    return {
      id: crypto.randomUUID(),
      type: 'redeem',
      points: -points, // Negativo para reduzir
      reason,
      metadata,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Criar bonus de pontos
   */
  static createBonusTransaction(
    points: number,
    reason: string,
    metadata?: Record<string, any>
  ): PointTransaction {
    return {
      id: crypto.randomUUID(),
      type: 'bonus',
      points,
      reason,
      metadata,
      timestamp: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 dias
    }
  }

  /**
   * Calcular desconto baseado no tier
   */
  static calculateTierDiscount(amount: number, tier: LoyaltyTier): number {
    return Math.floor(amount * (tier.discountPercentage / 100))
  }

  /**
   * Verificar se pode resgatar recompensa
   */
  static canRedeemReward(currentPoints: number, reward: Reward): boolean {
    return currentPoints >= reward.pointsCost && reward.available
  }

  /**
   * Gerar código de cupão
   */
  static generateCouponCode(prefix: string = 'LOYALTY'): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = prefix + '-'
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Eventos especiais que dão pontos bonus
   */
  static readonly BONUS_EVENTS = {
    birthday: {
      multiplier: 2,
      reason: 'Bonus de Aniversário - Pontos Dobrados! 🎉'
    },
    firstService: {
      points: 100,
      reason: 'Bonus de Boas-Vindas - Primeiro Serviço! 🎊'
    },
    referral: {
      points: 500,
      reason: 'Bonus de Indicação - Obrigado por nos recomendar! 💙'
    },
    review: {
      points: 50,
      reason: 'Bonus de Avaliação - Obrigado pelo feedback! ⭐'
    },
    checkIn: {
      points: 10,
      reason: 'Bonus de Check-in! 📍'
    },
    milestone: {
      5: { points: 250, reason: '🎯 5º Serviço - Bónus Especial!' },
      10: { points: 500, reason: '🎯 10º Serviço - Cliente Fiel!' },
      25: { points: 1500, reason: '🎯 25º Serviço - Cliente VIP!' },
      50: { points: 3000, reason: '🎯 50º Serviço - Cliente Diamante!' }
    }
  }

  /**
   * Expirar pontos antigos (políticas)
   */
  static expireOldPoints(transactions: PointTransaction[]): PointTransaction[] {
    const now = new Date().getTime()
    
    const expirations: PointTransaction[] = []
    
    transactions.forEach(tx => {
      if (tx.type === 'earn' && tx.expiresAt) {
        const expiryDate = new Date(tx.expiresAt).getTime()
        if (expiryDate < now && tx.points > 0) {
          expirations.push({
            id: crypto.randomUUID(),
            type: 'expire',
            points: -tx.points,
            reason: `Pontos expirados de ${new Date(tx.timestamp).toLocaleDateString('pt-PT')}`,
            metadata: { originalTransactionId: tx.id },
            timestamp: new Date().toISOString()
          })
        }
      }
    })
    
    return expirations
  }

  /**
   * Calcular estatísticas de fidelidade
   */
  static calculateStats(transactions: PointTransaction[]) {
    const earned = transactions
      .filter(t => t.type === 'earn' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.points, 0)
    
    const redeemed = Math.abs(transactions
      .filter(t => t.type === 'redeem')
      .reduce((sum, t) => sum + t.points, 0))
    
    const expired = Math.abs(transactions
      .filter(t => t.type === 'expire')
      .reduce((sum, t) => sum + t.points, 0))
    
    const current = earned - redeemed - expired
    
    return {
      earned,
      redeemed,
      expired,
      current,
      redemptionRate: earned > 0 ? (redeemed / earned * 100).toFixed(1) : '0'
    }
  }
}
