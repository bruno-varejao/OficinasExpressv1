# Sistema de Moradas das Oficinas

## 📍 Estrutura Detalhada de Morada

As oficinas agora possuem campos de morada separados e estruturados, em vez de um único campo de texto livre.

### Campos de Morada

```typescript
interface WorkshopAddress {
  // Campo legado (manter para compatibilidade)
  address?: string
  
  // Novos campos estruturados
  rua: string           // Nome da rua/avenida
  numeroPorta: string   // Número da porta
  codigoPostal: string  // XXXX-XXX
  concelho: string      // Ex: Lisboa, Porto, Coimbra
  localidade: string    // Ex: Benfica, Foz, Baixa
}
```

### Exemplo Completo

```typescript
{
  id: "uuid-da-oficina",
  name: "Oficina Central Porto",
  
  // Campos de morada estruturados
  rua: "Avenida da Boavista",
  numeroPorta: "1234",
  codigoPostal: "4100-123",
  concelho: "Porto",
  localidade: "Foz",
  
  // Outros campos
  phone: "220 123 456",
  email: "geral@oficinacentral.pt",
  nif: "123456789",
  logoUrl: "https://...",
  isActive: true
}
```

## 🗺️ API de Códigos Postais

### Endpoint Atual (Básico)

```typescript
GET /make-server-6971b43c/public/postal-code/:code
```

**Resposta:**
```json
{
  "postalCode": "1000-001",
  "concelho": "Lisboa",
  "localidade": "Lisboa"
}
```

### Limitações Atuais

1. **Base de dados limitada**: Apenas alguns códigos postais principais
2. **Mapping manual**: Dados hardcoded no servidor
3. **Sem validação completa**: Não valida se código existe de facto

### Integração Futura - APIs Portuguesas

#### Opção 1: CTT - Correios de Portugal

**API:** Não oficial, web scraping necessário
**URL:** https://www.ctt.pt/feapl_2/app/open/postalCodeSearch

**Vantagens:**
- Dados oficiais
- Sempre atualizados

**Desvantagens:**
- Não é uma API oficial
- Pode bloquear scraping
- Rate limiting

#### Opção 2: Codigo-Postal.pt

**API:** Não oficial
**URL:** https://www.codigo-postal.pt/

**Vantagens:**
- Interface amigável
- Pesquisa por código ou localidade

**Desvantagens:**
- Sem API pública
- Requer scraping

#### Opção 3: OpenCep (Alternativa)

Para MVP, pode-se usar uma base de dados estática de códigos postais.

### Implementação Recomendada

```typescript
// No backend
app.get('/make-server-6971b43c/public/postal-code/:code', async (c) => {
  try {
    const postalCode = c.req.param('code')
    
    // Validate format
    if (!/^\d{4}-\d{3}$/.test(postalCode)) {
      return c.json({ error: 'Formato inválido. Use XXXX-XXX' }, 400)
    }
    
    // Option 1: Check local database
    const localData = await kv.get(`postal_code:${postalCode}`)
    if (localData) {
      return c.json(localData)
    }
    
    // Option 2: Call external API (future)
    try {
      const externalData = await fetchFromCTT(postalCode)
      if (externalData) {
        // Cache for future use
        await kv.set(`postal_code:${postalCode}`, externalData)
        return c.json(externalData)
      }
    } catch (error) {
      console.log('External API failed, using fallback')
    }
    
    // Option 3: Fallback based on prefix
    const fallbackData = getFallbackFromPrefix(postalCode)
    return c.json(fallbackData)
    
  } catch (error) {
    return c.json({ error: 'Erro ao validar código postal' }, 500)
  }
})

// Helper function for fallback
function getFallbackFromPrefix(postalCode: string): any {
  const prefix = postalCode.substring(0, 2)
  
  const prefixMap: Record<string, any> = {
    '10': { concelho: 'Lisboa', localidade: 'Lisboa' },
    '11': { concelho: 'Lisboa', localidade: 'Lisboa' },
    '12': { concelho: 'Amadora', localidade: 'Amadora' },
    '13': { concelho: 'Oeiras', localidade: 'Oeiras' },
    '14': { concelho: 'Cascais', localidade: 'Cascais' },
    '15': { concelho: 'Sintra', localidade: 'Sintra' },
    '20': { concelho: 'Santarém', localidade: 'Santarém' },
    '30': { concelho: 'Coimbra', localidade: 'Coimbra' },
    '40': { concelho: 'Porto', localidade: 'Porto' },
    '41': { concelho: 'Porto', localidade: 'Porto' },
    '42': { concelho: 'Maia', localidade: 'Maia' },
    '43': { concelho: 'Matosinhos', localidade: 'Matosinhos' },
    '44': { concelho: 'Vila Nova de Gaia', localidade: 'Gaia' },
    '50': { concelho: 'Aveiro', localidade: 'Aveiro' },
    '60': { concelho: 'Viseu', localidade: 'Viseu' },
    '70': { concelho: 'Évora', localidade: 'Évora' },
    '80': { concelho: 'Faro', localidade: 'Faro' },
    '90': { concelho: 'Funchal', localidade: 'Funchal' },
    '95': { concelho: 'Ponta Delgada', localidade: 'Ponta Delgada' },
  }
  
  return {
    postalCode,
    ...(prefixMap[prefix] || { concelho: 'Portugal', localidade: 'Portugal' })
  }
}
```

## 🔧 Atualização do Painel Admin

### Formulário de Edição de Oficina

O AdminPanel precisa ser atualizado para suportar os novos campos:

```tsx
// Em AdminPanel.tsx - handleUpdateWorkshop
const [workshopFormData, setWorkshopFormData] = useState({
  name: '',
  nif: '',
  // Campos antigos
  address: '',
  // Novos campos estruturados
  rua: '',
  numeroPorta: '',
  codigoPostal: '',
  concelho: '',
  localidade: '',
  // Outros
  phone: '',
  email: ''
})

// Componente de formulário
<div className="grid md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="rua">Rua *</Label>
    <Input
      id="rua"
      value={workshopFormData.rua}
      onChange={(e) => setWorkshopFormData({...workshopFormData, rua: e.target.value})}
      placeholder="Rua das Flores"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="numeroPorta">Número *</Label>
    <Input
      id="numeroPorta"
      value={workshopFormData.numeroPorta}
      onChange={(e) => setWorkshopFormData({...workshopFormData, numeroPorta: e.target.value})}
      placeholder="123"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="codigoPostal">Código Postal *</Label>
    <Input
      id="codigoPostal"
      value={workshopFormData.codigoPostal}
      onChange={(e) => {
        const value = e.target.value
        setWorkshopFormData({...workshopFormData, codigoPostal: value})
        
        // Auto-fetch location when code is complete
        if (/^\d{4}-\d{3}$/.test(value)) {
          fetchLocationFromPostalCode(value)
        }
      }}
      placeholder="1000-123"
      pattern="\d{4}-\d{3}"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="concelho">Concelho *</Label>
    <Input
      id="concelho"
      value={workshopFormData.concelho}
      onChange={(e) => setWorkshopFormData({...workshopFormData, concelho: e.target.value})}
      placeholder="Lisboa"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="localidade">Localidade *</Label>
    <Input
      id="localidade"
      value={workshopFormData.localidade}
      onChange={(e) => setWorkshopFormData({...workshopFormData, localidade: e.target.value})}
      placeholder="Baixa"
      required
    />
  </div>
</div>

// Auto-complete function
const fetchLocationFromPostalCode = async (postalCode: string) => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/postal-code/${postalCode}`,
      {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      setWorkshopFormData(prev => ({
        ...prev,
        concelho: data.concelho,
        localidade: data.localidade
      }))
      toast.success('Localidade preenchida automaticamente!')
    }
  } catch (error) {
    console.error('Error fetching postal code:', error)
  }
}
```

## 📝 Migração de Dados Existentes

Para oficinas que já existem com campo `address` único:

```typescript
// Script de migração (executar uma vez)
app.post('/make-server-6971b43c/admin/migrate-addresses', requireAdmin, async (c) => {
  try {
    const workshops = await kv.getByPrefix('workshop:')
    let migratedCount = 0
    
    for (const workshop of workshops) {
      // Se já tem campos novos, skip
      if (workshop.rua && workshop.codigoPostal) {
        continue
      }
      
      // Parse address (best effort)
      if (workshop.address) {
        // Exemplo básico - em produção, usar regex mais robusto
        const parts = workshop.address.split(',').map((s: string) => s.trim())
        
        workshop.rua = parts[0] || ''
        workshop.numeroPorta = parts[1] || ''
        workshop.codigoPostal = parts[2] || ''
        workshop.concelho = parts[3] || ''
        workshop.localidade = parts[4] || ''
        
        await kv.set(`workshop:${workshop.id}`, workshop)
        migratedCount++
      }
    }
    
    return c.json({ 
      success: true, 
      migrated: migratedCount,
      message: `${migratedCount} oficinas migradas com sucesso`
    })
  } catch (error) {
    return c.json({ error: 'Erro na migração' }, 500)
  }
})
```

## 🎯 Benefícios da Estrutura Detalhada

### 1. Pesquisa Mais Precisa
- Filtrar por concelho específico
- Pesquisar por código postal
- Localização exata no mapa

### 2. Validação de Dados
- Código postal em formato correto
- Campos obrigatórios
- Preenchimento automático

### 3. Melhor UX
- Autocompletar localidade via código postal
- Dropdowns de concelhos conhecidos
- Sugestões baseadas em outras oficinas

### 4. Integração com APIs
- Google Maps API (geocoding)
- Cálculo de distâncias
- Direções para a oficina

### 5. Análise de Dados
- Oficinas por distrito
- Cobertura geográfica
- Estatísticas regionais

## 🗺️ Próximos Passos - Geolocalização

### Adicionar Coordenadas GPS

```typescript
interface WorkshopLocation {
  latitude: number
  longitude: number
}

// Exemplo
{
  rua: "Avenida da Liberdade",
  numeroPorta: "123",
  codigoPostal: "1250-123",
  concelho: "Lisboa",
  localidade: "Lisboa",
  latitude: 38.7169,
  longitude: -9.1399
}
```

### Geocoding Automático

```typescript
// Usando Google Maps Geocoding API
async function geocodeAddress(workshop: Workshop): Promise<Coordinates> {
  const address = `${workshop.rua} ${workshop.numeroPorta}, ${workshop.codigoPostal} ${workshop.concelho}`
  
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`
  )
  
  const data = await response.json()
  
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location
    return {
      latitude: location.lat,
      longitude: location.lng
    }
  }
  
  throw new Error('Address not found')
}
```

### Cálculo de Distância

```typescript
// Haversine formula
function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in km
}
```

## 📋 Checklist de Implementação

- [x] Backend - Campos de morada estruturados
- [x] Backend - Endpoint de validação de código postal
- [x] Backend - Filtro por concelho/localidade
- [ ] Frontend - AdminPanel atualizado com novos campos
- [ ] Frontend - Autocompletar via código postal
- [ ] Migração - Script para dados existentes
- [ ] API - Integração com serviço de códigos postais
- [ ] Geolocalização - Coordenadas GPS
- [ ] Geolocalização - Google Maps integration
- [ ] Geolocalização - Cálculo de distância

## ⚠️ Considerações Importantes

### Privacidade
- Morada completa é pública (necessário para clientes)
- NIF é opcional e pode ser ocultado
- Telefone e email são para contacto público

### Performance
- Cache de códigos postais no KV store
- Rate limiting na API externa
- Fallback quando API falha

### Compatibilidade
- Manter campo `address` para backwards compatibility
- Preencher automaticamente `address` a partir dos campos novos
- Migração gradual de dados existentes

---

**Versão:** 1.0 - Sistema de Moradas Estruturadas  
**Data:** 1 de Novembro de 2025  
**Status:** ✅ Backend Implementado | ⏳ Frontend em Progresso
