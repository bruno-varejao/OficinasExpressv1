import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Trophy, Star, Gift, TrendingUp, Calendar, Award, Sparkles } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface LoyaltyDashboardProps {
  clientId: string
  workshopId: string
  accessToken: string
}

export function LoyaltyDashboard({ clientId, workshopId, accessToken }: LoyaltyDashboardProps) {
  const [loyaltyData, setLoyaltyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    loadLoyaltyData()
  }, [clientId, workshopId])

  const loadLoyaltyData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/loyalty/${workshopId}/${clientId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLoyaltyData(data)
      } else {
        toast.error('Erro ao carregar dados de fidelização')
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const redeemReward = async (rewardId: string, pointsCost: number) => {
    try {
      setRedeeming(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/loyalty/${workshopId}/${clientId}/redeem`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rewardId, pointsCost }),
        }
      )

      if (response.ok) {
        const updated = await response.json()
        setLoyaltyData(updated)
        toast.success('Recompensa resgatada com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao resgatar recompensa')
      }
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast.error('Erro ao resgatar recompensa')
    } finally {
      setRedeeming(false)
    }
  }

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: { name: 'Bronze', color: 'from-amber-700 to-amber-900', icon: Star, min: 0, max: 999 },
      silver: { name: 'Silver', color: 'from-gray-400 to-gray-600', icon: Award, min: 1000, max: 2499 },
      gold: { name: 'Gold', color: 'from-yellow-400 to-yellow-600', icon: Trophy, min: 2500, max: 4999 },
      platinum: { name: 'Platinum', color: 'from-purple-400 to-purple-600', icon: Sparkles, min: 5000, max: Infinity }
    }
    return tiers[tier as keyof typeof tiers] || tiers.bronze
  }

  const rewards = [
    { id: '1', name: 'Desconto 10% próxima visita', points: 250, icon: '🎁' },
    { id: '2', name: 'Mudança óleo grátis', points: 500, icon: '🛢️' },
    { id: '3', name: 'Lavagem completa grátis', points: 750, icon: '🧽' },
    { id: '4', name: 'Desconto 25% próxima visita', points: 1000, icon: '💎' },
    { id: '5', name: 'Revisão grátis', points: 1500, icon: '🔧' },
    { id: '6', name: 'VIP - Prioridade 1 mês', points: 2000, icon: '⭐' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-600 to-orange-500 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar programa de fidelização...</p>
        </div>
      </div>
    )
  }

  if (!loyaltyData) {
    return (
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-900">Erro</CardTitle>
          <CardDescription>Não foi possível carregar os dados de fidelização</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const tierInfo = getTierInfo(loyaltyData.tier)
  const TierIcon = tierInfo.icon
  const progressToNextTier = loyaltyData.tier === 'platinum' 
    ? 100 
    : ((loyaltyData.points - tierInfo.min) / (tierInfo.max - tierInfo.min + 1)) * 100

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                Programa de Fidelização
              </CardTitle>
              <CardDescription>
                Ganhe pontos e desbloqueie recompensas exclusivas
              </CardDescription>
            </div>
            <Badge className={`bg-gradient-to-r ${tierInfo.color} text-white border-0 px-4 py-2 text-base`}>
              <TierIcon className="h-4 w-4 mr-1" />
              {tierInfo.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Points Display */}
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Pontos Disponíveis</p>
              <p className="text-5xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                {loyaltyData.points.toLocaleString('pt-PT')}
              </p>
            </div>

            {/* Progress to Next Tier */}
            {loyaltyData.tier !== 'platinum' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Próximo nível</span>
                  <span className="font-semibold text-gray-900">
                    {loyaltyData.points} / {tierInfo.max + 1} pontos
                  </span>
                </div>
                <Progress value={progressToNextTier} className="h-3" />
                <p className="text-xs text-gray-500 text-center">
                  Faltam {tierInfo.max + 1 - loyaltyData.points} pontos para {getTierInfo(
                    loyaltyData.tier === 'bronze' ? 'silver' :
                    loyaltyData.tier === 'silver' ? 'gold' : 'platinum'
                  ).name}
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {loyaltyData.visitsCount || 0}
                </p>
                <p className="text-xs text-gray-600">Visitas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  €{loyaltyData.totalSpent?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-gray-600">Gasto Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {loyaltyData.redeemedRewards?.length || 0}
                </p>
                <p className="text-xs text-gray-600">Resgates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="earn">Como Ganhar</TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const canRedeem = loyaltyData.points >= reward.points
              return (
                <Card 
                  key={reward.id}
                  className={`border-2 ${canRedeem ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-2xl">{reward.icon}</span>
                          {reward.name}
                        </CardTitle>
                        <CardDescription>
                          {reward.points} pontos
                        </CardDescription>
                      </div>
                      {canRedeem && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                          Disponível
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => redeemReward(reward.id, reward.points)}
                      disabled={!canRedeem || redeeming}
                      className={canRedeem 
                        ? "w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        : "w-full"
                      }
                      variant={canRedeem ? "default" : "outline"}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {canRedeem ? 'Resgatar Agora' : `Faltam ${reward.points - loyaltyData.points} pontos`}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loyaltyData.transactions && loyaltyData.transactions.length > 0 ? (
            <div className="space-y-3">
              {loyaltyData.transactions.map((transaction: any) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">{transaction.reason}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </p>
                        <p className="text-xs text-gray-500">pontos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sem histórico ainda</p>
                <p className="text-sm text-gray-500 mt-2">
                  As suas transações aparecerão aqui
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* How to Earn Tab */}
        <TabsContent value="earn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Como Ganhar Pontos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                  <span className="text-sm font-bold">€1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Por cada euro gasto</p>
                  <p className="text-sm text-gray-600">Ganhe 10 pontos</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="bg-green-600 text-white rounded-full p-2 flex-shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Visita completa</p>
                  <p className="text-sm text-gray-600">Ganhe 50 pontos bónus</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-600 text-white rounded-full p-2 flex-shrink-0">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Aniversário</p>
                  <p className="text-sm text-gray-600">Ganhe 200 pontos</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="bg-orange-600 text-white rounded-full p-2 flex-shrink-0">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Avaliação 5 estrelas</p>
                  <p className="text-sm text-gray-600">Ganhe 100 pontos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}