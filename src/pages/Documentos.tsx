import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Image,
  File,
  Search,
  FolderOpen,
  Download,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DocEntry = {
  project_id: string;
  project_name: string;
  transaction_id: string;
  file_name: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  description: string | null;
  document_number: string | null;
  expense_type: string | null;
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return <Image className="h-4 w-4 text-blue-500" />;
  }
  if (ext === 'pdf') {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-gray-400" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function getSignedUrl(path: string) {
  const { data } = await supabase.storage.from('invoices').createSignedUrl(path, 3600);
  return data?.signedUrl || '';
}

function DocCard({ doc }: { doc: DocEntry }) {
  const handleOpen = async () => {
    const url = await getSignedUrl(doc.storage_path);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm hover:shadow-md transition">
      <FileIcon name={doc.file_name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[hsl(var(--ink))]">
          {doc.file_name}
        </div>
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-ink))]">
          {doc.description && <span className="truncate max-w-[160px]">{doc.description}</span>}
          {doc.document_number && <span>#{doc.document_number}</span>}
          {doc.size_bytes && <span>{formatSize(doc.size_bytes)}</span>}
          {doc.expense_type && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0",
                doc.expense_type === 'entrada'
                  ? 'border-green-300 text-green-700'
                  : 'border-orange-300 text-orange-700'
              )}
            >
              {doc.expense_type === 'entrada' ? 'Entrada' : 'Saída'}
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full shrink-0"
        onClick={handleOpen}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ProjectFolder({
  projectName,
  docs,
  defaultOpen = false,
}: {
  projectName: string;
  docs: DocEntry[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border bg-white overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-5 py-4 hover:bg-black/5 transition"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-ink))] shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-ink))] shrink-0" />
        )}
        <FolderOpen className="h-5 w-5 text-[hsl(var(--brand))] shrink-0" />
        <span className="flex-1 text-left font-semibold text-sm text-[hsl(var(--ink))]">
          {projectName}
        </span>
        <span className="rounded-full bg-[hsl(var(--brand)/0.1)] px-2 py-0.5 text-xs font-bold text-[hsl(var(--brand))]">
          {docs.length}
        </span>
      </button>

      {open && (
        <div className="border-t px-4 py-3 grid gap-2">
          {docs.map((doc) => (
            <DocCard key={doc.transaction_id + doc.file_name} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Documentos() {
  const [search, setSearch] = useState("");

  const docsQuery = useQuery({
    queryKey: ["documentos"],
    queryFn: async () => {
      // Get transactions that have invoice files, join with projects
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          project_id,
          description,
          document_number,
          expense_type,
          invoice_file_name,
          invoice_path,
          invoice_size_bytes,
          created_at,
          projects!inner(id, name)
        `)
        .not("invoice_file_name", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) throw error;

      return (data || []).map((tx: any) => ({
        project_id: tx.project_id,
        project_name: tx.projects?.name || "Sem projeto",
        transaction_id: tx.id,
        file_name: tx.invoice_file_name,
        storage_path: tx.invoice_path,
        size_bytes: tx.invoice_size_bytes,
        mime_type: null,
        created_at: tx.created_at,
        description: tx.description,
        document_number: tx.document_number,
        expense_type: tx.expense_type,
      })) as DocEntry[];
    },
  });

  // Also get transaction_attachments
  const attachmentsQuery = useQuery({
    queryKey: ["documentos-attachments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_attachments")
        .select(`
          id,
          transaction_id,
          project_id,
          file_name,
          storage_path,
          size_bytes,
          mime_type,
          created_at,
          transactions!inner(description, document_number, expense_type, projects!inner(name))
        `)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) throw error;

      return (data || []).map((att: any) => ({
        project_id: att.project_id,
        project_name: att.transactions?.projects?.name || "Sem projeto",
        transaction_id: att.transaction_id,
        file_name: att.file_name,
        storage_path: att.storage_path,
        size_bytes: att.size_bytes,
        mime_type: att.mime_type,
        created_at: att.created_at,
        description: att.transactions?.description,
        document_number: att.transactions?.document_number,
        expense_type: att.transactions?.expense_type,
      })) as DocEntry[];
    },
  });

  // Merge and deduplicate
  const allDocs: DocEntry[] = [
    ...(docsQuery.data || []),
    ...(attachmentsQuery.data || []),
  ];

  // Filter by search
  const filtered = allDocs.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.project_name.toLowerCase().includes(q) ||
      d.file_name.toLowerCase().includes(q) ||
      (d.description || '').toLowerCase().includes(q)
    );
  });

  // Group by project
  const byProject = new Map<string, { name: string; docs: DocEntry[] }>();
  for (const doc of filtered) {
    const key = doc.project_id;
    if (!byProject.has(key)) {
      byProject.set(key, { name: doc.project_name, docs: [] });
    }
    byProject.get(key)!.docs.push(doc);
  }

  // Sort projects by name
  const groups = Array.from(byProject.entries()).sort((a, b) =>
    a[1].name.localeCompare(b[1].name)
  );

  const totalDocs = allDocs.length;
  const isLoading = docsQuery.isLoading || attachmentsQuery.isLoading;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="rounded-3xl border bg-white p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(var(--brand)/0.12)] px-3 py-1 text-xs font-medium text-[hsl(var(--brand))]">
              <FileText className="h-3.5 w-3.5" />
              Documentos
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[hsl(var(--ink))]">
              Documentos
            </h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-ink))]">
              Notas fiscais e comprovantes organizados por projeto.{" "}
              <span className="font-semibold text-[hsl(var(--ink))]">
                {totalDocs} documentos
              </span>{" "}
              em {byProject.size} projetos.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-ink))]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documentos..."
              className="rounded-full pl-9"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-sm text-[hsl(var(--muted-ink))]">
          Carregando documentos...
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 text-center text-sm text-[hsl(var(--muted-ink))]">
          {search ? "Nenhum documento encontrado para esta busca." : "Nenhum documento encontrado. Faça upload de notas fiscais nos lançamentos."}
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map(([projectId, { name, docs }], idx) => (
            <ProjectFolder
              key={projectId}
              projectName={name}
              docs={docs}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
