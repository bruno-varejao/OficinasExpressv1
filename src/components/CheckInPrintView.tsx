import { forwardRef } from 'react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface CheckInItem {
  name: string
  checked: boolean
}

interface CheckIn {
  id: string
  workshopId: string
  clientId: string
  vehicleId: string
  driverName: string
  driverCPF?: string
  driverRG?: string
  driverCNH?: string
  driverCategory?: string
  driverCNHIssue?: string
  driverCNHExpiry?: string
  driverAddress?: string
  driverPhone?: string
  entryDate: string
  exitDate?: string
  entryOdometer: number
  exitOdometer?: number
  entryFuelLevel: number
  exitFuelLevel?: number
  checklistEntry: CheckInItem[]
  checklistExit?: CheckInItem[]
  damages?: string
  observations?: string
  status: 'in-progress' | 'completed'
  createdAt: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  nif?: string
  address?: string
}

interface Vehicle {
  id: string
  clientId: string
  plate: string
  brand: string
  model: string
  year: number
  color?: string
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

interface CheckInPrintViewProps {
  checkIn: CheckIn
  client?: Client
  vehicle?: Vehicle
  workshop?: Workshop | null
}

export const CheckInPrintView = forwardRef<HTMLDivElement, CheckInPrintViewProps>(
  ({ checkIn, client, vehicle, workshop }, ref) => {
    const fuelLevelToGauge = (level: number) => {
      // Convert 0-100 to gauge rotation (0deg = empty, 180deg = full)
      const rotation = (level / 100) * 180
      return rotation
    }

    return (
      <div ref={ref} className="print-content p-6 bg-white text-black mx-auto">
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              
              body * {
                visibility: hidden;
              }
              
              .print-content, .print-content * {
                visibility: visible;
              }
              
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 210mm;
                max-width: 210mm;
                padding: 0 !important;
                margin: 0 !important;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
            }
            
            @media screen {
              .print-content {
                max-width: 210mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
          `}
        </style>

        {/* Header */}
        <div className="border-2 border-black mb-2">
          <div className="grid grid-cols-2 border-b-2 border-black">
            <div className="border-r-2 border-black p-4 flex items-center justify-center min-h-[80px]">
              {workshop?.logoUrl ? (
                <ImageWithFallback
                  src={workshop.logoUrl}
                  alt={workshop.name}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <p className="text-sm">SEU LOGO AQUI</p>
              )}
            </div>
            <div className="p-4 flex items-center justify-center">
              <div className="text-center text-xs">
                <p className="mb-1">{workshop?.name || 'DADOS DA SUA EMPRESA AQUI'}</p>
                {workshop?.address && <p className="mb-1">{workshop.address}</p>}
                {workshop?.phone && <p className="mb-1">Tel: {workshop.phone}</p>}
                {workshop?.email && <p className="mb-1">Email: {workshop.email}</p>}
                {workshop?.nif && <p>NIF: {workshop.nif}</p>}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-200 text-center py-1 border-b-2 border-black">
            <p className="text-xs" style={{ fontWeight: 600 }}>CHECKLIST DE VEÍCULO - ENTRADA / SAÍDA</p>
          </div>

          {/* Dados do Veículo */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 px-2 py-1 border-b border-black">
              <p className="text-xs" style={{ fontWeight: 600 }}>Dados do Veículo</p>
            </div>
            <div className="grid grid-cols-2 text-xs">
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Veículo:</span> {vehicle ? `${vehicle.brand} ${vehicle.model}` : '-'}
              </div>
              <div className="p-2">
                <span style={{ fontWeight: 600 }}>Matrícula:</span> {vehicle?.plate || '-'}
              </div>
            </div>
            <div className="grid grid-cols-2 text-xs border-t border-black">
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Cor:</span> {vehicle?.color || '-'}
              </div>
              <div className="p-2">
                <span style={{ fontWeight: 600 }}>Ano:</span> {vehicle?.year || '-'}
              </div>
            </div>
          </div>

          {/* Dados do Condutor */}
          <div className="border-b-2 border-black">
            <div className="bg-gray-100 px-2 py-1 border-b border-black">
              <p className="text-xs" style={{ fontWeight: 600 }}>Dados do Condutor</p>
            </div>
            <div className="grid grid-cols-3 text-xs">
              <div className="col-span-2 border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Nome completo:</span> {checkIn.driverName}
              </div>
              <div className="p-2">
                <span style={{ fontWeight: 600 }}>NIF:</span> {checkIn.driverCPF || '-'}
              </div>
            </div>
            <div className="grid grid-cols-4 text-xs border-t border-black">
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>CC/BI:</span> {checkIn.driverRG || '-'}
              </div>
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Carta de Condução:</span> {checkIn.driverCNH || '-'}
              </div>
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Categoria:</span> {checkIn.driverCategory || '-'}
              </div>
              <div className="p-2">
                <span style={{ fontWeight: 600 }}>Data emissão:</span> {checkIn.driverCNHIssue ? new Date(checkIn.driverCNHIssue).toLocaleDateString('pt-PT') : '-'}
              </div>
            </div>
            <div className="grid grid-cols-2 text-xs border-t border-black">
              <div className="border-r border-black p-2">
                <span style={{ fontWeight: 600 }}>Data de validade:</span> {checkIn.driverCNHExpiry ? new Date(checkIn.driverCNHExpiry).toLocaleDateString('pt-PT') : '-'}
              </div>
              <div className="p-2">
                <span style={{ fontWeight: 600 }}>Telefone:</span> {checkIn.driverPhone || '-'}
              </div>
            </div>
            <div className="text-xs border-t border-black p-2">
              <span style={{ fontWeight: 600 }}>Morada completa:</span> {checkIn.driverAddress || '-'}
            </div>
          </div>

          {/* Checklist e Entrada/Saída */}
          <div className="grid grid-cols-3 border-b-2 border-black">
            {/* Checklist Left */}
            <div className="border-r-2 border-black">
              <div className="bg-gray-100 px-2 py-1 border-b border-black text-center">
                <p className="text-xs" style={{ fontWeight: 600 }}>Marcar X nos itens que apresentaram problemas</p>
              </div>
              <div className="text-xs">
                {checkIn.checklistEntry.slice(0, Math.ceil(checkIn.checklistEntry.length / 2)).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-1 border-b border-gray-300">
                    <div className="w-4 h-4 border border-black flex items-center justify-center flex-shrink-0">
                      {item.checked && <span>✓</span>}
                    </div>
                    <span className="text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist Right */}
            <div className="border-r-2 border-black">
              <div className="bg-gray-100 px-2 py-1 border-b border-black">
                <p className="text-xs">&nbsp;</p>
              </div>
              <div className="text-xs">
                {checkIn.checklistEntry.slice(Math.ceil(checkIn.checklistEntry.length / 2)).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-1 border-b border-gray-300">
                    <div className="w-4 h-4 border border-black flex items-center justify-center flex-shrink-0">
                      {item.checked && <span>✓</span>}
                    </div>
                    <span className="text-xs">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Entrada/Saída */}
            <div>
              <div className="bg-gray-100 px-2 py-1 border-b border-black text-center">
                <p className="text-xs" style={{ fontWeight: 600 }}>Saída / Entrada</p>
              </div>
              
              {/* Data/Hora */}
              <div className="border-b border-black">
                <div className="grid grid-cols-2 text-xs">
                  <div className="border-r border-black p-2 text-center">
                    <p style={{ fontWeight: 600 }}>Data/Hora Entrada:</p>
                  </div>
                  <div className="p-2 text-center">
                    <p style={{ fontWeight: 600 }}>Data/Hora Saída:</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 text-xs border-t border-black">
                  <div className="border-r border-black p-2 text-center">
                    {new Date(checkIn.entryDate).toLocaleDateString('pt-PT')}
                  </div>
                  <div className="p-2 text-center">
                    {checkIn.exitDate ? new Date(checkIn.exitDate).toLocaleDateString('pt-PT') : '-'}
                  </div>
                </div>
              </div>

              {/* Quilometragem */}
              <div className="border-b border-black">
                <div className="bg-gray-200 px-2 py-1 text-center">
                  <p className="text-xs" style={{ fontWeight: 600 }}>Quilometragem</p>
                </div>
                <div className="grid grid-cols-2 text-xs">
                  <div className="border-r border-black p-2 text-center">
                    <p style={{ fontWeight: 600 }}>Entrada KM:</p>
                    <p>{checkIn.entryOdometer}</p>
                  </div>
                  <div className="p-2 text-center">
                    <p style={{ fontWeight: 600 }}>Saída KM:</p>
                    <p>{checkIn.exitOdometer || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Combustível */}
              <div className="border-b border-black">
                <div className="bg-gray-200 px-2 py-1 text-center">
                  <p className="text-xs" style={{ fontWeight: 600 }}>Indicar nível de combustível</p>
                </div>
                <div className="grid grid-cols-2 text-xs">
                  <div className="border-r border-black p-2">
                    <p className="text-center mb-2" style={{ fontWeight: 600 }}>Entrada</p>
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <svg viewBox="0 0 100 60" className="w-full h-full">
                          {/* Background arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#ddd"
                            strokeWidth="8"
                          />
                          {/* Fuel level arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="8"
                            strokeDasharray={`${(checkIn.entryFuelLevel / 100) * 126} 126`}
                          />
                          {/* Labels */}
                          <text x="10" y="55" fontSize="8" fill="black">E</text>
                          <text x="85" y="55" fontSize="8" fill="black">C</text>
                          <text x="45" y="45" fontSize="10" fill="black" fontWeight="600">{checkIn.entryFuelLevel}%</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-center mb-2" style={{ fontWeight: 600 }}>Saída</p>
                    <div className="flex justify-center">
                      <div className="relative w-16 h-16">
                        <svg viewBox="0 0 100 60" className="w-full h-full">
                          {/* Background arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#ddd"
                            strokeWidth="8"
                          />
                          {/* Fuel level arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="8"
                            strokeDasharray={`${((checkIn.exitFuelLevel || 0) / 100) * 126} 126`}
                          />
                          {/* Labels */}
                          <text x="10" y="55" fontSize="8" fill="black">E</text>
                          <text x="85" y="55" fontSize="8" fill="black">C</text>
                          <text x="45" y="45" fontSize="10" fill="black" fontWeight="600">{checkIn.exitFuelLevel || 0}%</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Diagram */}
              <div className="p-2">
                <div className="bg-gray-200 px-2 py-1 text-center mb-2">
                  <p className="text-xs" style={{ fontWeight: 600 }}>Circule a área com danos ou avarias</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Front */}
                  <div className="border border-black p-2">
                    <svg viewBox="0 0 100 60" className="w-full">
                      <rect x="20" y="5" width="60" height="40" fill="none" stroke="black" strokeWidth="2" />
                      <rect x="25" y="10" width="20" height="15" fill="none" stroke="black" strokeWidth="1" />
                      <rect x="55" y="10" width="20" height="15" fill="none" stroke="black" strokeWidth="1" />
                      <rect x="35" y="40" width="30" height="5" fill="none" stroke="black" strokeWidth="1" />
                    </svg>
                  </div>
                  {/* Back */}
                  <div className="border border-black p-2">
                    <svg viewBox="0 0 100 60" className="w-full">
                      <rect x="20" y="5" width="60" height="40" fill="none" stroke="black" strokeWidth="2" />
                      <rect x="25" y="30" width="20" height="10" fill="none" stroke="black" strokeWidth="1" />
                      <rect x="55" y="30" width="20" height="10" fill="none" stroke="black" strokeWidth="1" />
                    </svg>
                  </div>
                  {/* Top */}
                  <div className="border border-black p-2">
                    <svg viewBox="0 0 100 100" className="w-full">
                      <ellipse cx="50" cy="50" rx="30" ry="45" fill="none" stroke="black" strokeWidth="2" />
                      <rect x="35" y="20" width="30" height="25" fill="none" stroke="black" strokeWidth="1" />
                      <rect x="35" y="55" width="30" height="25" fill="none" stroke="black" strokeWidth="1" />
                    </svg>
                  </div>
                  {/* Side */}
                  <div className="border border-black p-2">
                    <svg viewBox="0 0 100 60" className="w-full">
                      <path d="M 10 40 L 20 30 L 40 30 L 45 20 L 70 20 L 75 30 L 90 30 L 90 40 Z" fill="none" stroke="black" strokeWidth="2" />
                      <circle cx="25" cy="40" r="6" fill="none" stroke="black" strokeWidth="2" />
                      <circle cx="75" cy="40" r="6" fill="none" stroke="black" strokeWidth="2" />
                      <rect x="30" y="22" width="20" height="10" fill="none" stroke="black" strokeWidth="1" />
                      <rect x="52" y="22" width="15" height="10" fill="none" stroke="black" strokeWidth="1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <div className="bg-gray-100 px-2 py-1 border-b border-black">
              <p className="text-xs" style={{ fontWeight: 600 }}>Observações:</p>
            </div>
            <div className="p-2 min-h-[60px] text-xs">
              {checkIn.observations || ''}
            </div>
            {checkIn.damages && (
              <>
                <div className="bg-gray-100 px-2 py-1 border-t border-b border-black">
                  <p className="text-xs" style={{ fontWeight: 600 }}>Danos / Avarias:</p>
                </div>
                <div className="p-2 min-h-[40px] text-xs">
                  {checkIn.damages}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-8 text-xs">
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p style={{ fontWeight: 600 }}>Assinatura do Cliente</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-black pt-2">
              <p style={{ fontWeight: 600 }}>Assinatura do Responsável</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

CheckInPrintView.displayName = 'CheckInPrintView'
