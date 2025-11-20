import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import {
  Star,
  User,
  Calendar,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  Award
} from 'lucide-react'

interface Review {
  id: string
  workshopId: string
  clientName: string
  clientEmail: string
  appointmentId?: string
  rating: number
  comment?: string
  createdAt: string
}

interface WorkshopReviewsModuleProps {
  accessToken: string
}

export function WorkshopReviewsModule({ accessToken }: WorkshopReviewsModuleProps) {
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0] // 1-5 stars
  })

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/reviews`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar avaliações')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
      setStats(data.stats || { averageRating: 0, totalReviews: 0, ratingDistribution: [0, 0, 0, 0, 0] })
    } catch (error: any) {
      console.error('Error loading reviews:', error)
      toast.error('Erro ao carregar avaliações')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-blue-600'
    if (rating >= 2.5) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="space-y-6 p-4" style={{ margin: '10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Avaliações de Clientes
          </h1>
          <p className="text-gray-500 mt-1">
            Veja o que os seus clientes dizem sobre a sua oficina
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadReviews}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Average Rating */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Avaliação Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <div className={`text-5xl font-black ${getRatingColor(stats.averageRating)}`}>
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(stats.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Baseado em {stats.totalReviews} avaliação(ões)
            </p>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg bg-blue-600 flex items-center justify-center">
                <MessageSquare className="h-7 w-7 text-white" />
              </div>
              <div className="text-5xl font-black text-gray-900">
                {stats.totalReviews}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Badge */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Qualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-lg bg-green-600 flex items-center justify-center">
                <Award className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-2xl font-black text-gray-900">
                  {stats.averageRating >= 4.5 ? 'Excelente' :
                   stats.averageRating >= 3.5 ? 'Muito Bom' :
                   stats.averageRating >= 2.5 ? 'Bom' : 'Razoável'}
                </div>
                <p className="text-xs text-gray-500">
                  {stats.averageRating >= 4.5 && '🏆 Top qualidade'}
                  {stats.averageRating >= 3.5 && stats.averageRating < 4.5 && '👍 Acima da média'}
                  {stats.averageRating >= 2.5 && stats.averageRating < 3.5 && '👌 Na média'}
                  {stats.averageRating < 2.5 && '⚠️ Precisa melhorar'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.ratingDistribution[stars - 1] || 0
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Todas as Avaliações</h2>
        
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">A carregar avaliações...</p>
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Ainda sem avaliações
              </h3>
              <p className="text-sm text-gray-500">
                As avaliações aparecerão aqui quando os clientes avaliarem a sua oficina
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Header with stars and date */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{review.clientName}</p>
                        <p className="text-xs text-gray-500">Cliente verificado</p>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 italic">
                          "{review.comment}"
                        </p>
                      </div>
                    )}

                    {/* Rating badge */}
                    <div>
                      <Badge 
                        variant="secondary"
                        className={
                          review.rating >= 4 ? 'bg-green-100 text-green-800' :
                          review.rating >= 3 ? 'bg-blue-100 text-blue-800' :
                          'bg-orange-100 text-orange-800'
                        }
                      >
                        {review.rating >= 4 ? '👍 Recomenda' :
                         review.rating >= 3 ? '👌 Satisfeito' :
                         '⚠️ Precisa melhorar'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      {stats.totalReviews > 0 && stats.averageRating >= 4.5 && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Excelente Trabalho! 🎉
                </h3>
                <p className="text-sm text-gray-600">
                  As suas avaliações são excepcionais! Destaque isto nos seus orçamentos para atrair mais clientes.
                  Continue a oferecer um serviço de qualidade.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
