/**
 * Dynamic Pricing com IA
 * Sistema inteligente de precificação que otimiza margens e competitividade
 */

export interface PricingFactors {
  // Fatores internos
  baseCost: number
  laborCost: number
  overheadCost: number
  targetMargin: number
  
  // Fatores de mercado
  competitorPrices: number[]
  marketAverage: number
  seasonality: 'low' | 'normal' | 'high' | 'peak'
  
  // Fatores do cliente
  customerTier: 'new' | 'regular' | 'vip' | 'platinum'
  customerLifetimeValue: number
  lastServiceDate?: string
  loyaltyPoints?: number
  
  // Fatores de demanda
  currentDemand: 'very_low' | 'low' | 'normal' | 'high' | 'very_high'
  timeSlotDemand: 'off_peak' | 'normal' | 'peak'
  urgency: 'standard' | 'priority' | 'urgent' | 'emergency'
  
  // Fatores operacionais
  workshopCapacity: number // 0-100%
  technicianAvailability: number // 0-100%
  partsAvailability: 'in_stock' | 'order_needed' | 'scarce'
  
  // Histórico
  historicalConversionRate: number // 0-100%
  priceElasticity: number // Sensibilidade ao preço
}

export interface PricingRecommendation {
  recommendedPrice: number
  minimumPrice: number
  optimalPrice: number
  maximumPrice: number
  
  breakdown: {
    baseCost: number
    margin: number
    marginPercentage: number
    adjustments: Array<{
      factor: string
      adjustment: number
      percentage: number
      reason: string
    }>
  }
  
  confidence: number // 0-100%
  reasoning: string[]
  warnings: string[]
  opportunities: string[]
  
  competitivePosition: 'below' | 'at' | 'above'
  conversionProbability: number // 0-100%
  expectedRevenue: number
}

export class DynamicPricing {
  /**
   * Multiplicadores por tier de cliente
   */
  private static readonly CUSTOMER_TIER_MULTIPLIERS = {
    new: 0.95,        // 5% desconto para atrair
    regular: 1.00,    // Preço normal
    vip: 0.90,        // 10% desconto (fidelidade)
    platinum: 0.85    // 15% desconto (alto LTV)
  }

  /**
   * Multiplicadores por sazonalidade
   */
  private static readonly SEASONALITY_MULTIPLIERS = {
    low: 0.90,        // 10% desconto em época baixa
    normal: 1.00,     // Preço normal
    high: 1.10,       // 10% aumento em época alta
    peak: 1.20        // 20% aumento em picos
  }

  /**
   * Multiplicadores por demanda
   */
  private static readonly DEMAND_MULTIPLIERS = {
    very_low: 0.85,
    low: 0.95,
    normal: 1.00,
    high: 1.10,
    very_high: 1.15
  }

  /**
   * Multiplicadores por urgência
   */
  private static readonly URGENCY_MULTIPLIERS = {
    standard: 1.00,
    priority: 1.15,
    urgent: 1.25,
    emergency: 1.40
  }

  /**
   * Calcular preço recomendado usando IA
   */
  static calculateOptimalPrice(factors: PricingFactors): PricingRecommendation {
    const reasoning: string[] = []
    const warnings: string[] = []
    const opportunities: string[] = []
    const adjustments: Array<{ factor: string; adjustment: number; percentage: number; reason: string }> = []

    // 1. Calcular custo total
    const totalCost = factors.baseCost + factors.laborCost + factors.overheadCost
    reasoning.push(`Custo total: €${totalCost.toFixed(2)}`)

    // 2. Aplicar margem alvo
    let price = totalCost * (1 + factors.targetMargin / 100)
    const baseMargin = price - totalCost
    reasoning.push(`Preço base (margem ${factors.targetMargin}%): €${price.toFixed(2)}`)

    // 3. Ajuste por tier de cliente
    const tierMultiplier = this.CUSTOMER_TIER_MULTIPLIERS[factors.customerTier]
    const tierAdjustment = price * (tierMultiplier - 1)
    price *= tierMultiplier
    
    if (tierAdjustment !== 0) {
      adjustments.push({
        factor: 'Cliente ' + factors.customerTier.toUpperCase(),
        adjustment: tierAdjustment,
        percentage: (tierMultiplier - 1) * 100,
        reason: `Ajuste para cliente ${factors.customerTier}`
      })
      reasoning.push(`Ajuste tier ${factors.customerTier}: ${tierAdjustment > 0 ? '+' : ''}€${tierAdjustment.toFixed(2)}`)
    }

    // 4. Ajuste por sazonalidade
    const seasonalityMultiplier = this.SEASONALITY_MULTIPLIERS[factors.seasonality]
    const seasonalityAdjustment = price * (seasonalityMultiplier - 1)
    price *= seasonalityMultiplier
    
    if (seasonalityAdjustment !== 0) {
      adjustments.push({
        factor: 'Sazonalidade',
        adjustment: seasonalityAdjustment,
        percentage: (seasonalityMultiplier - 1) * 100,
        reason: `Época ${factors.seasonality}`
      })
    }

    // 5. Ajuste por demanda
    const demandMultiplier = this.DEMAND_MULTIPLIERS[factors.currentDemand]
    const demandAdjustment = price * (demandMultiplier - 1)
    price *= demandMultiplier
    
    if (demandAdjustment !== 0) {
      adjustments.push({
        factor: 'Demanda',
        adjustment: demandAdjustment,
        percentage: (demandMultiplier - 1) * 100,
        reason: `Demanda ${factors.currentDemand.replace('_', ' ')}`
      })
    }

    // 6. Ajuste por urgência
    const urgencyMultiplier = this.URGENCY_MULTIPLIERS[factors.urgency]
    const urgencyAdjustment = price * (urgencyMultiplier - 1)
    price *= urgencyMultiplier
    
    if (urgencyAdjustment !== 0) {
      adjustments.push({
        factor: 'Urgência',
        adjustment: urgencyAdjustment,
        percentage: (urgencyMultiplier - 1) * 100,
        reason: `Serviço ${factors.urgency}`
      })
    }

    // 7. Ajuste por capacidade
    if (factors.workshopCapacity > 90) {
      const capacityAdjustment = price * 0.10
      price += capacityAdjustment
      adjustments.push({
        factor: 'Capacidade',
        adjustment: capacityAdjustment,
        percentage: 10,
        reason: 'Oficina com alta ocupação (>90%)'
      })
      warnings.push('Alta ocupação - considere aumentar preços')
    } else if (factors.workshopCapacity < 50) {
      const capacityAdjustment = price * -0.05
      price += capacityAdjustment
      adjustments.push({
        factor: 'Capacidade',
        adjustment: capacityAdjustment,
        percentage: -5,
        reason: 'Baixa ocupação (<50%) - atrair clientes'
      })
      opportunities.push('Baixa ocupação - promoções podem aumentar volume')
    }

    // 8. Ajuste por disponibilidade de peças
    if (factors.partsAvailability === 'scarce') {
      const scarcityAdjustment = price * 0.08
      price += scarcityAdjustment
      adjustments.push({
        factor: 'Disponibilidade de Peças',
        adjustment: scarcityAdjustment,
        percentage: 8,
        reason: 'Peças escassas no mercado'
      })
      warnings.push('Peças escassas - pode afetar prazo de entrega')
    }

    // 9. Análise competitiva
    const avgCompetitorPrice = factors.marketAverage || 
      (factors.competitorPrices.length > 0 
        ? factors.competitorPrices.reduce((a, b) => a + b, 0) / factors.competitorPrices.length 
        : price)
    
    let competitivePosition: 'below' | 'at' | 'above' = 'at'
    const priceDiff = ((price - avgCompetitorPrice) / avgCompetitorPrice * 100)
    
    if (priceDiff < -5) {
      competitivePosition = 'below'
      opportunities.push(`Preço ${Math.abs(priceDiff).toFixed(1)}% abaixo da concorrência - pode aumentar margem`)
    } else if (priceDiff > 5) {
      competitivePosition = 'above'
      warnings.push(`Preço ${priceDiff.toFixed(1)}% acima da concorrência - pode afetar conversão`)
    } else {
      reasoning.push('Preço competitivo com o mercado')
    }

    // 10. Calcular elasticidade e probabilidade de conversão
    const baseConversion = factors.historicalConversionRate || 60
    let conversionProbability = baseConversion
    
    // Ajustar conversão baseado em competitividade
    if (competitivePosition === 'below') {
      conversionProbability += 15
    } else if (competitivePosition === 'above') {
      conversionProbability -= 20 * (priceDiff / 100) // Quanto mais caro, menor a conversão
    }
    
    // Ajustar por tier de cliente
    if (factors.customerTier === 'vip' || factors.customerTier === 'platinum') {
      conversionProbability += 10 // Clientes fiéis convertem mais
    }
    
    conversionProbability = Math.max(0, Math.min(100, conversionProbability))

    // 11. Definir faixas de preço
    const minimumPrice = totalCost * 1.15 // Margem mínima de 15%
    const optimalPrice = price
    const maximumPrice = avgCompetitorPrice * 1.15 // Até 15% acima da concorrência

    // 12. Calcular receita esperada
    const expectedRevenue = optimalPrice * (conversionProbability / 100)

    // 13. Calcular confiança
    const hasCompetitorData = factors.competitorPrices.length > 0
    const hasHistoricalData = factors.historicalConversionRate !== undefined
    let confidence = 70
    if (hasCompetitorData) confidence += 15
    if (hasHistoricalData) confidence += 15

    // 14. Gerar recomendações finais
    if (factors.lastServiceDate) {
      const daysSinceLastService = Math.floor(
        (new Date().getTime() - new Date(factors.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastService > 180) {
        opportunities.push('Cliente inativo há 180+ dias - considere desconto de reativação')
      }
    }

    if (factors.loyaltyPoints && factors.loyaltyPoints > 1000) {
      opportunities.push('Cliente com muitos pontos de fidelidade - pode resgatar desconto')
    }

    const finalMargin = optimalPrice - totalCost
    const marginPercentage = (finalMargin / totalCost) * 100

    return {
      recommendedPrice: Math.round(optimalPrice * 100) / 100,
      minimumPrice: Math.round(minimumPrice * 100) / 100,
      optimalPrice: Math.round(optimalPrice * 100) / 100,
      maximumPrice: Math.round(maximumPrice * 100) / 100,
      
      breakdown: {
        baseCost: totalCost,
        margin: finalMargin,
        marginPercentage,
        adjustments
      },
      
      confidence,
      reasoning,
      warnings,
      opportunities,
      
      competitivePosition,
      conversionProbability: Math.round(conversionProbability),
      expectedRevenue: Math.round(expectedRevenue * 100) / 100
    }
  }

  /**
   * Simular diferentes cenários de preço
   */
  static simulateScenarios(factors: PricingFactors): Array<{
    price: number
    margin: number
    conversionRate: number
    expectedRevenue: number
    expectedProfit: number
    scenario: string
  }> {
    const baseRecommendation = this.calculateOptimalPrice(factors)
    const scenarios: Array<any> = []

    // Cenário 1: Preço mínimo (margem de segurança)
    scenarios.push({
      price: baseRecommendation.minimumPrice,
      margin: 15,
      conversionRate: 85,
      expectedRevenue: baseRecommendation.minimumPrice * 0.85,
      expectedProfit: (baseRecommendation.minimumPrice - factors.baseCost - factors.laborCost - factors.overheadCost) * 0.85,
      scenario: 'Conservador (Margem Mínima)'
    })

    // Cenário 2: Preço ótimo (recomendado)
    scenarios.push({
      price: baseRecommendation.optimalPrice,
      margin: baseRecommendation.breakdown.marginPercentage,
      conversionRate: baseRecommendation.conversionProbability,
      expectedRevenue: baseRecommendation.expectedRevenue,
      expectedProfit: baseRecommendation.breakdown.margin * (baseRecommendation.conversionProbability / 100),
      scenario: 'Ótimo (Recomendado)'
    })

    // Cenário 3: Preço agressivo (maximizar margem)
    const aggressivePrice = baseRecommendation.maximumPrice
    const aggressiveConversion = Math.max(30, baseRecommendation.conversionProbability - 25)
    scenarios.push({
      price: aggressivePrice,
      margin: ((aggressivePrice - factors.baseCost - factors.laborCost - factors.overheadCost) / (factors.baseCost + factors.laborCost + factors.overheadCost)) * 100,
      conversionRate: aggressiveConversion,
      expectedRevenue: aggressivePrice * (aggressiveConversion / 100),
      expectedProfit: (aggressivePrice - factors.baseCost - factors.laborCost - factors.overheadCost) * (aggressiveConversion / 100),
      scenario: 'Agressivo (Alta Margem)'
    })

    // Cenário 4: Preço competitivo (igualar mercado)
    const marketPrice = factors.marketAverage
    const marketConversion = 70
    scenarios.push({
      price: marketPrice,
      margin: ((marketPrice - factors.baseCost - factors.laborCost - factors.overheadCost) / (factors.baseCost + factors.laborCost + factors.overheadCost)) * 100,
      conversionRate: marketConversion,
      expectedRevenue: marketPrice * (marketConversion / 100),
      expectedProfit: (marketPrice - factors.baseCost - factors.laborCost - factors.overheadCost) * (marketConversion / 100),
      scenario: 'Competitivo (Média de Mercado)'
    })

    // Cenário 5: Preço promocional (alto volume)
    const promoPrice = baseRecommendation.minimumPrice * 0.95
    const promoConversion = 95
    scenarios.push({
      price: promoPrice,
      margin: ((promoPrice - factors.baseCost - factors.laborCost - factors.overheadCost) / (factors.baseCost + factors.laborCost + factors.overheadCost)) * 100,
      conversionRate: promoConversion,
      expectedRevenue: promoPrice * (promoConversion / 100),
      expectedProfit: (promoPrice - factors.baseCost - factors.laborCost - factors.overheadCost) * (promoConversion / 100),
      scenario: 'Promocional (Alto Volume)'
    })

    return scenarios.map(s => ({
      ...s,
      price: Math.round(s.price * 100) / 100,
      margin: Math.round(s.margin * 10) / 10,
      expectedRevenue: Math.round(s.expectedRevenue * 100) / 100,
      expectedProfit: Math.round(s.expectedProfit * 100) / 100
    }))
  }

  /**
   * Analisar sensibilidade ao preço
   */
  static analyzePriceSensitivity(factors: PricingFactors): {
    pricePoints: number[]
    conversionRates: number[]
    revenues: number[]
    profits: number[]
    optimalPoint: { price: number; profit: number }
  } {
    const basePrice = this.calculateOptimalPrice(factors).optimalPrice
    const totalCost = factors.baseCost + factors.laborCost + factors.overheadCost
    
    const pricePoints: number[] = []
    const conversionRates: number[] = []
    const revenues: number[] = []
    const profits: number[] = []

    // Testar de -30% a +30% do preço base
    for (let i = -30; i <= 30; i += 5) {
      const price = basePrice * (1 + i / 100)
      pricePoints.push(Math.round(price * 100) / 100)
      
      // Modelo simplificado de elasticidade
      const priceElasticity = factors.priceElasticity || -1.5
      const conversionChange = i * priceElasticity
      const conversion = Math.max(10, Math.min(100, 70 + conversionChange))
      conversionRates.push(Math.round(conversion))
      
      const revenue = price * (conversion / 100)
      revenues.push(Math.round(revenue * 100) / 100)
      
      const profit = (price - totalCost) * (conversion / 100)
      profits.push(Math.round(profit * 100) / 100)
    }

    // Encontrar ponto ótimo
    const maxProfitIndex = profits.indexOf(Math.max(...profits))
    
    return {
      pricePoints,
      conversionRates,
      revenues,
      profits,
      optimalPoint: {
        price: pricePoints[maxProfitIndex],
        profit: profits[maxProfitIndex]
      }
    }
  }

  /**
   * Gerar insights e recomendações estratégicas
   */
  static generateStrategicInsights(factors: PricingFactors): string[] {
    const insights: string[] = []
    const recommendation = this.calculateOptimalPrice(factors)

    // Análise de margem
    if (recommendation.breakdown.marginPercentage < 20) {
      insights.push('⚠️ Margem abaixo do ideal (<20%). Considere renegociar custos ou aumentar preços.')
    } else if (recommendation.breakdown.marginPercentage > 40) {
      insights.push('💰 Excelente margem (>40%). Posição forte no mercado.')
    }

    // Análise competitiva
    if (recommendation.competitivePosition === 'above') {
      insights.push('📊 Preço acima da concorrência. Certifique-se de comunicar valor diferenciado.')
    } else if (recommendation.competitivePosition === 'below') {
      insights.push('🎯 Preço competitivo. Oportunidade de aumentar margem sem perder clientes.')
    }

    // Análise de conversão
    if (recommendation.conversionProbability < 50) {
      insights.push('⚡ Baixa probabilidade de conversão. Considere reduzir preço ou melhorar proposta de valor.')
    } else if (recommendation.conversionProbability > 80) {
      insights.push('✅ Alta probabilidade de conversão. Pode testar preço ligeiramente superior.')
    }

    // Análise de cliente
    if (factors.customerTier === 'new') {
      insights.push('🆕 Cliente novo. Preço atrativo pode garantir conversão e futuro negócio.')
    } else if (factors.customerTier === 'platinum' || factors.customerTier === 'vip') {
      insights.push('⭐ Cliente VIP. Foco em qualidade e serviço, menos sensível a preço.')
    }

    // Análise de demanda
    if (factors.currentDemand === 'very_high' && factors.workshopCapacity > 80) {
      insights.push('🔥 Alta demanda + alta capacidade = oportunidade de aumentar preços.')
    } else if (factors.currentDemand === 'very_low' && factors.workshopCapacity < 50) {
      insights.push('📉 Baixa demanda + baixa capacidade = considere promoções agressivas.')
    }

    return insights
  }
}
