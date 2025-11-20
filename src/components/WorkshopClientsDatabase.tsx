import { useState, useEffect, Fragment } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from './ui/pagination'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Search, Users, Building2, RefreshCw, AlertCircle, Database, Eye, Mail, Phone, MapPin, Calendar, Percent } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'

interface WorkshopClientsProps {
  accessToken: string
}

interface ClientWithWorkshops {
  nif: string
  names: string[]
  emails: string[]
  phones: string[]
  addresses: string[]
  postalCodes: string[]
  localities: string[]
  countries: string[]
  clientNumbers: string[]
  cardNumbers: string[]
  discounts: number[]
  creditDays: number[]
  vatRegimes: string[]
  workshops: Array<{
    id: string
    name: string
    clientId: string
    clientName: string
    clientData: {
      email1?: string
      email2?: string
      phone1?: string
      phone2?: string
      phone3?: string
      address?: string
      cp4?: string
      cp3?: string
      postalCode?: string
      locality?: string
      country?: string
      clientNumber?: string
      cardNumber?: string
      discount?: number
      creditDays?: number
      vatRegime?: string
      email1Active?: boolean
      email2Active?: boolean
      phone1Active?: boolean
      phone2Active?: boolean
      phone3Active?: boolean
    }
    createdAt: string
  }>
  totalOccurrences: number
}

const CLIENTS_PER_PAGE = 10

export function WorkshopClientsDatabase({ accessToken }: WorkshopClientsProps) {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientWithWorkshops[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [expandedNIF, setExpandedNIF] = useState<string | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientWithWorkshops | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchAllClients()
  }, [])

  const fetchAllClients = async () => {
    try {
      setLoading(true)
      console.log('🔍 A buscar todos os clientes de todas as oficinas...')

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshop-clients-database`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao buscar clientes')
      }

      const data = await response.json()
      console.log('✅ Clientes carregados:', data.clientsByNIF.length)
      setClients(data.clientsByNIF || [])
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error)
      toast.error('Erro ao carregar base de dados de clientes')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    if (!searchFilter.trim()) return true
    const searchLower = searchFilter.toLowerCase()
    
    return (
      client.nif?.toLowerCase().includes(searchLower) ||
      client.names.some(name => name?.toLowerCase().includes(searchLower)) ||
      client.emails.some(email => email?.toLowerCase().includes(searchLower)) ||
      client.workshops.some(w => w.name?.toLowerCase().includes(searchLower))
    )
  })

  const duplicatedClients = clients.filter(c => c.totalOccurrences > 1)
  const uniqueClients = clients.filter(c => c.totalOccurrences === 1)

  // Paginação
  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE)
  const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE
  const endIndex = startIndex + CLIENTS_PER_PAGE
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  // Resetar para página 1 quando o filtro mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Base de Dados de Clientes das Oficinas
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Visualização agregada de todos os clientes por NIF com indicação de oficinas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchAllClients}
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de NIFs</p>
                <p className="text-2xl font-bold text-blue-600">{clients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Database className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">NIFs Duplicados</p>
                <p className="text-2xl font-bold text-orange-600">{duplicatedClients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-500 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">NIFs Únicos</p>
                <p className="text-2xl font-bold text-green-600">{uniqueClients.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Pesquisar por NIF, nome, email ou oficina..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-10 border-blue-200 focus:border-blue-400"
          />
        </div>
        {searchFilter && (
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {filteredClients.length} resultado(s)
            </Badge>
            {totalPages > 1 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0">
                Página {currentPage} de {totalPages}
              </Badge>
            )}
          </div>
        )}
        {!searchFilter && totalPages > 1 && (
          <Badge className="bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0">
            Página {currentPage} de {totalPages}
          </Badge>
        )}
      </div>

      {/* Info Alert */}
      {duplicatedClients.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{duplicatedClients.length} NIF(s)</strong> estão registados em múltiplas oficinas. 
            Clique numa linha para ver detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar base de dados...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="inline-block h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-600">
            {searchFilter ? 'Nenhum cliente encontrado com esse critério' : 'Nenhum cliente na base de dados'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-blue-100 overflow-hidden bg-white/60 backdrop-blur-xl shadow-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200">
                <TableHead className="font-bold text-blue-900 w-12"></TableHead>
                <TableHead className="font-bold text-blue-900">NIF</TableHead>
                <TableHead className="font-bold text-blue-900">Nome(s)</TableHead>
                <TableHead className="font-bold text-blue-900">Email(s)</TableHead>
                <TableHead className="font-bold text-blue-900">Telefone(s)</TableHead>
                <TableHead className="font-bold text-blue-900">Nº Oficinas</TableHead>
                <TableHead className="font-bold text-blue-900">Oficinas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedClients.map((client, index) => (
                <Fragment key={`${client.nif || 'no-nif'}-${startIndex + index}`}>
                  <TableRow 
                    className={`hover:bg-blue-50/50 transition-colors border-b border-blue-100 ${
                      client.totalOccurrences > 1 ? 'bg-orange-50/30' : ''
                    } ${expandedNIF === client.nif ? 'bg-blue-100/50' : ''}`}
                  >
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClient(client)
                          setViewDialogOpen(true)
                        }}
                        className="h-8 w-8 p-0 hover:bg-blue-100"
                        title="Ver dados completos"
                      >
                        <Eye className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <code className="text-xs bg-gradient-to-r from-blue-100 to-orange-100 px-2 py-1 rounded-lg font-mono border border-blue-200">
                        {client.nif || 'Sem NIF'}
                      </code>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-800 truncate">
                          {client.names[0] || 'N/A'}
                        </p>
                        {client.names.length > 1 && (
                          <p className="text-xs text-gray-500">+{client.names.length - 1} variação(ões)</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-700 truncate">
                          {client.emails[0] || 'N/A'}
                        </p>
                        {client.emails.length > 1 && (
                          <p className="text-xs text-gray-500">+{client.emails.length - 1} email(s)</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-700 truncate">
                          {client.phones[0] || 'N/A'}
                        </p>
                        {client.phones.length > 1 && (
                          <p className="text-xs text-gray-500">+{client.phones.length - 1} telefone(s)</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <Badge 
                        className={
                          client.totalOccurrences > 1 
                            ? 'bg-orange-500 text-white border-0' 
                            : 'bg-green-500 text-white border-0'
                        }
                      >
                        {client.totalOccurrences}
                      </Badge>
                    </TableCell>
                    <TableCell 
                      onClick={() => setExpandedNIF(expandedNIF === client.nif ? null : client.nif)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {client.workshops.slice(0, 2).map((workshop) => (
                          <Badge 
                            key={workshop.clientId} 
                            variant="outline"
                            className="border-blue-300 text-blue-700 bg-blue-50"
                          >
                            {workshop.name}
                          </Badge>
                        ))}
                        {client.workshops.length > 2 && (
                          <Badge 
                            variant="outline"
                            className="border-gray-300 text-gray-600"
                          >
                            +{client.workshops.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Details */}
                  {expandedNIF === client.nif && (
                    <TableRow className="bg-blue-50/50 border-b-2 border-blue-200">
                      <TableCell colSpan={7}>
                        <div className="p-4 space-y-4">
                          <h4 className="font-bold text-blue-900 mb-3">
                            Detalhes das Ocorrências em Oficinas
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {client.workshops.map((workshop) => (
                              <Card key={workshop.clientId} className="border-blue-200 bg-white">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-5 w-5 text-blue-600" />
                                      <CardTitle className="text-base">{workshop.name}</CardTitle>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                      ID: {workshop.clientId.substring(0, 8)}...
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-xs mt-2">
                                    Registado em: {new Date(workshop.createdAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-sm text-gray-700">
                                    <strong>Nome:</strong> {workshop.clientName}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50/30 to-orange-50/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  A mostrar <span className="font-semibold text-blue-700">{startIndex + 1}</span> a{' '}
                  <span className="font-semibold text-blue-700">{Math.min(endIndex, filteredClients.length)}</span> de{' '}
                  <span className="font-semibold text-blue-700">{filteredClients.length}</span> cliente{filteredClients.length !== 1 ? 's' : ''}
                </p>
                
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-100'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Mostrar sempre primeira, última, atual e adjacentes
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2
                      
                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      
                      if (!showPage) return null
                      
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className={currentPage === page 
                              ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white border-0' 
                              : 'hover:bg-blue-100 cursor-pointer'
                            }
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-100'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Visualização Completa */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Dados Completos do Cliente
            </DialogTitle>
            <DialogDescription>
              Visualização detalhada de todas as informações agregadas por NIF
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6 mt-4">
              {/* NIF Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">NIF</h3>
                </div>
                <code className="block text-sm bg-gradient-to-r from-blue-100 to-orange-100 px-4 py-2 rounded-lg font-mono border border-blue-200">
                  {selectedClient.nif || 'Sem NIF'}
                </code>
              </div>

              <Separator />

              {/* Names Section */}
              {selectedClient.names.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Nome{selectedClient.names.length > 1 ? 's' : ''} ({selectedClient.names.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.names.map((name, idx) => (
                      <div 
                        key={`name-${idx}`}
                        className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200"
                      >
                        <p className="text-sm font-medium text-gray-800">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Emails Section */}
              {selectedClient.emails.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Email{selectedClient.emails.length > 1 ? 's' : ''} ({selectedClient.emails.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.emails.map((email, idx) => (
                      <div 
                        key={`email-${idx}`}
                        className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 flex items-center gap-2"
                      >
                        <Mail className="h-3 w-3 text-blue-600" />
                        <p className="text-sm text-gray-700">{email}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Phones Section */}
              {selectedClient.phones.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Telefone{selectedClient.phones.length > 1 ? 's' : ''} ({selectedClient.phones.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.phones.map((phone, idx) => (
                      <div 
                        key={`phone-${idx}`}
                        className="bg-green-50 px-4 py-2 rounded-lg border border-green-200 flex items-center gap-2"
                      >
                        <Phone className="h-3 w-3 text-green-600" />
                        <p className="text-sm text-gray-700">{phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Addresses Section */}
              {selectedClient.addresses.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Morada{selectedClient.addresses.length > 1 ? 's' : ''} ({selectedClient.addresses.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.addresses.map((address, idx) => (
                      <div 
                        key={`address-${idx}`}
                        className="bg-orange-50 px-4 py-2 rounded-lg border border-orange-200 flex items-center gap-2"
                      >
                        <MapPin className="h-3 w-3 text-orange-600" />
                        <p className="text-sm text-gray-700">{address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Postal Codes Section */}
              {selectedClient.postalCodes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-blue-900">
                      Código{selectedClient.postalCodes.length > 1 ? 's' : ''} Postal ({selectedClient.postalCodes.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.postalCodes.map((code, idx) => (
                      <div 
                        key={`postal-${idx}`}
                        className="bg-purple-50 px-4 py-2 rounded-lg border border-purple-200 flex items-center gap-2"
                      >
                        <p className="text-sm font-mono text-gray-700">{code}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.postalCodes.length > 0 && <Separator />}

              {/* Localities Section */}
              {selectedClient.localities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <h3 className="font-semibold text-blue-900">
                      Localidade{selectedClient.localities.length > 1 ? 's' : ''} ({selectedClient.localities.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.localities.map((locality, idx) => (
                      <div 
                        key={`locality-${idx}`}
                        className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200"
                      >
                        <p className="text-sm text-gray-700">{locality}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.localities.length > 0 && <Separator />}

              {/* Countries Section */}
              {selectedClient.countries.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    <h3 className="font-semibold text-blue-900">
                      País{selectedClient.countries.length > 1 ? 'es' : ''} ({selectedClient.countries.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.countries.map((country, idx) => (
                      <div 
                        key={`country-${idx}`}
                        className="bg-teal-50 px-4 py-2 rounded-lg border border-teal-200"
                      >
                        <p className="text-sm text-gray-700">{country}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.countries.length > 0 && <Separator />}

              {/* Client Numbers Section */}
              {selectedClient.clientNumbers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-cyan-600" />
                    <h3 className="font-semibold text-blue-900">
                      Número{selectedClient.clientNumbers.length > 1 ? 's' : ''} de Cliente ({selectedClient.clientNumbers.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.clientNumbers.map((num, idx) => (
                      <div 
                        key={`client-num-${idx}`}
                        className="bg-cyan-50 px-4 py-2 rounded-lg border border-cyan-200"
                      >
                        <p className="text-sm font-mono text-gray-700">{num}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.clientNumbers.length > 0 && <Separator />}

              {/* Card Numbers Section */}
              {selectedClient.cardNumbers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-pink-600" />
                    <h3 className="font-semibold text-blue-900">
                      Número{selectedClient.cardNumbers.length > 1 ? 's' : ''} de Cartão ({selectedClient.cardNumbers.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.cardNumbers.map((num, idx) => (
                      <div 
                        key={`card-num-${idx}`}
                        className="bg-pink-50 px-4 py-2 rounded-lg border border-pink-200"
                      >
                        <p className="text-sm font-mono text-gray-700">{num}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.cardNumbers.length > 0 && <Separator />}

              {/* Discounts Section */}
              {selectedClient.discounts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-amber-600" />
                    <h3 className="font-semibold text-blue-900">
                      Desconto{selectedClient.discounts.length > 1 ? 's' : ''} ({selectedClient.discounts.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedClient.discounts.map((discount, idx) => (
                      <div 
                        key={`discount-${idx}`}
                        className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-200"
                      >
                        <p className="text-sm font-semibold text-amber-700">{discount}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.discounts.length > 0 && <Separator />}

              {/* Credit Days Section */}
              {selectedClient.creditDays.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-lime-600" />
                    <h3 className="font-semibold text-blue-900">
                      Dias de Crédito ({selectedClient.creditDays.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedClient.creditDays.map((days, idx) => (
                      <div 
                        key={`credit-${idx}`}
                        className="bg-lime-50 px-4 py-2 rounded-lg border border-lime-200"
                      >
                        <p className="text-sm font-semibold text-lime-700">{days} dias</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.creditDays.length > 0 && <Separator />}

              {/* VAT Regimes Section */}
              {selectedClient.vatRegimes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-violet-600" />
                    <h3 className="font-semibold text-blue-900">
                      Regime{selectedClient.vatRegimes.length > 1 ? 's' : ''} de IVA ({selectedClient.vatRegimes.length})
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {selectedClient.vatRegimes.map((regime, idx) => (
                      <div 
                        key={`vat-${idx}`}
                        className="bg-violet-50 px-4 py-2 rounded-lg border border-violet-200"
                      >
                        <p className="text-sm text-gray-700">{regime}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.vatRegimes.length > 0 && <Separator />}

              {/* Workshops Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">
                      Oficinas ({selectedClient.workshops.length})
                    </h3>
                  </div>
                  <Badge 
                    className={
                      selectedClient.totalOccurrences > 1 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-green-500 text-white'
                    }
                  >
                    {selectedClient.totalOccurrences} ocorrência{selectedClient.totalOccurrences > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedClient.workshops.map((workshop) => (
                    <Card key={workshop.clientId} className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-sm">{workshop.name}</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-xs mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(workshop.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs">
                          <p className="text-gray-600">Nome registado:</p>
                          <p className="font-medium text-gray-800">{workshop.clientName}</p>
                        </div>
                        
                        {workshop.clientData && (
                          <div className="space-y-2 pt-2 border-t border-blue-100">
                            {/* Emails */}
                            {(workshop.clientData.email1 || workshop.clientData.email2) && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Emails:</p>
                                {workshop.clientData.email1 && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                    <span className="text-gray-700">{workshop.clientData.email1}</span>
                                    {workshop.clientData.email1Active && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Ativo</Badge>
                                    )}
                                  </div>
                                )}
                                {workshop.clientData.email2 && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                    <span className="text-gray-700">{workshop.clientData.email2}</span>
                                    {workshop.clientData.email2Active && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Ativo</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Phones */}
                            {(workshop.clientData.phone1 || workshop.clientData.phone2 || workshop.clientData.phone3) && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Telefones:</p>
                                {workshop.clientData.phone1 && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Phone className="h-3 w-3 text-green-600" />
                                    <span className="text-gray-700">{workshop.clientData.phone1}</span>
                                    {workshop.clientData.phone1Active && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Ativo</Badge>
                                    )}
                                  </div>
                                )}
                                {workshop.clientData.phone2 && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Phone className="h-3 w-3 text-green-600" />
                                    <span className="text-gray-700">{workshop.clientData.phone2}</span>
                                    {workshop.clientData.phone2Active && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Ativo</Badge>
                                    )}
                                  </div>
                                )}
                                {workshop.clientData.phone3 && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-green-600" />
                                    <span className="text-gray-700">{workshop.clientData.phone3}</span>
                                    {workshop.clientData.phone3Active && (
                                      <Badge className="bg-green-500 text-white text-[10px] px-1 py-0">Ativo</Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Address */}
                            {workshop.clientData.address && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Morada:</p>
                                <div className="flex items-start gap-1">
                                  <MapPin className="h-3 w-3 text-orange-600 mt-0.5" />
                                  <span className="text-gray-700">{workshop.clientData.address}</span>
                                </div>
                              </div>
                            )}

                            {/* Postal Code & Locality */}
                            {((workshop.clientData.cp4 && workshop.clientData.cp3) || workshop.clientData.postalCode) && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Código Postal:</p>
                                <span className="text-gray-700 font-mono">
                                  {workshop.clientData.cp4 && workshop.clientData.cp3 
                                    ? `${workshop.clientData.cp4}-${workshop.clientData.cp3}` 
                                    : workshop.clientData.postalCode}
                                </span>
                              </div>
                            )}

                            {workshop.clientData.locality && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Localidade:</p>
                                <span className="text-gray-700">{workshop.clientData.locality}</span>
                              </div>
                            )}

                            {workshop.clientData.country && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">País:</p>
                                <span className="text-gray-700">{workshop.clientData.country}</span>
                              </div>
                            )}

                            {/* Financial Info */}
                            {(workshop.clientData.discount !== undefined && workshop.clientData.discount !== null) && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Desconto:</p>
                                <Badge className="bg-amber-100 text-amber-700 border-amber-300">
                                  {workshop.clientData.discount}%
                                </Badge>
                              </div>
                            )}

                            {(workshop.clientData.creditDays !== undefined && workshop.clientData.creditDays !== null) && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Dias de Crédito:</p>
                                <Badge className="bg-lime-100 text-lime-700 border-lime-300">
                                  {workshop.clientData.creditDays} dias
                                </Badge>
                              </div>
                            )}

                            {workshop.clientData.vatRegime && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Regime IVA:</p>
                                <Badge className="bg-violet-100 text-violet-700 border-violet-300">
                                  {workshop.clientData.vatRegime}
                                </Badge>
                              </div>
                            )}

                            {/* Client & Card Number */}
                            {workshop.clientData.clientNumber && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Nº Cliente:</p>
                                <code className="text-xs bg-cyan-100 px-2 py-0.5 rounded font-mono">
                                  {workshop.clientData.clientNumber}
                                </code>
                              </div>
                            )}

                            {workshop.clientData.cardNumber && (
                              <div className="text-xs">
                                <p className="text-gray-600 mb-1">Nº Cartão:</p>
                                <code className="text-xs bg-pink-100 px-2 py-0.5 rounded font-mono">
                                  {workshop.clientData.cardNumber}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs pt-2 border-t border-blue-100">
                          <p className="text-gray-600">ID Cliente:</p>
                          <code className="text-xs bg-blue-100 px-2 py-0.5 rounded font-mono">
                            {workshop.clientId.substring(0, 12)}...
                          </code>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
