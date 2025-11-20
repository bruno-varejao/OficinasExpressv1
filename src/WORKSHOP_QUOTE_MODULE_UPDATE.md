# Atualização do Módulo de Pedidos de Orçamento da Oficina

## Problemas Identificados

1. ❌ **Oficina não vê pedidos escolhidos pelo cliente**
   - Endpoint `/workshop-requests/pending` só mostra pedidos com status "pending"
   - Quando cliente escolhe oficina, pedido já está com status "validated"/"modified"

2. ❌ **Falta tab "Escolhidos"**
   - Interface não tem separação para pedidos escolhidos pelo cliente
   - Oficina não sabe quando foi selecionada

3. ❌ **Falta solicitação de agendamento**
   - Quando cliente escolhe oficina, não há fluxo de agendamento
   - Cliente espera ser contactado mas não há ação clara

## Soluções Implementadas

### Backend

✅ **Criado novo endpoint `/workshop-requests/all`**
- Retorna TODOS os pedidos da oficina (pending, validated, modified, rejected, chosen)
- Adiciona flag `isChosenByClient` quando cliente seleciona a oficina
- Retorna resumo com contagens por categoria

### Frontend

✅ **Adicionadas Tabs**
1. **Pendentes**: Pedidos aguardando resposta da oficina
2. **Escolhidos**: Pedidos onde o cliente escolheu esta oficina (NOVO!)
3. **Respondidos**: Pedidos com resposta enviada
4. **Rejeitados**: Pedidos rejeitados pela oficina

✅ **Tab "Escolhidos" destaca**:
- Card com borda verde
- Badge "Escolhido pelo Cliente"
- Alerta para contactar cliente e agendar
- Dados completos do cliente visíveis

## Próximos Passos Necessários

### 1. Completar as Tabs
Arquivo: `/components/WorkshopQuoteRequestsModule.tsx`

Adicionar após linha 435 (antes do Dialog):

```tsx
            </TabsContent>
            
            {/* CHOSEN BY CLIENT TAB */}
            <TabsContent value="chosen">
              {chosenRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum pedido escolhido
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ainda não foi escolhido por nenhum cliente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {chosenRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-all border-2 border-green-500 bg-green-50">
                      <CardHeader>
                        <Badge className="bg-green-600 w-fit">
                          <Star className="h-3 w-3 mr-1" />
                          Escolhido pelo Cliente
                        </Badge>
                        <CardTitle className="text-lg mt-2">{request.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Car className="h-4 w-4" />
                            <span className="font-bold">{request.licensePlate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4" />
                            <span>{request.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4" />
                            <a href={`tel:${request.clientPhone}`} className="text-blue-600">{request.clientPhone}</a>
                          </div>
                        </div>
                        
                        {request.workshopResponse && (
                          <div className="p-3 bg-white rounded border border-green-300">
                            <div className="flex justify-between mb-1">
                              <span>Preço:</span>
                              <span className="font-bold">€{request.workshopResponse.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Duração:</span>
                              <span className="font-bold">{request.workshopResponse.duration} min</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 mt-0.5" />
                            <div>
                              <p className="font-semibold mb-1">Próximo Passo</p>
                              <p className="text-sm">Entre em contacto para agendar o serviço</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* RESPONDED TAB */}
            <TabsContent value="responded">
              {respondedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Nenhum pedido respondido</h3>
                    <p className="text-sm text-gray-500">Não há pedidos com resposta enviada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {respondedRequests.map((request) => (
                    <Card key={request.id} className="border-2 border-blue-200">
                      <CardHeader>
                        {getStatusBadge(request.status)}
                        <CardTitle className="text-lg mt-2">{request.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          <span className="font-bold">{request.licensePlate}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm">{request.clientName}</span>
                        </div>
                        {request.workshopResponse && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex justify-between">
                              <span>Preço:</span>
                              <span className="font-bold">€{request.workshopResponse.price.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 text-center">Aguardando escolha do cliente</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* REJECTED TAB */}
            <TabsContent value="rejected">
              {rejectedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Nenhum pedido rejeitado</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {rejectedRequests.map((request) => (
                    <Card key={request.id} className="border-2 border-red-200 opacity-75">
                      <CardHeader>
                        {getStatusBadge(request.status)}
                        <CardTitle className="text-lg mt-2 text-gray-500">{request.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Car className="h-4 w-4" />
                          {request.licensePlate}
                        </div>
                        {request.workshopResponse?.notes && (
                          <div className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                            <p className="text-xs text-red-800 font-semibold mb-1">Motivo:</p>
                            <p className="text-gray-600">{request.workshopResponse.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
```

### 2. Adicionar Fluxo de Agendamento

Quando o cliente escolhe a oficina no novo sistema, devemos:

1. ✅ Marcar oficina como escolhida (já implementado)
2. ❌ Solicitar data/hora desejada para agendamento
3. ❌ Enviar notificação para oficina com dados do agendamento
4. ❌ Permitir oficina confirmar/alterar horário

## Status

- [x] Backend: Endpoint `/workshop-requests/all` criado
- [x] Backend: Detecção de sistema (antigo vs novo) no approve
- [x] Frontend: Estrutura de tabs criada
- [ ] Frontend: Tabs adicionais precisam ser inseridas no arquivo
- [ ] Fluxo de agendamento completo
