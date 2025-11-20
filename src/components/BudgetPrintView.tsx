import { forwardRef } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface BudgetItem {
  partNumber: string
  description: string
  quantity: number
  price: number
}

interface Budget {
  id: string
  number: string
  clientId: string
  vehicleId: string
  items?: BudgetItem[]
  laborHours?: number
  laborRate?: number
  partsTotal?: number
  laborTotal?: number
  subtotal?: number
  tax?: number
  total?: number
  status: 'pending' | 'approved' | 'rejected' | 'canceled' | 'quoted'
  notes?: string
  createdAt: string
}

interface Workshop {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  nif?: string
  logoUrl?: string
  isActive: boolean
}

interface BudgetPrintViewProps {
  budget: Budget
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientNIF?: string
  vehicleInfo: string
  workshop?: Workshop | null
}

export const BudgetPrintView = forwardRef<HTMLDivElement, BudgetPrintViewProps>(
  ({ budget, clientName, clientEmail, clientPhone, clientNIF, vehicleInfo, workshop }, ref) => {
    return (
      <div ref={ref} className="print-content p-8 bg-white text-black mx-auto">
        <style>
          {`
            @media print {
              /* Configuração da página A4 */
              @page {
                size: A4 portrait;
                margin: 15mm 15mm 15mm 15mm;
              }
              
              /* Ocultar tudo exceto o conteúdo de impressão */
              body * {
                visibility: hidden;
              }
              
              .print-content, .print-content * {
                visibility: visible;
              }
              
              /* Posicionamento e dimensões para A4 */
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                max-width: 210mm;
                min-height: 297mm;
                padding: 0 !important;
                margin: 0 !important;
                box-sizing: border-box;
              }
              
              /* Evitar quebras de página indesejadas */
              .print-content h1,
              .print-content h2,
              .print-content h3 {
                page-break-after: avoid;
                break-after: avoid;
              }
              
              .print-content table {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              .print-content tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Tamanhos de fonte otimizados para impressão */
              html {
                font-size: 12pt;
              }
              
              /* Remover sombras e efeitos que não ficam bem em impressão */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            
            /* Estilos de visualização (antes de imprimir) */
            @media screen {
              .print-content {
                max-width: 210mm;
                min-height: 297mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
          `}
        </style>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl mb-2" style={{ fontWeight: 700 }}>
                {workshop?.name || 'OficinasExpress'}
              </h1>
              <div className="text-sm text-gray-600">
                {workshop?.address && <p>{workshop.address}</p>}
                {workshop?.phone && <p>Tel: {workshop.phone}</p>}
                {workshop?.email && <p>Email: {workshop.email}</p>}
                {workshop?.nif && <p>NIF: {workshop.nif}</p>}
                
                {/* Fallback para dados genéricos se não houver dados da oficina */}
                {!workshop && (
                  <>
                    <p>Rua da Oficina, 123</p>
                    <p>4000-000 Porto, Portugal</p>
                    <p>Tel: +351 220 000 000</p>
                    <p>Email: geral@oficinasexpress.pt</p>
                    <p>NIF: 123456789</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Logotipo da Oficina */}
            {workshop?.logoUrl && (
              <div className="flex-shrink-0">
                <ImageWithFallback
                  src={workshop.logoUrl}
                  alt={`Logotipo ${workshop.name}`}
                  className="h-20 w-auto object-contain"
                  style={{ maxWidth: '200px' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Document Info */}
        <div className="mb-8">
          <h2 className="text-2xl mb-4" style={{ fontWeight: 600 }}>Orçamento {budget.number}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Data:</p>
              <p style={{ fontWeight: 500 }}>{new Date(budget.createdAt).toLocaleDateString('pt-PT')}</p>
            </div>
            <div>
              <p className="text-gray-600">Estado:</p>
              <p style={{ fontWeight: 500 }}>
                {budget.status === 'approved' ? 'Aprovado' :
                 budget.status === 'rejected' ? 'Rejeitado' :
                 budget.status === 'quoted' ? 'Orçamentado' :
                 budget.status === 'canceled' ? 'Anulado' :
                 'Pendente'}
              </p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8 border-t pt-4">
          <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>Dados do Cliente</h3>
          <div className="text-sm">
            <p><span className="text-gray-600">Nome:</span> <span style={{ fontWeight: 500 }}>{clientName}</span></p>
            {clientNIF && <p><span className="text-gray-600">NIF:</span> <span style={{ fontWeight: 500 }}>{clientNIF}</span></p>}
            {clientEmail && <p><span className="text-gray-600">Email:</span> <span style={{ fontWeight: 500 }}>{clientEmail}</span></p>}
            {clientPhone && <p><span className="text-gray-600">Telefone:</span> <span style={{ fontWeight: 500 }}>{clientPhone}</span></p>}
          </div>
        </div>

        {/* Vehicle Info */}
        <div className="mb-8">
          <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>Veículo</h3>
          <p className="text-sm" style={{ fontWeight: 500 }}>{vehicleInfo}</p>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>Peças e Materiais</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">Ref.</th>
                <th className="text-left py-2 px-2">Descrição</th>
                <th className="text-right py-2 px-2">Qtd.</th>
                <th className="text-right py-2 px-2">Preço Unit.</th>
                <th className="text-right py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {(budget.items || []).map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 px-2">{item.partNumber || '-'}</td>
                  <td className="py-2 px-2">{item.description}</td>
                  <td className="text-right py-2 px-2">{item.quantity ?? 0}</td>
                  <td className="text-right py-2 px-2">€{(item.price ?? 0).toFixed(2)}</td>
                  <td className="text-right py-2 px-2">€{((item.quantity ?? 0) * (item.price ?? 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={4} className="text-right py-2 px-2" style={{ fontWeight: 600 }}>Subtotal Peças:</td>
                <td className="text-right py-2 px-2" style={{ fontWeight: 600 }}>€{(budget.partsTotal ?? 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Labor */}
        {(budget.laborHours ?? 0) > 0 && (
          <div className="mb-8">
            <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>Mão de Obra</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 px-2">Descrição</th>
                  <th className="text-right py-2 px-2">Horas</th>
                  <th className="text-right py-2 px-2">Taxa/Hora</th>
                  <th className="text-right py-2 px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 px-2">Mão de Obra</td>
                  <td className="text-right py-2 px-2">{budget.laborHours ?? 0}h</td>
                  <td className="text-right py-2 px-2">€{(budget.laborRate ?? 0).toFixed(2)}/h</td>
                  <td className="text-right py-2 px-2">€{(budget.laborTotal ?? 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Notes */}
        {budget.notes && (
          <div className="mb-8">
            <h3 className="text-lg mb-3" style={{ fontWeight: 600 }}>Observações</h3>
            <p className="text-sm whitespace-pre-wrap">{budget.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="border-t-2 pt-4">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 text-sm">
                <span>Subtotal:</span>
                <span>€{(budget.subtotal ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span>IVA (23%):</span>
                <span>€{(budget.tax ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 text-lg" style={{ fontWeight: 700 }}>
                <span>Total:</span>
                <span>€{(budget.total ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-xs text-gray-500 text-center">
          <p>Este orçamento é válido por 30 dias a partir da data de emissão.</p>
          <p className="mt-2">{workshop?.name || 'OficinasExpress'} - Todos os direitos reservados</p>
        </div>
      </div>
    )
  }
)

BudgetPrintView.displayName = 'BudgetPrintView'
