#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";

const supabaseUrl = "https://pttidjztgnqcyrsreygn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_KEY não definida");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para extrair ano da data
function getYearFromDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return parseInt(parts[2], 10);
  }
  return null;
}

// Função para normalizar valor (remover separadores e converter)
function normalizeValue(valueStr) {
  if (!valueStr) return 0;
  // Remove espaços, converte "." em "" (separador de milhares) e "," em "." (decimal)
  const cleaned = valueStr.trim().replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

// Função para processar um arquivo CSV
async function processCsvFile(filePath, projectFolder, isEntrada) {
  console.log(`\n📄 Processando: ${filePath}`);

  const content = fs.readFileSync(filePath, "utf8");

  return new Promise((resolve) => {
    Papa.parse(content, {
      complete: async (results) => {
        const records = results.data.filter((row) => row && row.id);
        console.log(`   → ${records.length} lançamentos encontrados`);

        // Mapear estrutura dos CSVs
        const mappedRecords = records.map((row) => ({
          id: row.id,
          projeto: row.projeto,
          planoConta: row.plano_conta,
          vencimento: row.vencimento,
          pagamento: row.pagamento,
          valor: normalizeValue(row.valor),
          status: row.status,
          isEntrada,
          ano: getYearFromDate(row.pagamento),
        }));

        // Filtrar apenas lançamentos até 2024
        const filtered = mappedRecords.filter((r) => r.ano && r.ano <= 2024);
        console.log(`   → ${filtered.length} lançamentos até 2024`);

        resolve(filtered);
      },
    });
  });
}

// Função para buscar projeto no Supabase pelo nome
async function findProjectByName(projectName) {
  // Normalizar nome para busca
  const searchName = projectName.toLowerCase().trim();

  const { data, error } = await supabase.from("projects").select("id,name").limit(100);

  if (error) {
    console.error("❌ Erro ao buscar projetos:", error);
    return null;
  }

  // Procurar correspondência exata ou parcial
  const exact = data?.find((p) => p.name.toLowerCase() === searchName);
  if (exact) return exact.id;

  const partial = data?.find((p) => searchName.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(searchName));
  if (partial) return partial.id;

  return null;
}

// Função para buscar ou criar budget
async function getOrCreateBudget(projectId) {
  // Buscar orçamento do projeto
  const { data, error } = await supabase
    .from("budgets")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (error || !data || data.length === 0) {
    console.warn(`   ⚠️  Sem orçamento para projeto ${projectId}`);
    return null;
  }

  return data[0].id;
}

// Função para buscar ou criar linha de orçamento
async function getOrCreateBudgetLine(budgetId, isEntrada) {
  const lineName = isEntrada ? "Entradas" : "Saídas";
  const lineCode = isEntrada ? "1.1" : "1.2";

  const { data, error } = await supabase
    .from("budget_lines")
    .select("id")
    .eq("budget_id", budgetId)
    .ilike("name", `%${lineName}%`)
    .limit(1);

  if (error) {
    console.error("❌ Erro ao buscar linhas de orçamento:", error);
    return null;
  }

  if (data && data.length > 0) {
    return data[0].id;
  }

  // Se não encontrar, tentar criar uma genérica
  console.warn(`   ⚠️  Linha de orçamento "${lineName}" não encontrada`);
  return null;
}

// Função para obter ou criar vendor genérico
async function getOrCreateGenericVendor() {
  const { data, error } = await supabase
    .from("vendors")
    .select("id")
    .ilike("name", "%ASBEMQ%")
    .limit(1);

  if (data && data.length > 0) {
    return data[0].id;
  }

  // Criar vendor genérico
  const { data: newVendor, error: createError } = await supabase
    .from("vendors")
    .insert({ name: "ASBEMQ - Importação", email: "import@asbemq.local" })
    .select("id")
    .single();

  if (createError) {
    console.error("❌ Erro ao criar vendor:", createError);
    return null;
  }

  return newVendor.id;
}

// Função para criar lançamento
async function createTransaction(record, projectId, budgetId, budgetLineId, vendorId) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      project_id: projectId,
      budget_id: budgetId,
      budget_line_id: budgetLineId,
      date: record.pagamento,
      paid_date: record.pagamento,
      due_date: record.vencimento || record.pagamento,
      month_index: 1, // Será ajustado depois se necessário
      amount: Math.abs(record.valor), // Sempre positivo
      description: `${record.planoConta} - ${record.projeto}`,
      notes: `Importado de ASBEMQ - Status: ${record.status}`,
      vendor_id: vendorId,
      payment_method: "transferência",
      document_number: record.id,
      created_by_user_id: "system-import", // Será ajustado para um user real
    })
    .select("id")
    .single();

  if (error) {
    console.error(`❌ Erro ao criar transação:`, error);
    return null;
  }

  return data.id;
}

// Função principal
async function main() {
  console.log("🚀 Iniciando importação de lançamentos do ASBEMQ");
  console.log(`📁 Fonte: /Users/pap/Downloads/claude cowork/Projetos_Codigo/dyad-apps/EcoBuzios - financeiro Projetos/ASBEMQ`);

  const baseDir = "/Users/pap/Downloads/claude cowork/Projetos_Codigo/dyad-apps/EcoBuzios - financeiro Projetos/ASBEMQ";

  // Encontrar todos os arquivos de lançamentos
  let allRecords = [];
  const projectDirs = fs.readdirSync(baseDir).filter((f) => {
    const fullPath = path.join(baseDir, f);
    return fs.statSync(fullPath).isDirectory();
  });

  console.log(`\n📂 Encontrados ${projectDirs.length} projetos`);

  for (const projectFolder of projectDirs) {
    const lancamentosDir = path.join(baseDir, projectFolder, "Lançamentos");

    if (!fs.existsSync(lancamentosDir)) continue;

    const entradasFile = path.join(lancamentosDir, "Entradas", "lancamentos.csv");
    const saidasFile = path.join(lancamentosDir, "Saídas", "lancamentos.csv");

    if (fs.existsSync(entradasFile)) {
      const records = await processCsvFile(entradasFile, projectFolder, true);
      allRecords = allRecords.concat(records);
    }

    if (fs.existsSync(saidasFile)) {
      const records = await processCsvFile(saidasFile, projectFolder, false);
      allRecords = allRecords.concat(records);
    }
  }

  console.log(`\n✅ Total de lançamentos até 2024: ${allRecords.length}`);

  // Agrupar por projeto
  const byProject = {};
  for (const record of allRecords) {
    if (!byProject[record.projeto]) {
      byProject[record.projeto] = [];
    }
    byProject[record.projeto].push(record);
  }

  // Processar por projeto
  let totalCreated = 0;
  let totalFailed = 0;

  for (const [projectName, records] of Object.entries(byProject)) {
    console.log(`\n📊 Projeto: ${projectName} (${records.length} lançamentos)`);

    // Buscar projeto no Supabase
    const projectId = await findProjectByName(projectName);
    if (!projectId) {
      console.warn(`   ⚠️  Projeto não encontrado no sistema`);
      totalFailed += records.length;
      continue;
    }

    console.log(`   ✓ Encontrado: ${projectId}`);

    // Buscar orçamento
    const budgetId = await getOrCreateBudget(projectId);
    if (!budgetId) {
      console.warn(`   ⚠️  Sem orçamento`);
      totalFailed += records.length;
      continue;
    }

    // Obter vendor genérico
    const vendorId = await getOrCreateGenericVendor();
    if (!vendorId) {
      console.warn(`   ⚠️  Não foi possível obter vendor`);
      totalFailed += records.length;
      continue;
    }

    // Processar cada lançamento
    for (const record of records) {
      // Buscar ou criar linha de orçamento
      const budgetLineId = await getOrCreateBudgetLine(budgetId, record.isEntrada);
      if (!budgetLineId) {
        console.warn(`   ⚠️  Linha de orçamento não encontrada para ${record.isEntrada ? "entradas" : "saídas"}`);
        totalFailed++;
        continue;
      }

      // Criar transação
      const txId = await createTransaction(record, projectId, budgetId, budgetLineId, vendorId);
      if (txId) {
        totalCreated++;
        console.log(`   ✓ Lançamento ${record.id} → ${txId}`);
      } else {
        totalFailed++;
      }
    }
  }

  console.log(`\n\n📈 Resumo Final:`);
  console.log(`   ✅ Criados: ${totalCreated}`);
  console.log(`   ❌ Falhados: ${totalFailed}`);
  console.log(`   📊 Total: ${totalCreated + totalFailed}`);
}

main().catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
