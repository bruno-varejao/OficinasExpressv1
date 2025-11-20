import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { QrCode, Download, Printer, Share2, Copy, Check } from 'lucide-react'
import { QRCodeGenerator } from '../../utils/qrcode/QRCodeGenerator'
import { toast } from 'sonner@2.0.3'

interface QRCodeCardProps {
  type: 'client' | 'vehicle' | 'workorder' | 'appointment' | 'invoice'
  id: string
  workshopId: string
  title: string
  description?: string
  className?: string
}

/**
 * Componente para exibir e gerenciar QR Codes
 * Permite download, impressão e partilha
 */
export function QRCodeCard({ 
  type, 
  id, 
  workshopId, 
  title, 
  description,
  className = ''
}: QRCodeCardProps) {
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQR()
  }, [type, id, workshopId])

  const generateQR = async () => {
    setLoading(true)
    try {
      let qr = ''
      switch (type) {
        case 'client':
          qr = await QRCodeGenerator.generateClientQR(id, workshopId)
          break
        case 'vehicle':
          qr = await QRCodeGenerator.generateVehicleQR(id, workshopId)
          break
        case 'workorder':
          qr = await QRCodeGenerator.generateWorkOrderQR(id, workshopId)
          break
        case 'appointment':
          qr = await QRCodeGenerator.generateAppointmentQR(id, workshopId)
          break
      }
      setQrCode(qr)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Erro ao gerar QR Code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    QRCodeGenerator.downloadQRCode(qrCode, `qr-${type}-${id}`)
    toast.success('QR Code transferido!', {
      description: 'O ficheiro foi guardado nos seus downloads'
    })
  }

  const handlePrint = () => {
    QRCodeGenerator.printQRCode(qrCode, title)
    toast.success('A imprimir QR Code...')
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/qr/${type}/${id}?w=${workshopId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || 'Acesso rápido via QR Code',
          url: url
        })
        toast.success('Partilhado com sucesso!')
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: copiar link
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Link copiado!', {
        description: 'Cole o link onde quiser partilhar'
      })
    }
  }

  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/qr/${type}/${id}?w=${workshopId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copiado!')
  }

  return (
    <Card className={`border-2 border-blue-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <QrCode className="h-5 w-5 text-blue-600" />
          QR Code de Acesso Rápido
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {loading ? (
            <div className="w-64 h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          ) : (
            <div className="relative group">
              <img 
                src={qrCode} 
                alt={`QR Code - ${title}`}
                className="w-64 h-64 border-4 border-blue-100 rounded-lg shadow-lg transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-center">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-1">
            Escaneie para acesso instantâneo
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Transferir
          </Button>

          <Button 
            onClick={handlePrint}
            variant="outline"
            className="border-blue-200 hover:bg-blue-50"
            disabled={loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>

          <Button 
            onClick={handleShare}
            variant="outline"
            className="border-orange-200 hover:bg-orange-50"
            disabled={loading}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partilhar
          </Button>

          <Button 
            onClick={handleCopyUrl}
            variant="outline"
            className="border-orange-200 hover:bg-orange-50"
            disabled={loading}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Link
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-orange-50 p-4 rounded-lg border-2 border-blue-100">
          <p className="text-sm text-gray-700">
            <strong className="text-blue-600">💡 Como usar:</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 ml-4">
            <li>• Imprima e cole na documentação</li>
            <li>• Partilhe com o cliente por email/WhatsApp</li>
            <li>• Escaneie na receção para acesso rápido</li>
            <li>• Use no tablet/smartphone para check-in</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
