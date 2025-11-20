import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Search, User, Mail, Phone, Calendar, FileText, CheckCircle2 } from 'lucide-react'

interface PlatformClient {
  clientName: string
  clientEmail: string
  clientPhone?: string
  licensePlate?: string
  location?: string
  serviceName?: string
  notes?: string
  createdAt: string
  quoteRequestId: string
  status: string
  selectedWorkshopName?: string
}

interface PlatformClientsModuleProps {
  accessToken: string
}

export function PlatformClientsModule({ accessToken }: PlatformClientsModuleProps) {
  const [clients, setClients] = useState<PlatformClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      console.log('📡 Fetching platform requests...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/platform-clients`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Platform requests fetched:', data.clients?.length || 0)
        setClients(data.clients || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Error fetching platform requests:', errorText)
        toast.error('Erro ao carregar pedidos da plataforma')
      }
    } catch (error: any) {
      console.error('❌ Error fetching platform requests:', error)
      toast.error('Erro ao carregar pedidos da plataforma')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client => {
    if (!searchFilter.trim()) return true
    const searchLower = searchFilter.toLowerCase()
    return (
      client.clientName?.toLowerCase().includes(searchLower) ||
      client.clientEmail?.toLowerCase().includes(searchLower) ||
      client.clientPhone?.toLowerCase().includes(searchLower) ||
      client.licensePlate?.toLowerCase().includes(searchLower) ||
      client.location?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
      case 'quoted':
        return <Badge variant="default">Orçamentado</Badge>
      case 'accepted':
      case 'approved':
        return <Badge className="bg-green-500">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pedidos da Plataforma Online</CardTitle>
          <CardDescription>
            Pedidos de orçamento solicitados através do portal público
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, email, telefone, matrícula..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {searchFilter && (
              <Badge variant="secondary">
                {filteredClients.length} resultado{filteredClients.length !== 1 ? 's' : ''}
              </Badge>
            )}

            <Button onClick={fetchClients} variant="outline">
              🔄 Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              A carregar pedidos...
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum pedido encontrado</p>
              <p className="text-sm mt-2">
                Pedidos de orçamento solicitados através da plataforma pública aparecerão aqui
              </p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum resultado encontrado para "{searchFilter}"
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Localidade</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Oficina Escolhida</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client, index) => (
                    <TableRow key={client.quoteRequestId || index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{client.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a 
                              href={`mailto:${client.clientEmail}`}
                              className="hover:underline text-blue-600"
                            >
                              {client.clientEmail}
                            </a>
                          </div>
                          {client.clientPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a 
                                href={`tel:${client.clientPhone}`}
                                className="hover:underline"
                              >
                                {client.clientPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.licensePlate ? (
                          <Badge variant="outline" className="font-mono">
                            {client.licensePlate}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{client.location || '-'}</TableCell>
                      <TableCell>{client.serviceName || '-'}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        {(client.status === 'accepted' || client.status === 'approved') && client.selectedWorkshopName ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{client.selectedWorkshopName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {new Date(client.createdAt).toLocaleDateString('pt-PT')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.notes ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground max-w-[200px]">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate" title={client.notes}>
                              {client.notes}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filteredClients.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Total: {filteredClients.length} pedido{filteredClients.length !== 1 ? 's' : ''}
              {searchFilter && ` de ${clients.length}`}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
