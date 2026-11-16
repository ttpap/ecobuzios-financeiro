import { useState } from "react";
import type { Transaction, Vendor } from "@/lib/supabaseTypes";
import type { PaymentMethod } from "@/lib/fileUtils";

export function useTransactionForm(initialMonthIndex: number, initialLineId: string) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(initialMonthIndex);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [paymentReceiptNumber, setPaymentReceiptNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [editingMonthIndex, setEditingMonthIndex] = useState<number>(initialMonthIndex);
  const [editingLineId, setEditingLineId] = useState<string>(initialLineId);
  const [actionTxId, setActionTxId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  function resetForm() {
    setVendor(null);
    setPaymentMethod("");
    setDocumentNumber("");
    setPaymentReceiptNumber("");
    setDueDate("");
    setPaidDate("");
    setAmount("");
    setNotes("");
    setFiles([]);
    setEditing(null);
    setActionTxId(null);
  }

  return {
    currentMonthIndex, setCurrentMonthIndex,
    vendor, setVendor,
    paymentMethod, setPaymentMethod,
    documentNumber, setDocumentNumber,
    paymentReceiptNumber, setPaymentReceiptNumber,
    dueDate, setDueDate,
    paidDate, setPaidDate,
    amount, setAmount,
    notes, setNotes,
    files, setFiles,
    editing, setEditing,
    editingMonthIndex, setEditingMonthIndex,
    editingLineId, setEditingLineId,
    actionTxId, setActionTxId,
    previewOpen, setPreviewOpen,
    previewUrl, setPreviewUrl,
    resetForm,
  };
}
