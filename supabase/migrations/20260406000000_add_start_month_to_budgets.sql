-- Migration: add_start_month_to_budgets
-- Data: 2026-04-06
-- Descrição: Adiciona campo start_month (YYYY-MM) à tabela budgets para mapeamento
-- de meses do projeto para meses reais do calendário.

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS start_month TEXT DEFAULT NULL;

-- Exemplo de valor válido: '2024-03' (março de 2024)
-- Este campo define em qual mês/ano o orçamento começa
