import { useState } from "react";
import { useAppStore } from "@/lib/appStore";
import { BalanceteTabs } from "@/components/balancete/BalanceteTabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/money";
import { ReportHeader } from "@/components/reports/ReportHeader";
import { CalendarDays, Download, Eye, FileText, X } from "lucide-react";
import { useReportData, monthRefLabel } from "@/hooks/useReportData";
import { useReportExports } from "@/hooks/useReportExports";
import { formatDateBR } from "@/lib/reportBuilders";

export default function BalanceteRelatorios() {
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const [report, setReport] = useState<"rubricas" | "lancamentos" | "notas">("rubricas");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  const {
    project,
    budget,
    rubricasRows,
    lancamentosRows,
    notasRows,
    plannedTotal,
    executedTotal,
    availableMonths,
  } = useReportData(selectedMonths);

  function toggleMonth(m: string) {
    setSelectedMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort()
    );
  }

  const {
    printRef,
    exportRubricasPdf,
    previewRubricasPdf,
    exportLancamentosPdf,
    previewLancamentosPdf,
    exportRubricasXlsx,
    exportLancamentosXlsx,
    viewSingleInvoicePdf,
    mergeInvoicesPdf,
    exportNotasConsolidadasPdf,
  } = useReportExports({ rubricasRows, lancamentosRows, notasRows, project, budget, plannedTotal, executedTotal });

  if (!activeProjectId) {
    return (
      <div className="grid gap-6">
        <BalanceteTabs />
        <div className="rounded-3xl border bg-white p-6">
          <div className="text-sm font-semibold text-[hsl(var(--ink))]">Selecione um projeto</div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="grid gap-6">
        <BalanceteTabs />
        <div className="rounded-3xl border bg-white p-6">
          <div className="text-sm font-semibold text-[hsl(var(--ink))]">Sem orçamento</div>
          <div className="mt-2 text-sm text-[hsl(var(--muted-ink))]">Crie o orçamento no Balancete PRO.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <BalanceteTabs />

      {availableMonths.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white p-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-[hsl(var(--muted-ink))]">
            <CalendarDays className="h-3.5 w-3.5" />
            Mês:
          </span>
          {availableMonths.map((m) => (
            <button
              key={m}
              onClick={() => toggleMonth(m)}
              className={cn(
                "rounded-full px-3 py-0.5 text-xs font-semibold transition-colors",
                selectedMonths.includes(m)
                  ? "bg-[hsl(var(--brand))] text-white"
                  : "border border-[hsl(var(--border))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--app-bg))]"
              )}
            >
              {monthRefLabel(m)}
            </button>
          ))}
          {selectedMonths.length > 0 && (
            <button
              onClick={() => setSelectedMonths([])}
              className="ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-[hsl(var(--muted-ink))] hover:text-[hsl(var(--ink))]"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Seletor de relatório */}
      <div className="flex min-w-0 flex-wrap gap-2">
        <Button
          variant={report === "rubricas" ? "default" : "outline"}
          className={cn("rounded-full", report === "rubricas" ? "bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-strong))]" : "")}
          onClick={() => setReport("rubricas")}
        >
          <span className="sm:hidden">Rubricas</span>
          <span className="hidden sm:inline">Relatório de Rubricas</span>
        </Button>
        <Button
          variant={report === "lancamentos" ? "default" : "outline"}
          className={cn("rounded-full", report === "lancamentos" ? "bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-strong))]" : "")}
          onClick={() => setReport("lancamentos")}
        >
          <span className="sm:hidden">Lançamentos</span>
          <span className="hidden sm:inline">Relatório de Lançamentos</span>
        </Button>
        <Button
          variant={report === "notas" ? "default" : "outline"}
          className={cn("rounded-full", report === "notas" ? "bg-[hsl(var(--brand))] text-white hover:bg-[hsl(var(--brand-strong))]" : "")}
          onClick={() => setReport("notas")}
        >
          <span className="sm:hidden">Notas</span>
          <span className="hidden sm:inline">Relatório de Notas Fiscais</span>
        </Button>
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        {report === "rubricas" && (
          <>
            <Button variant="outline" className="rounded-full" onClick={previewRubricasPdf}>
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pré-visualizar</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={exportRubricasPdf}>
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={exportRubricasXlsx}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </>
        )}

        {report === "lancamentos" && (
          <>
            <Button variant="outline" className="rounded-full" onClick={previewLancamentosPdf}>
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pré-visualizar</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={exportLancamentosPdf}>
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button variant="outline" className="rounded-full" onClick={exportLancamentosXlsx}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
          </>
        )}

        {report === "notas" && (
          <>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={mergeInvoicesPdf}
              disabled={!notasRows.length}
              title={project?.stamp_path ? "Pré-visualizar com carimbo aplicado" : "Pré-visualizar PDF"}
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {project?.stamp_path ? "Pré-visualizar com Carimbo" : "Pré-visualizar"}
              </span>
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={exportNotasConsolidadasPdf}
              disabled={!notasRows.length}
              title={project?.stamp_path ? "Baixar PDF com carimbo aplicado" : "Baixar PDF"}
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">
                {project?.stamp_path ? "Baixar com Carimbo" : "Baixar PDF"}
              </span>
            </Button>
          </>
        )}
      </div>

      <div ref={printRef} className="grid gap-6">
        {report === "rubricas" && (
          <>
            <ReportHeader
              title="Relatório de Rubricas (Planejado x Executado)"
              planned={plannedTotal}
              executed={executedTotal}
              project={project}
            />

            <Card className="rounded-3xl border bg-white p-0 shadow-sm">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Código</TableHead>
                      <TableHead className="min-w-[320px]">Item / Subitem</TableHead>
                      <TableHead className="min-w-[160px] text-right">Planejado</TableHead>
                      <TableHead className="min-w-[160px] text-right">Executado</TableHead>
                      <TableHead className="min-w-[160px] text-right">Saldo</TableHead>
                      <TableHead className="min-w-[140px] text-right">% Executado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rubricasRows.map((r, idx) => (
                      <TableRow
                        key={`${r.kind}-${r.code}-${idx}`}
                        className={cn(
                          r.kind === "item" ? "bg-black/[0.03]" : "",
                          r.kind === "total_project" ? "bg-[hsl(var(--ink))] text-white" : ""
                        )}
                      >
                        <TableCell className={cn("font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {r.code}
                        </TableCell>
                        <TableCell className={cn(r.kind === "item" ? "font-semibold" : r.kind === "subitem" ? "pl-6" : "font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {r.name}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {formatBRL(r.planned)}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {formatBRL(r.executed)}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {formatBRL(r.saldo)}
                        </TableCell>
                        <TableCell className={cn("text-right font-semibold", r.kind === "total_project" ? "text-white" : "text-[hsl(var(--ink))]")}>
                          {`${Math.round(r.pct * 100)}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {report === "lancamentos" && (
          <>
            <ReportHeader
              title={`Relatório de Lançamentos${selectedMonths.length ? ` · ${selectedMonths.map(monthRefLabel).join(", ")}` : ""}`}
              planned={plannedTotal}
              executed={executedTotal}
              project={project}
            />

            <Card className="rounded-3xl border bg-white p-0 shadow-sm">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[110px]">Subitem</TableHead>
                      <TableHead className="min-w-[260px]">Descrição</TableHead>
                      <TableHead className="min-w-[220px]">Fornecedor</TableHead>
                      <TableHead className="min-w-[170px]">CNPJ/CPF</TableHead>
                      <TableHead className="min-w-[140px]">Forma</TableHead>
                      <TableHead className="min-w-[140px]">Data pag.</TableHead>
                      <TableHead className="min-w-[120px]">Nº Doc</TableHead>
                      <TableHead className="min-w-[140px]">Data NF</TableHead>
                      <TableHead className="min-w-[140px] text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosRows.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-[hsl(var(--ink))]">{r.codigo}</TableCell>
                        <TableCell>{r.descricao}</TableCell>
                        <TableCell>{r.fornecedor}</TableCell>
                        <TableCell>{r.cnpj_cpf}</TableCell>
                        <TableCell>{r.forma_pagamento}</TableCell>
                        <TableCell>{r.data_pagamento}</TableCell>
                        <TableCell>{r.numero_documento}</TableCell>
                        <TableCell>{r.data_nota}</TableCell>
                        <TableCell className="text-right font-semibold text-[hsl(var(--ink))]">{formatBRL(r.valor)}</TableCell>
                      </TableRow>
                    ))}

                    <TableRow className="bg-[hsl(var(--app-bg))]">
                      <TableCell />
                      <TableCell className="font-semibold text-[hsl(var(--ink))]">
                        {selectedMonths.length ? "TOTAL DO PERÍODO" : "TOTAL PAGO NO PROJETO"}
                      </TableCell>
                      <TableCell colSpan={6} />
                      <TableCell className="text-right font-semibold text-[hsl(var(--ink))]">
                        {formatBRL(lancamentosRows.reduce((acc, r) => acc + r.valor, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}

        {report === "notas" && (
          <>
            <ReportHeader
              title={`Relatório de Notas Fiscais${selectedMonths.length ? ` · ${selectedMonths.map(monthRefLabel).join(", ")}` : ""}`}
              planned={plannedTotal}
              executed={executedTotal}
              project={project}
            />

            <Card className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-[hsl(var(--ink))]">
                Notas anexadas {selectedMonths.length > 0 && <span className="font-normal text-[hsl(var(--muted-ink))]">(filtradas por mês)</span>}
              </div>
              <div className="mt-2 text-sm text-[hsl(var(--muted-ink))]">
                O sistema irá consolidar as notas fiscais anexadas (PDF) em um único arquivo, ordenadas pela data da nota fiscal.
              </div>

              <div className="mt-4 grid gap-2">
                {notasRows.map((n, idx) => (
                  <div
                    key={`${n.invoice_path}-${idx}`}
                    className="flex items-center justify-between rounded-2xl border bg-[hsl(var(--app-bg))] p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-[hsl(var(--ink))]">{n.invoice_file_name}</div>
                      <div className="mt-1 text-xs text-[hsl(var(--muted-ink))]">Data NF: {formatDateBR(n.due_date)}</div>
                    </div>
                    <div className="flex items-center gap-3 pl-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => viewSingleInvoicePdf(n)}
                        title="Visualizar esta nota"
                      >
                        <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden sm:inline">Visualizar</span>
                      </Button>
                      <div className="text-xs font-medium text-[hsl(var(--muted-ink))]">#{idx + 1}</div>
                    </div>
                  </div>
                ))}

                {!notasRows.length && (
                  <div className="rounded-2xl border bg-[hsl(var(--app-bg))] p-6 text-center text-sm text-[hsl(var(--muted-ink))]">
                    {selectedMonths.length ? "Nenhuma nota fiscal nos meses selecionados." : "Nenhuma nota fiscal anexada ao projeto."}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      <style>{`
        @media print {
          header, footer { display: none !important; }
          button { display: none !important; }
          a { text-decoration: none; }
        }
      `}</style>
    </div>
  );
}
