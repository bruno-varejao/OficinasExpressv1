import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { toast } from 'sonner@2.0.3'
import { Upload, Image as ImageIcon, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface LogoManagementModuleProps {
  accessToken: string
}

interface PlatformLogos {
  logo?: string
  icon?: string
  favicon?: string
}

export function LogoManagementModule({ accessToken }: LogoManagementModuleProps) {
  const [logos, setLogos] = useState<PlatformLogos>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<{
    logo: boolean
    icon: boolean
    favicon: boolean
  }>({
    logo: false,
    icon: false,
    favicon: false
  })

  // Preview states
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [iconPreview, setIconPreview] = useState<string | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  useEffect(() => {
    loadLogos()
  }, [])

  const loadLogos = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/platform-logos`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLogos(data.logos || {})
      }
    } catch (error) {
      console.error('Error loading logos:', error)
      toast.error('Erro ao carregar logotipos')
    } finally {
      setLoading(false)
    }
  }

  const validateImage = (file: File, type: 'logo' | 'icon' | 'favicon'): boolean => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de ficheiro inválido. Apenas JPEG, PNG, WEBP e SVG são permitidos')
      return false
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('Ficheiro muito grande. Tamanho máximo é 2MB')
      return false
    }

    // Favicon specific validation - recommend 32x32 or 16x16
    if (type === 'favicon') {
      const img = new Image()
      img.onload = () => {
        if (img.width !== 32 && img.width !== 16 && img.width !== 64) {
          toast.warning('Recomendado: Favicon deve ter 16x16, 32x32 ou 64x64 pixels')
        }
      }
      img.src = URL.createObjectURL(file)
    }

    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'icon' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!validateImage(file, type)) {
      e.target.value = '' // Reset input
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const preview = reader.result as string
      if (type === 'logo') {
        setLogoPreview(preview)
        setLogoFile(file)
      } else if (type === 'icon') {
        setIconPreview(preview)
        setIconFile(file)
      } else if (type === 'favicon') {
        setFaviconPreview(preview)
        setFaviconFile(file)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async (type: 'logo' | 'icon' | 'favicon') => {
    const file = type === 'logo' ? logoFile : type === 'icon' ? iconFile : faviconFile

    if (!file) {
      toast.error('Selecione um ficheiro primeiro')
      return
    }

    setUploading(prev => ({ ...prev, [type]: true }))

    try {
      const formData = new FormData()
      formData.append(type, file)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/platform-logos/${type}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(`${type === 'logo' ? 'Logotipo' : type === 'icon' ? 'Icon' : 'Favicon'} carregado com sucesso!`)
        
        // Update state
        setLogos(prev => ({ ...prev, [type]: data.url }))
        
        // Clear preview and file
        if (type === 'logo') {
          setLogoPreview(null)
          setLogoFile(null)
        } else if (type === 'icon') {
          setIconPreview(null)
          setIconFile(null)
        } else {
          setFaviconPreview(null)
          setFaviconFile(null)
        }

        // Reload to get updated URLs
        await loadLogos()
      } else {
        const data = await response.json()
        toast.error(`Erro ao carregar: ${data.error}`)
      }
    } catch (error) {
      console.error('Error uploading:', error)
      toast.error('Erro ao carregar ficheiro')
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }
  }

  const handleDelete = async (type: 'logo' | 'icon' | 'favicon') => {
    if (!confirm(`Tem a certeza que deseja remover o ${type === 'logo' ? 'logotipo' : type === 'icon' ? 'icon' : 'favicon'}?`)) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/platform-logos/${type}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (response.ok) {
        toast.success(`${type === 'logo' ? 'Logotipo' : type === 'icon' ? 'Icon' : 'Favicon'} removido com sucesso!`)
        setLogos(prev => ({ ...prev, [type]: undefined }))
      } else {
        const data = await response.json()
        toast.error(`Erro ao remover: ${data.error}`)
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Erro ao remover ficheiro')
    }
  }

  const renderUploadCard = (
    type: 'logo' | 'icon' | 'favicon',
    title: string,
    description: string,
    currentUrl: string | undefined,
    preview: string | null,
    file: File | null,
    isUploading: boolean
  ) => {
    return (
      <Card className="border-2 border-blue-100 shadow-lg">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-orange-500"></div>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-orange-50">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Current Image Display */}
          {currentUrl && !preview && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Imagem Atual
              </Label>
              <div className="relative p-4 bg-slate-50 rounded-lg border-2 border-slate-200 flex items-center justify-center min-h-[120px]">
                <ImageWithFallback
                  src={currentUrl}
                  alt={title}
                  className={`${type === 'favicon' ? 'h-8 w-8' : type === 'icon' ? 'h-16 w-16' : 'max-h-24'} object-contain`}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(type)}
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Pré-visualização (Não guardado)
              </Label>
              <div className="relative p-4 bg-orange-50 rounded-lg border-2 border-orange-200 flex items-center justify-center min-h-[120px]">
                <img
                  src={preview}
                  alt="Preview"
                  className={`${type === 'favicon' ? 'h-8 w-8' : type === 'icon' ? 'h-16 w-16' : 'max-h-24'} object-contain`}
                />
              </div>
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor={`${type}-upload`}>
              {currentUrl ? 'Substituir Imagem' : 'Carregar Imagem'}
            </Label>
            <Input
              id={`${type}-upload`}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
              onChange={(e) => handleFileSelect(e, type)}
              disabled={isUploading}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Ficheiro selecionado: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Upload Button */}
          {file && (
            <Button
              onClick={() => handleUpload(type)}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  A carregar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar {title}
                </>
              )}
            </Button>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Formatos aceites:</strong> JPEG, PNG, WEBP, SVG<br />
              <strong>Tamanho máximo:</strong> 2MB<br />
              {type === 'favicon' && (
                <>
                  <strong>Dimensões recomendadas:</strong> 16x16, 32x32 ou 64x64 pixels<br />
                </>
              )}
              {type === 'icon' && (
                <>
                  <strong>Dimensões recomendadas:</strong> 128x128 ou 256x256 pixels<br />
                </>
              )}
              {type === 'logo' && (
                <>
                  <strong>Nota:</strong> Imagem será exibida no portal público<br />
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar logotipos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Gestão de Logotipos da Plataforma
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure o logotipo, icon e favicon que aparecerão no portal público
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 px-4 py-2">
          <Upload className="h-4 w-4 mr-2" />
          Portal Público
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Logo */}
        {renderUploadCard(
          'logo',
          'Logotipo',
          'Logotipo principal da plataforma (cabeçalho)',
          logos.logo,
          logoPreview,
          logoFile,
          uploading.logo
        )}

        {/* Icon */}
        {renderUploadCard(
          'icon',
          'Icon',
          'Ícone da aplicação (rodapé e branding)',
          logos.icon,
          iconPreview,
          iconFile,
          uploading.icon
        )}

        {/* Favicon */}
        {renderUploadCard(
          'favicon',
          'Favicon',
          'Ícone do separador do navegador',
          logos.favicon,
          faviconPreview,
          faviconFile,
          uploading.favicon
        )}
      </div>

      {/* Status Summary */}
      <Card className="border-2 border-green-100 bg-green-50/50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Estado dos Logotipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Logotipo</span>
              <Badge variant={logos.logo ? 'default' : 'secondary'} className={logos.logo ? 'bg-green-600' : ''}>
                {logos.logo ? 'Configurado' : 'Não configurado'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Icon</span>
              <Badge variant={logos.icon ? 'default' : 'secondary'} className={logos.icon ? 'bg-green-600' : ''}>
                {logos.icon ? 'Configurado' : 'Não configurado'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Favicon</span>
              <Badge variant={logos.favicon ? 'default' : 'secondary'} className={logos.favicon ? 'bg-green-600' : ''}>
                {logos.favicon ? 'Configurado' : 'Não configurado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
