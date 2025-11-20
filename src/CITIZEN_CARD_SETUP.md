# Configuração do Leitor de Cartão de Cidadão - OficinasExpress

## ✅ Funcionalidade Ativada

A funcionalidade de leitura do Cartão de Cidadão está agora **totalmente ativada** no módulo de Clientes.

## 🔧 Como Funciona

O sistema tenta conectar-se ao middleware **Autenticação.Gov** que deve estar instalado e em execução na sua máquina local. O middleware faz a ponte entre o leitor USB e a aplicação web.

### Fluxo de Funcionamento:

1. **Tentativa de Conexão Local** (Produção):
   - O sistema tenta conectar aos seguintes endereços locais:
     - `http://localhost:38000/read`
     - `http://localhost:8080/read`
     - `http://127.0.0.1:38000/read`
     - `http://127.0.0.1:8080/read`

2. **Modo de Demonstração** (Fallback):
   - Se o middleware não for encontrado, o sistema usa dados simulados automaticamente
   - Você verá uma notificação informando que está em modo de demonstração

## 📦 Instalação do Middleware Autenticação.Gov

### 1. Download

Aceda ao site oficial:
**https://www.autenticacao.gov.pt**

### 2. Escolha a Versão para o Seu Sistema

- **Windows**: Download do instalador .exe
- **macOS**: Download do instalador .pkg
- **Linux**: Download do pacote .deb ou .rpm

### 3. Instalação

1. Execute o instalador descarregado
2. Siga as instruções no ecrã
3. **Importante**: Reinicie o computador após a instalação

### 4. Verificar Instalação

#### Windows:
1. Abra o menu Iniciar
2. Procure por "Autenticação.Gov"
3. Execute a aplicação
4. Verifique se o serviço está em execução

#### macOS:
1. Abra as Aplicações
2. Procure por "Autenticação.Gov"
3. Execute a aplicação
4. Verifique se está em execução na barra de menu

#### Linux:
```bash
# Verificar se o serviço está em execução
systemctl status pteid

# Iniciar o serviço se necessário
sudo systemctl start pteid
```

## 🔌 Hardware Necessário

### Leitores de Cartões Compatíveis

Qualquer leitor USB compatível com Smart Cards ISO 7816:

#### Recomendados:
- **ACR38** / ACR38U-N1
- **SCM SCR3310**
- **Gemalto PC Twin Reader**
- **Identive CLOUD 2700 R**
- **Bit4id miniLector EVO**

#### Verificação:
1. Conecte o leitor USB
2. Insira o Cartão de Cidadão
3. O LED do leitor deve acender

## 🚀 Como Usar na OficinasExpress

### Passo a Passo:

1. **Preparação**:
   - Certifique-se de que o middleware está em execução
   - Conecte o leitor USB
   - Insira o Cartão de Cidadão

2. **No Sistema**:
   - Aceda ao módulo **Clientes**
   - Clique no botão **"Leitor de Cartão"**
   - Clique em **"Ler Cartão"**

3. **Aguarde**:
   - O sistema irá conectar ao middleware
   - Os dados serão lidos automaticamente
   - Tempo estimado: 2-5 segundos

4. **Dados Lidos**:
   - ✅ Nome completo
   - ✅ NIF (Número de Identificação Fiscal)
   - ✅ Morada
   - ⚠️ **Telefone**: NÃO está no cartão - deve adicionar manualmente
   - ⚠️ **Email**: NÃO está no cartão - pode adicionar (opcional)

5. **Finalização**:
   - Preencha o campo **Telefone** (obrigatório)
   - Adicione o **Email** se disponível (opcional)
   - Clique em **"Criar Cliente"**

## ⚙️ Configuração Avançada do Middleware

### Alterar a Porta do Middleware

Se o seu middleware estiver configurado para usar uma porta diferente:

1. Abra o ficheiro de configuração do middleware
2. Localize a definição da porta
3. Ajuste conforme necessário
4. Reinicie o serviço

**Nota**: A OficinasExpress tenta automaticamente as portas mais comuns (38000 e 8080).

### Firewall

Se tiver problemas de conexão, verifique se o firewall não está a bloquear:
- Porta **38000** (padrão)
- Porta **8080** (alternativa)
- Conexões de **localhost** / **127.0.0.1**

#### Windows Defender:
```
1. Painel de Controlo > Sistema e Segurança > Firewall do Windows
2. Permitir uma aplicação através do Firewall
3. Adicionar "Autenticação.Gov"
```

#### macOS:
```
1. Preferências do Sistema > Segurança e Privacidade > Firewall
2. Opções de Firewall
3. Adicionar "Autenticação.Gov"
```

## 🐛 Resolução de Problemas

### Erro: "Middleware local não encontrado"

**Causa**: O serviço do middleware não está em execução ou está a usar uma porta diferente.

**Solução**:
1. Verifique se a aplicação Autenticação.Gov está aberta
2. Reinicie a aplicação
3. Verifique os processos em execução:
   - Windows: Gestor de Tarefas
   - macOS: Monitor de Atividade
   - Linux: `ps aux | grep pteid`

### Erro: "Leitor não detectado"

**Causa**: O leitor de cartões não está conectado ou não tem drivers instalados.

**Solução**:
1. Desconecte e reconecte o leitor USB
2. Tente outra porta USB
3. Reinstale os drivers do leitor
4. Teste o leitor com a aplicação oficial do middleware

### Erro: "Cartão não lido"

**Causa**: O cartão está mal inserido ou danificado.

**Solução**:
1. Remova e reinsira o cartão corretamente
2. Limpe os contactos do cartão com um pano seco
3. Teste com outro Cartão de Cidadão se possível
4. Verifique se o cartão está dentro da validade

### Timeout na Leitura

**Causa**: O middleware está lento ou sobrecarregado.

**Solução**:
1. Aguarde alguns segundos e tente novamente
2. Reinicie o middleware
3. Verifique se existem atualizações disponíveis
4. Feche outras aplicações que possam estar a usar o leitor

## 🔒 Segurança e Privacidade

### Dados Recolhidos

O sistema recolhe apenas os dados essenciais do cartão:
- Nome completo
- NIF
- Morada

### Conformidade RGPD

- ✅ Consentimento explícito do cliente antes da leitura
- ✅ Dados processados localmente (não são enviados para servidores externos durante a leitura)
- ✅ Armazenamento seguro na base de dados da oficina
- ✅ Acesso controlado por autenticação
- ✅ Logs de auditoria de acessos

### Boas Práticas

1. **Sempre peça autorização** ao cliente antes de ler o cartão
2. **Explique** para que serão usados os dados
3. **Não recolha** dados desnecessários
4. **Proteja** os dados com palavras-passe fortes
5. **Implemente** políticas de retenção de dados

## 📊 Dados Disponíveis vs. Não Disponíveis

### ✅ Disponíveis no Cartão

| Dado | Descrição |
|------|-----------|
| Nome Completo | Nome civil completo |
| NIF | Número de Identificação Fiscal |
| Morada | Morada fiscal registada |
| Data de Nascimento | Data de nascimento |
| Validade | Data de validade do documento |
| Nº Documento | Número do Cartão de Cidadão |

### ❌ NÃO Disponíveis no Cartão

| Dado | Solução |
|------|---------|
| Telefone | Preencher manualmente (obrigatório) |
| Email | Preencher manualmente (opcional) |
| Profissão | Não aplicável |
| Estado Civil | Não incluído no cartão standard |

## 🌐 Modo Online vs. Offline

### Modo Online (Com Middleware)
- ✅ Leitura real do cartão físico
- ✅ Dados atualizados e corretos
- ✅ Validação automática
- ⚠️ Requer hardware e software instalado

### Modo Offline (Simulação)
- ⚠️ Dados de demonstração
- ⚠️ Apenas para testes
- ✅ Não requer hardware
- ✅ Útil para formação e demos

**O sistema alterna automaticamente** entre os dois modos.

## 📞 Suporte Técnico

### Suporte do Middleware Autenticação.Gov

- **Site**: https://www.autenticacao.gov.pt
- **Email**: info.cidadao@ama.pt
- **Telefone**: (+351) 211 509 509
- **Horário**: Segunda a Sexta, 9h-18h

### Suporte OficinasExpress

Para questões específicas sobre a integração na plataforma OficinasExpress, contacte o suporte da sua oficina.

## 📚 Recursos Adicionais

- [Manual Oficial do Middleware](https://www.autenticacao.gov.pt/documents)
- [FAQ - Cartão de Cidadão](https://www.autenticacao.gov.pt/faq)
- [Guia de Instalação de Leitores](https://www.autenticacao.gov.pt/leitores)
- [Documentação Técnica API](https://www.autenticacao.gov.pt/api-docs)

## 🔄 Atualizações

### Verificar Versão do Middleware

1. Abra a aplicação Autenticação.Gov
2. Vá a "Ajuda" > "Acerca de"
3. Verifique a versão instalada
4. Compare com a versão mais recente no site oficial

### Atualizar

É recomendado manter o middleware sempre atualizado para:
- Correções de segurança
- Melhor compatibilidade
- Novos recursos
- Correção de bugs

---

**Última atualização**: Novembro 2024  
**Versão do guia**: 1.0  
**Sistema**: OficinasExpress - Módulo de Clientes
