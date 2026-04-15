import { useEffect, useMemo, useState, useCallback } from "react";
import type { BudgetLine, Transaction } from "@/lib/supabaseTypes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, formatPtBrDecimal, parsePtBrMoneyToNumber } from "@/lib/money";
import { monthRefFromIndex } from "@/lib/fileUtils";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import { useTransactionMutations } from "@/hooks/useTransactionMutations";
import { TransactionFormCard } from "@/components/execucao/TransactionFormCard";
import { TransactionListCard } from "@/components/execucao/TransactionListCard";
import { cn } from "@/lib/utils";
import { extractPdfTextFromUrl } from "@/lib/pdfTextExtractor";
import { verifyInvoice, type InvoiceVerificationResult } from "@/lib/invoiceVerifier";
import { toast } from "sonner";

export function ExecucaoLancamentosDialog({
  open,
  onOpenChange,
  projectId,
  budgetId,
  line,
  monthIndex,
  monthsCount,
  budgetStartMonth,
  onChangeSelectedLineId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
  budgetId: string;
  line: BudgetLine | null;
  monthIndex: number;
  monthsCount: number;
  budgetStartMonth?: string | null;
  onChangeSelectedLineId?: (lineId: string) => void;
}) {
  const form = useTransactionForm(monthIndex, line?.id ?? "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<InvoiceVerificationResult | null>(null);

  const monthRef = useMemo(() => monthRefFromIndex(form.currentMonthIndex, budgetStartMonth), [form.currentMonthIndex, budgetStartMonth]);

  const {
    linesForSelect,
    transactions,
    attachments,
    monthTotal,
    createTx,
    updateTx,
    deleteTx,
    removeAttachment,
    signedUrl,
    fetchVendorById,
  } = useTransactionMutations({
    open,
    budgetId,
    projectId,
    line,
    monthRef,
    editingLineId: form.editingLineId,
    budgetStartMonth,
    onChangeSelectedLineId,
  });

  function fillFormFromTx(t: any) {
    form.setPaymentMethod((t.payment_method as any) || "");
    form.setDocumentNumber(t.document_number || "");
    form.setDueDate(t.due_date || "");
    form.setPaidDate(t.paid_date || "");
    form.setAmount(formatPtBrDecimal(Number(t.amount ?? 0)));
    form.setNotes(t.notes || "");
    form.setEditingMonthIndex(Number(t.month_index ?? form.currentMonthIndex));
    form.setEditingLineId(String(t.budget_line_id || line?.id || ""));
    form.setFiles([]);
    const vendorId = String(t.vendor_id || "");
    if (vendorId) fetchVendorById(vendorId).then((v) => v && form.setVendor(v));
    else form.setVendor(null);
  }

  function startEditCompletely(t: any) { form.setActionTxId(null); form.setEditing(t as Transaction); fillFormFromTx(t); setVerificationResult(null); }

  function startCloneTx(t: any) {
    form.setActionTxId(null); form.setEditing(null);
    const nextMonth = Number(t.month_index ?? form.currentMonthIndex);
    if (Number.isFinite(nextMonth) && nextMonth > 0) form.setCurrentMonthIndex(nextMonth);
    fillFormFromTx(t);
  }

  function resetFormFully() {
    form.setEditing(null);
    form.setVendor(null);
    form.setPaymentMethod("");
    form.setDocumentNumber("");
    form.setDueDate("");
    form.setPaidDate("");
    form.setAmount("");
    form.setNotes("");
    form.setFiles([]);
    form.setEditingMonthIndex(form.currentMonthIndex);
    form.setEditingLineId(line?.id ?? "");
    setVerificationResult(null);
  }

  const verifyCurrentInvoice = useCallback(async () => {
    if (!form.editing) return;

    // Pega o primeiro anexo do lançamento sendo editado
    const txAttachments = attachments?.get(form.editing.id) ?? [];
    const legacyPath = (form.editing as any).invoice_path as string | null;
    const storagePath =
      txAttachments[0]?.storage_path ?? legacyPath ?? null;

    if (!storagePath) {
      toast.error("Nenhum anexo encontrado para verificar");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const url = await signedUrl.mutateAsync(storagePath);
      const text = await extractPdfTextFromUrl(url);
      const result = verifyInvoice(text, {
        amount: form.amount,
        paidDate: form.paidDate,
        vendorTaxId: form.vendor?.tax_id ?? null,
        documentNumber: form.documentNumber,
      });
      setVerificationResult(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao verificar nota fiscal");
    } finally {
      setIsVerifying(false);
    }
  }, [form.editing, form.amount, form.paidDate, form.vendor, form.documentNumber, attachments, signedUrl]);

  useEffect(() => {
    if (!open) {
      form.resetForm();
      form.setCurrentMonthIndex(monthIndex);
      form.setEditingMonthIndex(monthIndex);
      form.setEditingLineId(line?.id ?? "");
      return;
    }
    form.setCurrentMonthIndex(monthIndex);
    form.setEditingLineId(line?.id ?? "");
    form.setActionTxId(null);
  }, [open, monthIndex, line?.id]);

  // Auto-fill form when there are existing transactions
  useEffect(() => {
    if (!open || form.editing) return;
    if (transactions.length >= 1) {
      startEditCompletely(transactions[0]);
    }
  }, [transactions.length, open]);

  const hasMultiple = transactions.length >= 2;

  function handleSave() {
    const mutationParams = {
      vendor: form.vendor,
      paymentMethod: form.paymentMethod,
      paidDate: form.paidDate,
      amount: form.amount,
      currentMonthIndex: form.currentMonthIndex,
      documentNumber: form.documentNumber,
      notes: form.notes,
      dueDate: form.dueDate,
      files: form.files,
    };

    if (!form.editing) {
      createTx.mutate(mutationParams, {
        onSuccess: () => {
          form.setEditing(null);
          form.setVendor(null);
          form.setPaymentMethod("");
          form.setDocumentNumber("");
          form.setDueDate("");
          form.setPaidDate("");
          form.setAmount("");
          form.setNotes("");
          form.setFiles([]);
        },
      });
    } else {
      updateTx.mutate(
        {
          ...mutationParams,
          editing: form.editing,
          editingMonthIndex: form.editingMonthIndex,
        },
        {
          onSuccess: ({ tx }) => {
            const newMonthIndex = Number((tx as any).month_index ?? form.editingMonthIndex);
            form.setFiles([]);
            // Re-populate form with saved data so fields stay visible
            startEditCompletely(tx);
            if (newMonthIndex !== form.currentMonthIndex) form.setCurrentMonthIndex(newMonthIndex);
          },
        }
      );
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              Lançamentos — {line?.code || ""} {line?.name || ""} · Mês {form.currentMonthIndex}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Abas de lançamentos quando há 2 ou mais no mês */}
            {hasMultiple && (
              <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(var(--border))] pb-3">
                {transactions.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => startEditCompletely(t)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      form.editing?.id === t.id
                        ? "border-transparent bg-[hsl(var(--brand))] text-white"
                        : "border-[hsl(var(--border))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--app-bg))]"
                    )}
                  >
                    Lançamento {i + 1} · {formatBRL(Number(t.amount ?? 0))}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetFormFully}
                  className={cn(
                    "rounded-full border border-dashed px-3 py-1.5 text-sm font-medium transition-colors",
                    !form.editing
                      ? "border-[hsl(var(--brand))] text-[hsl(var(--brand))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-ink))] hover:bg-[hsl(var(--app-bg))]"
                  )}
                >
                  + Novo lançamento
                </button>
              </div>
            )}

            <TransactionFormCard
              monthTotal={monthTotal}
              editing={form.editing}
              linesForSelect={linesForSelect}
              editingLineId={form.editingLineId}
              onEditingLineIdChange={form.setEditingLineId}
              editingMonthIndex={form.editingMonthIndex}
              onEditingMonthIndexChange={form.setEditingMonthIndex}
              monthsCount={monthsCount}
              vendor={form.vendor}
              onVendorChange={form.setVendor}
              paymentMethod={form.paymentMethod}
              onPaymentMethodChange={form.setPaymentMethod}
              documentNumber={form.documentNumber}
              onDocumentNumberChange={form.setDocumentNumber}
              dueDate={form.dueDate}
              onDueDateChange={form.setDueDate}
              paidDate={form.paidDate}
              onPaidDateChange={form.setPaidDate}
              amount={form.amount}
              onAmountChange={form.setAmount}
              onAmountBlur={() => {
                if (!form.amount.trim()) return;
                const n = parsePtBrMoneyToNumber(form.amount);
                form.setAmount(formatPtBrDecimal(n));
              }}
              notes={form.notes}
              onNotesChange={form.setNotes}
              files={form.files}
              onFilesChange={form.setFiles}
              onFileInputChange={(fileList) => {
                const list = Array.from(fileList ?? []);
                if (list.length) form.setFiles((curr) => [...curr, ...list]);
              }}
              onCancelEdit={() => {
                if (hasMultiple) {
                  // Ao cancelar com múltiplos lançamentos, volta para o primeiro
                  startEditCompletely(transactions[0]);
                } else {
                  resetFormFully();
                }
              }}
              onSave={handleSave}
              isSaving={createTx.isPending || updateTx.isPending}
              currentMonthIndex={form.currentMonthIndex}
              lineId={line?.id}
              hasAttachment={Boolean(
                form.editing &&
                  ((attachments?.get(form.editing.id) ?? []).length > 0 ||
                    (form.editing as any).invoice_path)
              )}
              onVerifyInvoice={verifyCurrentInvoice}
              isVerifying={isVerifying}
              verificationResult={verificationResult}
              onDeleteClick={form.editing ? () => deleteTx.mutate(form.editing!.id) : undefined}
            />

            <TransactionListCard
              transactions={transactions}
              attachments={attachments}
              editing={form.editing}
              actionTxId={form.actionTxId}
              projectId={projectId}
              onEditClick={(t) => form.setActionTxId(t.id)}
              onCloneClick={startCloneTx}
              onEditCompletelyClick={startEditCompletely}
              onCancelAction={() => form.setActionTxId(null)}
              onDeleteClick={(id) => deleteTx.mutate(id)}
              onRemoveAttachment={(a, tx) => removeAttachment.mutate({ attachment: a, tx })}
              onGetSignedUrl={(path) => signedUrl.mutateAsync(path)}
              onPreviewOpen={(url) => {
                form.setPreviewUrl(url);
                form.setPreviewOpen(true);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={form.previewOpen} onOpenChange={form.setPreviewOpen}>
        <DialogContent className="max-w-5xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Visualizar nota fiscal</DialogTitle>
          </DialogHeader>
          <div className="h-[75vh] overflow-hidden rounded-2xl border bg-white">
            {/\.(png|jpe?g|gif|webp)/i.test(form.previewUrl.split("?")[0]) ? (
              <img src={form.previewUrl} alt="Nota fiscal" className="h-full w-full object-contain" />
            ) : (
              <iframe title="Nota fiscal" src={form.previewUrl} className="h-full w-full" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
