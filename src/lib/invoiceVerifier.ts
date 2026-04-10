import { parsePtBrMoneyToNumber } from "@/lib/money";

export type FieldStatus = "ok" | "divergente" | "nao_encontrado";

export interface InvoiceVerificationResult {
  valor: { status: FieldStatus; extraidos: number[] };
  dataPagamento: { status: FieldStatus; extraidas: string[] };
  cnpj: { status: FieldStatus; extraidos: string[] };
  numeroDocumento: { status: FieldStatus; extraidos: string[] };
  totalDivergencias: number;
}

function parseBRLFromText(str: string): number {
  return (
    Number(
      str
        .replace(/R\$\s*/i, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0
  );
}

function cleanCnpj(s: string) {
  return s.replace(/\D/g, "");
}

function extractAmounts(text: string): number[] {
  const matches = text.match(/R\$\s*[\d.,]+/gi) ?? [];
  return matches
    .map((m) => parseBRLFromText(m))
    .filter((n) => n > 0);
}

function extractDates(text: string): string[] {
  // DD/MM/YYYY or DD-MM-YYYY
  const matches = [...text.matchAll(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/g)];
  return matches.map((m) => `${m[3]}-${m[2]}-${m[1]}`);
}

function extractCnpjs(text: string): string[] {
  const matches = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g) ?? [];
  return matches.map(cleanCnpj);
}

function extractDocumentNumbers(text: string): string[] {
  // NF, NF-e, Nota Fiscal seguido de número
  const matches = [
    ...text.matchAll(/(?:NF[e\-]?\s*n[°º.]?\s*|nota\s+fiscal\s*n[°º.]?\s*|n[°º.]\s*)(\d+)/gi),
  ];
  const found = matches.map((m) => m[1].replace(/^0+/, ""));

  // Também tenta padrões como "Número: 123" ou "Nº 123"
  const matches2 = [...text.matchAll(/n[°º][.:]?\s*(\d+)/gi)];
  const found2 = matches2.map((m) => m[1].replace(/^0+/, ""));

  return [...new Set([...found, ...found2])];
}

function numericallySimilar(a: number, b: number): boolean {
  if (b === 0) return false;
  return Math.abs(a - b) < 0.02;
}

export function verifyInvoice(
  pdfText: string,
  form: {
    amount: string;
    paidDate: string;
    vendorTaxId?: string | null;
    documentNumber: string;
  }
): InvoiceVerificationResult {
  const amounts = extractAmounts(pdfText);
  const dates = extractDates(pdfText);
  const cnpjs = extractCnpjs(pdfText);
  const docNumbers = extractDocumentNumbers(pdfText);

  const formAmount = parsePtBrMoneyToNumber(form.amount);
  const formDate = form.paidDate?.trim() ?? "";
  const formCnpj = cleanCnpj(form.vendorTaxId ?? "");
  const formDoc = (form.documentNumber ?? "").trim().replace(/^0+/, "");

  const valorOk = amounts.length === 0
    ? "nao_encontrado"
    : amounts.some((a) => numericallySimilar(a, formAmount))
    ? "ok"
    : "divergente";

  const dataOk = dates.length === 0 || !formDate
    ? "nao_encontrado"
    : dates.includes(formDate)
    ? "ok"
    : "divergente";

  const cnpjOk = cnpjs.length === 0 || !formCnpj
    ? "nao_encontrado"
    : cnpjs.includes(formCnpj)
    ? "ok"
    : "divergente";

  const docOk = docNumbers.length === 0 || !formDoc
    ? "nao_encontrado"
    : docNumbers.some((d) => d === formDoc)
    ? "ok"
    : "divergente";

  const totalDivergencias = [valorOk, dataOk, cnpjOk, docOk].filter(
    (s) => s === "divergente"
  ).length;

  return {
    valor: { status: valorOk, extraidos: amounts },
    dataPagamento: { status: dataOk, extraidas: dates },
    cnpj: { status: cnpjOk, extraidos: cnpjs },
    numeroDocumento: { status: docOk, extraidos: docNumbers },
    totalDivergencias,
  };
}
