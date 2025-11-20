import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  BookOpen, Server, Database, Code, Globe, Lock, CheckCircle, 
  AlertTriangle, Terminal, FileCode, Settings, Zap, CloudUpload,
  Eye, RefreshCw, Shield, Key, Mail, ExternalLink, Copy, Rocket
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'

export function ProductionDocumentation() {
  const copyToClipboard = (text: string, label: string) => {
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      
      // Execute copy command
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (successful) {
        toast.success(`${label} copiado!`)
      } else {
        toast.error('Erro ao copiar. Por favor, copie manualmente.')
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Erro ao copiar. Por favor, copie manualmente.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Documentação de Produção
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Guia completo para migrar a OficinasExpress do Figma Make para produção com Supabase
          </p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 px-6 py-2 text-base">
          <Rocket className="h-5 w-5 mr-2" />
          Deploy para Produção
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-8 w-full bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-200 p-1">
          <TabsTrigger value="overview">
            <BookOpen className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="supabase">
            <Database className="h-4 w-4 mr-2" />
            Supabase
          </TabsTrigger>
          <TabsTrigger value="functions">
            <Code className="h-4 w-4 mr-2" />
            Edge Functions
          </TabsTrigger>
          <TabsTrigger value="frontend">
            <Globe className="h-4 w-4 mr-2" />
            Frontend
          </TabsTrigger>
          <TabsTrigger value="env">
            <Key className="h-4 w-4 mr-2" />
            Variáveis
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="migration">
            <CloudUpload className="h-4 w-4 mr-2" />
            Migração
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <CheckCircle className="h-4 w-4 mr-2" />
            Checklist
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-orange-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BookOpen className="h-6 w-6" />
                Visão Geral do Processo
              </CardTitle>
              <CardDescription>
                Entenda a arquitetura e os passos necessários para o deploy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-white rounded-lg p-6 border-2 border-blue-200">
                <h3 className="font-bold text-lg text-blue-900 mb-4">Arquitetura da Aplicação</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border border-blue-300">
                    <Globe className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-blue-900">Frontend</h4>
                    <p className="text-sm text-blue-700 mt-2">React + TypeScript + Tailwind CSS</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-lg border border-green-300">
                    <Server className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-semibold text-green-900">Backend</h4>
                    <p className="text-sm text-green-700 mt-2">Supabase Edge Functions (Deno + Hono)</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-lg border border-purple-300">
                    <Database className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-purple-900">Database</h4>
                    <p className="text-sm text-purple-700 mt-2">Supabase PostgreSQL + KV Store</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg p-6 border-2 border-orange-200">
                <h3 className="font-bold text-lg text-orange-900 mb-4">Passos Principais do Deploy</h3>
                <div className="space-y-3">
                  {[
                    { step: 1, title: 'Criar Projeto Supabase em Produção', time: '5 min' },
                    { step: 2, title: 'Configurar Database e Tabelas', time: '10 min' },
                    { step: 3, title: 'Deploy das Edge Functions', time: '15 min' },
                    { step: 4, title: 'Deploy do Frontend', time: '10 min' },
                    { step: 5, title: 'Configurar Variáveis de Ambiente', time: '10 min' },
                    { step: 6, title: 'Migração de Dados (se necessário)', time: '20-60 min' },
                    { step: 7, title: 'Configurar Domínio Personalizado', time: '15 min' },
                    { step: 8, title: 'Testes de Produção', time: '30 min' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4 bg-white p-4 rounded-lg border border-orange-200">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.title}</p>
                      </div>
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        ~{item.time}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-2">Pontos de Atenção</h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>O ambiente Figma Make é de desenvolvimento/prototipagem - não use em produção</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>Todos os dados do Figma Make precisam ser migrados manualmente</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>Configure backups automáticos no Supabase em produção</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-600">•</span>
                        <span>Revise todas as chaves de API e secrets antes do deploy</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supabase Tab */}
        <TabsContent value="supabase" className="space-y-6 mt-6">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Database className="h-6 w-6" />
                Passo 1: Configurar Projeto Supabase
              </CardTitle>
              <CardDescription>
                Crie e configure o projeto Supabase de produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Criar Projeto */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">1</span>
                  Criar Novo Projeto Supabase
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-green-700 flex-shrink-0">1.1</span>
                      <div>
                        <p>Aceda a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                          supabase.com/dashboard <ExternalLink className="h-3 w-3" />
                        </a></p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-green-700 flex-shrink-0">1.2</span>
                      <p>Clique em <strong>"New Project"</strong></p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-green-700 flex-shrink-0">1.3</span>
                      <div className="flex-1">
                        <p className="mb-2">Preencha os dados:</p>
                        <div className="bg-white border border-green-300 rounded p-4 space-y-2 font-mono text-xs">
                          <div><strong>Name:</strong> OficinasExpress-Production</div>
                          <div><strong>Database Password:</strong> [Senha forte - guarde num gestor de passwords]</div>
                          <div><strong>Region:</strong> Europe West (London) ou mais próximo</div>
                          <div><strong>Pricing Plan:</strong> Pro (recomendado para produção)</div>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-green-700 flex-shrink-0">1.4</span>
                      <p>Aguarde 2-3 minutos pela criação do projeto</p>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Obter Credenciais */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">2</span>
                  Obter Credenciais do Projeto
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm mb-4">No dashboard do projeto, vá em <strong>Settings → API</strong> e copie:</p>
                  <div className="space-y-4">
                    <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-green-800">Project URL</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs font-mono border">
                          https://[your-project-id].supabase.co
                        </code>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Copie do seu projeto')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-green-800">anon / public Key</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs font-mono border">
                          eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        </code>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Copie do seu projeto')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-red-300 rounded-lg p-4">
                      <Label className="text-xs font-semibold text-red-800">service_role Key (SECRETO)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs font-mono border">
                          eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                        </code>
                        <Button size="sm" variant="outline" onClick={() => toast.info('Copie do seu projeto')}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        NUNCA exponha esta chave no frontend!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Criar Tabela KV */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">3</span>
                  Criar Tabela Key-Value Store
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm mb-4">No dashboard, vá em <strong>SQL Editor</strong> e execute:</p>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-gray-500">-- Criar tabela KV Store</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-green-400 hover:text-green-300"
                        onClick={() => copyToClipboard(`CREATE TABLE IF NOT EXISTS kv_store_6971b43c (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para pesquisas por prefixo
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix ON kv_store_6971b43c (key text_pattern_ops);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER kv_store_updated_at_trigger
BEFORE UPDATE ON kv_store_6971b43c
FOR EACH ROW
EXECUTE FUNCTION update_kv_store_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE kv_store_6971b43c ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas via service role
CREATE POLICY "Allow service role access" ON kv_store_6971b43c
FOR ALL USING (auth.role() = 'service_role');`, 'SQL Script')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap">
{`CREATE TABLE IF NOT EXISTS kv_store_6971b43c (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para pesquisas por prefixo
CREATE INDEX IF NOT EXISTS idx_kv_store_key_prefix 
ON kv_store_6971b43c (key text_pattern_ops);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_kv_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER kv_store_updated_at_trigger
BEFORE UPDATE ON kv_store_6971b43c
FOR EACH ROW
EXECUTE FUNCTION update_kv_store_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE kv_store_6971b43c ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso apenas via service role
CREATE POLICY "Allow service role access" ON kv_store_6971b43c
FOR ALL USING (auth.role() = 'service_role');`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Configurar Auth */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm">4</span>
                  Configurar Autenticação
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm mb-4">Vá em <strong>Authentication → Settings</strong>:</p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Ative <strong>Email Confirmations</strong> (envio de email de confirmação)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Configure <strong>Site URL</strong> para o seu domínio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Adicione <strong>Redirect URLs</strong> permitidos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Configure SMTP para envio de emails (ou use o gratuito do Supabase)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edge Functions Tab */}
        <TabsContent value="functions" className="space-y-6 mt-6">
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Code className="h-6 w-6" />
                Passo 2: Deploy das Edge Functions
              </CardTitle>
              <CardDescription>
                Faça o deploy do backend (Edge Functions) para produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Instalar Supabase CLI */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">1</span>
                  Instalar Supabase CLI
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <p className="text-sm mb-4">Instale a CLI do Supabase no seu computador:</p>
                  <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500"># macOS / Linux</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-purple-400"
                        onClick={() => copyToClipboard('brew install supabase/tap/supabase', 'Comando')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <pre>brew install supabase/tap/supabase</pre>
                  </div>

                  <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-sm mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500"># Windows (via NPM)</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-purple-400"
                        onClick={() => copyToClipboard('npm install -g supabase', 'Comando')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <pre>npm install -g supabase</pre>
                  </div>

                  <p className="text-xs text-purple-700 mt-4">
                    Documentação completa: <a href="https://supabase.com/docs/guides/cli" target="_blank" className="text-blue-600 hover:underline">
                      supabase.com/docs/guides/cli
                    </a>
                  </p>
                </div>
              </div>

              {/* Exportar código do Figma */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">2</span>
                  Exportar Código do Figma Make
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-purple-700">2.1</span>
                      <p>No Figma Make, copie todo o conteúdo da pasta <code className="bg-purple-100 px-2 py-1 rounded text-xs">/supabase/functions/</code></p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-purple-700">2.2</span>
                      <p>Crie uma pasta local no seu computador para o projeto</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-purple-700">2.3</span>
                      <p>Cole os ficheiros na estrutura:</p>
                      <div className="bg-white border border-purple-300 rounded p-4 mt-2 font-mono text-xs">
{`oficinasexpress-production/
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx
│           ├── kv_store.tsx
│           ├── integration_routes.tsx
│           ├── moloni_routes.tsx
│           ├── tecdoc_routes.tsx
│           ├── ocr_routes.tsx
│           ├── quote_agenda_routes.tsx
│           └── infomatricula_routes.tsx`}
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Login e Link */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">3</span>
                  Conectar ao Projeto Supabase
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2">Faça login na CLI:</p>
                      <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500"># Fazer login</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-purple-400"
                            onClick={() => copyToClipboard('supabase login', 'Comando')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <pre>supabase login</pre>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm mb-2">Associe a pasta ao projeto:</p>
                      <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-500"># Na pasta do projeto</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-purple-400"
                            onClick={() => copyToClipboard('supabase link --project-ref [your-project-id]', 'Comando')}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <pre>supabase link --project-ref [your-project-id]</pre>
                      </div>
                      <p className="text-xs text-purple-700 mt-2">
                        Substitua [your-project-id] pelo ID do seu projeto (encontra em Settings → General)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deploy Functions */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">4</span>
                  Deploy das Functions
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <p className="text-sm mb-4">Faça o deploy da Edge Function:</p>
                  <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500"># Deploy da function server</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-purple-400"
                        onClick={() => copyToClipboard('supabase functions deploy server', 'Comando')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <pre>supabase functions deploy server</pre>
                  </div>

                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-900 mb-1">Sucesso!</p>
                        <p className="text-green-700">A function estará disponível em:</p>
                        <code className="text-xs bg-white px-2 py-1 rounded mt-2 inline-block border border-green-200">
                          https://[your-project-id].supabase.co/functions/v1/make-server-6971b43c
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secrets */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm">5</span>
                  Configurar Secrets da Function
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <p className="text-sm mb-4">As Edge Functions precisam de acesso às variáveis de ambiente:</p>
                  <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-xs space-y-2">
                    {[
                      'supabase secrets set SUPABASE_URL="https://[your-project-id].supabase.co"',
                      'supabase secrets set SUPABASE_ANON_KEY="[your-anon-key]"',
                      'supabase secrets set SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"',
                      'supabase secrets set OCR_API_KEY="[your-ocr-api-key]"',
                      'supabase secrets set CTT_POSTAL_CODE_API_KEY="[your-ctt-key]"',
                      'supabase secrets set RAPIDAPI_VIN_DECODER_KEY="[your-vin-key]"'
                    ].map((cmd, idx) => (
                      <div key={idx} className="flex items-center justify-between group">
                        <pre className="flex-1">{cmd}</pre>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-purple-400 opacity-0 group-hover:opacity-100"
                          onClick={() => copyToClipboard(cmd, 'Comando')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-4">
                    ⚠️ Substitua os valores entre [] pelas suas chaves reais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frontend Tab */}
        <TabsContent value="frontend" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Globe className="h-6 w-6" />
                Passo 3: Deploy do Frontend
              </CardTitle>
              <CardDescription>
                Publique o frontend React em produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Opções de Hosting */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-blue-900 mb-4">Opções de Hosting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold">Vercel</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Recomendado - Deploy automático, CDN global, SSL grátis</p>
                    <Badge className="bg-green-500 text-white text-xs">Recomendado</Badge>
                  </div>

                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-600 to-orange-400 flex items-center justify-center">
                        <Server className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold">Netlify</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Alternativa excelente, interface simples, ótima performance</p>
                    <Badge variant="outline" className="text-xs">Alternativa</Badge>
                  </div>

                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
                        <CloudUpload className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-bold">Cloudflare</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">CDN rápido, Pages grátis, boa para projetos grandes</p>
                    <Badge variant="outline" className="text-xs">Alternativa</Badge>
                  </div>
                </div>
              </div>

              {/* Deploy com Vercel */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">1</span>
                  Deploy com Vercel (Recomendado)
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <ol className="space-y-4 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.1</span>
                      <div className="flex-1">
                        <p className="mb-2">Exporte todo o código do frontend do Figma Make</p>
                        <p className="text-xs text-blue-700">Copie todos os ficheiros .tsx, .css, package.json, etc.</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.2</span>
                      <div className="flex-1">
                        <p className="mb-2">Crie um repositório Git (GitHub, GitLab ou Bitbucket)</p>
                        <div className="bg-gray-900 text-blue-400 p-3 rounded font-mono text-xs mt-2">
{`git init
git add .
git commit -m "Initial commit - OficinasExpress"
git remote add origin [your-repo-url]
git push -u origin main`}
                        </div>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.3</span>
                      <div className="flex-1">
                        <p>Aceda a <a href="https://vercel.com" target="_blank" className="text-blue-600 hover:underline">vercel.com</a> e faça login</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.4</span>
                      <p>Clique em <strong>"Import Project"</strong> e selecione o seu repositório</p>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.5</span>
                      <div className="flex-1">
                        <p className="mb-2">Configure as variáveis de ambiente (ver tab "Variáveis")</p>
                      </div>
                    </li>

                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">1.6</span>
                      <p>Clique em <strong>"Deploy"</strong> e aguarde 2-3 minutos</p>
                    </li>
                  </ol>

                  <div className="bg-green-50 border border-green-300 rounded-lg p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold text-green-900">Deploy Concluído!</p>
                        <p className="text-green-700 mt-1">A sua aplicação estará disponível em https://[project-name].vercel.app</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configurar Domínio */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm">2</span>
                  Configurar Domínio Personalizado
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">2.1</span>
                      <p>No dashboard do Vercel, vá em <strong>Settings → Domains</strong></p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">2.2</span>
                      <p>Adicione o seu domínio (ex: oficinasexpress.pt)</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">2.3</span>
                      <div className="flex-1">
                        <p className="mb-2">Configure os registos DNS no seu fornecedor de domínio:</p>
                        <div className="bg-white border border-blue-300 rounded p-3 font-mono text-xs space-y-1">
                          <div>Type: A → Value: 76.76.21.21</div>
                          <div>Type: CNAME → Name: www → Value: cname.vercel-dns.com</div>
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="font-bold text-blue-700">2.4</span>
                      <p>Aguarde propagação DNS (pode levar até 48h, mas normalmente 1-2h)</p>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Environment Variables Tab */}
        <TabsContent value="env" className="space-y-6 mt-6">
          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <Key className="h-6 w-6" />
                Variáveis de Ambiente
              </CardTitle>
              <CardDescription>
                Configure todas as variáveis necessárias para produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-orange-900 mb-4">Variáveis do Frontend (Vercel/Netlify)</h3>
                <p className="text-sm text-orange-800 mb-4">Adicione estas variáveis nas configurações do seu hosting:</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'VITE_SUPABASE_URL', value: 'https://[your-project-id].supabase.co', secret: false },
                    { key: 'VITE_SUPABASE_ANON_KEY', value: 'eyJhbGc...', secret: false },
                  ].map((env) => (
                    <div key={env.key} className="bg-white border-2 border-orange-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-mono text-sm font-bold">{env.key}</Label>
                        {!env.secret && <Badge className="bg-green-500 text-white text-xs">Público</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs border overflow-x-auto">
                          {env.value}
                        </code>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(`${env.key}="${env.value}"`, env.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-red-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Secrets da Edge Function (Supabase)
                </h3>
                <p className="text-sm text-red-800 mb-4">Configure via Supabase CLI (NÃO exponha no frontend!):</p>
                
                <div className="space-y-3">
                  {[
                    { key: 'SUPABASE_URL', desc: 'URL do projeto Supabase' },
                    { key: 'SUPABASE_ANON_KEY', desc: 'Chave pública do Supabase' },
                    { key: 'SUPABASE_SERVICE_ROLE_KEY', desc: '⚠️ CRÍTICO - Acesso total ao DB' },
                    { key: 'OCR_API_KEY', desc: 'API key para OCR de matrículas' },
                    { key: 'CTT_POSTAL_CODE_API_KEY', desc: 'API key dos CTT para códigos postais' },
                    { key: 'RAPIDAPI_VIN_DECODER_KEY', desc: 'API key para descodificar VIN' },
                  ].map((env) => (
                    <div key={env.key} className="bg-white border-2 border-red-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="font-mono text-sm font-bold text-red-900">{env.key}</Label>
                        {env.key.includes('SERVICE_ROLE') && (
                          <Badge className="bg-red-600 text-white text-xs">SECRETO</Badge>
                        )}
                      </div>
                      <p className="text-xs text-red-700">{env.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white border-2 border-red-400 rounded-lg p-4 mt-4">
                  <p className="text-sm font-bold text-red-900 mb-2">Comando para configurar:</p>
                  <div className="bg-gray-900 text-red-400 p-3 rounded font-mono text-xs">
                    supabase secrets set [KEY_NAME]="[value]"
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-3">APIs Externas Necessárias</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">OCR.space API</p>
                      <p className="text-xs text-gray-600">Para reconhecimento de matrículas por imagem</p>
                      <a href="https://ocr.space/ocrapi" target="_blank" className="text-blue-600 text-xs hover:underline">
                        ocr.space/ocrapi
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">RapidAPI VIN Decoder</p>
                      <p className="text-xs text-gray-600">Para descodificar números VIN de veículos</p>
                      <a href="https://rapidapi.com" target="_blank" className="text-blue-600 text-xs hover:underline">
                        rapidapi.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">CTT Códigos Postais API</p>
                      <p className="text-xs text-gray-600">Para validação de moradas portuguesas</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="border-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <Shield className="h-6 w-6" />
                Segurança e Boas Práticas
              </CardTitle>
              <CardDescription>
                Configurações essenciais de segurança para produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row Level Security */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-red-900 mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Row Level Security (RLS)
                </h3>
                <p className="text-sm text-red-800 mb-4">
                  CRÍTICO: Ative RLS em todas as tabelas para proteger os dados
                </p>
                <div className="bg-white border border-red-300 rounded-lg p-4">
                  <p className="text-sm mb-2 font-semibold">A tabela kv_store já tem RLS configurado ✓</p>
                  <p className="text-xs text-gray-600">
                    Se criar mais tabelas, sempre ative RLS e crie políticas apropriadas
                  </p>
                </div>
              </div>

              {/* API Keys */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-orange-900 mb-4">Gestão de API Keys</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">NUNCA exponha service_role_key no frontend</p>
                      <p className="text-xs text-orange-700">Esta chave tem acesso total ao banco de dados</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Use anon_key apenas no frontend</p>
                      <p className="text-xs text-gray-600">É segura para uso público</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Guarde todas as chaves num gestor de passwords</p>
                      <p className="text-xs text-gray-600">Ex: 1Password, Bitwarden, LastPass</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* CORS */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-blue-900 mb-4">CORS e Domínios Permitidos</h3>
                <p className="text-sm mb-4">Configure os domínios permitidos no Supabase:</p>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700">1.</span>
                    <p>Vá em <strong>Authentication → URL Configuration</strong></p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700">2.</span>
                    <p>Adicione o seu domínio em <strong>Site URL</strong></p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-blue-700">3.</span>
                    <div className="flex-1">
                      <p className="mb-2">Adicione URLs permitidos em <strong>Redirect URLs</strong>:</p>
                      <div className="bg-white border border-blue-300 rounded p-3 font-mono text-xs space-y-1">
                        <div>https://oficinasexpress.pt/**</div>
                        <div>https://www.oficinasexpress.pt/**</div>
                        <div>http://localhost:3000/**</div>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>

              {/* HTTPS */}
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-green-900 mb-4">SSL/HTTPS</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p><strong>Vercel:</strong> SSL automático e gratuito (Let's Encrypt)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p><strong>Supabase:</strong> Todas as conexões usam HTTPS por padrão</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <p>Force HTTPS em produção - não permita conexões HTTP</p>
                  </div>
                </div>
              </div>

              {/* Backups */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-purple-900 mb-4">Backups</h3>
                <p className="text-sm mb-4">Configure backups automáticos no Supabase:</p>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-700">1.</span>
                    <p>Vá em <strong>Database → Backups</strong></p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-700">2.</span>
                    <p>No plano Pro: Backups diários automáticos por 7 dias</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-700">3.</span>
                    <p>Pode fazer backups manuais a qualquer momento</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-purple-700">4.</span>
                    <p>Configure Point-in-Time Recovery (PITR) para proteção máxima</p>
                  </li>
                </ol>
              </div>

              {/* Monitoring */}
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Monitorização</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Supabase Dashboard</p>
                      <p className="text-xs text-gray-600">Monitore uso de API, DB queries, logs em tempo real</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Vercel Analytics</p>
                      <p className="text-xs text-gray-600">Performance do frontend, visitantes, erros</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Eye className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Configure alertas</p>
                      <p className="text-xs text-gray-600">Receba notificações de erros críticos ou uso elevado</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration Tab */}
        <TabsContent value="migration" className="space-y-6 mt-6">
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <CloudUpload className="h-6 w-6" />
                Migração de Dados
              </CardTitle>
              <CardDescription>
                Transfira os dados do ambiente Figma Make para produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-yellow-900 mb-2">Atenção</h3>
                    <p className="text-sm text-yellow-800">
                      Os dados do Figma Make (oficinas, utilizadores, clientes, veículos, etc.) 
                      NÃO são transferidos automaticamente. É necessário migração manual.
                    </p>
                  </div>
                </div>
              </div>

              {/* Opções de Migração */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Opções de Migração</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Opção 1: Começar do Zero */}
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900">Opção 1: Começar do Zero</h4>
                        <Badge className="bg-green-500 text-white mt-1 text-xs">Recomendado</Badge>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Mais seguro e limpo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Sem dados de teste</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Ideal para novo lançamento</span>
                      </li>
                    </ul>
                  </div>

                  {/* Opção 2: Migrar Dados */}
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center">
                        <CloudUpload className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-orange-900">Opção 2: Migrar Dados</h4>
                        <Badge variant="outline" className="mt-1 text-xs border-orange-300">Avançado</Badge>
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span>Requer scripts personalizados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span>Necessita validação dos dados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Mantém dados de desenvolvimento</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Script de Migração */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Script de Migração (Se optar por migrar)
                </h3>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <p className="text-sm mb-4">Exemplo de script Node.js para migrar dados:</p>
                  <div className="bg-gray-900 text-purple-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">// migrate.js</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-purple-400"
                        onClick={() => copyToClipboard(`// Script exemplo - adapte às suas necessidades
const { createClient } = require('@supabase/supabase-js')

// Ambiente de desenvolvimento (Figma Make)
const devSupabase = createClient(
  process.env.DEV_SUPABASE_URL,
  process.env.DEV_SUPABASE_SERVICE_KEY
)

// Ambiente de produção
const prodSupabase = createClient(
  process.env.PROD_SUPABASE_URL,
  process.env.PROD_SUPABASE_SERVICE_KEY
)

async function migrateData() {
  console.log('Iniciando migração...')
  
  // Exemplo: Migrar oficinas
  const workshops = await getFromDev('workshop_')
  for (const workshop of workshops) {
    await saveToProd(workshop.key, workshop.value)
  }
  
  console.log('Migração concluída!')
}

async function getFromDev(prefix) {
  // Implemente lógica para ler do KV store de dev
}

async function saveToProd(key, value) {
  // Implemente lógica para gravar no KV store de prod
}

migrateData()`, 'Script de Migração')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copiar
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap">{`// Script exemplo - adapte às suas necessidades
const { createClient } = require('@supabase/supabase-js')

// Ambiente de desenvolvimento (Figma Make)
const devSupabase = createClient(
  process.env.DEV_SUPABASE_URL,
  process.env.DEV_SUPABASE_SERVICE_KEY
)

// Ambiente de produção
const prodSupabase = createClient(
  process.env.PROD_SUPABASE_URL,
  process.env.PROD_SUPABASE_SERVICE_KEY
)

async function migrateData() {
  console.log('Iniciando migração...')
  
  // Exemplo: Migrar oficinas
  const workshops = await getFromDev('workshop_')
  for (const workshop of workshops) {
    await saveToProd(workshop.key, workshop.value)
  }
  
  console.log('Migração concluída!')
}`}</pre>
                  </div>
                </div>
              </div>

              {/* Dados a Considerar */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-bold text-blue-900 mb-4">Dados a Migrar (se aplicável)</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    'Oficinas (workshops)',
                    'Utilizadores (users)',
                    'Clientes',
                    'Veículos',
                    'Ordens de Trabalho',
                    'Orçamentos',
                    'Faturas',
                    'Peças/Stock',
                    'Configurações',
                    'Logs de Auditoria'
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 bg-white p-3 rounded border border-blue-200">
                      <Database className="h-4 w-4 text-blue-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-6 mt-6">
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-6 w-6" />
                Checklist de Deploy
              </CardTitle>
              <CardDescription>
                Lista completa de verificação antes e depois do deploy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pré-Deploy */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  ✅ Pré-Deploy
                </h3>
                <div className="space-y-2">
                  {[
                    'Criar conta Supabase e projeto de produção',
                    'Configurar tabela kv_store com RLS',
                    'Obter e guardar credenciais Supabase',
                    'Exportar código do Figma Make',
                    'Criar repositório Git',
                    'Configurar variáveis de ambiente',
                    'Instalar Supabase CLI',
                    'Fazer login na Supabase CLI',
                    'Testar Edge Functions localmente (opcional)',
                    'Obter API keys necessárias (OCR, VIN, CTT, MOLONI)',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="h-5 w-5 rounded border-2 border-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 bg-blue-600 rounded-sm"></div>
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Durante Deploy */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
                  🚀 Durante o Deploy
                </h3>
                <div className="space-y-2">
                  {[
                    'Deploy das Edge Functions via Supabase CLI',
                    'Configurar secrets das Edge Functions',
                    'Verificar logs das Edge Functions',
                    'Fazer deploy do frontend (Vercel/Netlify)',
                    'Configurar variáveis de ambiente do frontend',
                    'Aguardar build completar',
                    'Verificar se não há erros de build',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="h-5 w-5 rounded border-2 border-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="h-2 w-2 bg-orange-600 rounded-sm"></div>
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pós-Deploy */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  ✔️ Pós-Deploy (Testes)
                </h3>
                <div className="space-y-2">
                  {[
                    'Aceder à aplicação e verificar carregamento',
                    'Testar criação de conta de administrador',
                    'Testar login no painel ADMIN',
                    'Criar oficina de teste',
                    'Testar login com conta de oficina',
                    'Verificar todos os módulos principais',
                    'Testar integração MOLONI',
                    'Testar OCR de matrículas',
                    'Testar descodificador VIN',
                    'Verificar envio de emails',
                    'Testar Portal Público de orçamentos',
                    'Verificar responsividade mobile',
                    'Testar performance e velocidade',
                    'Configurar domínio personalizado',
                    'Configurar SSL/HTTPS',
                    'Configurar backups automáticos',
                    'Configurar monitorização e alertas',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="h-5 w-5 rounded border-2 border-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Manutenção */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                  🔧 Manutenção Contínua
                </h3>
                <div className="space-y-2">
                  {[
                    'Monitorizar logs do Supabase diariamente',
                    'Verificar uso de recursos e custos',
                    'Fazer backups manuais mensais',
                    'Atualizar dependências regularmente',
                    'Renovar certificados SSL (automático)',
                    'Verificar feedback de utilizadores',
                    'Implementar melhorias e correções',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="h-5 w-5 rounded border-2 border-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <RefreshCw className="h-3 w-3 text-purple-600" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Notes */}
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 border-2 border-blue-300 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Rocket className="h-12 w-12 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-xl text-blue-900 mb-2">Parabéns! 🎉</h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Se completou todos os passos acima, a sua plataforma OficinasExpress está oficialmente em produção!
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-2">Próximos passos recomendados:</p>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• Criar documentação interna para a equipa</li>
                        <li>• Configurar emails transacionais profissionais</li>
                        <li>• Implementar analytics (Google Analytics, Mixpanel, etc.)</li>
                        <li>• Configurar sistema de suporte ao cliente</li>
                        <li>• Planear roadmap de funcionalidades futuras</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
