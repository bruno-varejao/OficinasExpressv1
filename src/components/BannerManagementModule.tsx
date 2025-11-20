import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Edit2, 
  MoveUp, 
  MoveDown,
  Save,
  X,
  AlertCircle
} from 'lucide-react'

interface Banner {
  id: string
  imageUrl: string
  title: string
  subtitle: string
  order: number
  active: boolean
  type: 'carousel' | 'fixed' // carousel = em carrossel com outros, fixed = banner único fixo
  createdAt: string
}

interface BannerManagementModuleProps {
  accessToken: string
}

export function BannerManagementModule({ accessToken }: BannerManagementModuleProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    imageFile: null as File | null,
    type: 'carousel' as 'carousel' | 'fixed',
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/banners`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setBanners(data.banners || [])
      } else {
        toast.error('Erro ao carregar banners')
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Erro ao carregar banners')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.imageFile) {
      toast.error('Por favor, selecione uma imagem')
      return
    }

    setUploading(true)

    try {
      // Upload image
      const formDataToSend = new FormData()
      formDataToSend.append('image', formData.imageFile)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('subtitle', formData.subtitle)
      formDataToSend.append('type', formData.type)
      if (editingBanner) {
        formDataToSend.append('bannerId', editingBanner.id)
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/banners`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formDataToSend,
        }
      )

      if (response.ok) {
        toast.success(editingBanner ? 'Banner atualizado com sucesso!' : 'Banner adicionado com sucesso!')
        setShowAddDialog(false)
        setEditingBanner(null)
        setFormData({ title: '', subtitle: '', imageFile: null, type: 'carousel' })
        fetchBanners()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao salvar banner')
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      toast.error('Erro ao salvar banner')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (bannerId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este banner?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/banners/${bannerId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Banner eliminado com sucesso!')
        fetchBanners()
      } else {
        toast.error('Erro ao eliminar banner')
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Erro ao eliminar banner')
    }
  }

  const handleToggleActive = async (bannerId: string, currentActive: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/banners/${bannerId}/toggle`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ active: !currentActive }),
        }
      )

      if (response.ok) {
        toast.success(currentActive ? 'Banner desativado' : 'Banner ativado')
        fetchBanners()
      } else {
        toast.error('Erro ao atualizar banner')
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
      toast.error('Erro ao atualizar banner')
    }
  }

  const handleReorder = async (bannerId: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/banners/${bannerId}/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ direction }),
        }
      )

      if (response.ok) {
        fetchBanners()
      } else {
        toast.error('Erro ao reordenar banner')
      }
    } catch (error) {
      console.error('Error reordering banner:', error)
      toast.error('Erro ao reordenar banner')
    }
  }

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      imageFile: null,
      type: banner.type,
    })
    setShowAddDialog(true)
  }

  const closeDialog = () => {
    setShowAddDialog(false)
    setEditingBanner(null)
    setFormData({ title: '', subtitle: '', imageFile: null, type: 'carousel' })
  }
  
  // Check if there are active banners of both types (conflict)
  const activeFixedBanners = banners.filter(b => b.active && b.type === 'fixed')
  const activeCarouselBanners = banners.filter(b => b.active && b.type === 'carousel')
  const hasConflict = activeFixedBanners.length > 0 && activeCarouselBanners.length > 0
  const hasMultipleFixed = activeFixedBanners.length > 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Banners</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os banners exibidos na página inicial
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-orange-500">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Editar Banner' : 'Adicionar Novo Banner'}
              </DialogTitle>
              <DialogDescription>
                {editingBanner 
                  ? 'Atualize as informações do banner. Para alterar a imagem, selecione uma nova.'
                  : 'Adicione uma nova imagem ao carousel da página inicial.'
                }
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Imagem do Banner *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setFormData({ ...formData, imageFile: file })
                    }
                  }}
                  required={!editingBanner}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 1920x600px, formato JPG ou PNG
                </p>
                {editingBanner && !formData.imageFile && (
                  <p className="text-xs text-blue-600">
                    Deixe em branco para manter a imagem atual
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Promoção de Verão"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Ex: Até 30% de desconto em serviços"
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Banner</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'carousel' | 'fixed' })}
                  disabled={uploading}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {formData.type === 'carousel' ? 'Carousel' : 'Fixo'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="fixed">Fixo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Carousel:</strong> Banners rotativos com outros banners.<br/>
                  <strong>Fixo:</strong> Banner único em tela cheia sem espaços laterais.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-gradient-to-r from-blue-600 to-orange-500"
                >
                  {uploading ? (
                    'A guardar...'
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingBanner ? 'Atualizar' : 'Adicionar'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Warning alerts */}
      {(hasConflict || hasMultipleFixed) && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-2 flex-1">
                {hasConflict && (
                  <div>
                    <h3 className="font-semibold text-orange-900">⚠️ Conflito de Tipos de Banner</h3>
                    <p className="text-sm text-orange-800 mt-1">
                      Tem banners <strong>Fixos</strong> e de <strong>Carousel</strong> ativos simultaneamente. 
                      Apenas o banner <strong>Fixo</strong> será exibido na página inicial.
                    </p>
                    <p className="text-xs text-orange-700 mt-2">
                      Para exibir o carousel, desative todos os banners fixos.
                    </p>
                  </div>
                )}
                {hasMultipleFixed && !hasConflict && (
                  <div>
                    <h3 className="font-semibold text-orange-900">⚠️ Múltiplos Banners Fixos Ativos</h3>
                    <p className="text-sm text-orange-800 mt-1">
                      Tem {activeFixedBanners.length} banners fixos ativos. Apenas o primeiro será exibido.
                      Recomendamos ter apenas 1 banner fixo ativo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg mb-2">Nenhum banner encontrado</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Adicione banners para serem exibidos na página inicial da plataforma.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner, index) => (
            <Card key={banner.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {banner.title || 'Banner sem título'}
                      {banner.active ? (
                        <Badge className="bg-green-600">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                      <Badge variant={banner.type === 'fixed' ? 'default' : 'outline'} className={banner.type === 'fixed' ? 'bg-purple-600' : ''}>
                        {banner.type === 'fixed' ? 'Fixo' : 'Carousel'}
                      </Badge>
                    </CardTitle>
                    {banner.subtitle && (
                      <CardDescription>{banner.subtitle}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(banner.id, 'up')}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReorder(banner.id, 'down')}
                      disabled={index === banners.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-[16/5] rounded-lg overflow-hidden border border-border bg-muted">
                  <ImageWithFallback
                    src={banner.imageUrl}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Ordem: {banner.order} • Criado em {new Date(banner.createdAt).toLocaleDateString('pt-PT')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(banner.id, banner.active)}
                    >
                      {banner.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(banner)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(banner.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}