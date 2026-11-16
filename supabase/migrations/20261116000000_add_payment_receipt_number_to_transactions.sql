-- Separa o documento da despesa (NF, guia, recibo) do comprovante de pagamento (Pix/transferência).
-- document_number continua sendo o documento da despesa; payment_receipt_number é o comprovante bancário.
alter table public.transactions
  add column if not exists payment_receipt_number text;

comment on column public.transactions.document_number is 'Documento da despesa: nº da NF, guia (DARF/GFD) ou recibo';
comment on column public.transactions.payment_receipt_number is 'Nº do comprovante de pagamento (Pix/transferência)';
