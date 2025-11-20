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
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Building2, 
  Phone, 
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ShoppingCart,
  TruckIcon,
  Euro
} from 'lucide-react'

interface SupplierOrdersModuleProps {
  accessToken: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  nif: string
  notes: string
  isActive: boolean
  createdAt: string
}

interface OrderItem {
  id: string
  partName: string
  partReference: string
  quantity: number
  unitPrice: number
  total: number
  notes: string
}

interface SupplierOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  items: OrderItem[]
  totalAmount: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  expectedDeliveryDate?: string
  deliveredDate?: string
  notes: string
  createdAt: string
  updatedAt?: string
}

export function SupplierOrdersModule({ accessToken }: SupplierOrdersModuleProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('orders')
  
  // Supplier dialog state
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    nif: '',
    notes: ''
  })
  
  // Order dialog state
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [orderForm, setOrderForm] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: ''
  })
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [newItem, setNewItem] = useState({
    partName: '',
    partReference: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  })
  
  // Delete dialogs
  const [deleteSupplierDialog, setDeleteSupplierDialog] = useState(false)
  const [deleteOrderDialog, setDeleteOrderDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  
  // Order details dialog
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)

  useEffect(() => {
    fetchSuppliers()
    fetchOrders()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
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
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Erro ao carregar encomendas')
    }
  }

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingSupplier
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/suppliers/${editingSupplier.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/suppliers`
      
      const response = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(supplierForm),
      })

      if (response.ok) {
        toast.success(editingSupplier ? 'Fornecedor atualizado!' : 'Fornecedor criado!')
        setShowSupplierDialog(false)
        resetSupplierForm()
        fetchSuppliers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar fornecedor')
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      toast.error('Erro ao salvar fornecedor')
    }
  }

  const handleDeleteSupplier = async () => {
    if (!itemToDelete) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/suppliers/${itemToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Fornecedor eliminado!')
        setDeleteSupplierDialog(false)
        setItemToDelete(null)
        fetchSuppliers()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao eliminar fornecedor')
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast.error('Erro ao eliminar fornecedor')
    }
  }

  const addItemToOrder = () => {
    if (!newItem.partName || !newItem.partReference || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      toast.error('Preencha todos os campos obrigatórios do item')
      return
    }

    const item: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      partName: newItem.partName,
      partReference: newItem.partReference,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      total: newItem.quantity * newItem.unitPrice,
      notes: newItem.notes
    }

    setOrderItems([...orderItems, item])
    setNewItem({
      partName: '',
      partReference: '',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    })
    toast.success('Item adicionado à encomenda')
  }

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId))
    toast.success('Item removido')
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!orderForm.supplierId) {
      toast.error('Selecione um fornecedor')
      return
    }

    if (orderItems.length === 0) {
      toast.error('Adicione pelo menos um item à encomenda')
      return
    }

    try {
      const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ...orderForm,
            items: orderItems,
            totalAmount
          }),
        }
      )

      if (response.ok) {
        toast.success('Encomenda criada com sucesso!')
        setShowOrderDialog(false)
        resetOrderForm()
        fetchOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar encomenda')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Erro ao criar encomenda')
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: SupplierOrder['status']) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/orders/${orderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (response.ok) {
        toast.success('Estado atualizado!')
        fetchOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao atualizar estado')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Erro ao atualizar estado')
    }
  }

  const handleDeleteOrder = async () => {
    if (!itemToDelete) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/supplier-orders/orders/${itemToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Encomenda eliminada!')
        setDeleteOrderDialog(false)
        setItemToDelete(null)
        fetchOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao eliminar encomenda')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Erro ao eliminar encomenda')
    }
  }

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      nif: '',
      notes: ''
    })
    setEditingSupplier(null)
  }

  const resetOrderForm = () => {
    setOrderForm({
      supplierId: '',
      expectedDeliveryDate: '',
      notes: ''
    })
    setOrderItems([])
    setNewItem({
      partName: '',
      partReference: '',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    })
  }

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setSupplierForm({
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      nif: supplier.nif,
      notes: supplier.notes
    })
    setShowSupplierDialog(true)
  }

  const getStatusBadge = (status: SupplierOrder['status']) => {
    const badges = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      confirmed: { label: 'Confirmada', variant: 'default' as const, icon: CheckCircle },
      shipped: { label: 'Enviada', variant: 'default' as const, icon: TruckIcon },
      delivered: { label: 'Entregue', variant: 'default' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle }
    }
    
    const config = badges[status]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.nif.includes(searchTerm)
  )

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Encomenda a Fornecedores
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão de fornecedores e pedidos de peças
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Encomendas
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar encomendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowOrderDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Encomenda
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">A carregar...</div>
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma encomenda encontrada' : 'Ainda não há encomendas registadas'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Encomenda</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <span className="font-mono">{order.orderNumber}</span>
                      </TableCell>
                      <TableCell>{order.supplierName}</TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">€{order.totalAmount.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowOrderDetails(true)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as SupplierOrder['status'])}
                              className="text-sm rounded border px-2 py-1"
                            >
                              <option value="pending">Pendente</option>
                              <option value="confirmed">Confirmada</option>
                              <option value="shipped">Enviada</option>
                              <option value="delivered">Entregue</option>
                              <option value="cancelled">Cancelar</option>
                            </select>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setItemToDelete(order.id)
                              setDeleteOrderDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar fornecedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowSupplierDialog(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">A carregar...</div>
              </CardContent>
            </Card>
          ) : filteredSuppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum fornecedor encontrado' : 'Ainda não há fornecedores registados'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {supplier.name}
                        </CardTitle>
                        <CardDescription>{supplier.contact}</CardDescription>
                      </div>
                      {supplier.isActive && (
                        <Badge variant="default">Ativo</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.nif && (
                        <div className="text-muted-foreground">
                          <span className="font-semibold">NIF:</span> {supplier.nif}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditSupplier(supplier)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setItemToDelete(supplier.id)
                          setDeleteSupplierDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do fornecedor
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input
                  id="name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({...supplierForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Pessoa de Contacto</Label>
                <Input
                  id="contact"
                  value={supplierForm.contact}
                  onChange={(e) => setSupplierForm({...supplierForm, contact: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({...supplierForm, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({...supplierForm, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  value={supplierForm.nif}
                  onChange={(e) => setSupplierForm({...supplierForm, nif: e.target.value})}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Morada</Label>
                <Input
                  id="address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({...supplierForm, address: e.target.value})}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({...supplierForm, notes: e.target.value})}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowSupplierDialog(false)
                resetSupplierForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSupplier ? 'Atualizar' : 'Criar'} Fornecedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Encomenda</DialogTitle>
            <DialogDescription>
              Crie uma nova encomenda de peças
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateOrder} className="space-y-6">
            {/* Order Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informação da Encomenda</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Fornecedor *</Label>
                  <select
                    id="supplier"
                    value={orderForm.supplierId}
                    onChange={(e) => setOrderForm({...orderForm, supplierId: e.target.value})}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  >
                    <option value="">Selecione o fornecedor...</option>
                    {suppliers.filter(s => s.isActive).map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">Data Prevista de Entrega</Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={orderForm.expectedDeliveryDate}
                    onChange={(e) => setOrderForm({...orderForm, expectedDeliveryDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="orderNotes">Observações da Encomenda</Label>
                  <textarea
                    id="orderNotes"
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Add Items */}
            <div className="space-y-4">
              <h3 className="font-semibold">Adicionar Itens</h3>
              <div className="grid md:grid-cols-5 gap-4 items-end">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="partName">Nome da Peça</Label>
                  <Input
                    id="partName"
                    value={newItem.partName}
                    onChange={(e) => setNewItem({...newItem, partName: e.target.value})}
                    placeholder="Ex: Filtro de óleo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="partReference">Referência</Label>
                  <Input
                    id="partReference"
                    value={newItem.partReference}
                    onChange={(e) => setNewItem({...newItem, partReference: e.target.value})}
                    placeholder="Ex: FO123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantity">Qtd</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Preço Unit. (€)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <Button type="button" onClick={addItemToOrder} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {/* Items List */}
            {orderItems.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Itens da Encomenda ({orderItems.length})</h3>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peça</TableHead>
                        <TableHead>Referência</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.partName}</TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">{item.partReference}</span>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-semibold">€{item.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromOrder(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4} className="text-right font-semibold">
                          Total da Encomenda:
                        </TableCell>
                        <TableCell className="text-right font-bold text-lg">
                          €{orderItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowOrderDialog(false)
                resetOrderForm()
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={orderItems.length === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Criar Encomenda
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Encomenda {selectedOrder.orderNumber}
                </DialogTitle>
                <DialogDescription>
                  Detalhes da encomenda
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fornecedor</Label>
                    <p className="font-semibold">{selectedOrder.supplierName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado</Label>
                    <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data da Encomenda</Label>
                    <p>{new Date(selectedOrder.orderDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                  {selectedOrder.expectedDeliveryDate && (
                    <div>
                      <Label className="text-muted-foreground">Data Prevista de Entrega</Label>
                      <p>{new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString('pt-PT')}</p>
                    </div>
                  )}
                </div>

                {selectedOrder.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="mt-1">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground mb-2 block">Itens da Encomenda</Label>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peça</TableHead>
                          <TableHead>Referência</TableHead>
                          <TableHead className="text-right">Qtd</TableHead>
                          <TableHead className="text-right">Preço Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.partName}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{item.partReference}</span>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">€{item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">€{item.total.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right font-semibold">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            €{selectedOrder.totalAmount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Supplier Dialog */}
      <AlertDialog open={deleteSupplierDialog} onOpenChange={setDeleteSupplierDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Fornecedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fornecedor será permanentemente eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupplier} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Order Dialog */}
      <AlertDialog open={deleteOrderDialog} onOpenChange={setDeleteOrderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Encomenda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A encomenda será permanentemente eliminada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
