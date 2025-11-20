import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  History,
  Filter,
  Download,
  Layers,
  MapPin,
  DollarSign,
  Warehouse,
  BarChart3,
  Archive,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  X,
  Database
} from 'lucide-react'

interface StockModuleProps {
  accessToken: string
}

interface Category {
  id: string
  name: string
  description: string
  workshopId: string
  createdAt: string
}

interface StockItem {
  id: string
  reference: string
  name: string
  description: string
  categoryId: string
  categoryName?: string
  quantity: number
  minQuantity: number
  maxQuantity?: number
  location: string
  purchasePrice: number
  salePrice: number
  supplierId?: string
  supplierName?: string
  barcode?: string
  notes: string
  isActive: boolean
  workshopId: string
  createdAt: string
  updatedAt?: string
  imagePath?: string
  imageUrl?: string
}

interface StockMovement {
  id: string
  itemId: string
  itemReference: string
  itemName: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason: string
  relatedDocument?: string // budget ID, order ID, etc
  userId: string
  userName: string
  workshopId: string
  createdAt: string
}

export function StockModule({ accessToken }: StockModuleProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('items')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok' | 'high'>('all')
  
  // Category dialog
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })
  
  // Stock item dialog
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [itemForm, setItemForm] = useState({
    reference: '',
    name: '',
    description: '',
    categoryId: '',
    quantity: 0,
    minQuantity: 0,
    maxQuantity: 0,
    location: '',
    purchasePrice: 0,
    salePrice: 0,
    supplierId: '',
    barcode: '',
    notes: '',
    imageUrl: '',
    manufacturer: '',
    eanCode: ''
  })
  
  // Movement dialog
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [movementForm, setMovementForm] = useState({
    itemId: '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  })
  
  // Delete dialogs
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState(false)
  const [deleteItemDialog, setDeleteItemDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  
  // TecDoc integration
  const [tecdocLoading, setTecdocLoading] = useState(false)
  const [tecdocDataImported, setTecdocDataImported] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchStockItems()
    fetchMovements()
    fetchSuppliers()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/categories`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const categories = data.categories || []
        setCategories(categories)
        
        // Initialize default categories if none exist
        if (categories.length === 0) {
          await initializeDefaultCategories()
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Erro ao carregar categorias')
    }
  }

  const initializeDefaultCategories = async () => {
    try {
      console.log('🏗️ Initializing default stock categories...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/categories/init-defaults`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Initialized ${data.count} default categories`)
        setCategories(data.categories || [])
        toast.success(`${data.count} categorias predefinidas foram criadas!`)
      }
    } catch (error) {
      console.error('Error initializing default categories:', error)
    }
  }

  const fetchStockItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStockItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching stock items:', error)
      toast.error('Erro ao carregar stock')
    } finally {
      setLoading(false)
    }
  }

  const fetchMovements = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/movements`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setMovements(data.movements || [])
      }
    } catch (error) {
      console.error('Error fetching movements:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/suppliers`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  // Category CRUD
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCategory
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/categories/${editingCategory.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/categories`
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(categoryForm),
      })

      if (response.ok) {
        toast.success(editingCategory ? 'Categoria atualizada!' : 'Categoria criada!')
        setShowCategoryDialog(false)
        resetCategoryForm()
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar categoria')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Erro ao salvar categoria')
    }
  }

  const handleDeleteCategory = async () => {
    if (!itemToDelete) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/categories/${itemToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Categoria eliminada!')
        setDeleteCategoryDialog(false)
        setItemToDelete(null)
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao eliminar categoria')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Erro ao eliminar categoria')
    }
  }

  // Stock Item CRUD
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingItem
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items/${editingItem.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items`
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(itemForm),
      })

      if (response.ok) {
        toast.success(editingItem ? 'Item atualizado!' : 'Item criado!')
        setShowItemDialog(false)
        resetItemForm()
        fetchStockItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      toast.error('Erro ao salvar item')
    }
  }

  const handleDeleteItem = async () => {
    if (!itemToDelete) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items/${itemToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Item eliminado!')
        setDeleteItemDialog(false)
        setItemToDelete(null)
        fetchStockItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao eliminar item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Erro ao eliminar item')
    }
  }

  // Stock Movement
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!movementForm.itemId || movementForm.quantity <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/movements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(movementForm),
        }
      )

      if (response.ok) {
        toast.success('Movimento registado!')
        setShowMovementDialog(false)
        resetMovementForm()
        fetchStockItems()
        fetchMovements()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar movimento')
      }
    } catch (error) {
      console.error('Error creating movement:', error)
      toast.error('Erro ao criar movimento')
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '' })
    setEditingCategory(null)
  }

  const resetItemForm = () => {
    setItemForm({
      reference: '',
      name: '',
      description: '',
      categoryId: '',
      quantity: 0,
      minQuantity: 0,
      maxQuantity: 0,
      location: '',
      purchasePrice: 0,
      salePrice: 0,
      supplierId: '',
      barcode: '',
      notes: '',
      imageUrl: '',
      manufacturer: '',
      eanCode: ''
    })
    setEditingItem(null)
  }

  const resetMovementForm = () => {
    setMovementForm({
      itemId: '',
      type: 'in',
      quantity: 0,
      reason: ''
    })
  }

  // TecDoc Search Handler
  const handleTecDocSearch = async () => {
    const reference = itemForm.reference.trim()
    
    if (!reference) {
      toast.error('Por favor, insira uma referência primeiro')
      return
    }

    try {
      setTecdocLoading(true)
      toast.info('A consultar TecDoc...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/tecdoc/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reference }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.configured === false) {
          toast.error('API TecDoc não está configurada. Consulte TECDOC_INTEGRATION.md para instruções.')
        } else if (data.found === false) {
          toast.warning('Nenhum resultado encontrado no TecDoc para esta referência')
        } else {
          toast.error(data.error || 'Erro ao consultar TecDoc')
        }
        console.log('ℹ️ Para configurar TecDoc, consulte o arquivo TECDOC_INTEGRATION.md')
        return
      }

      if (data.found === false) {
        toast.warning('Nenhum resultado encontrado no TecDoc para esta referência')
        return
      }

      // Auto-fill form with TecDoc data
      setItemForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        description: data.description || prev.description,
        purchasePrice: data.purchasePrice || data.recommendedPrice || prev.purchasePrice,
        salePrice: data.salePrice || data.recommendedPrice || prev.salePrice,
        imageUrl: data.imageUrl || prev.imageUrl,
        manufacturer: data.manufacturer || prev.manufacturer,
        eanCode: data.eanCode || prev.eanCode,
        barcode: data.eanCode || prev.barcode,
      }))

      // Show detailed success message with imported fields
      const importedFields = []
      if (data.name) importedFields.push('Nome')
      if (data.description) importedFields.push('Descrição')
      if (data.manufacturer) importedFields.push('Fabricante')
      if (data.eanCode) importedFields.push('EAN')
      if (data.purchasePrice || data.recommendedPrice) importedFields.push('Preços')
      if (data.imageUrl) importedFields.push('Imagem')
      
      toast.success(`Dados importados do TecDoc! (${importedFields.join(', ')})`)
      console.log('✅ TecDoc data imported:', data)
      setTecdocDataImported(true)

    } catch (error) {
      console.error('Error fetching TecDoc data:', error)
      toast.error('Erro ao conectar ao TecDoc')
    } finally {
      setTecdocLoading(false)
    }
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description
    })
    setShowCategoryDialog(true)
  }

  const openEditItem = (item: StockItem) => {
    setEditingItem(item)
    setItemForm({
      reference: item.reference,
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity || 0,
      location: item.location,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      supplierId: item.supplierId || '',
      barcode: item.barcode || '',
      notes: item.notes,
      imageUrl: item.imageUrl || '',
      manufacturer: (item as any).manufacturer || '',
      eanCode: (item as any).eanCode || ''
    })
    setTecdocDataImported(false)
    setShowItemDialog(true)
  }

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) {
      return { label: 'Esgotado', variant: 'destructive' as const, icon: AlertTriangle }
    } else if (item.quantity <= item.minQuantity) {
      return { label: 'Baixo', variant: 'destructive' as const, icon: TrendingDown }
    } else if (item.maxQuantity && item.quantity >= item.maxQuantity) {
      return { label: 'Alto', variant: 'default' as const, icon: TrendingUp }
    }
    return { label: 'OK', variant: 'default' as const, icon: CheckCircle2 }
  }

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !filterCategory || item.categoryId === filterCategory
    
    let matchesStatus = true
    if (filterStatus === 'low') {
      matchesStatus = item.quantity <= item.minQuantity
    } else if (filterStatus === 'ok') {
      matchesStatus = item.quantity > item.minQuantity && (!item.maxQuantity || item.quantity < item.maxQuantity)
    } else if (filterStatus === 'high') {
      matchesStatus = item.maxQuantity ? item.quantity >= item.maxQuantity : false
    }
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const lowStockCount = stockItems.filter(item => item.quantity <= item.minQuantity).length
  const outOfStockCount = stockItems.filter(item => item.quantity === 0).length
  const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0)
  const totalSaleValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.salePrice), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Gestão de Stock
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Controle completo do inventário de peças
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Itens</CardDescription>
            <CardTitle className="text-3xl">{stockItems.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {categories.length} categorias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor em Stock</CardDescription>
            <CardTitle className="text-3xl">€{totalValue.toFixed(0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Valor venda: €{totalSaleValue.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        
        <Card className={lowStockCount > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Stock Baixo</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{lowStockCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
        
        <Card className={outOfStockCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Esgotado</CardDescription>
            <CardTitle className="text-3xl text-red-600">{outOfStockCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Sem stock disponível
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Itens
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movimentos
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="all">Todos os estados</option>
              <option value="low">Stock baixo</option>
              <option value="ok">Stock OK</option>
              <option value="high">Stock alto</option>
            </select>
            
            <Button onClick={() => {
              setShowItemDialog(true)
              setTecdocDataImported(false)
            }} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Item
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowMovementDialog(true)}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Movimento
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">A carregar...</div>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm || filterCategory ? 'Nenhum item encontrado' : 'Ainda não há itens no stock'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Preço Compra</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const status = getStockStatus(item)
                    const StatusIcon = status.icon
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-14 h-14 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-muted rounded-lg flex items-center justify-center border">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">{item.reference}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.categoryName || '-'}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.location && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3" />
                              {item.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.quantity <= item.minQuantity ? 'text-red-600 font-semibold' : 'font-medium'}>
                            {item.quantity}
                          </span>
                          {item.minQuantity > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              / min: {item.minQuantity}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">€{item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">€{item.salePrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(item.id)
                                setDeleteItemDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {categories.length} categorias registadas
            </p>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button 
                  variant="outline"
                  onClick={initializeDefaultCategories} 
                  className="flex items-center gap-2"
                >
                  <Layers className="h-4 w-4" />
                  Carregar Categorias Predefinidas
                </Button>
              )}
              <Button onClick={() => setShowCategoryDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nova Categoria
              </Button>
            </div>
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Ainda não há categorias criadas
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline"
                      onClick={initializeDefaultCategories}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      Carregar 35 Categorias Predefinidas
                    </Button>
                    <Button onClick={() => setShowCategoryDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Manualmente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
              const itemCount = stockItems.filter(item => item.categoryId === category.id).length
              return (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="h-5 w-5 text-primary" />
                          {category.name}
                        </CardTitle>
                        <CardDescription className="mt-1">{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCategory(category)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItemToDelete(category.id)
                          setDeleteCategoryDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            </div>
          )}
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {movements.length} movimentos registados
            </p>
          </div>

          {movements.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Ainda não há movimentos registados</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Stock Anterior</TableHead>
                    <TableHead className="text-right">Stock Novo</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 50).map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">
                        {new Date(movement.createdAt).toLocaleString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          movement.type === 'in' ? 'default' : 
                          movement.type === 'out' ? 'destructive' : 
                          'secondary'
                        }>
                          {movement.type === 'in' ? 'Entrada' : 
                           movement.type === 'out' ? 'Saída' : 
                           'Ajuste'}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.itemName}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{movement.itemReference}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}
                        {movement.quantity}
                      </TableCell>
                      <TableCell className="text-right">{movement.previousQuantity}</TableCell>
                      <TableCell className="text-right font-semibold">{movement.newQuantity}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {movement.reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              Organize os itens em categorias
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nome *</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                placeholder="Ex: Filtros"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Descrição</Label>
              <textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                placeholder="Descrição da categoria"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCategoryDialog(false)
                resetCategoryForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {editingItem ? 'Editar Item' : 'Novo Item de Stock'}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do item
                </DialogDescription>
              </div>
              {tecdocDataImported && (
                <Badge variant="default" className="bg-green-600">
                  <Database className="h-3 w-3 mr-1" />
                  Dados TecDoc
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="reference">Referência *</Label>
                <div className="flex gap-2">
                  <Input
                    id="reference"
                    value={itemForm.reference}
                    onChange={(e) => setItemForm({...itemForm, reference: e.target.value})}
                    placeholder="Ex: FO-123, 0450906262"
                    required
                    className="flex-1"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTecDocSearch}
                          disabled={tecdocLoading || !itemForm.reference.trim()}
                          className="shrink-0"
                        >
                          {tecdocLoading ? (
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Database className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Buscar dados automaticamente no TecDoc</p>
                        <p className="text-xs text-muted-foreground">Preenche nome, descrição, preços e imagem</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" /> Insira a referência da peça e clique no ícone 🗄️ para importar dados do TecDoc
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="itemName">Nome *</Label>
                <Input
                  id="itemName"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                  placeholder="Ex: Filtro de óleo"
                  required
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="Descrição detalhada do item"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({...itemForm, categoryId: e.target.value})}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={itemForm.location}
                  onChange={(e) => setItemForm({...itemForm, location: e.target.value})}
                  placeholder="Ex: Prateleira A3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade Inicial</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({...itemForm, quantity: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                <Input
                  id="minQuantity"
                  type="number"
                  min="0"
                  value={itemForm.minQuantity}
                  onChange={(e) => setItemForm({...itemForm, minQuantity: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxQuantity">Quantidade Máxima (opcional)</Label>
                <Input
                  id="maxQuantity"
                  type="number"
                  min="0"
                  value={itemForm.maxQuantity}
                  onChange={(e) => setItemForm({...itemForm, maxQuantity: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Preço de Compra (€) *</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.purchasePrice}
                  onChange={(e) => setItemForm({...itemForm, purchasePrice: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="salePrice">Preço de Venda (€) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.salePrice}
                  onChange={(e) => setItemForm({...itemForm, salePrice: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supplier">Fornecedor</Label>
                <select
                  id="supplier"
                  value={itemForm.supplierId}
                  onChange={(e) => setItemForm({...itemForm, supplierId: e.target.value})}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">Selecione...</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barcode">Código de Barras</Label>
                <Input
                  id="barcode"
                  value={itemForm.barcode}
                  onChange={(e) => setItemForm({...itemForm, barcode: e.target.value})}
                  placeholder="EAN/UPC"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={itemForm.manufacturer}
                  onChange={(e) => setItemForm({...itemForm, manufacturer: e.target.value})}
                  placeholder="Nome do fabricante"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eanCode">Código EAN</Label>
                <Input
                  id="eanCode"
                  value={itemForm.eanCode}
                  onChange={(e) => setItemForm({...itemForm, eanCode: e.target.value})}
                  placeholder="EAN (European Article Number)"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({...itemForm, notes: e.target.value})}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={itemForm.imageUrl}
                  onChange={(e) => setItemForm({...itemForm, imageUrl: e.target.value})}
                  placeholder="URL da imagem do item"
                />
                {itemForm.imageUrl && (
                  <div className="mt-2 rounded-lg border p-2 bg-muted/50">
                    <img 
                      src={itemForm.imageUrl} 
                      alt="Preview" 
                      className="h-24 w-24 object-cover rounded-lg mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowItemDialog(false)
                resetItemForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Atualizar' : 'Criar'} Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Movimento de Stock</DialogTitle>
            <DialogDescription>
              Entrada, saída ou ajuste de inventário
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateMovement} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movementItem">Item *</Label>
              <select
                id="movementItem"
                value={movementForm.itemId}
                onChange={(e) => setMovementForm({...movementForm, itemId: e.target.value})}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="">Selecione o item...</option>
                {stockItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.reference} - {item.name} (Stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movementType">Tipo de Movimento *</Label>
              <select
                id="movementType"
                value={movementForm.type}
                onChange={(e) => setMovementForm({...movementForm, type: e.target.value as any})}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="in">Entrada (adicionar stock)</option>
                <option value="out">Saída (remover stock)</option>
                <option value="adjustment">Ajuste (correção)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movementQuantity">Quantidade *</Label>
              <Input
                id="movementQuantity"
                type="number"
                min="1"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="movementReason">Motivo *</Label>
              <textarea
                id="movementReason"
                value={movementForm.reason}
                onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})}
                rows={3}
                className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                placeholder="Descreva o motivo do movimento"
                required
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowMovementDialog(false)
                resetMovementForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                Registar Movimento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={deleteCategoryDialog} onOpenChange={setDeleteCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A categoria será permanentemente eliminada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={deleteItemDialog} onOpenChange={setDeleteItemDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O item será permanentemente eliminado do stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
