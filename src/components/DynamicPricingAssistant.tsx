import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Slider } from './ui/slider'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, BarChart3, Zap } from 'lucide-react'
import { DynamicPricing, PricingFactors } from '../utils/ai/DynamicPricing'
import { toast } from 'sonner@2.0.3'

export function DynamicPricingAssistant() {
  const [factors, setFactors] = useState<PricingFactors>({
    baseCost: 150,
    laborCost: 80,
    overheadCost: 20,
    targetMargin: 30,
    
    competitorPrices: [280, 295, 310, 325],
    marketAverage: 302,
    seasonality: 'normal',
    
    customerTier: 'regular',
    customerLifetimeValue: 1200,
    loyaltyPoints: 450,
    
    currentDemand: 'normal',
    timeSlotDemand: 'normal',
    urgency: 'standard',
    
    workshopCapacity: 65,
    technicianAvailability: 75,
    partsAvailability: 'in_stock',
    
    historicalConversionRate: 68,
    priceElasticity: -1.5
  })

  const [recommendation, setRecommendation] = useState(DynamicPricing.calculateOptimalPrice(factors))
  const [scenarios, setScenarios] = useState(DynamicPricing.simulateScenarios(factors))
  const [insights, setInsights] = useState(DynamicPricing.generateStrategicInsights(factors))

  const handleRecalculate = () => {
    const newRecommendation = DynamicPricing.calculateOptimalPrice(factors)
    const newScenarios = DynamicPricing.simulateScenarios(factors)
    const newInsights = DynamicPricing.generateStrategicInsights(factors)
    
    setRecommendation(newRecommendation)
    setScenarios(newScenarios)
    setInsights(newInsights)
    
    toast.success('Preços recalculados!', {
      description: `Preço ótimo: €${newRecommendation.optimalPrice}`
    })
  }

  const updateFactor = (key: keyof PricingFactors, value: any) => {
    setFactors({ ...factors, [key]: value })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Assistente de Pricing com IA
              </CardTitle>
              <CardDescription className="mt-1">
                Otimização inteligente de preços baseada em IA e machine learning
              </CardDescription>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recomendação Principal */}
      <Card className="border-4 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Preço Recomendado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-2">Preço Ótimo</p>
            <p className="text-5xl font-bold text-green-600 mb-2">
              €{recommendation.optimalPrice.toFixed(2)}
            </p>
            <Badge className={`text-sm ${
              recommendation.confidence > 80 ? 'bg-green-600' :
              recommendation.confidence > 60 ? 'bg-yellow-600' :
              'bg-orange-600'
            }`}>
              {recommendation.confidence}% de Confiança
            </Badge>
          </div>

          {/* Faixa de Preços */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs text-gray-600">Mínimo</p>
                <p className="text-lg font-bold text-red-600">
                  €{recommendation.minimumPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Margem segurança</p>
              </div>
              
              <div className="text-center flex-1 border-x-2 border-gray-200 px-4">
                <p className="text-xs text-gray-600">Ótimo</p>
                <p className="text-lg font-bold text-green-600">
                  €{recommendation.optimalPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Recomendado</p>
              </div>
              
              <div className="text-center flex-1">
                <p className="text-xs text-gray-600">Máximo</p>
                <p className="text-lg font-bold text-orange-600">
                  €{recommendation.maximumPrice.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Limite mercado</p>
              </div>
            </div>

            {/* Barra Visual */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-red-500 via-green-500 to-orange-500"
                style={{ width: '100%' }}
              />
              <div 
                className="absolute h-full w-1 bg-white shadow-lg"
                style={{ 
                  left: `${((recommendation.optimalPrice - recommendation.minimumPrice) / 
                    (recommendation.maximumPrice - recommendation.minimumPrice)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-white rounded-lg border-2 border-green-200">
              <p className="text-xs text-gray-600">Margem</p>
              <p className="text-xl font-bold text-green-600">
                {recommendation.breakdown.marginPercentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                €{recommendation.breakdown.margin.toFixed(2)}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border-2 border-blue-200">
              <p className="text-xs text-gray-600">Conversão</p>
              <p className="text-xl font-bold text-blue-600">
                {recommendation.conversionProbability}%
              </p>
              <p className="text-xs text-gray-500">Probabilidade</p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg border-2 border-purple-200">
              <p className="text-xs text-gray-600">Receita Esperada</p>
              <p className="text-xl font-bold text-purple-600">
                €{recommendation.expectedRevenue.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">Com conversão</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="factors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="factors">Fatores</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
          <TabsTrigger value="breakdown">Detalhes</TabsTrigger>
        </TabsList>

        {/* Fatores */}
        <TabsContent value="factors" className="space-y-4 mt-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Custos Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Custo de Materiais</Label>
                  <Input
                    type="number"
                    value={factors.baseCost}
                    onChange={(e) => updateFactor('baseCost', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custo de Mão de Obra</Label>
                  <Input
                    type="number"
                    value={factors.laborCost}
                    onChange={(e) => updateFactor('laborCost', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custos Indiretos</Label>
                  <Input
                    type="number"
                    value={factors.overheadCost}
                    onChange={(e) => updateFactor('overheadCost', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Margem Alvo (%)</Label>
                  <Input
                    type="number"
                    value={factors.targetMargin}
                    onChange={(e) => updateFactor('targetMargin', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg">Mercado e Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Médio de Mercado</Label>
                  <Input
                    type="number"
                    value={factors.marketAverage}
                    onChange={(e) => updateFactor('marketAverage', Number(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tier do Cliente</Label>
                  <Select 
                    value={factors.customerTier} 
                    onValueChange={(value) => updateFactor('customerTier', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="platinum">Platinum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sazonalidade</Label>
                  <Select 
                    value={factors.seasonality} 
                    onValueChange={(value) => updateFactor('seasonality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="peak">Pico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Demanda Atual</Label>
                  <Select 
                    value={factors.currentDemand} 
                    onValueChange={(value) => updateFactor('currentDemand', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_low">Muito Baixa</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="very_high">Muito Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Capacidade da Oficina: {factors.workshopCapacity}%</Label>
                <Slider
                  value={[factors.workshopCapacity]}
                  onValueChange={(value) => updateFactor('workshopCapacity', value[0])}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleRecalculate} className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white" size="lg">
            <Zap className="h-4 w-4 mr-2" />
            Recalcular Preços com IA
          </Button>
        </TabsContent>

        {/* Cenários */}
        <TabsContent value="scenarios" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 gap-4">
            {scenarios.map((scenario, index) => {
              const isOptimal = scenario.scenario.includes('Ótimo')
              
              return (
                <Card 
                  key={index}
                  className={`border-2 ${
                    isOptimal ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50' : 'border-gray-200'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{scenario.scenario}</CardTitle>
                      {isOptimal && (
                        <Badge className="bg-green-600">Recomendado</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Preço</p>
                        <p className="text-xl font-bold text-blue-600">€{scenario.price.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Margem</p>
                        <p className="text-xl font-bold text-purple-600">{scenario.margin.toFixed(1)}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Conversão</p>
                        <p className="text-xl font-bold text-orange-600">{scenario.conversionRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Receita</p>
                        <p className="text-xl font-bold text-green-600">€{scenario.expectedRevenue.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Lucro</p>
                        <p className="text-xl font-bold text-teal-600">€{scenario.expectedProfit.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Insights IA */}
        <TabsContent value="insights" className="space-y-4 mt-6">
          <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-orange-600" />
                Insights Estratégicos da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-orange-200">
                  <BarChart3 className="h-5 w-5 text-orange-600 mt-0.5" />
                  <p className="text-sm text-gray-800">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Avisos */}
          {recommendation.warnings.length > 0 && (
            <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Avisos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendation.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                    <span>⚠️</span>
                    <p>{warning}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Oportunidades */}
          {recommendation.opportunities.length > 0 && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5" />
                  Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recommendation.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-green-700">
                    <span>💡</span>
                    <p>{opportunity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Breakdown Detalhado */}
        <TabsContent value="breakdown" className="space-y-4 mt-6">
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle>Análise Detalhada do Preço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Custo Total</span>
                  <span className="font-bold">€{recommendation.breakdown.baseCost.toFixed(2)}</span>
                </div>
                
                {recommendation.breakdown.adjustments.map((adjustment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <span className="font-medium">{adjustment.factor}</span>
                      <p className="text-xs text-gray-500">{adjustment.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${adjustment.adjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adjustment.adjustment > 0 ? '+' : ''}€{adjustment.adjustment.toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500">
                        ({adjustment.percentage > 0 ? '+' : ''}{adjustment.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                  <span className="font-bold text-lg">Preço Final</span>
                  <span className="font-bold text-2xl text-green-600">€{recommendation.optimalPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
