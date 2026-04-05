import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface CopyState {
  [key: string]: boolean;
}

export default function API() {
  const [copied, setCopied] = useState<CopyState>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  const CodeBlock = ({ code, id, label }: { code: string; id: string; label?: string }) => (
    <div className="relative">
      {label && <div className="mb-2 text-xs font-medium text-[hsl(var(--muted-ink))]">{label}</div>}
      <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-50">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copied[id] ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="rounded-3xl border bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--brand)/0.12)]">
            <Code2 className="h-6 w-6 text-[hsl(var(--brand))]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[hsl(var(--ink))]">
              Documentação da API
            </h1>
            <p className="text-sm text-[hsl(var(--muted-ink))]">
              Todas as informações necessárias para integração com o Supabase
            </p>
          </div>
        </div>
      </div>

      {/* Supabase Configuration */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          🔐 Configuração do Supabase
        </h2>
        <div className="grid gap-4">
          <div>
            <div className="mb-2 text-sm font-medium text-[hsl(var(--muted-ink))]">Project URL</div>
            <CodeBlock code={SUPABASE_URL} id="supabase-url" />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-[hsl(var(--muted-ink))]">Anon Key</div>
            <CodeBlock code={SUPABASE_ANON_KEY} id="supabase-key" />
          </div>
        </div>
      </Card>

      {/* JavaScript/TypeScript Client */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          📦 Inicializar Cliente Supabase
        </h2>
        <CodeBlock
          code={`import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = '${SUPABASE_URL}'
const SUPABASE_KEY = '${SUPABASE_ANON_KEY}'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)`}
          id="supabase-client"
        />
      </Card>

      {/* Data Structure */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          📊 Estrutura de Dados
        </h2>
        <div className="grid gap-6">
          {/* Projects Table */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">Tabela: projects</h3>
            <CodeBlock
              code={`{
  id: UUID,
  owner_user_id: UUID,
  project_number: string | null,
  name: string,
  description: string | null,
  duration_months: integer,
  execution_year: integer,
  status: "ativo" | "pausado" | "finalizado",
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: timestamp | null
}`}
              id="table-projects"
              label="Campos da tabela"
            />
          </div>

          {/* Budget Table */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">Tabela: budgets</h3>
            <CodeBlock
              code={`{
  id: UUID,
  project_id: UUID,
  budget_year: integer,
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: timestamp | null
}`}
              id="table-budgets"
              label="Campos da tabela"
            />
          </div>

          {/* Budget Lines Table */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">Tabela: budget_lines</h3>
            <CodeBlock
              code={`{
  id: UUID,
  budget_id: UUID,
  code: string,
  description: string,
  total_approved: numeric,
  is_subtotal: boolean,
  parent_id: UUID | null,
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: timestamp | null
}`}
              id="table-budget-lines"
              label="Campos da tabela"
            />
          </div>

          {/* Transactions Table */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">Tabela: transactions</h3>
            <CodeBlock
              code={`{
  id: UUID,
  project_id: UUID,
  budget_id: UUID,
  budget_line_id: UUID | null,
  amount: numeric,
  description: string,
  transaction_date: date,
  document_type: string | null,
  document_number: string | null,
  created_at: timestamp,
  updated_at: timestamp,
  deleted_at: timestamp | null
}`}
              id="table-transactions"
              label="Campos da tabela"
            />
          </div>
        </div>
      </Card>

      {/* API Queries */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          🔍 Queries Essenciais
        </h2>
        <div className="grid gap-6">
          {/* Get all projects */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">Obter todos os projetos</h3>
            <CodeBlock
              code={`const { data: projects, error } = await supabase
  .from('projects')
  .select('*')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })`}
              id="query-all-projects"
              label="JavaScript"
            />
          </div>

          {/* Get projects by status and year */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">
              Projetos por status e ano
            </h3>
            <CodeBlock
              code={`const { data: projects, error } = await supabase
  .from('projects')
  .select('id, name, status, execution_year')
  .is('deleted_at', null)
  .eq('execution_year', 2026)
  .eq('status', 'ativo')
  .order('created_at', { ascending: false })`}
              id="query-projects-by-status-year"
              label="JavaScript"
            />
          </div>

          {/* Get balancete (budget summary) */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">
              Obter balancete geral (resumo de orçamentos)
            </h3>
            <CodeBlock
              code={`// 1. Buscar todos os projetos não deletados
const { data: projects } = await supabase
  .from('projects')
  .select('id, name, execution_year, status')
  .is('deleted_at', null)

// 2. Buscar budgets de todos os projetos
const projectIds = projects.map(p => p.id)
const { data: budgets } = await supabase
  .from('budgets')
  .select('id, project_id, budget_year')
  .in('project_id', projectIds)
  .is('deleted_at', null)

// 3. Buscar linhas de orçamento
const budgetIds = budgets.map(b => b.id)
const { data: lines } = await supabase
  .from('budget_lines')
  .select('budget_id, total_approved')
  .in('budget_id', budgetIds)
  .is('deleted_at', null)

// 4. Buscar transações
const { data: transactions } = await supabase
  .from('transactions')
  .select('project_id, budget_id, amount')
  .in('project_id', projectIds)
  .is('deleted_at', null)

// Resultado: você terá dados de orçado vs executado por projeto`}
              id="query-balancete-geral"
              label="JavaScript"
            />
          </div>

          {/* Get project details with balance */}
          <div>
            <h3 className="mb-3 font-semibold text-[hsl(var(--ink))]">
              Detalhes de um projeto com saldo
            </h3>
            <CodeBlock
              code={`const projectId = 'xxxxx'

// Projeto
const { data: project } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single()

// Orçamento ativo
const { data: budget } = await supabase
  .from('budgets')
  .select('*')
  .eq('project_id', projectId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Linhas do orçamento
const { data: lines } = await supabase
  .from('budget_lines')
  .select('*')
  .eq('budget_id', budget.id)

// Transações do projeto
const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('project_id', projectId)
  .is('deleted_at', null)`}
              id="query-project-with-balance"
              label="JavaScript"
            />
          </div>
        </div>
      </Card>

      {/* Project Status Reference */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          📋 Status dos Projetos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-left font-semibold">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    ativo
                  </span>
                </td>
                <td className="px-3 py-2 text-[hsl(var(--muted-ink))]">
                  Projeto em execução
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-3 py-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    pausado
                  </span>
                </td>
                <td className="px-3 py-2 text-[hsl(var(--muted-ink))]">
                  Projeto temporariamente suspenso
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                    finalizado
                  </span>
                </td>
                <td className="px-3 py-2 text-[hsl(var(--muted-ink))]">
                  Projeto concluído
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Security Notes */}
      <Card className="rounded-3xl border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-3 text-lg font-semibold text-amber-900">
          ⚠️ Notas de Segurança
        </h2>
        <ul className="space-y-2 text-sm text-amber-800">
          <li>
            • A <strong>Anon Key</strong> está segura para usar no frontend (é uma chave pública limitada)
          </li>
          <li>
            • Para operações sensíveis no backend, use a <strong>Service Role Key</strong> (disponível nas configurações do Supabase)
          </li>
          <li>
            • Todos os dados têm <strong>Row Level Security (RLS)</strong> habilitado por usuário
          </li>
          <li>
            • Soft delete: registros com <code>deleted_at</code> preenchido devem ser filtrados nas queries
          </li>
        </ul>
      </Card>

      {/* Additional Resources */}
      <Card className="rounded-3xl p-6">
        <h2 className="mb-4 text-xl font-semibold text-[hsl(var(--ink))]">
          📚 Recursos Adicionais
        </h2>
        <div className="space-y-3">
          <div>
            <a
              href="https://supabase.com/docs/reference/javascript"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--brand))] hover:underline"
            >
              → Documentação Supabase JavaScript Client
            </a>
          </div>
          <div>
            <a
              href={`${SUPABASE_URL}/rest/v1/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--brand))] hover:underline"
            >
              → REST API Endpoint
            </a>
          </div>
          <div>
            <p className="text-sm text-[hsl(var(--muted-ink))]">
              Versão da API: v1 (PostgreSQL 15)
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
