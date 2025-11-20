import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Car, Edit, UserPlus, X, History, Search } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'

interface CourtesyVehiclesModuleProps {
  accessToken: string
}

interface CourtesyVehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year: string
  color: string
  fuelType: string
  status: 'available' | 'in_use'
  notes: string
}

interface Assignment {
  id: string
  courtesyVehicleId: string
  clientId: string
  clientName: string
  startDate: string
  endDate: string | null
  notes: string
}

interface Client {
  id: string
  name: string
  nif: string
}

export default function CourtesyVehiclesModule({ accessToken }: CourtesyVehiclesModuleProps) {
  const [vehicles, setVehicles] = useState<CourtesyVehicle[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<CourtesyVehicle | null>(null)
  const [selectedVehicleForAssign, setSelectedVehicleForAssign] = useState<string | null>(null)
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  // Form states
  const [licensePlate, setLicensePlate] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [color, setColor] = useState('')
  const [fuelType, setFuelType] = useState('gasoline')
  const [notes, setNotes] = useState('')

  // Assignment form states
  const [selectedClientId, setSelectedClientId] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  useEffect(() => {
    loadVehicles()
    loadAssignments()
    loadClients()
  }, [])

  const loadVehicles = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-vehicles`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )
      if (!response.ok) throw new Error('Erro ao carregar veículos')
      const data = await response.json()
      setVehicles(data.vehicles || [])
    } catch (error) {
      console.error('Erro ao carregar veículos:', error)
      toast.error('Erro ao carregar veículos de cortesia')
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-assignments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )
      if (!response.ok) throw new Error('Erro ao carregar atribuições')
      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (error) {
      console.error('Erro ao carregar atribuições:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )
      if (!response.ok) throw new Error('Erro ao carregar clientes')
      const data = await response.json()
      setClients(data.clients || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const resetForm = () => {
    setLicensePlate('')
    setBrand('')
    setModel('')
    setYear('')
    setColor('')
    setFuelType('gasoline')
    setNotes('')
    setEditingVehicle(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!licensePlate || !brand || !model || !year) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const vehicleData = {
        licensePlate: licensePlate.toUpperCase(),
        brand,
        model,
        year,
        color,
        fuelType,
        notes,
        status: editingVehicle ? editingVehicle.status : 'available'
      }

      const url = editingVehicle
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-vehicles/${editingVehicle.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-vehicles`

      const method = editingVehicle ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(vehicleData)
      })

      if (!response.ok) throw new Error('Erro ao salvar veículo')

      toast.success(editingVehicle ? 'Veículo atualizado com sucesso' : 'Veículo criado com sucesso')
      setIsDialogOpen(false)
      resetForm()
      loadVehicles()
    } catch (error) {
      console.error('Erro ao salvar veículo:', error)
      toast.error('Erro ao salvar veículo')
    }
  }

  const handleEditVehicle = (vehicle: CourtesyVehicle) => {
    setEditingVehicle(vehicle)
    setLicensePlate(vehicle.licensePlate)
    setBrand(vehicle.brand)
    setModel(vehicle.model)
    setYear(vehicle.year)
    setColor(vehicle.color)
    setFuelType(vehicle.fuelType)
    setNotes(vehicle.notes)
    setIsDialogOpen(true)
  }

  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error('Selecione um cliente')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-assignments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            courtesyVehicleId: selectedVehicleForAssign,
            clientId: selectedClientId,
            notes: assignmentNotes
          })
        }
      )

      if (!response.ok) throw new Error('Erro ao atribuir veículo')

      toast.success('Veículo atribuído com sucesso')
      setIsAssignDialogOpen(false)
      setSelectedClientId('')
      setAssignmentNotes('')
      loadVehicles()
      loadAssignments()
    } catch (error) {
      console.error('Erro ao atribuir veículo:', error)
      toast.error('Erro ao atribuir veículo')
    }
  }

  const handleReturnVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/courtesy-assignments/return/${vehicleId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      )

      if (!response.ok) throw new Error('Erro ao devolver veículo')

      toast.success('Veículo devolvido com sucesso')
      loadVehicles()
      loadAssignments()
    } catch (error) {
      console.error('Erro ao devolver veículo:', error)
      toast.error('Erro ao devolver veículo')
    }
  }

  const openAssignDialog = (vehicleId: string) => {
    setSelectedVehicleForAssign(vehicleId)
    setIsAssignDialogOpen(true)
  }

  const openHistoryDialog = (vehicleId: string) => {
    setSelectedVehicleForHistory(vehicleId)
    setIsHistoryDialogOpen(true)
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? client.name : 'Cliente desconhecido'
  }

  const getCurrentAssignment = (vehicleId: string) => {
    return assignments.find(a => a.courtesyVehicleId === vehicleId && !a.endDate)
  }

  const getVehicleHistory = (vehicleId: string) => {
    return assignments
      .filter(a => a.courtesyVehicleId === vehicleId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
  }

  const filterVehicles = (vehiclesList: CourtesyVehicle[]) => {
    if (!searchFilter) return vehiclesList
    const search = searchFilter.toLowerCase()
    return vehiclesList.filter(v =>
      v.licensePlate.toLowerCase().includes(search) ||
      v.brand.toLowerCase().includes(search) ||
      v.model.toLowerCase().includes(search)
    )
  }

  const availableVehicles = filterVehicles(vehicles.filter(v => v.status === 'available'))
  const inUseVehicles = filterVehicles(vehicles.filter(v => v.status === 'in_use'))

  const renderVehiclesTable = (vehiclesList: CourtesyVehicle[]) => {
    if (vehiclesList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchFilter ? 'Nenhum veículo encontrado' : 'Nenhum veículo nesta categoria'}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matrícula</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Ano</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Combustível</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cliente Atual</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehiclesList.map((vehicle) => {
            const currentAssignment = getCurrentAssignment(vehicle.id)
            return (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div className="flex items-center">
                    <Car className="mr-2 h-4 w-4 text-muted-foreground" />
                    {vehicle.licensePlate}
                  </div>
                </TableCell>
                <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.color}</TableCell>
                <TableCell className="capitalize">
                  {vehicle.fuelType === 'gasoline' ? 'Gasolina' :
                   vehicle.fuelType === 'diesel' ? 'Diesel' :
                   vehicle.fuelType === 'electric' ? 'Elétrico' :
                   vehicle.fuelType === 'hybrid' ? 'Híbrido' : vehicle.fuelType}
                </TableCell>
                <TableCell>
                  <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                    {vehicle.status === 'available' ? 'Disponível' : 'Em Uso'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {currentAssignment ? getClientName(currentAssignment.clientId) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditVehicle(vehicle)}
                      title="Editar veículo"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openHistoryDialog(vehicle.id)}
                      title="Ver histórico"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    {vehicle.status === 'available' ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openAssignDialog(vehicle.id)}
                        title="Atribuir a cliente"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Atribuir
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturnVehicle(vehicle.id)}
                        title="Marcar como devolvido"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Devolver
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>Veículos de Cortesia</h2>
        <p className="text-muted-foreground">
          Gestão de veículos disponibilizados aos clientes durante reparações
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por matrícula, marca ou modelo..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo de Cortesia
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Editar Veículo de Cortesia' : 'Novo Veículo de Cortesia'}</DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Atualize as informações do veículo' : 'Adicione um novo veículo de cortesia'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">Matrícula *</Label>
                  <Input
                    id="licensePlate"
                    placeholder="00-AA-00"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Ano *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max="2100"
                    placeholder="2023"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    placeholder="Ex: Renault"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    placeholder="Ex: Clio"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    placeholder="Ex: Branco"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelType">Combustível</Label>
                  <Select value={fuelType} onValueChange={setFuelType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Elétrico</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas / Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o veículo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingVehicle ? 'Atualizar Veículo' : 'Criar Veículo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Veículos de Cortesia</CardTitle>
          <CardDescription>
            {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''} registado{vehicles.length !== 1 ? 's' : ''}
            {' • '}
            {availableVehicles.length} disponíve{availableVehicles.length !== 1 ? 'is' : 'l'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : (
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="available">
                  Disponíveis ({availableVehicles.length})
                </TabsTrigger>
                <TabsTrigger value="in_use">
                  Em Uso ({inUseVehicles.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                {renderVehiclesTable(availableVehicles)}
              </TabsContent>

              <TabsContent value="in_use">
                {renderVehiclesTable(inUseVehicles)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Assign Vehicle Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Veículo de Cortesia</DialogTitle>
            <DialogDescription>
              Selecione o cliente para atribuir o veículo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignVehicle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.nif})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignmentNotes">Notas</Label>
              <Textarea
                id="assignmentNotes"
                placeholder="Observações sobre a atribuição..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Atribuir Veículo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Atribuições</DialogTitle>
            <DialogDescription>
              Histórico de atribuições do veículo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedVehicleForHistory && getVehicleHistory(selectedVehicleForHistory).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Sem histórico de atribuições
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Devolução</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVehicleForHistory && getVehicleHistory(selectedVehicleForHistory).map((assignment) => {
                    const start = new Date(assignment.startDate)
                    const end = assignment.endDate ? new Date(assignment.endDate) : new Date()
                    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>{getClientName(assignment.clientId)}</TableCell>
                        <TableCell>{new Date(assignment.startDate).toLocaleDateString('pt-PT')}</TableCell>
                        <TableCell>
                          {assignment.endDate ? (
                            new Date(assignment.endDate).toLocaleDateString('pt-PT')
                          ) : (
                            <Badge variant="secondary">Em uso</Badge>
                          )}
                        </TableCell>
                        <TableCell>{duration} dia{duration !== 1 ? 's' : ''}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {assignment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
