import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  CheckCircle,
  Building2,
  MapPin,
  Clock,
  Euro,
  Star,
  AlertCircle,
  ChevronLeft,
  Calendar
} from 'lucide-react'
import { Checkbox } from './ui/checkbox'

interface Workshop {
  workshopId: string
  workshopName: string
  workshopPhone: string
  workshopEmail: string
  workshopAddress: string
  workshopPostalCode?: string
  workshopLocality?: string
  workshopLogoUrl?: string
  estimatedPrice: number
  estimatedDuration: number
  rating?: number
  reviewsCount?: number
  responseTime?: string
  nextAvailableDate?: string | null
}

interface InstantQuoteResultsProps {
  workshops: Workshop[]
  serviceName: string
  location: string
  selectedWorkshops: string[]
  onToggleWorkshop: (workshopId: string) => void
  onContinue: () => void
  onBack: () => void
  loading: boolean
}

export function InstantQuoteResults({
  workshops,
  serviceName,
  location,
  selectedWorkshops,
  onToggleWorkshop,
  onContinue,
  onBack,
  loading
}: InstantQuoteResultsProps) {
  // Format date to Portuguese
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl mb-4 font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
          Orçamentos Instantâneos!
        </h2>
        <p className="text-xl text-gray-600 mb-2">
          Encontrámos <span className="font-bold text-blue-600">{workshops.length} oficina(s)</span> em{' '}
          <span className="font-bold text-orange-600">{location}</span>
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Serviço: <span className="font-semibold text-gray-700">{serviceName}</span>
        </p>
      </div>

      {/* Selection Info */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Selecione até 3 oficinas
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Escolha até <strong>3 oficinas</strong> para pedir validação ou retificação do orçamento. 
                As oficinas selecionadas irão analisar e responder com os valores finais.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant={selectedWorkshops.length > 0 ? "default" : "secondary"} className="text-sm">
                  {selectedWorkshops.length} / 3 selecionadas
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workshops Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {workshops.map((workshop) => {
          const isSelected = selectedWorkshops.includes(workshop.workshopId)
          const canSelect = selectedWorkshops.length < 3 || isSelected
          
          return (
            <Card 
              key={workshop.workshopId}
              className={`relative hover:shadow-2xl transition-all duration-300 border-2 bg-white/90 backdrop-blur-xl overflow-hidden cursor-pointer group ${
                isSelected 
                  ? 'border-blue-500 shadow-blue-200 ring-4 ring-blue-100 scale-105' 
                  : canSelect
                  ? 'border-gray-200 hover:border-blue-300 hover:-translate-y-1'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => {
                console.log('🖱️ Card clicked:', workshop.workshopName, workshop.workshopId)
                console.log('   Can select?', canSelect)
                console.log('   Is selected?', isSelected)
                if (canSelect) {
                  onToggleWorkshop(workshop.workshopId)
                }
              }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-orange-500"></div>
              )}
              
              {/* Selection Checkbox */}
              <div className="absolute top-4 right-4 z-10">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                  isSelected 
                    ? 'bg-gradient-to-br from-blue-600 to-orange-500 shadow-lg scale-110' 
                    : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  {isSelected && <CheckCircle className="h-5 w-5 text-white" />}
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start gap-3 pr-10">
                  {workshop.workshopLogoUrl ? (
                    <img 
                      src={workshop.workshopLogoUrl} 
                      alt={workshop.workshopName}
                      className="h-16 w-16 object-contain rounded-lg border border-gray-200 bg-white p-1"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 leading-tight mb-2">
                      {workshop.workshopName}
                    </CardTitle>
                    <div className="space-y-1">
                      {workshop.workshopAddress && (
                        <div className="flex items-start gap-1 text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="leading-tight">{workshop.workshopAddress}</span>
                        </div>
                      )}
                      {(workshop.workshopPostalCode || workshop.workshopLocality) && (
                        <div className="text-xs text-gray-500 pl-4">
                          {workshop.workshopPostalCode && <span>{workshop.workshopPostalCode}</span>}
                          {workshop.workshopPostalCode && workshop.workshopLocality && <span> • </span>}
                          {workshop.workshopLocality && <span>{workshop.workshopLocality}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Price - Highlight */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Euro className="h-5 w-5 text-orange-600" />
                    <span className="text-sm text-gray-700 font-semibold">Preço Estimado:</span>
                  </div>
                  <span className="text-2xl font-black text-orange-600">
                    €{workshop.estimatedPrice}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>Duração: {workshop.estimatedDuration}min</span>
                  </div>
                  
                  {workshop.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-gray-700 font-semibold">{workshop.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({workshop.reviewsCount || 0} avaliações)</span>
                    </div>
                  )}
                  
                  {workshop.responseTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span>Responde em: {workshop.responseTime}</span>
                    </div>
                  )}
                  
                  {/* Next Available Date */}
                  {workshop.nextAvailableDate ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <span className="text-xs text-gray-600">Próxima disponibilidade:</span>
                        <p className="font-semibold text-green-700 text-sm">
                          {formatDate(workshop.nextAvailableDate)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Disponibilidade a confirmar</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-8">
        <Button 
          onClick={onBack} 
          variant="outline" 
          size="lg"
          className="border-2 border-gray-300 hover:bg-gray-50 font-semibold"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Voltar
        </Button>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
          <Button 
            onClick={onContinue}
            size="lg"
            disabled={selectedWorkshops.length === 0 || loading}
            className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-xl font-bold px-8"
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⚙️</span>
                A enviar...
              </span>
            ) : (
              <>
                Enviar para {selectedWorkshops.length} Oficina(s) Selecionada(s)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
