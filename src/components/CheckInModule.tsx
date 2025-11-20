import { useState, useEffect, useRef } from 'react'
import { useWorkshop } from './WorkshopContext'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Checkbox } from './ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { ClipboardCheck, Plus, Printer, Search, Eye, Edit, CarFront } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { CheckInPrintView } from './CheckInPrintView'

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

const DEFAULT_CHECKLIST_ITEMS = [
  'Farol Esq.',
  'Pneu Diant. Esq.',
  'Pisca Esq.',
  'Luz Travão Esq.',
  'Luz Matrícula',
  'Ar condicionado',
  'Retrovisor Esq.',
  'Nível de Óleo Motor',
  'Limpa Para-brisas',
  'Nível Fluido de Travão',
  'Vidros Laterais',
  'Vidros Eléctricos',
  'Estofos Bancos',
  'Chave de Fendas',
  'Macaco',
  'Triângulo',
  'Bateria',
  'Documento do Veículo',
  'GPS',
  'Chave Ignição',
  'Limpeza Interior',
  'Farol Dir.',
  'Pneu Diant. Dir.',
  'Pisca Dir.',
  'Luz Travão Dir.',
  'Buzina',
  'Retrovisor Interno',
  'Retrovisor Dir.',
  'Nível Óleo Hidráulico',
  'Limpa Vidro Tras.',
  'Para-brisas Traseiro',
  'Para-brisas Dianteiro',
  'Rádio',
  'Tapetes',
  'Chave de Rodas',
  'Extintor',
  'Exterior',
  'Bom Estado Painel',
  'Manual do Veículo',
  'Cinto de Segurança',
  'Limpeza Exterior',
  'Outros'
]

interface CheckInModuleProps {
  accessToken: string
}

export function CheckInModule({ accessToken }: CheckInModuleProps) {
  const { workshop } = useWorkshop()
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null)
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  // Form states
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverCPF, setDriverCPF] = useState('')
  const [driverRG, setDriverRG] = useState('')
  const [driverCNH, setDriverCNH] = useState('')
  const [driverCategory, setDriverCategory] = useState('')
  const [driverCNHIssue, setDriverCNHIssue] = useState('')
  const [driverCNHExpiry, setDriverCNHExpiry] = useState('')
  const [driverAddress, setDriverAddress] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [exitDate, setExitDate] = useState('')
  const [entryOdometer, setEntryOdometer] = useState('')
  const [exitOdometer, setExitOdometer] = useState('')
  const [entryFuelLevel, setEntryFuelLevel] = useState('50')
  const [exitFuelLevel, setExitFuelLevel] = useState('50')
  const [checklistEntry, setChecklistEntry] = useState<CheckInItem[]>([])
  const [checklistExit, setChecklistExit] = useState<CheckInItem[]>([])
  const [damages, setDamages] = useState('')
  const [observations, setObservations] = useState('')
  const [status, setStatus] = useState<'in-progress' | 'completed'>('in-progress')

  useEffect(() => {
    if (workshop) {
      loadData()
    }
  }, [workshop])

  useEffect(() => {
    // Initialize checklist
    setChecklistEntry(DEFAULT_CHECKLIST_ITEMS.map(name => ({ name, checked: false })))
    setChecklistExit(DEFAULT_CHECKLIST_ITEMS.map(name => ({ name, checked: false })))
  }, [])

  const loadData = async () => {
    if (!workshop) return

    setLoading(true)
    try {
      const [checkInsRes, clientsRes, vehiclesRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/checkins`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ])

      if (checkInsRes.ok) {
        const data = await checkInsRes.json()
        setCheckIns(Array.isArray(data) ? data : data.checkIns || [])
      }

      if (clientsRes.ok) {
        const data = await clientsRes.json()
        console.log('📋 Clients data received:', data)
        setClients(Array.isArray(data) ? data : data.clients || [])
      }

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        console.log('🚗 Vehicles data received:', data)
        setVehicles(Array.isArray(data) ? data : data.vehicles || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedClientId('')
    setSelectedVehicleId('')
    setDriverName('')
    setDriverCPF('')
    setDriverRG('')
    setDriverCNH('')
    setDriverCategory('')
    setDriverCNHIssue('')
    setDriverCNHExpiry('')
    setDriverAddress('')
    setDriverPhone('')
    setEntryDate('')
    setExitDate('')
    setEntryOdometer('')
    setExitOdometer('')
    setEntryFuelLevel('50')
    setExitFuelLevel('50')
    setChecklistEntry(DEFAULT_CHECKLIST_ITEMS.map(name => ({ name, checked: false })))
    setChecklistExit(DEFAULT_CHECKLIST_ITEMS.map(name => ({ name, checked: false })))
    setDamages('')
    setObservations('')
    setStatus('in-progress')
    setEditingCheckIn(null)
  }

  const handleOpenDialog = (checkIn?: CheckIn) => {
    if (checkIn) {
      setEditingCheckIn(checkIn)
      setSelectedClientId(checkIn.clientId)
      setSelectedVehicleId(checkIn.vehicleId)
      setDriverName(checkIn.driverName)
      setDriverCPF(checkIn.driverCPF || '')
      setDriverRG(checkIn.driverRG || '')
      setDriverCNH(checkIn.driverCNH || '')
      setDriverCategory(checkIn.driverCategory || '')
      setDriverCNHIssue(checkIn.driverCNHIssue || '')
      setDriverCNHExpiry(checkIn.driverCNHExpiry || '')
      setDriverAddress(checkIn.driverAddress || '')
      setDriverPhone(checkIn.driverPhone || '')
      setEntryDate(checkIn.entryDate.split('T')[0])
      setExitDate(checkIn.exitDate ? checkIn.exitDate.split('T')[0] : '')
      setEntryOdometer(checkIn.entryOdometer.toString())
      setExitOdometer(checkIn.exitOdometer?.toString() || '')
      setEntryFuelLevel(checkIn.entryFuelLevel.toString())
      setExitFuelLevel(checkIn.exitFuelLevel?.toString() || '50')
      setChecklistEntry(checkIn.checklistEntry)
      setChecklistExit(checkIn.checklistExit || DEFAULT_CHECKLIST_ITEMS.map(name => ({ name, checked: false })))
      setDamages(checkIn.damages || '')
      setObservations(checkIn.observations || '')
      setStatus(checkIn.status)
    } else {
      resetForm()
      const today = new Date().toISOString().split('T')[0]
      setEntryDate(today)
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!workshop || !selectedClientId || !selectedVehicleId || !driverName || !entryDate || !entryOdometer) {
      toast.error('Por favor, preencha todos os campos obrigatórios')
      return
    }

    const checkInData = {
      workshopId: workshop.id,
      clientId: selectedClientId,
      vehicleId: selectedVehicleId,
      driverName,
      driverCPF: driverCPF || undefined,
      driverRG: driverRG || undefined,
      driverCNH: driverCNH || undefined,
      driverCategory: driverCategory || undefined,
      driverCNHIssue: driverCNHIssue || undefined,
      driverCNHExpiry: driverCNHExpiry || undefined,
      driverAddress: driverAddress || undefined,
      driverPhone: driverPhone || undefined,
      entryDate: new Date(entryDate).toISOString(),
      exitDate: exitDate ? new Date(exitDate).toISOString() : undefined,
      entryOdometer: parseFloat(entryOdometer),
      exitOdometer: exitOdometer ? parseFloat(exitOdometer) : undefined,
      entryFuelLevel: parseFloat(entryFuelLevel),
      exitFuelLevel: exitFuelLevel ? parseFloat(exitFuelLevel) : undefined,
      checklistEntry,
      checklistExit: status === 'completed' ? checklistExit : undefined,
      damages: damages || undefined,
      observations: observations || undefined,
      status
    }

    try {
      const url = editingCheckIn
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/checkins/${editingCheckIn.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/checkins`

      const response = await fetch(url, {
        method: editingCheckIn ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(checkInData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Erro ao salvar check-in')
      }

      toast.success(editingCheckIn ? 'Check-in atualizado com sucesso!' : 'Check-in criado com sucesso!')
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Erro ao salvar check-in:', error)
      toast.error('Erro ao salvar check-in')
    }
  }

  const handlePrint = (checkIn: CheckIn) => {
    setSelectedCheckIn(checkIn)
    setPrintDialogOpen(true)
  }

  const getClientName = (clientId: string) => {
    const clientsArray = Array.isArray(clients) ? clients : []
    return clientsArray.find(c => c.id === clientId)?.name || 'Cliente não encontrado'
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
    const vehicle = vehiclesArray.find(v => v.id === vehicleId)
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo não encontrado'
  }

  const getVehicle = (vehicleId: string) => {
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
    return vehiclesArray.find(v => v.id === vehicleId)
  }

  const filteredCheckIns = (Array.isArray(checkIns) ? checkIns : []).filter(checkIn => {
    const clientsArray = Array.isArray(clients) ? clients : []
    const vehiclesArray = Array.isArray(vehicles) ? vehicles : []
    const client = clientsArray.find(c => c.id === checkIn.clientId)
    const vehicle = vehiclesArray.find(v => v.id === checkIn.vehicleId)
    const searchLower = searchTerm.toLowerCase()
    
    return (
      checkIn.driverName.toLowerCase().includes(searchLower) ||
      client?.name.toLowerCase().includes(searchLower) ||
      vehicle?.plate.toLowerCase().includes(searchLower) ||
      vehicle?.brand.toLowerCase().includes(searchLower) ||
      vehicle?.model.toLowerCase().includes(searchLower)
    )
  })

  const inProgressCheckIns = filteredCheckIns.filter(c => c.status === 'in-progress')
  const completedCheckIns = filteredCheckIns.filter(c => c.status === 'completed')
  
  // Filter vehicles by selected client
  const filteredVehicles = selectedClientId 
    ? (Array.isArray(vehicles) ? vehicles : []).filter(v => v.clientId === selectedClientId)
    : []

  const renderCheckInsTable = (data: CheckIn[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum check-in encontrado
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data Entrada</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Condutor</TableHead>
            <TableHead>Quilometragem</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((checkIn) => (
            <TableRow key={checkIn.id}>
              <TableCell>{new Date(checkIn.entryDate).toLocaleDateString('pt-PT')}</TableCell>
              <TableCell>{getClientName(checkIn.clientId)}</TableCell>
              <TableCell>{getVehicleInfo(checkIn.vehicleId)}</TableCell>
              <TableCell>{checkIn.driverName}</TableCell>
              <TableCell>
                {checkIn.entryOdometer} km
                {checkIn.exitOdometer && ` → ${checkIn.exitOdometer} km`}
              </TableCell>
              <TableCell>
                <Badge variant={checkIn.status === 'completed' ? 'default' : 'secondary'}>
                  {checkIn.status === 'completed' ? 'Concluído' : 'Em Progresso'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePrint(checkIn)}
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(checkIn)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  const handleChecklistToggle = (index: number, isEntry: boolean) => {
    if (isEntry) {
      const updated = [...checklistEntry]
      updated[index].checked = !updated[index].checked
      setChecklistEntry(updated)
    } else {
      const updated = [...checklistExit]
      updated[index].checked = !updated[index].checked
      setChecklistExit(updated)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl">Check-in de Viaturas</h2>
            <p className="text-sm text-muted-foreground">
              Registo de entrada e saída de veículos
            </p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Check-in
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por condutor, cliente, matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-ins</CardTitle>
          <CardDescription>
            {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''} registado{checkIns.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : (
            <Tabs defaultValue="in-progress" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="in-progress">
                  Em Progresso ({inProgressCheckIns.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Concluídos ({completedCheckIns.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="in-progress">
                {renderCheckInsTable(inProgressCheckIns)}
              </TabsContent>
              
              <TabsContent value="completed">
                {renderCheckInsTable(completedCheckIns)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCheckIn ? 'Editar Check-in' : 'Novo Check-in'}</DialogTitle>
            <DialogDescription>
              Preencha as informações do check-in de viatura
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente e Veículo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(clients) ? clients : []).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">Veículo *</Label>
                <Select 
                  value={selectedVehicleId} 
                  onValueChange={setSelectedVehicleId}
                  disabled={!selectedClientId}
                >
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Selecionar veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.plate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dados do Condutor */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Dados do Condutor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Nome Completo *</Label>
                  <Input
                    id="driverName"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCPF">NIF</Label>
                  <Input
                    id="driverCPF"
                    value={driverCPF}
                    onChange={(e) => setDriverCPF(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverRG">CC / BI</Label>
                  <Input
                    id="driverRG"
                    value={driverRG}
                    onChange={(e) => setDriverRG(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCNH">Carta de Condução</Label>
                  <Input
                    id="driverCNH"
                    value={driverCNH}
                    onChange={(e) => setDriverCNH(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCategory">Categoria</Label>
                  <Input
                    id="driverCategory"
                    value={driverCategory}
                    onChange={(e) => setDriverCategory(e.target.value)}
                    placeholder="A, B, C..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCNHIssue">Data Emissão</Label>
                  <Input
                    id="driverCNHIssue"
                    type="date"
                    value={driverCNHIssue}
                    onChange={(e) => setDriverCNHIssue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverCNHExpiry">Data Validade</Label>
                  <Input
                    id="driverCNHExpiry"
                    type="date"
                    value={driverCNHExpiry}
                    onChange={(e) => setDriverCNHExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Telefone</Label>
                  <Input
                    id="driverPhone"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="driverAddress">Morada Completa</Label>
                  <Input
                    id="driverAddress"
                    value={driverAddress}
                    onChange={(e) => setDriverAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Entrada/Saída */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Entrada / Saída</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryDate">Data/Hora Entrada *</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitDate">Data/Hora Saída</Label>
                  <Input
                    id="exitDate"
                    type="date"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryOdometer">Quilometragem Entrada (km) *</Label>
                  <Input
                    id="entryOdometer"
                    type="number"
                    value={entryOdometer}
                    onChange={(e) => setEntryOdometer(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitOdometer">Quilometragem Saída (km)</Label>
                  <Input
                    id="exitOdometer"
                    type="number"
                    value={exitOdometer}
                    onChange={(e) => setExitOdometer(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryFuelLevel">Nível Combustível Entrada (%)</Label>
                  <Input
                    id="entryFuelLevel"
                    type="range"
                    min="0"
                    max="100"
                    value={entryFuelLevel}
                    onChange={(e) => setEntryFuelLevel(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground text-center">{entryFuelLevel}%</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitFuelLevel">Nível Combustível Saída (%)</Label>
                  <Input
                    id="exitFuelLevel"
                    type="range"
                    min="0"
                    max="100"
                    value={exitFuelLevel}
                    onChange={(e) => setExitFuelLevel(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground text-center">{exitFuelLevel}%</div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Checklist de Itens</h3>
              <Tabs defaultValue="entry" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="entry">Entrada</TabsTrigger>
                  <TabsTrigger value="exit">Saída</TabsTrigger>
                </TabsList>
                
                <TabsContent value="entry" className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {checklistEntry.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`entry-${index}`}
                          checked={item.checked}
                          onCheckedChange={() => handleChecklistToggle(index, true)}
                        />
                        <label
                          htmlFor={`entry-${index}`}
                          className="text-sm cursor-pointer select-none"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="exit" className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {checklistExit.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exit-${index}`}
                          checked={item.checked}
                          onCheckedChange={() => handleChecklistToggle(index, false)}
                        />
                        <label
                          htmlFor={`exit-${index}`}
                          className="text-sm cursor-pointer select-none"
                        >
                          {item.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Danos e Observações */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="damages">Marcar Danos / Avarias</Label>
                <Textarea
                  id="damages"
                  value={damages}
                  onChange={(e) => setDamages(e.target.value)}
                  rows={4}
                  placeholder="Descreva os danos ou avarias encontrados..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(value: 'in-progress' | 'completed') => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="submit">
                {editingCheckIn ? 'Atualizar Check-in' : 'Criar Check-in'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imprimir Check-in</DialogTitle>
            <DialogDescription>
              Pré-visualização do check-in para impressão
            </DialogDescription>
          </DialogHeader>
          {selectedCheckIn && (
            <CheckInPrintView
              ref={printRef}
              checkIn={selectedCheckIn}
              client={clients.find(c => c.id === selectedCheckIn.clientId)}
              vehicle={getVehicle(selectedCheckIn.vehicleId)}
              workshop={workshop}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
