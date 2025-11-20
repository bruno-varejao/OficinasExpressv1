import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Users,
  DollarSign,
  Award,
  BarChart3,
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit,
  Calendar,
  Star
} from 'lucide-react'
import { Button } from './ui/button'

interface Statistics {
  totalRequests: number
  pendingRequests: number
  respondedRequests: number
  chosenByClient: number
  rejectedRequests: number
  conversionRate: number
  averageResponseTime: number // in minutes
  averagePrice: number
  competitorAveragePrice: number
  priceDifferencePercentage: number
  requestsByService: { serviceName: string; count: number }[]
  monthlyTrend: { month: string; requests: number; chosen: number }[]
  averageRating: number
  totalReviews: number
}

interface WorkshopStatisticsModuleProps {
  accessToken: string
}

export function WorkshopStatisticsModule({ accessToken }: WorkshopStatisticsModuleProps) {
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadStatistics()
  }, [timeRange])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/statistics?timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }

      const data = await response.json()
      setStatistics(data.statistics)
    } catch (error: any) {
      console.error('Error loading statistics:', error)
      toast.error('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }

  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}min`
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4" style={{ margin: '10px' }}>
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">A carregar estatísticas...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="space-y-6 p-4" style={{ margin: '10px' }}>
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">
              Sem dados disponíveis
            </h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4" style={{ margin: '10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Estatísticas & Performance
          </h1>
          <p className="text-gray-500 mt-1">
            Análise detalhada da sua performance
          </p>
        </div>
        <div className="flex gap-3">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Semana
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Mês
            </Button>
            <Button
              variant={timeRange === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('year')}
            >
              Ano
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStatistics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Requests */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Total de Pedidos</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {statistics.totalRequests}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {statistics.pendingRequests} pendentes
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Taxa de Conversão</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {statistics.conversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-2 mt-2">
              {statistics.conversionRate >= 30 ? (
                <div className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Excelente
                </div>
              ) : statistics.conversionRate >= 15 ? (
                <div className="flex items-center text-blue-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Bom
                </div>
              ) : (
                <div className="flex items-center text-orange-600 text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Melhorar
                </div>
              )}
              <span className="text-xs text-gray-500">
                {statistics.chosenByClient} escolhido(s)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Tempo de Resposta</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-orange-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">
              {formatResponseTime(statistics.averageResponseTime)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              {statistics.averageResponseTime < 120 ? (
                <div className="flex items-center text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Rápido
                </div>
              ) : statistics.averageResponseTime < 360 ? (
                <div className="flex items-center text-blue-600 text-sm">
                  Razoável
                </div>
              ) : (
                <div className="flex items-center text-orange-600 text-sm">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Lento
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-gray-600">Avaliação Média</CardTitle>
              <div className="h-10 w-10 rounded-lg bg-yellow-600 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-gray-900">
                {statistics.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(statistics.averageRating)
                        ? 'fill-current'
                        : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">
                {statistics.totalReviews} avaliação(ões)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Price Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Comparação de Preços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seu Preço Médio:</span>
                <span className="font-bold text-gray-900">€{statistics.averagePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Média da Concorrência:</span>
                <span className="font-bold text-gray-900">€{statistics.competitorAveragePrice.toFixed(2)}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diferença:</span>
                <div className="flex items-center gap-2">
                  {statistics.priceDifferencePercentage > 0 ? (
                    <>
                      <Badge variant="destructive" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{statistics.priceDifferencePercentage.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-500">mais caro</span>
                    </>
                  ) : statistics.priceDifferencePercentage < 0 ? (
                    <>
                      <Badge className="bg-green-600 text-xs">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {statistics.priceDifferencePercentage.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-gray-500">mais barato</span>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Igual
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <p className="text-blue-900">
                {statistics.priceDifferencePercentage > 10 ? (
                  <>💡 <strong>Dica:</strong> Os seus preços estão {Math.abs(statistics.priceDifferencePercentage).toFixed(0)}% acima da média. 
                  Considere ajustar para aumentar a taxa de conversão.</>
                ) : statistics.priceDifferencePercentage < -10 ? (
                  <>💡 <strong>Dica:</strong> Os seus preços são competitivos! Isto pode atrair mais clientes.</>
                ) : (
                  <>✅ <strong>Ótimo:</strong> Os seus preços estão alinhados com o mercado.</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Breakdown de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Responded */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Respondidos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.totalRequests > 0 ? (statistics.respondedRequests / statistics.totalRequests) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">
                  {statistics.respondedRequests}
                </span>
              </div>
            </div>

            {/* Chosen */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-green-100 flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Escolhidos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.totalRequests > 0 ? (statistics.chosenByClient / statistics.totalRequests) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">
                  {statistics.chosenByClient}
                </span>
              </div>
            </div>

            {/* Pending */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-700">Pendentes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.totalRequests > 0 ? (statistics.pendingRequests / statistics.totalRequests) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">
                  {statistics.pendingRequests}
                </span>
              </div>
            </div>

            {/* Rejected */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">Rejeitados</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ 
                      width: `${statistics.totalRequests > 0 ? (statistics.rejectedRequests / statistics.totalRequests) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="font-bold text-gray-900 w-12 text-right">
                  {statistics.rejectedRequests}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services Breakdown */}
      {statistics.requestsByService.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Pedidos por Serviço
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.requestsByService
                .sort((a, b) => b.count - a.count)
                .map((service) => (
                  <div key={service.serviceName} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{service.serviceName}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-orange-500 h-2 rounded-full" 
                          style={{ 
                            width: `${(service.count / statistics.totalRequests) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 w-12 text-right">
                        {service.count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Insights & Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statistics.conversionRate < 15 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-sm">
                <p className="text-orange-900">
                  <strong>⚠️ Taxa de Conversão Baixa:</strong> Considere:
                  <ul className="list-disc ml-5 mt-1">
                    <li>Reduzir preços ligeiramente</li>
                    <li>Melhorar tempo de resposta</li>
                    <li>Adicionar notas personalizadas nas respostas</li>
                  </ul>
                </p>
              </div>
            )}

            {statistics.averageResponseTime > 360 && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
                <p className="text-red-900">
                  <strong>⏰ Tempo de Resposta Elevado:</strong> Clientes preferem respostas rápidas (idealmente <2h). 
                  Ative notificações para responder mais rapidamente.
                </p>
              </div>
            )}

            {statistics.conversionRate >= 30 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                <p className="text-green-900">
                  <strong>🎉 Excelente Performance!</strong> A sua taxa de conversão está acima da média. 
                  Continue com o excelente trabalho!
                </p>
              </div>
            )}

            {statistics.averageRating >= 4.5 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                <p className="text-yellow-900">
                  <strong>⭐ Avaliações Excelentes!</strong> Os seus clientes estão muito satisfeitos. 
                  Destaque isto nos seus orçamentos!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
