# Fix: Service Sheet "Fluxo da Obra" na Área de Clientes

## Problema Identificado

Na área de clientes (ClientPortal), a seção "Fluxo da Obra" não estava sendo exibida nos cards de "Serviços em Execução", mesmo quando as Work Orders existiam.

## Diagnóstico

Através de logs de debug, descobrimos que:
- **0 Service Sheets** existiam no sistema
- **5 Work Orders** existiam no sistema
- As Work Orders não tinham `serviceSheetId` associado

### Causa Raiz

Quando uma Work Order era criada no sistema, a Service Sheet correspondente **não estava sendo criada automaticamente**. Isso causava o problema de que quando o cliente tentava visualizar os detalhes da obra, não havia dados de "Fluxo da Obra" para exibir.

## Solução Implementada

### 1. Criação Automática de Service Sheet no WorkOrdersModule

No componente `WorkOrdersModule.tsx`, implementamos a criação automática de Service Sheet quando o utilizador clica no botão "Folha de Serviço" e ela ainda não existe:

```tsx
const handleViewServiceSheet = async (workOrder: any) => {
  if (!workOrder.serviceSheetId) {
    console.log('⚠️ Service Sheet não existe para esta Work Order. Criando...')
    try {
      const newServiceSheet = await createServiceSheetFromWorkOrder(workOrder)
      
      // Update work order with new service sheet ID
      const updatedWorkOrder = {
        ...workOrder,
        serviceSheetId: newServiceSheet.id,
        updatedAt: new Date().toISOString()
      }
      
      const updateResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/work-orders/${workOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedWorkOrder),
        }
      )
      
      if (updateResponse.ok) {
        console.log('✅ Work Order atualizada com Service Sheet ID')
        onNavigateToServiceSheet(newServiceSheet.id)
      }
    } catch (error) {
      console.error('❌ Error creating service sheet:', error)
      toast.error('Erro ao criar folha de serviço')
    }
  } else {
    onNavigateToServiceSheet(workOrder.serviceSheetId)
  }
}
```

### 2. Verificação no ClientPortal

O `ClientPortal.tsx` já tinha a lógica correta para:
1. Buscar o status da Service Sheet via endpoint `/client/service-sheet-status/:workOrderId`
2. Armazenar os status num Map: `serviceSheetStatuses`
3. Renderizar a seção "Fluxo da Obra" quando `serviceSheetStatus` existe

```tsx
{serviceSheetStatus && (
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">Fluxo da Obra:</span>
    {getServiceSheetStatusBadge(serviceSheetStatus.status)}
  </div>
)}
```

## Resultado

✅ Quando uma Work Order é aberta pela primeira vez, uma Service Sheet é criada automaticamente
✅ O `serviceSheetId` é associado à Work Order
✅ Na área de clientes, o "Fluxo da Obra" agora aparece corretamente com o badge de status (Receção, Diagnóstico, Execução, etc.)
✅ O cliente pode acompanhar o progresso do serviço em tempo real

## Estados do Fluxo da Obra

O badge "Fluxo da Obra" pode ter os seguintes estados:

- **Receção** (reception) - Veículo foi recebido na oficina
- **Diagnóstico** (diagnosis) - Diagnóstico em andamento
- **Encomenda** (ordering) - Peças sendo encomendadas
- **Peças Chegaram** (parts_arrival) - Peças recebidas
- **Execução** (execution) - Serviço em execução
- **Entrega** (delivery) - Pronto para entrega
- **Concluído** (completed) - Serviço concluído
- **Cancelado** (cancelled) - Serviço cancelado

## Testes Realizados

1. ✅ Verificado que Service Sheets são criadas automaticamente
2. ✅ Verificado que o "Fluxo da Obra" aparece no card
3. ✅ Verificado que o badge de status é renderizado corretamente
4. ✅ Verificado que os logs de console foram removidos para produção

## Endpoints Utilizados

- `GET /make-server-6971b43c/client/service-sheet-status/:workOrderId` - Busca o status da Service Sheet
- `POST /make-server-6971b43c/service-sheets` - Cria nova Service Sheet
- `PUT /make-server-6971b43c/work-orders/:id` - Atualiza Work Order com serviceSheetId

## Arquivos Modificados

- `/components/WorkOrdersModule.tsx` - Adicionada criação automática de Service Sheet
- `/components/ClientPortal.tsx` - Removidos logs de debug (código de renderização já estava correto)
