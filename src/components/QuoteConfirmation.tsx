import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import {
  CheckCircle,
  Building2,
  Mail,
  Clock,
  ArrowRight,
  Sparkles,
  Bell,
  LogIn
} from 'lucide-react'

interface SelectedWorkshop {
  workshopId: string
  workshopName: string
  workshopAddress: string
  workshopPhone: string
  workshopEmail: string
  workshopLogoUrl?: string
}

interface QuoteConfirmationProps {
  selectedWorkshops: SelectedWorkshop[]
  clientEmail: string
  quoteRequestId: string
  onNewRequest: () => void
  onClientLogin: () => void
  onViewResponses: () => void
}

export function QuoteConfirmation({
  selectedWorkshops,
  clientEmail,
  quoteRequestId,
  onNewRequest,
  onClientLogin,
  onViewResponses
}: QuoteConfirmationProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Success Header */}
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl animate-bounce-slow">
              <CheckCircle className="h-14 w-14 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-4xl md:text-5xl mb-4 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Pedido Enviado com Sucesso!
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          O seu pedido foi enviado para <span className="font-bold text-blue-600">{selectedWorkshops.length} oficina(s)</span>.
          <br />
          <span className="text-base text-gray-500 mt-2 inline-block">
            Receberá as respostas no e-mail: <span className="font-semibold text-gray-700">{clientEmail}</span>
          </span>
        </p>
      </div>

      {/* What Happens Next */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-3 text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            <Clock className="h-6 w-6 text-blue-600" />
            O que acontece agora?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-blue-100">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">As oficinas irão analisar</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  As {selectedWorkshops.length} oficinas selecionadas receberão o seu pedido e irão analisar os detalhes para validar ou retificar o orçamento.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-orange-100">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Receberá as respostas</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Será notificado por e-mail quando as oficinas responderem. Normalmente recebe respostas em 2-4 horas.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-100">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white font-bold">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Escolha e agende</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Compare as respostas, escolha a melhor oficina e agende diretamente através da plataforma.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Workshops */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
          Oficinas Selecionadas
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {selectedWorkshops.map((workshop) => (
            <Card key={workshop.workshopId} className="bg-white/90 backdrop-blur-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {workshop.workshopLogoUrl ? (
                    <img 
                      src={workshop.workshopLogoUrl} 
                      alt={workshop.workshopName}
                      className="h-12 w-12 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{workshop.workshopName}</h4>
                    <p className="text-xs text-gray-500 truncate">{workshop.workshopAddress}</p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Notification Card */}
      <Card className="max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 shadow-xl">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Quer acompanhar em tempo real?
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm mb-4">
                Crie uma conta gratuita para acompanhar o status do seu pedido, ver as respostas das oficinas e agendar diretamente através da plataforma.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={onClientLogin}
                  variant="default"
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg font-semibold"
                >
                  Criar Conta Grátis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  onClick={onClientLogin}
                  variant="outline"
                  size="sm"
                  className="border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-purple-700 font-semibold"
                >
                  Iniciar Sessão
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button 
          onClick={onNewRequest}
          variant="outline"
          size="lg"
          className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-semibold"
        >
          Fazer Novo Pedido
        </Button>
        <Button 
          onClick={onViewResponses}
          variant="default"
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white border-0 shadow-lg font-semibold"
        >
          Ver Respostas
        </Button>
      </div>
    </div>
  )
}