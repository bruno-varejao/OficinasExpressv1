import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Search, Car, Calendar, Fuel, Settings as SettingsIcon, Gauge, Hash, FileText, Clock, Trash2, RefreshCw, Database, AlertCircle, CheckCircle2 } from 'lucide-react'

interface VehicleData {
  plate: string
  vin: string
  make: string
  model: string
  version?: string
  plateDate?: string
  color?: string
  mixture?: string
  driveType?: string
  bodyType?: string
  valves?: string
  markFrom?: string
  fuelType?: string
  powercv?: string
  powerkw?: string
  cubicCap?: string
  categoryType?: string
  co2?: string
  ownerType?: string
  ownerCategory?: string
  categoryIUC?: string
  isImported?: string
  searchedAt?: string
  // VIN Decoder fields
  AWN_k_type?: string
  AWN_code_moteur?: string
  AWN_url_image?: string
  AWN_model_image?: string
  AWN_annee_de_debut_modele?: string
  AWN_annee_de_fin_modele?: string
}

export function DecodificadorMatriculasModule() {
  const [plate, setPlate] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [searchHistory, setSearchHistory] = useState<VehicleData[]>([])
  const [activeTab, setActiveTab] = useState('search')
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory()
  }, [])

  // Format Portuguese license plate with automatic hyphens
  const formatLicensePlate = (value: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // If empty, return empty
    if (!cleaned) return ''
    
    // Portuguese license plates can be:
    // Format 1 (current): XX-XX-XX (2 letters, 2 numbers, 2 letters) - e.g., AB-12-CD
    // Format 2 (old): XX-XX-XX (2 numbers, 2 letters, 2 numbers) - e.g., 12-AB-34
    
    // Detect format based on first characters
    const firstTwoAreLetters = /^[A-Z]{2}/.test(cleaned)
    const firstTwoAreNumbers = /^[0-9]{2}/.test(cleaned)
    
    let formatted = ''
    
    if (firstTwoAreLetters) {
      // Current format: XX-XX-XX (letters-numbers-letters)
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    } else if (firstTwoAreNumbers) {
      // Old format: XX-XX-XX (numbers-letters-numbers)
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    } else {
      // Mixed start or unknown - just add hyphens every 2 characters
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    }
    
    return formatted
  }

  const loadSearchHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/history`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSearchHistory(data.history || [])
      } else {
        const error = await response.text()
        console.error('Error loading history:', error)
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleSearch = async () => {
    if (!plate.trim()) {
      toast.error('Por favor, insira uma matrícula')
      return
    }

    // Format plate (remove spaces and convert to uppercase)
    const formattedPlate = formatLicensePlate(plate.trim())
    
    setLoading(true)
    setVehicleData(null)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${formattedPlate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setVehicleData(data)
        toast.success('Dados do veículo obtidos com sucesso!')
        
        // Reload history after successful search
        await loadSearchHistory()
        
        // Switch to details tab
        setActiveTab('details')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erro ao consultar matrícula')
      }
    } catch (error) {
      console.error('Error searching plate:', error)
      toast.error('Erro de conexão ao consultar matrícula')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHistory = async (plateToDelete: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/history/${plateToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Registo eliminado com sucesso')
        await loadSearchHistory()
      } else {
        toast.error('Erro ao eliminar registo')
      }
    } catch (error) {
      console.error('Error deleting history:', error)
      toast.error('Erro ao eliminar registo')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50"></div>
              <div className="relative bg-white p-2 rounded-lg">
                <Car className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            Descodificador de Matrículas
          </h1>
          <p className="text-gray-600 mt-2">
            Consulta e armazena informações de veículos por matrícula portuguesa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="search"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
          >
            <Search className="h-4 w-4" />
            Pesquisar
          </TabsTrigger>
          <TabsTrigger 
            value="details"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger 
            value="history"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
          >
            <Database className="h-4 w-4" />
            Histórico ({searchHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-600" />
                Consultar Matrícula Portuguesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fonte de Dados:</strong> InfoMatricula.pt - Sistema oficial de consulta de matrículas portuguesas.<br />
                  Os dados são automaticamente guardados na base de dados após cada pesquisa.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plate">Matrícula</Label>
                  <div className="flex gap-2">
                    <Input
                      id="plate"
                      placeholder="Ex: AA-00-BB ou 96-ZB-30"
                      value={plate}
                      onChange={(e) => setPlate(formatLicensePlate(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch()
                      }}
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={loading || !plate.trim()}
                      className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white px-8"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          A consultar...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Consultar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Formato aceite: AA-00-BB, AA00BB, 00-AA-00, etc.
                  </p>
                </div>

                {/* Example cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPlate('96-ZB-30')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">Exemplo 1</p>
                          <p className="text-sm text-gray-600">96-ZB-30</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPlate('AA-00-BB')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-orange-600" />
                        <div>
                          <p className="font-medium">Exemplo 2</p>
                          <p className="text-sm text-gray-600">AA-00-BB</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setPlate('00-AA-00')}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">Formato Antigo</p>
                          <p className="text-sm text-gray-600">00-AA-00</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {vehicleData ? (
            <div className="space-y-6">
              {/* Header Card */}
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50"></div>
                        <div className="relative bg-white p-3 rounded-lg">
                          <Car className="h-10 w-10 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{vehicleData.make} {vehicleData.model}</h2>
                        <p className="text-lg text-gray-700">{vehicleData.version || 'Versão não especificada'}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline" className="text-lg px-4 py-1 border-blue-600 text-blue-600">
                            {vehicleData.plate}
                          </Badge>
                          <Badge variant="outline" className="px-3 py-1">
                            VIN: {vehicleData.vin}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {vehicleData.searchedAt && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Consultado em</p>
                        <p className="text-sm font-medium">{formatDate(vehicleData.searchedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Registration Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Informação de Registo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Data de Matrícula</p>
                      <p className="font-medium">{vehicleData.plateDate || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ano de Fabrico</p>
                      <p className="font-medium">{vehicleData.markFrom || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cor</p>
                      <p className="font-medium">{vehicleData.color || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Proprietário</p>
                      <p className="font-medium">{vehicleData.ownerType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Categoria de Proprietário</p>
                      <p className="font-medium">{vehicleData.ownerCategory || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Engine Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <SettingsIcon className="h-4 w-4 text-orange-600" />
                      Motor e Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Combustível</p>
                      <p className="font-medium">{vehicleData.fuelType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sistema de Injeção</p>
                      <p className="font-medium">{vehicleData.mixture || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cilindrada (cm³)</p>
                      <p className="font-medium">{vehicleData.cubicCap || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Potência (cv)</p>
                      <p className="font-medium">{vehicleData.powercv || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Potência (kW)</p>
                      <p className="font-medium">{vehicleData.powerkw || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Válvulas</p>
                      <p className="font-medium">{vehicleData.valves || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Type & Environmental */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Car className="h-4 w-4 text-blue-600" />
                      Tipo e Ambiente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Carroçaria</p>
                      <p className="font-medium">{vehicleData.bodyType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Tração</p>
                      <p className="font-medium">{vehicleData.driveType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Categoria</p>
                      <p className="font-medium">{vehicleData.categoryType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Categoria IUC</p>
                      <p className="font-medium">{vehicleData.categoryIUC || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Emissões CO₂ (g/km)</p>
                      <p className="font-medium">{vehicleData.co2 || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Importado</p>
                      <p className="font-medium">{vehicleData.isImported || '-'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* VIN Decoder Data */}
              {(vehicleData.AWN_k_type || vehicleData.AWN_code_moteur || 
                vehicleData.AWN_annee_de_debut_modele || vehicleData.AWN_annee_de_fin_modele) && (
                <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-purple-600" />
                      Dados VIN Decoder (TECDOC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicleData.AWN_k_type && (
                        <div>
                          <p className="text-sm text-gray-600">K-Type / TECDOC</p>
                          <p className="font-medium">{vehicleData.AWN_k_type}</p>
                        </div>
                      )}
                      {vehicleData.AWN_code_moteur && (
                        <div>
                          <p className="text-sm text-gray-600">Código do Motor</p>
                          <p className="font-medium">{vehicleData.AWN_code_moteur}</p>
                        </div>
                      )}
                      {vehicleData.AWN_annee_de_debut_modele && (
                        <div>
                          <p className="text-sm text-gray-600">Ano de Início Produção</p>
                          <p className="font-medium">{vehicleData.AWN_annee_de_debut_modele}</p>
                        </div>
                      )}
                      {vehicleData.AWN_annee_de_fin_modele && (
                        <div>
                          <p className="text-sm text-gray-600">Ano de Fim Produção</p>
                          <p className="font-medium">{vehicleData.AWN_annee_de_fin_modele}</p>
                        </div>
                      )}
                      {vehicleData.AWN_url_image && (
                        <div className="col-span-full">
                          <p className="text-sm text-gray-600 mb-2">Imagem da Marca</p>
                          <img 
                            src={vehicleData.AWN_url_image} 
                            alt="Marca" 
                            className="h-12 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                      )}
                      {vehicleData.AWN_model_image && (
                        <div className="col-span-full">
                          <p className="text-sm text-gray-600 mb-2">Imagem do Modelo</p>
                          <img 
                            src={vehicleData.AWN_model_image} 
                            alt="Modelo" 
                            className="h-32 object-contain rounded-lg"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Success Alert */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Dados guardados com sucesso na base de dados. Pode consultar o histórico na tab "Histórico".
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Car className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum veículo consultado</p>
                  <p className="text-sm mt-2">Use a tab "Pesquisar" para consultar uma matrícula</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Histórico de Pesquisas ({searchHistory.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSearchHistory}
                  disabled={loadingHistory}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600">A carregar histórico...</p>
                </div>
              ) : searchHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>VIN</TableHead>
                        <TableHead>Marca / Modelo</TableHead>
                        <TableHead>Versão</TableHead>
                        <TableHead>Ano</TableHead>
                        <TableHead>Combustível</TableHead>
                        <TableHead>Potência</TableHead>
                        <TableHead>K-Type</TableHead>
                        <TableHead>Código Motor</TableHead>
                        <TableHead>Data de Pesquisa</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchHistory.map((vehicle) => (
                        <TableRow key={vehicle.plate}>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-600 text-blue-600">
                              {vehicle.plate}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{vehicle.vin}</TableCell>
                          <TableCell className="font-medium">
                            {vehicle.make} {vehicle.model}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {vehicle.version || '-'}
                          </TableCell>
                          <TableCell>{vehicle.markFrom || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{vehicle.fuelType || '-'}</Badge>
                          </TableCell>
                          <TableCell>{vehicle.powercv ? `${vehicle.powercv} cv` : '-'}</TableCell>
                          <TableCell>
                            {vehicle.AWN_k_type ? (
                              <Badge variant="outline" className="border-purple-600 text-purple-600">
                                {vehicle.AWN_k_type}
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {vehicle.AWN_code_moteur || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(vehicle.searchedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setVehicleData(vehicle)
                                  setActiveTab('details')
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteHistory(vehicle.plate)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma pesquisa no histórico</p>
                  <p className="text-sm mt-2">As pesquisas serão guardadas automaticamente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}