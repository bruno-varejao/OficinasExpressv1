import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function DebugWorkshopProfiles() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/workshop-profiles`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Debug: Workshop Profiles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={fetchProfiles} disabled={loading}>
          {loading ? 'Carregando...' : 'Buscar Perfis'}
        </Button>

        {data && (
          <div className="space-y-4">
            <p className="text-sm">
              <strong>Total de Oficinas:</strong> {data.totalWorkshops}
            </p>

            <div className="space-y-2">
              {data.profiles.map((profile: any, index: number) => (
                <div key={index} className="border p-3 rounded-lg space-y-1 text-sm">
                  <p><strong>Nome:</strong> {profile.workshopName}</p>
                  <p><strong>ID:</strong> {profile.workshopId}</p>
                  <p><strong>Ativa:</strong> {profile.isActive ? '✅ Sim' : '❌ Não'}</p>
                  <p><strong>Concelho:</strong> {profile.concelho || 'N/A'}</p>
                  <p><strong>Localidade:</strong> {profile.localidade || 'N/A'}</p>
                  <p><strong>Perfil Existe:</strong> {profile.profileExists ? '✅ Sim' : '❌ Não'}</p>
                  <p className={profile.interventionZone ? 'text-green-600' : 'text-red-600'}>
                    <strong>Zona Intervenção:</strong> {profile.interventionZone || 'NÃO DEFINIDA'}
                  </p>
                  <p><strong>Morada (Perfil):</strong> {profile.address || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
