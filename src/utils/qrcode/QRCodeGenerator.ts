/**
 * Sistema de QR Codes Inteligente
 * Cada cliente/veículo/ordem tem QR code único para acesso rápido
 */

export interface QRCodeData {
  type: 'client' | 'vehicle' | 'workorder' | 'appointment' | 'invoice'
  id: string
  workshopId: string
  metadata?: Record<string, any>
}

export class QRCodeGenerator {
  private static baseUrl = window.location.origin

  /**
   * Gerar QR code para cliente
   */
  static async generateClientQR(clientId: string, workshopId: string): Promise<string> {
    const data: QRCodeData = {
      type: 'client',
      id: clientId,
      workshopId
    }
    
    const url = `${this.baseUrl}/qr/client/${clientId}?w=${workshopId}`
    return this.generateQRCode(url)
  }

  /**
   * Gerar QR code para veículo
   */
  static async generateVehicleQR(vehicleId: string, workshopId: string): Promise<string> {
    const url = `${this.baseUrl}/qr/vehicle/${vehicleId}?w=${workshopId}`
    return this.generateQRCode(url)
  }

  /**
   * Gerar QR code para ordem de trabalho
   */
  static async generateWorkOrderQR(workOrderId: string, workshopId: string): Promise<string> {
    const url = `${this.baseUrl}/qr/workorder/${workOrderId}?w=${workshopId}`
    return this.generateQRCode(url)
  }

  /**
   * Gerar QR code para agendamento
   */
  static async generateAppointmentQR(appointmentId: string, workshopId: string): Promise<string> {
    const url = `${this.baseUrl}/qr/appointment/${appointmentId}?w=${workshopId}`
    return this.generateQRCode(url)
  }

  /**
   * Gerar QR code genérico
   */
  private static async generateQRCode(data: string): Promise<string> {
    // Criar QR code usando canvas
    const canvas = document.createElement('canvas')
    const size = 300
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    
    // Usar biblioteca QR (simulação - em produção usar biblioteca real)
    // Por agora, gerar um placeholder
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, size, size)
    
    // Desenhar padrão QR simulado
    ctx.fillStyle = '#000000'
    const modules = 29 // QR version 2
    const moduleSize = size / modules
    
    // Cantos (posição markers)
    this.drawPositionMarker(ctx, 0, 0, moduleSize)
    this.drawPositionMarker(ctx, size - 7 * moduleSize, 0, moduleSize)
    this.drawPositionMarker(ctx, 0, size - 7 * moduleSize, moduleSize)
    
    // Padrão aleatório mas consistente baseado no data
    const hash = this.simpleHash(data)
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        if ((hash + i * j) % 3 === 0) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize - 1, moduleSize - 1)
        }
      }
    }
    
    // Adicionar logo no centro
    ctx.fillStyle = '#FFFFFF'
    const logoSize = size / 5
    const logoPos = (size - logoSize) / 2
    ctx.fillRect(logoPos, logoPos, logoSize, logoSize)
    
    // Texto no centro
    ctx.fillStyle = '#0D80DF'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('OficinasExpress', size / 2, size / 2)
    
    return canvas.toDataURL('image/png')
  }

  private static drawPositionMarker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    // Quadrado exterior
    ctx.fillRect(x, y, size * 7, size * 7)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x + size, y + size, size * 5, size * 5)
    ctx.fillStyle = '#000000'
    ctx.fillRect(x + size * 2, y + size * 2, size * 3, size * 3)
  }

  private static simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  /**
   * Decodificar QR code URL
   */
  static decodeQRUrl(url: string): QRCodeData | null {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      
      if (pathParts[1] !== 'qr') return null
      
      const type = pathParts[2] as QRCodeData['type']
      const id = pathParts[3]
      const workshopId = urlObj.searchParams.get('w') || ''
      
      return { type, id, workshopId }
    } catch {
      return null
    }
  }

  /**
   * Baixar QR code como imagem
   */
  static downloadQRCode(dataUrl: string, filename: string) {
    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = dataUrl
    link.click()
  }

  /**
   * Imprimir QR code
   */
  static printQRCode(dataUrl: string, title: string) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${title}</title>
          <style>
            body {
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 400px;
              border: 2px solid #0D80DF;
              border-radius: 8px;
              padding: 20px;
              background: white;
            }
            h1 {
              color: #0D80DF;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              margin-top: 10px;
            }
            @media print {
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <img src="${dataUrl}" alt="QR Code" />
          <p>Escaneie para acesso rápido</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}
