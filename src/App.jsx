import { useState, useRef, useCallback, useEffect } from "react";
import { useDatabase } from "./useDatabase";

/* ══════════════════════════════════════════════════════════════
   SCHEMAS — 1:1 match amb Proposta_de_taules_V2.xlsx
   ══════════════════════════════════════════════════════════════ */
const SCHEMAS = {
  productes: {
    label: "Productes", icon: "📦", voice: true,
    fields: [
      { key: "producte",          label: "Producte",                   type: "text",   req: true },
      { key: "grup",              label: "Grup",                       type: "text" },
      { key: "unitats_per_palet", label: "Unitats per palet",          type: "number" },
      { key: "caixes_per_palet",  label: "Caixes per palet",           type: "number" },
      { key: "unitats_per_caixa", label: "Unitats per caixa",          type: "number" },
      { key: "kg_massa_palet",    label: "Kg massa / palet",           type: "number" },
      { key: "codi_massa",        label: "Codis massa",                type: "text",   placeholder: "M0002, M0007" },
      { key: "kg_farcit_palet",   label: "Kg farcit / palet",          type: "number" },
      { key: "codi_farcit",       label: "Codis farcit",               type: "text",   placeholder: "R3055, R3070" },
      { key: "dies_permesos",     label: "Dies permesos (Dll-Dm-Dc)",  type: "text" },
      { key: "incompatible_amb",  label: "Incompatible amb (llista)",   type: "text" },
      { key: "linies_permeses",   label: "Línies permeses",            type: "text",   placeholder: "Línia 2" },
      { key: "unitats_per_carro", label: "Unitats per carro",          type: "number" },
      { key: "comentaris",        label: "Comentaris",                 type: "text" },
      { key: "no_classificat",    label: "Xifres sense lloc",          type: "text" },
      { key: "basat_en",          label: "Basat en",                   type: "text" },
      { key: "transcripcio",      label: "Transcripció",               type: "text",  hidden: true },
    ],
  },
  recepta: {
    label: "Recepta", icon: "🧪", voice: true,
    fields: [
      { key: "producte",                label: "Producte",             type: "text",   req: true },
      { key: "codi_farcit",             label: "Codi farcit",          type: "text" },
      { key: "grams_per_unitat_farcit", label: "Grams/unitat farcit",  type: "number" },
      { key: "merma_farcit",            label: "Merma farcit",         type: "number" },
      { key: "codi_massa",              label: "Codi massa",           type: "text" },
      { key: "grams_per_unit_massa",    label: "Grams/unitat massa",   type: "number" },
      { key: "merma_massa",             label: "Merma massa",          type: "number" },
      { key: "kg_farcit_palet",         label: "Kg farcit / palet",    type: "number" },
      { key: "kg_massa_palet",          label: "Kg massa / palet",     type: "number" },
      { key: "comentaris",              label: "Comentaris",           type: "text" },
    ],
  },
  farcit: {
    label: "Farcit", icon: "🍫", voice: true,
    fields: [
      { key: "codi_farcit",  label: "Codi farcit (R####)",       type: "text",   req: true, placeholder: "R3055" },
      { key: "codi_nom_mp",  label: "Codi / Nom Matèria Prima",  type: "text",   req: true, placeholder: "M2001 o Ricotta" },
      { key: "kg_per_palet", label: "Kg per palet",              type: "number" },
      { key: "merma",        label: "Merma (decimal, 0.03 = 3%)", type: "number" },
    ],
  },
  masses: {
    label: "Masses", icon: "🌾", voice: true,
    fields: [
      { key: "codi_massa",   label: "Codi massa (M####)",        type: "text",   req: true, placeholder: "M0002" },
      { key: "codi_nom_mp",  label: "Codi / Nom Matèria Prima",  type: "text",   req: true, placeholder: "M1001 o Farina" },
      { key: "kg_per_palet", label: "Kg per palet",              type: "number" },
      { key: "merma",        label: "Merma (decimal, 0.03 = 3%)", type: "number" },
    ],
  },
  linies: {
    label: "Recursos", icon: "🏭", voice: true, manual: true,
    fields: [
      { key: "linia",             label: "Recurs / Línia",             type: "text",   req: true },
      { key: "tipus",             label: "Tipus (màquina/eina/estri)", type: "text" },
      { key: "quantitat",         label: "Quantitat (unitats iguals)", type: "number", placeholder: "2" },
      { key: "descripcio",        label: "Descripció",                 type: "text" },
      { key: "temps_preparacio",  label: "Temps preparació (min)",     type: "number" },
      { key: "temps_neteja",      label: "Temps neteja (min)",         type: "number" },
      { key: "temps_espera",      label: "Temps espera (min)",         type: "number" },
      { key: "comentaris",        label: "Comentaris",                 type: "text" },
    ],
  },
  flux: {
    label: "Flux", icon: "🔄", voice: true,
    fields: [
      { key: "producte",             label: "Producte",                     type: "text",   req: true },
      { key: "pas",                  label: "Pas (índex)",                  type: "number" },
      { key: "dia",                  label: "Dia del cicle",                type: "number" },
      { key: "accio",                label: "Què es fa",                    type: "text",   placeholder: "Preparació de carros" },
      { key: "codi_intervinent",     label: "Massa / Farcit (codi)",        type: "text",   placeholder: "M2001 / R3055" },
      { key: "linia",                label: "Recurs físic",                 type: "text" },
      { key: "massa",                label: "Massa (kg)",                   type: "number" },
      { key: "temps_per_kg",         label: "Temps (tal com es diu)",       type: "text",   placeholder: "45 min / 150kg" },
      { key: "minuts_min",           label: "Minuts (mínim)",               type: "number" },
      { key: "minuts_max",           label: "Minuts (màxim)",               type: "number" },
      { key: "temps_quantitat",      label: "Quantitat d'aquests minuts",   type: "number", placeholder: "150" },
      { key: "temps_unitat",         label: "Unitat de la quantitat",       type: "text",   placeholder: "fix / kg / unitat / caixa / carro" },
      { key: "persones_necessaries", label: "Persones necessàries",         type: "number" },
      { key: "perfils_de_persona",   label: "Perfils de persona",           type: "text" },
      { key: "es_pot_parar",         label: "Es pot parar (sí/no)",         type: "select", options: ["Sí", "No"] },
      { key: "frequencia",           label: "Freqüència",                   type: "text",   placeholder: "cada_produccio / final_jornada / final_setmana" },
      { key: "minuts_abans_produccio", label: "Minuts abans de fabricar",   type: "number" },
      { key: "depen_de_pas",         label: "Depèn del pas",                type: "text",   placeholder: "4, 7" },
      { key: "alternativa_de",       label: "Alternativa del pas",          type: "number" },
      { key: "prerequisits",         label: "Prerequisits",                 type: "text",   placeholder: "Finalitzar M2001" },
      { key: "comentaris",           label: "Comentaris",                   type: "text" },
    ],
  },
  torns: {
    label: "Torns", icon: "🕐", voice: false,
    fields: [
      { key: "persona",          label: "Persona",                    type: "text",   req: true },
      { key: "torn",             label: "Torn 1",                     type: "text",   placeholder: "Completo Matí 1" },
      { key: "hora_inici",       label: "Hora inici 1",               type: "text",   placeholder: "06:00" },
      { key: "hora_fi",          label: "Hora fi 1",                  type: "text",   placeholder: "14:00" },
      { key: "torn_2",           label: "Torn 2 (rotatiu)",           type: "text",   placeholder: "Completo Tarda 1" },
      { key: "hora_inici_2",     label: "Hora inici 2",               type: "text",   placeholder: "14:00" },
      { key: "hora_fi_2",        label: "Hora fi 2",                  type: "text",   placeholder: "22:00" },
      { key: "actiu",            label: "Actiu (sí/no)",              type: "select", options: ["Sí", "No"] },
      { key: "tipus_personal",   label: "Tipus personal",             type: "text",   placeholder: "Directa / Indirecte / Cocinero / Encarregat" },
      { key: "descans",          label: "Descans",                    type: "text",   placeholder: "15 minuts" },
      { key: "capacitats",       label: "Capacitats",                 type: "text",   placeholder: "TOTAS / NO ENROTLLA..." },
      { key: "autoritzacions",   label: "Autoritzacions",             type: "text",   placeholder: "DM (Detector Metalls)" },
      { key: "comentaris",       label: "Comentaris",                 type: "text" },
    ],
  },
  reprocessament: {
    label: "Reprocessar", icon: "♻️", voice: false, custom: true,
    fields: [
      { key: "producte", label: "Producte", type: "text", req: true },
      { key: "estat",    label: "Estat",    type: "text" },
      { key: "error",    label: "Error",    type: "text" },
    ],
  },
};

// La IA de vegades retorna noms en castellà en lloc de català. Normalitza abans de desar.
const normalizeAIFields = rows => rows.map(row => {
  const r = { ...row }
  if ('producto' in r && !('producte' in r)) { r.producte = r.producto; delete r.producto }
  return r
})

const CASCADE = ["productes", "recepta", "farcit", "masses", "linies", "flux"];

// Taules amb una columna 'producte': són les que pertanyen a UN producte i es poden refer.
// farcit, masses i linies no hi són perquè són catàlegs compartits entre productes.
const PER_PRODUCT_TABLES = ["productes", "recepta", "flux"];

// Separador entre gravacions d'un mateix producte dins de productes.transcripcio
const RECORDING_SEP = "\n\n";

// Un producte creat amb "Copiar" porta el seu base a l'inici de la transcripció
const parseVariantMarker = text => {
  const m = /^\[Duplicat de ([^\]]+)\]\s*([\s\S]*)$/.exec(String(text || '').trim());
  return m ? { base: m[1].trim(), diff: m[2].trim() } : null;
};

// Descripcions que encara no consten a la taula de gravacions
function recordingsToAdd(products, existing) {
  return products.filter(p => p.transcripcio).flatMap(p => {
    const texts = (existing || []).filter(g => g.producte === p.producte).map(g => g.text);
    if (texts.includes(p.transcripcio) || texts.join(RECORDING_SEP) === p.transcripcio) return [];
    return [{ producte: p.producte, text: p.transcripcio }];
  });
}

// Xifres d'un text, sense fraccions ni hores (la IA les converteix a minuts) ni números petits
// (apareixen arreu i no diuen res)
const significantNumbers = s => new Set(
  (String(s || '').replace(/\d+\/\d+|\d+:\d+/g, ' ').match(/\d+(?:[.,]\d+)?/g) || [])
    .map(n => Number(n.replace(',', '.')))
    .filter(n => n >= 10)
);

// Frases de la gravació amb alguna xifra que no consta enlloc del que s'ha extret, perquè es
// puguin revisar. Es fa per codi perquè el resultat no depengui de la IA que s'està comprovant.
function findUnplaced(text, extracted) {
  const have = significantNumbers(JSON.stringify(extracted));
  const missing = String(text || '').split(/(?<!\d)\.|\.(?!\d)|[;\n]+/)
    .map(s => s.trim())
    .filter(s => [...significantNumbers(s)].some(n => !have.has(n)));
  return missing.join("\n") || null;
}

// Deixa una fila a punt per desar: només columnes conegudes (una clau inventada per la IA faria
// fallar tota la inserció) i números vàlids. Els valors incorrectes s'afegeixen a 'problems'.
function prepareRow(table, row, problems) {
  const out = { _action: row._action, _existingId: row._existingId };
  for (const f of SCHEMAS[table].fields) {
    let v = row[f.key];
    if (v === undefined) continue;
    if (f.type === "number" && typeof v === "string" && v.trim() !== "") {
      const n = Number(v.trim().replace(",", "."));
      if (Number.isNaN(n)) { problems.push(`${SCHEMAS[table].label}: «${f.label}» no és un número («${v}»)`); continue; }
      v = n;
    }
    out[f.key] = v;
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════
   REPROCESSAMENT — tornar a extreure els productes des de les gravacions
   ══════════════════════════════════════════════════════════════ */

// Valors desats que no consten a la gravació o que hi discrepen (docs/informe-productes.md)
const FLAGGED_PRODUCTS = new Set([
  "626524", "628324", "229424", "111320", "225948", "226948",
  "2210848", "265722", "24382", "246210724", "24620924", "24100932",
]);

const isBlank = v => v === null || v === undefined || v === "";

const QUANTITY_FIELDS = ["kg_massa_palet", "kg_farcit_palet", "grams_per_unitat_farcit", "grams_per_unit_massa"];

const withoutProduct = (data, code) => {
  const src = { ...data };
  for (const t of PER_PRODUCT_TABLES) src[t] = (data[t] || []).filter(r => r.producte !== code);
  return src;
};

const rowsOfProduct = (data, code) => Object.fromEntries(
  PER_PRODUCT_TABLES.map(t => [t, (data[t] || []).filter(r => r.producte === code)])
);

// Productes amb gravació, cada base abans de les seves variants
function rerunOrder(productes) {
  const withText = productes.filter(p => p.producte && String(p.transcripcio || "").trim());
  const byCode = new Map(withText.map(p => [p.producte, p]));
  const out = [], seen = new Set();
  const visit = p => {
    if (seen.has(p.producte)) return;
    seen.add(p.producte);
    const marker = parseVariantMarker(p.transcripcio);
    const base = p.basat_en || marker?.base || null;
    if (base && byCode.has(base)) visit(byCode.get(base));
    out.push({ code: p.producte, text: p.transcripcio, base, diff: base ? (marker?.diff ?? p.transcripcio) : null });
  };
  withText.forEach(visit);
  return out;
}

// El que diu la gravació substitueix el que hi ha desat. Un camp que no hi consta conserva el valor
// actual, perquè un buit de la IA no l'esborri. En una variant, un valor heretat del base tampoc
// substitueix el propi: si la variant no l'ha dictat, la gravació no diu res d'aquell camp.
function mergeWithCurrent(parsed, data, base) {
  const fill = (table, row, old, baseRow) => {
    const out = { ...row };
    for (const { key } of SCHEMAS[table].fields) {
      const inherited = baseRow && !isBlank(row[key]) && String(row[key]) === String(baseRow[key]);
      // Els kg i grams del base no serveixen per a una variant d'un altre pes
      if (inherited && QUANTITY_FIELDS.includes(key)) out[key] = old[key] ?? null;
      else if (!isBlank(old[key]) && (isBlank(row[key]) || inherited)) out[key] = old[key];
    }
    return out;
  };
  const sameRecipe = SECONDARY_CHECKS.find(c => c.table === "recepta").matchFn;

  const productes = (parsed.productes || []).map(p => {
    const old = (data.productes || []).find(r => r.producte === p.producte);
    return old ? fill("productes", p, old, base?.productes?.[0]) : p;
  });

  const code = productes[0]?.producte;
  const oldRecepta = (data.recepta || []).filter(r => r.producte === code);
  const newRecepta = (parsed.recepta || []).map(r => {
    const old = oldRecepta.find(o => sameRecipe(r, o));
    const baseRow = (base?.recepta || []).find(b => sameRecipe(r, { ...b, producte: r.producte }));
    return old ? fill("recepta", r, old, baseRow) : r;
  });

  // Una gravació que no descriu cap recepta no pot deixar el producte sense la que ja tenia
  return { ...parsed, productes, recepta: newRecepta.length ? newRecepta : oldRecepta };
}

const mergedRerun = (h, data, held) => {
  const baseCode = h.resultat?.productes?.[0]?.basat_en;
  return mergeWithCurrent(h.resultat, data, baseCode ? held.get(baseCode)?.resultat : null);
};

// Codis de massa, farcit o matèria que hi ha ara i no hi serien després d'aprovar
function vanishingCodes(current, merged) {
  const codes = groups => new Set(groups.flatMap(([rows, fields]) =>
    (rows || []).flatMap(r => fields.flatMap(f => splitCodes(r[f])))
  ).map(c => c.split(".")[0].toUpperCase()));
  const before = codes([
    [current.productes, ["codi_massa", "codi_farcit"]],
    [current.recepta, ["codi_massa", "codi_farcit"]],
    [current.flux, ["codi_intervinent"]],
  ]);
  // Un codi que passa d'un camp a un comentari no s'ha perdut
  const after = JSON.stringify(merged).toUpperCase();
  return [...before].filter(c => !after.includes(c)).sort();
}

// Diferències d'una fila: 'substitueix' un valor existent o 'omple' un camp buit
function fieldChanges(table, oldRow, newRow) {
  return SCHEMAS[table].fields
    .filter(f => f.key !== "transcripcio" && !isBlank(newRow[f.key]))
    .filter(f => String(newRow[f.key]) !== String(oldRow?.[f.key] ?? ""))
    .map(f => ({
      key: f.key, label: f.label, from: oldRow?.[f.key], to: newRow[f.key],
      kind: isBlank(oldRow?.[f.key]) ? "omple" : "substitueix",
    }));
}

/* ══════════════════════════════════════════════════════════════
   ENTITY RESOLUTION — normalitza noms proposats contra la BD
   ══════════════════════════════════════════════════════════════ */

const normalizeStr = s =>
  String(s || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

// Un camp de codi pot portar diversos codis separats per comes ("M0002, M0007")
const splitCodes = v =>
  String(v || '').split(/[,;]/).map(s => s.trim()).filter(Boolean)

// Les tasques de neteja no són recursos propis: es modelen amb el temps_neteja del recurs
const isCleaningTask = v => /^(limpieza|neteja|netejar|limpiar)\b/.test(normalizeStr(v))

// El catàleg conté noms de tasques ("Etiquetado de cajas") i duplicats amb el tipus entre parèntesis.
// No s'ofereixen a la IA, perquè els copiaria com si fossin recursos.
const TASK_AS_RESOURCE = /^(fabricat|preparacion?|desembalar|etiquetado|encaixat|mezcla manual)\b|\s-\s/
const resourceNamesForPrompt = linies => {
  const names = [...new Set((linies || []).map(l => l.linia).filter(Boolean))]
  return names.filter(n => {
    if (TASK_AS_RESOURCE.test(normalizeStr(n))) return false
    const withType = /^(.*) \([^)]*\)$/.exec(n)
    return !(withType && names.includes(withType[1]))
  })
}

const singularize = s => {
  if (s.endsWith('es') && s.length > 4) return s.slice(0, -2)
  if (s.endsWith('s') && s.length > 3) return s.slice(0, -1)
  return s
}

const levenshtein = (a, b) => {
  if (Math.abs(a.length - b.length) > 3) return 99
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

const fuzzyMatch = (a, b) => {
  const na = normalizeStr(a), nb = normalizeStr(b)
  if (!na || !nb) return false
  if (na === nb) return true
  // Els números identifiquen: "Màquina 1" i "Màquina 4", o M2001 i M2002, són coses diferents
  if (na.replace(/\D/g, '') !== nb.replace(/\D/g, '')) return false
  if (singularize(na) === singularize(nb)) return true
  if (na.length >= 4 && nb.length >= 4 && levenshtein(na, nb) <= 2) return true
  return false
}

// exactMatch: només normalització (sense Levenshtein). Per a codis únics: producte, codi_farcit, codi_massa.
// Evita que "24155536" i "24155537" es confonguin per proximitat de caràcters.
const exactMatch = (a, b) => {
  const na = normalizeStr(a), nb = normalizeStr(b)
  return !!na && !!nb && na === nb
}

// Taules que defineixen entitats i les taules que les referencien
const ENTITY_DEFS = [
  {
    // producte és un codi únic → exactMatch obligatori per no confondre codis similars
    table: 'productes', keyField: 'producte', matchFn: exactMatch,
    refs: [
      { table: 'recepta', field: 'producte', clearIfUnresolved: true },
      { table: 'flux', field: 'producte', clearIfUnresolved: true },
    ],
  },
  {
    // linia és un nom descriptiu → fuzzyMatch per tolerar variants ortogràfiques
    // linia a flux és OPCIONAL (null per a passos sense recurs físic).
    // autoAdd: si la IA s'ha deixat un recurs que apareix al flux, es crea igualment.
    table: 'linies', keyField: 'linia', matchFn: fuzzyMatch,
    refs: [
      {
        table: 'flux', field: 'linia', clearIfUnresolved: false,
        autoAdd: true, autoAddDefaults: { quantitat: 1 }, skipAutoAdd: isCleaningTask,
      },
    ],
  },
]

// Taules secundàries: com detectar si una fila ja existeix
const SECONDARY_CHECKS = [
  {
    // Recepta: 1 fila per (producte + codi_farcit + codi_massa).
    // Un producte pot tenir diverses masses i diversos farcits, per tant la
    // identitat de la fila és la combinació dels tres codis, no només el farcit.
    table: 'recepta',
    matchFn: (row, existing) => {
      if (!exactMatch(row.producte, existing.producte)) return false
      // Cal com a mínim un dels dos codis per poder identificar la fila
      if (!row.codi_farcit && !row.codi_massa) return false
      // Un codi buit en un costat és compatible: la fila es va completant en gravacions successives
      const compatible = (a, b) => !a || !b || exactMatch(a, b)
      return compatible(row.codi_farcit, existing.codi_farcit)
        && compatible(row.codi_massa, existing.codi_massa)
        && (exactMatch(row.codi_farcit, existing.codi_farcit) || exactMatch(row.codi_massa, existing.codi_massa))
    },
  },
  {
    // Farcit: 1 fila per (codi_farcit + codi_nom_mp)
    // codi_farcit és un codi únic → exactMatch; codi_nom_mp pot ser nom → fuzzyMatch
    table: 'farcit',
    matchFn: (row, existing) =>
      row.codi_farcit != null && existing.codi_farcit != null &&
      exactMatch(row.codi_farcit, existing.codi_farcit) &&
      fuzzyMatch(row.codi_nom_mp, existing.codi_nom_mp),
  },
  {
    // Masses: 1 fila per (codi_massa + codi_nom_mp)
    // codi_massa és un codi únic → exactMatch; codi_nom_mp pot ser nom → fuzzyMatch
    table: 'masses',
    matchFn: (row, existing) =>
      row.codi_massa != null && existing.codi_massa != null &&
      exactMatch(row.codi_massa, existing.codi_massa) &&
      fuzzyMatch(row.codi_nom_mp, existing.codi_nom_mp),
  },
  {
    // Flux: 1 fila per (producte + dia + pas + recurs). Un mateix 'pas' pot tenir diverses files
    // (recursos paral·lels) i cada gravació pot tornar a numerar, per tant el número sol no identifica.
    // Sense número, fallback a (producte + dia + codi_intervinent + recurs).
    table: 'flux',
    matchFn: (row, existing) => {
      if (!exactMatch(row.producte, existing.producte)) return false
      if (String(row.dia ?? '') !== String(existing.dia ?? '')) return false
      const same = (a, b) => (!a && !b) || fuzzyMatch(a, b)
      if (!same(row.linia, existing.linia)) return false
      if (row.accio && existing.accio && !fuzzyMatch(row.accio, existing.accio)) return false
      if (row.pas != null && existing.pas != null)
        return String(row.pas) === String(existing.pas)
      return exactMatch(row.codi_intervinent || '', existing.codi_intervinent || '')
        || (!row.codi_intervinent && !existing.codi_intervinent)
    },
  },
]

function resolveCanonicalNames(parsed, dbData) {
  const resolved = JSON.parse(JSON.stringify(parsed))
  const changeLog = [] // { from, to, table }

  for (const { table, keyField, matchFn, refs } of ENTITY_DEFS) {
    const existing = dbData[table] || []
    const mapping = {} // normalizeStr(proposedVal) → { canonical, existingId }

    if (resolved[table]?.length) {
      resolved[table] = resolved[table].map(row => {
        const val = row[keyField]
        if (!val) return { ...row, _action: 'insert', _existingId: null }

        // Usa el matchFn específic de cada entitat (exactMatch per codis, fuzzyMatch per noms)
        const match = existing.find(e => matchFn(val, e[keyField]))
        if (match) {
          const canonical = match[keyField]
          if (normalizeStr(canonical) !== normalizeStr(val)) {
            changeLog.push({ from: val, to: canonical, table })
          }
          mapping[normalizeStr(val)] = { canonical, existingId: match.id }
          return { ...row, [keyField]: canonical, _action: 'update', _existingId: match.id }
        }
        mapping[normalizeStr(val)] = { canonical: val, existingId: null }
        return { ...row, _action: 'insert', _existingId: null }
      })
    }

    // Propaga el nom canònic a les taules que el referencien
    for (const ref of refs) {
      if (!resolved[ref.table]?.length) continue
      resolved[ref.table] = resolved[ref.table].map(row => {
        const refVal = row[ref.field]
        if (!refVal && !ref.clearIfUnresolved) return row
        // 1. Coincideix amb una entitat del batch (nova o existent)
        const mapped = mapping[normalizeStr(refVal)]
        if (mapped) return { ...row, [ref.field]: mapped.canonical }
        // 2. Coincideix directament amb la BD (usant el matchFn de l'entitat)
        const directMatch = existing.find(e => matchFn(refVal, e[keyField]))
        if (directMatch) return { ...row, [ref.field]: directMatch[keyField] }
        // 3. No resolt
        if (ref.clearIfUnresolved) {
          // Amb un sol producte al lot no hi ha dubte de a qui pertany la fila
          const sole = resolved[table]?.length === 1 ? resolved[table][0][keyField] : ''
          return { ...row, [ref.field]: sole || '' }
        }
        if (ref.autoAdd && !(ref.skipAutoAdd && ref.skipAutoAdd(refVal))) {
          const alreadyInBatch = resolved[table]?.some(e => matchFn(e[keyField], refVal))
          if (!alreadyInBatch) {
            resolved[table] = [...(resolved[table] || []), {
              [keyField]: refVal, ...(ref.autoAddDefaults || {}),
              _action: 'insert', _existingId: null,
            }]
            mapping[normalizeStr(refVal)] = { canonical: refVal, existingId: null }
          }
        }
        return row // mantenir el valor original
      })
    }
  }

  // Marca les files de taules secundàries com a insert o update
  for (const { table, matchFn } of SECONDARY_CHECKS) {
    if (!resolved[table]?.length) continue
    resolved[table] = resolved[table].map(row => {
      if (row._action) return row
      const match = (dbData[table] || []).find(e => matchFn(row, e))
      if (match) return { ...row, _action: 'update', _existingId: match.id }
      return { ...row, _action: 'insert', _existingId: null }
    })
  }

  return { resolved, changeLog }
}

// Les dues taules de composició, amb el camp de codi i la merma que els correspon a recepta
const COMPOSITION_TABLES = [
  { table: 'farcit', codeField: 'codi_farcit', mermaField: 'merma_farcit' },
  { table: 'masses', codeField: 'codi_massa', mermaField: 'merma_massa' },
]

// Codis referenciats des de recepta o productes que encara no tenen cap fila a la seva
// taula de composició. Retorna les files que caldria crear, amb el codi i la merma que
// porti la recepta i la resta buit.
function missingCompositionRows(dbData, source, { table, codeField, mermaField }) {
  const referenced = new Map() // codi normalitzat → { code, merma }
  const collect = (rows, withMerma) => {
    for (const r of rows || [])
      for (const code of splitCodes(r[codeField])) {
        const k = normalizeStr(code)
        if (!referenced.has(k)) referenced.set(k, { code, merma: withMerma ? r[mermaField] ?? null : null })
      }
  }
  collect(source.recepta, true)
  collect(source.productes, false)

  const rows = []
  for (const [k, { code, merma }] of referenced) {
    const has = list => (list || []).some(e => normalizeStr(e[codeField]) === k)
    if (has(dbData[table]) || has(source[table])) continue
    rows.push({ [codeField]: code, codi_nom_mp: null, kg_per_palet: null, merma })
  }
  return rows
}

// Recursos referenciats a flux.linia que no tenen fila al catàleg. Fa servir fuzzyMatch,
// igual que la resolució d'entitats, per no crear duplicats gairebé iguals.
function missingResourceRows(dbData) {
  const referenced = new Map() // normalitzat → nom original
  for (const r of dbData.flux || []) {
    const v = r.linia
    if (!v || isCleaningTask(v)) continue
    const k = normalizeStr(v)
    if (!referenced.has(k)) referenced.set(k, v)
  }
  return [...referenced.values()]
    .filter(v => !(dbData.linies || []).some(l => fuzzyMatch(v, l.linia)))
    .map(linia => ({ linia, quantitat: 1 }))
}

// Tot codi de farcit/massa referenciat ha de tenir com a mínim una fila a la seva taula
// de composició, perquè no quedi orfe i invisible.
// Files de composició que han quedat orfes: cap producte ni recepta referencia el seu codi i
// no tenen cap dada a dins. Són residus d'una extracció errònia (un codi que la IA va inventar),
// no catàleg reutilitzable: per això només compten les que estan buides.
function orphanCompositionRows(dbData, { table, codeField }) {
  const referenced = new Set()
  for (const t of ['recepta', 'productes'])
    for (const r of dbData[t] || [])
      for (const code of splitCodes(r[codeField])) referenced.add(normalizeStr(code))

  return (dbData[table] || []).filter(r =>
    r[codeField]
    && !referenced.has(normalizeStr(r[codeField]))
    && !r.codi_nom_mp
    && r.kg_per_palet == null
  )
}

function ensureCompositionStubs(resolved, dbData) {
  const out = { ...resolved }
  let added = 0

  for (const spec of COMPOSITION_TABLES) {
    const rows = missingCompositionRows(dbData, out, spec)
    if (!rows.length) continue
    out[spec.table] = [
      ...(out[spec.table] || []),
      ...rows.map(r => ({ ...r, _action: 'insert', _existingId: null })),
    ]
    added += rows.length
  }

  return { resolved: out, added }
}

/* ══════════════════════════════════════════════════════════════
   PROMPTS — pipeline de 3 crides sequencials a la IA
   Context: sistema d'optimització de producció industrial
   ══════════════════════════════════════════════════════════════ */

/* ═══ Models ═══ */
// La 1a crida ha de desambiguar si un M#### és la massa del producte o una matèria primera
// del farcit: és la part de raonament sobre un domini ambigu, i va amb Opus. La resta, Sonnet.
// (claude-sonnet-4-5 es retira el 30/11/2026; no es pot fer servir més enllà d'aquesta data.)
const MODEL_REASONING = "claude-opus-5-5";
const MODEL_DEFAULT = "claude-sonnet-5-5";

// 'temperature' està deprecat als models 4.7+ i retorna 400 si s'hi passa un valor:
// el determinisme s'ha de demanar per prompt.
const DETERMINISM_RULE = `- SIGUES DETERMINISTA: extreu només el que es diu a la transcripció, sense variacions
  creatives ni suposicions. La mateixa transcripció ha de donar sempre el mateix resultat.`;

// Els exemples dels prompts porten codis en forma de patró per evitar que la IA els copiï
// a la sortida quan l'usuari no n'ha dictat cap (abans inventava el codi de l'exemple).
const PLACEHOLDER_RULE = `- PATRONS, NO VALORS: "########", "M####", "R####" i "Màquina #" indiquen NOMÉS el format que
  tenen aquests codis. No són valors reals i no els has de copiar MAI a la sortida. Fes servir
  únicament els codis que l'usuari ha dictat; si per a un camp no n'ha dictat cap → null.
- XIFRES DELS EXEMPLES: cap número ni temps dels exemples d'aquest prompt és real. Una dada que no
  surt a la transcripció → null. No la copiïs dels exemples ni la dedueixis de productes semblants.`;

const PROMPT_PROD_RECEPTA = `Ets un assistent expert en producció alimentària industrial. Treballes per a un sistema d'OPTIMITZACIÓ DE LA PRODUCCIÓ que, a partir de les receptes i els recursos disponibles, optimitza l'ús del personal i les màquines per maximitzar l'eficiència productiva.

L'usuari dicta informació sobre UN PRODUCTE en català o castellà. Extreu les dades per a QUATRE TAULES:

═══════════════════════════════════════════
COM S'ESTRUCTUREN AQUESTES DADES (llegeix-ho abans de res):
═══════════════════════════════════════════
Un producte es fa amb una MASSA (l'oblea, el crep, la base) i un FARCIT (el farciment):
- El FARCIT té codi R#### i està COMPOST per diverses matèries primeres, cada una amb els seus kg.
- Aquestes matèries primeres normalment tenen codi M####, però també poden ser un nom ("Ricotta").
- La MASSA té codi M#### i també pot estar composta per matèries primeres.

Per tant el format M#### és AMBIGU: pot ser la massa del producte O un ingredient. Com distingir-ho:
si el que es dicta és que aquest M#### ENTRA DINS d'un R#### (és un component de la mescla, de la
crema, del farcit), aleshores és una MATÈRIA PRIMERA, va a la taula FARCIT, i NO al camp codi_massa.

Exemple del tipus de frase que dicta l'usuari:
  "necessitarem una M#### que seran 163,57 kg. La mescla final, que és la R####, seran 203,67 kg.
   I l'encolant, que és una altra M####, en necessitarem 21,01 kg."
  → La R#### és el farcit del producte: codi_farcit = R####, kg_farcit_palet = 203.67
  → Les DUES M#### són matèries primeres d'aquesta R####: DUES files a la taula FARCIT,
    amb kg_per_palet 163.57 i 21.01 respectivament.
  → codi_massa i kg_massa_palet queden a null: de la massa (l'oblea) no n'ha dit ni el codi ni els kg.
Si descartes una d'aquestes M#### perquè "no hi cap" en cap camp, l'extracció és INCORRECTA:
tot codi que l'usuari pronuncia ha d'acabar en alguna de les quatre taules.

═══════════════════════════════════════════
1. PRODUCTES (1 fila per producte):
═══════════════════════════════════════════
Camps i FORMATS exactes:
- 'producte'           text   → codi o identificador del producte, format ########
- 'grup'               text   → nom comercial/descriptiu (ex: "Crepes Salados 110gr", "Rolls Pollastre 90gr")
- 'unitats_per_palet'  number → ex: 3600
- 'caixes_per_palet'   number → ex: 180
- 'unitats_per_caixa'  number → ex: 20
- 'kg_massa_palet'     number → kg de la MASSA (oblea/base) per palet (ex: 335.01).
                                 NO hi posis els kg d'un ingredient del farcit.
- 'codi_massa'         text   → codi(s) de la massa, format M####. NOMÉS si es dicta que aquest
                                 M#### és la massa/base del producte. Si el M#### és un ingredient
                                 que entra dins del farcit → va a la taula FARCIT i aquí null.
                                 Si el producte té VÀRIES masses, separa-les per comes: "M####, M####".
- 'kg_farcit_palet'    number → kg de farcit per palet (ex: 328.01)
- 'codi_farcit'        text   → codi(s) del farcit, format R####.
                                 Si en té VARIS, separa'ls per comes: "R####, R####".
- 'dies_permesos'      text   → dies de la setmana en què es pot fabricar.
                                 Format preferent: "Dll-Dm-Dc" (Dll=Dilluns, Dm=Dimarts, Dc=Dimecres, Dj=Dijous, Dv=Divendres, Ds=Dissabte, Dg=Diumenge).
                                 Si l'usuari dicta noms complets, accepta també "Dimecres-Dijous-Divendres".
- 'incompatible_amb'   text   → text lliure descrivint productes/famílies incompatibles
                                 (ex: "No es poden fabricar altres crepes salats ni rolls. No es poden fabricar altres farcits amb formatges.")
- 'linies_permeses'    text   → línies on es pot fabricar el producte, NOMÉS si es dicta una restricció
                                 (ex: "Línia 2", "Línia 1, Línia 2"). null si no es diu.
- 'unitats_per_carro'  number → unitats de producte que hi caben a cada carro. null si no es dicta.
- 'comentaris'         text

═══════════════════════════════════════════
2. RECEPTA (1 fila per combinació de producte + farcit + massa):
═══════════════════════════════════════════
Camps i FORMATS:
- 'producte'                text   → MATEIX codi de producte que a PRODUCTES
- 'codi_farcit'             text   → R####
- 'grams_per_unitat_farcit' number → grams de farcit per unitat final (ex: 72)
- 'merma_farcit'            number → DECIMAL entre 0 i 1 (ex: 0.01 = 1%, 0.248 = 24.8%). MAI percentatge sencer.
- 'codi_massa'              text   → M####
- 'grams_per_unit_massa'    number → grams de massa per unitat final (ex: 40)
- 'merma_massa'             number → DECIMAL entre 0 i 1 (ex: 0.248 = 24.8%)
- 'kg_farcit_palet'         number → kg per palet d'AQUEST codi_farcit (ex: 328.01). null si no es dicta per separat.
- 'kg_massa_palet'          number → kg per palet d'AQUESTA codi_massa (ex: 335.01). null si no es dicta per separat.
- 'comentaris'              text

Regles RECEPTA:
- Una fila representa una combinació (producte + codi_farcit + codi_massa).
- Si el producte té MÚLTIPLES farcits → crea UNA FILA per cada codi_farcit amb els seus grams i merma específics.
- Si el producte té MÚLTIPLES masses → crea UNA FILA per cada codi_massa amb els seus grams i merma específics.
- Si té diverses masses I diversos farcits, crea una fila per cada combinació que l'usuari descrigui.
- Repeteix el mateix 'codi_massa' a diverses files NOMÉS si totes comparteixen realment la mateixa massa.
- Si dicta percentatges ("3 per cent", "24,8%"), DIVIDEIX per 100 i registra com a decimal.
- Si l'usuari parla de "la massa" o "el farcit" però NO en dicta el codi → deixa el camp a null.
  No te l'inventis ni el copiïs dels exemples d'aquest prompt.

═══════════════════════════════════════════
3. FARCIT (1 fila per matèria primera dins un codi_farcit):
═══════════════════════════════════════════
Camps i FORMATS:
- 'codi_farcit'   text   → R#### a què pertany la matèria primera
- 'codi_nom_mp'   text   → codi M#### o nom de la matèria primera (ex: "Ricotta", "Gambes")
- 'kg_per_palet'  number → kg d'aquesta matèria primera per palet de producte (ex: 142.03)
- 'merma'         number → DECIMAL entre 0 i 1 (ex: 0.03 = 3%, 0.65 = 65%)

Regles FARCIT:
- Un codi_farcit està compost per matèries primeres → crea UNA FILA per cada matèria primera.
  Pot tenir-ne 2 o pot tenir-ne 10: registra les que es dictin i no esperis una llista completa.
  Unes van identificades per codi M#### i d'altres pel seu nom.
- ELS KG: el número de kg que es diu al costat de cada matèria primera és el seu 'kg_per_palet'.
  No el confonguis amb els kg TOTALS del farcit, que van a 'kg_farcit_palet' de PRODUCTES.
- ATENCIÓ al doble ús del format M####: un M#### pot ser una MASSA o una MATÈRIA PRIMERA. El que ho
  distingeix és el paper que fa a la frase, no el format. Si l'usuari diu que un M#### és un
  INGREDIENT del farcit i en dóna els kg (ex: "les gambes, que són la M####, en necessitarem 42 kg"),
  va aquí com a 'codi_nom_mp' amb el seu 'codi_farcit', NO com a codi_massa.
- Recull aquestes matèries primeres encara que l'usuari les mencioni enmig de la descripció del
  procés (descongelar, preparar, escórrer, batre) i no en una llista de composició ordenada.
- Una matèria primera pot ser una PREPARACIÓ INTERMÈDIA amb el seu propi procés de cuina
  (una crema, un saltat, un descongelat). Que tingui passos propis al flux no la treu d'aquí:
  segueix sent una fila de FARCIT amb els seus kg.
- NO retornis farcit:[] si s'ha dictat algun M#### o algun ingredient que entri dins d'un R####.

═══════════════════════════════════════════
4. MASSES (1 fila per matèria primera dins un codi_massa):
═══════════════════════════════════════════
Camps i FORMATS:
- 'codi_massa'    text   → M#### a què pertany la matèria primera
- 'codi_nom_mp'   text   → codi M#### o nom de la matèria primera (ex: "Farina")
- 'kg_per_palet'  number → kg d'aquesta matèria primera per palet de producte
- 'merma'         number → DECIMAL entre 0 i 1 (ex: 0.03 = 3%)

Regles MASSES:
- Un codi_massa està compost per VÀRIES matèries primeres → crea UNA FILA per cada matèria primera.
- Mateixa lògica que FARCIT però per a la massa en lloc del farcit.
- Si l'usuari no descriu la composició de la massa → retorna masses:[].

═══════════════════════════════════════════
EXEMPLE DE FORMAT (els codis hi surten com a PATRONS, no com a valors reals):
═══════════════════════════════════════════
{
  "productes": [{
    "producte": "########", "grup": "Crepes Salados 110gr",
    "unitats_per_palet": 3600, "caixes_per_palet": 180, "unitats_per_caixa": 20,
    "kg_massa_palet": 335.01, "codi_massa": "M####",
    "kg_farcit_palet": 328.01, "codi_farcit": "R####",
    "dies_permesos": "Dc-Dj-Dv",
    "incompatible_amb": "No es poden fabricar altres crepes salats ni rolls.",
    "linies_permeses": null, "unitats_per_carro": null,
    "comentaris": null
  }],
  "recepta": [{
    "producte": "########", "codi_farcit": "R####",
    "grams_per_unitat_farcit": 72, "merma_farcit": 0.01,
    "codi_massa": "M####", "grams_per_unit_massa": 40, "merma_massa": 0.248,
    "kg_farcit_palet": 328.01, "kg_massa_palet": 335.01,
    "comentaris": null
  }],
  "farcit": [
    { "codi_farcit": "R####", "codi_nom_mp": "M####",         "kg_per_palet": 142.03, "merma": 0.03 },
    { "codi_farcit": "R####", "codi_nom_mp": "<altre M####>", "kg_per_palet": 228.67, "merma": 0.65 },
    { "codi_farcit": "R####", "codi_nom_mp": "Ricotta",       "kg_per_palet": 49.2,   "merma": 0 }
  ],
  "masses": [
    { "codi_massa": "M####", "codi_nom_mp": "M####",  "kg_per_palet": 210.5, "merma": 0.02 },
    { "codi_massa": "M####", "codi_nom_mp": "Farina", "kg_per_palet": 98.3,  "merma": 0 }
  ]
}

Productes ja existents al sistema (NO duplicar — fes servir EL MATEIX 'producte'): {{EXISTING_PRODUCTS}}

REGLES ESTRICTES:
- CAP CODI PERDUT: abans de respondre, repassa la transcripció i fes la llista de tots els codis
  M#### i R#### que l'usuari ha pronunciat. Cada un ha d'aparèixer en alguna de les quatre taules
  (com a codi_massa, codi_farcit, codi_nom_mp o codi d'una fila de composició). Si algun no hi
  encaixa com a massa ni com a farcit, és una MATÈRIA PRIMERA: posa'l a FARCIT amb els seus kg.
${PLACEHOLDER_RULE}
${DETERMINISM_RULE}
- Retorna ÚNICAMENT un objecte JSON vàlid. Cap markdown, cap backtick, cap text extra.
- Format exacte: {"productes":[...],"recepta":[...],"farcit":[...],"masses":[...]}
- Claus exactes (case-sensitive, minúscules amb guions baixos). Converteix números parlats a xifres.
- Si una taula no té informació → array buit [].
- VALORS NO MENCIONATS: numèrics → null (MAI ""). Textos → null (MAI "").
- TIPUS ESTRICTES: numèrics → number o null. Textos → string o null.`;

const PROMPT_FLUX = `Ets un assistent expert en producció alimentària industrial. Treballes per a un sistema d'OPTIMITZACIÓ DE LA PRODUCCIÓ que necessita conèixer tots els passos del procés per planificar l'ús òptim del personal i els recursos.

L'usuari ha dictat informació sobre el producte "{{PROPOSED_PRODUCTE}}". Extreu tots els PASSOS DEL FLUX DE PRODUCCIÓ.

FLUX (1 fila per pas de fabricació — ha de descriure TOT el procés de principi a fi):
producte, pas, dia, accio, codi_intervinent, linia, massa, temps_per_kg, minuts_min, minuts_max, temps_quantitat, temps_unitat, persones_necessaries, perfils_de_persona, es_pot_parar, frequencia, minuts_abans_produccio, depen_de_pas, alternativa_de, prerequisits, comentaris

Recursos (màquines/zones/equips) disponibles al sistema: {{EXISTING_RESOURCES}}

Passos ja registrats d'aquest producte: {{EXISTING_STEPS}}
Si n'hi ha, aquesta gravació els amplia: continua la numeració de 'pas' a partir del més alt i retorna només els passos nous o els que aquesta gravació completi (amb el seu mateix 'pas', 'dia' i 'linia').

═══════════════════════════════════════════
CAMPS I FORMATS:
═══════════════════════════════════════════
- 'producte'             text   → MATEIX codi de producte a TOTES les files (format ########).
- 'pas'                  number → índex seqüencial global del pas (1, 2, 3...). Cada pas té un número únic. Serveix per ordenar.
- 'dia'                  number → dia RELATIU al dia de fabricació. 0 = el dia que el producte passa per la línia. -1 = el dia anterior, -2 = dos dies abans, 1 = l'endemà.
                                   El mateix dia agrupa múltiples passos. Totes les fases del dia de fabricació (arrencada, fabricat, túnel, encaixat, neteja) són dia 0 si no es diu el contrari.
                                   "2 días antes de la producción" → -2. Si es dicta un marge ("com a molt tard el dia abans", "dos o tres dies abans"), posa el dia MÉS TARDÀ permès i copia el marge a 'comentaris'.
                                   "al día siguiente" o "el día de la cocción" es refereixen a la fase de què s'està parlant: situa'ls respecte a la fabricació. Si no es menciona, dedueix-lo de l'ordre lògic.
- 'accio'                text   → QUÈ es fa en aquest pas, en poques paraules (ex: "Mesclar farcit", "Fregir", "Preparació de carros", "Neteja Olla mediana", "Encaixat / Paletització"). Obligatori a TOTES les files.
- 'codi_intervinent'     text   → codi de la matèria principal del pas, format M#### o R####.
                                   Si el pas és una variant del mateix codi (neteja, subtasca), pots afegir sufix decimal: "M####.1", "M####.2".
                                   null si el pas no està lligat a una matèria/farcit concret (ex: "Preparació de carros", "Encaixat / Paletització").
- 'linia'                text   → NOMÉS el nom del recurs físic (màquina, zona, equip) que s'OCUPA en aquest pas (ex: "Olla mediana", "Freidora", "Turmix Grande / Balança"). El nom de la tasca va a 'accio', mai aquí.
                                   Si el recurs ja és a la llista de recursos disponibles, escriu-lo EXACTAMENT igual. Preparar carros, etiquetar o desembalar són tasques: si no ocupen cap màquina, 'linia' → null.
                                   null si el pas no ocupa cap recurs físic concret (esperes, controls, administratiu).
- 'massa'                number → kg de massa/farcit del producte que intervenen en aquest pas. null si no aplica.
- 'temps_per_kg'         text   → el temps TAL COM ES DIU, sense interpretar-lo (ex: "## minuts / ### kg", "## minuts", "### unidades / hora", "de 30 a 45 minuts"). null si no s'especifica.
- 'minuts_min'           number → el mateix temps convertit a MINUTS. "1/4 d'hora" = 15, "3/4" = 45, "1:30 h" = 90.
- 'minuts_max'           number → igual que minuts_min si és un sol valor. Si és un marge ("de mitja hora a 3/4"): minuts_min = 30 i minuts_max = 45.
- 'temps_quantitat'      number → quantitat a què corresponen aquests minuts. "45 minuts / 150 kg" → 150. "75 cajas / hora" → minuts 60 i quantitat 75. null si el temps és fix.
- 'temps_unitat'         text   → unitat de la quantitat. NOMÉS un d'aquests valors: "fix" (no depèn de cap quantitat), "kg", "unitat", "caixa", "carro", "container", "bandeja", "palet".
                                   Si no s'ha dictat cap temps: temps_per_kg, minuts_min, minuts_max, temps_quantitat i temps_unitat → null.
- 'persones_necessaries' number → nombre de persones (ex: 1, 3). 0 NOMÉS si el pas passa sol sense ningú (túnel, espera). null si no es diu.
- 'perfils_de_persona'   text   → tipus de personal. NOMÉS aquests noms, amb aquesta grafia: "Cocinero", "Directa", "Directa formada", "Encarregat", "Responsable de línia", "Almacenero", "Indirecte", "Manipuladora", "Qualsevol".
                                   Separats per " / " vol dir que ho pot fer QUALSEVOL d'ells. "Encargado" → "Encarregat". null si no es diu.
- 'es_pot_parar'         text   → "Sí" si el procés es pot interrompre, "No" si ha de ser continu. null si no es dicta ni es desprèn clarament.
- 'frequencia'           text   → quan cal fer el pas. NOMÉS un d'aquests valors: "cada_produccio", "final_jornada", "final_setmana", "altres" (explica-ho a 'comentaris').
                                   Divendres o "a final de semana" → "final_setmana". Si no es diu res → "cada_produccio".
- 'minuts_abans_produccio' number → minuts d'antelació respecte a l'INICI de la fabricació, si es dicten ("1:30 h antes de la producción" → 90). Si és un marge, el valor més gran. null si no es diu.
- 'depen_de_pas'         text   → números de 'pas' d'aquesta mateixa llista que han d'estar acabats abans, separats per comes (ex: "4, 7"). Omple-ho quan el prerequisit es correspongui amb un pas concret. null si no depèn de cap.
- 'alternativa_de'       number → si aquest pas és una ALTRA MANERA de fer el mateix pas (amb un altre equip o una altra velocitat, i es fa una o l'altra, mai totes dues), el número de 'pas' de la primera opció. A la primera opció i a la resta de passos → null.
- 'prerequisits'         text   → TEXT LLIURE descrivint què ha d'estar acabat abans (ex: "Finalitzar M####", "Aigua a 90 graus", "Mezcla R#### acabada", "Producció acabada", "Línia neta i muntada"). null si no depèn de res.
- 'comentaris'           text   → notes addicionals (ex: "Màxim 60 kg per container", "Batut: mínim 90 kg / màxim 300 kg", "Palet màxim de 180 caixes").

═══════════════════════════════════════════
EXEMPLE DE FORMAT (els codis hi surten com a PATRONS, no com a valors reals):
═══════════════════════════════════════════
{
  "flux": [
    { "producte": "########", "pas": 1, "dia": -1, "accio": "Cocció", "codi_intervinent": "M####", "linia": "Olla mediana", "massa": 150, "temps_per_kg": "## minuts / ### kg", "minuts_min": 45, "minuts_max": 45, "temps_quantitat": 150, "temps_unitat": "kg", "persones_necessaries": 1, "perfils_de_persona": "Cocinero", "es_pot_parar": "No", "frequencia": "cada_produccio", "minuts_abans_produccio": null, "depen_de_pas": null, "alternativa_de": null, "prerequisits": null, "comentaris": null },
    { "producte": "########", "pas": 2, "dia": -1, "accio": "Neteja Olla mediana", "codi_intervinent": "M####.1", "linia": "Olla mediana", "massa": null, "temps_per_kg": "## minuts", "minuts_min": 15, "minuts_max": 15, "temps_quantitat": null, "temps_unitat": "fix", "persones_necessaries": 1, "perfils_de_persona": "Cocinero / Directa", "es_pot_parar": "Sí", "frequencia": "cada_produccio", "minuts_abans_produccio": null, "depen_de_pas": "1", "alternativa_de": null, "prerequisits": "Finalitzar M####", "comentaris": null },
    { "producte": "########", "pas": 3, "dia": 0, "accio": "Batut de massa", "codi_intervinent": "M####", "linia": "Turmix Grande / Balança", "massa": null, "temps_per_kg": "de ## a ## minuts", "minuts_min": 30, "minuts_max": 45, "temps_quantitat": null, "temps_unitat": "fix", "persones_necessaries": 1, "perfils_de_persona": "Cocinero", "es_pot_parar": "No", "frequencia": "cada_produccio", "minuts_abans_produccio": 90, "depen_de_pas": null, "alternativa_de": null, "prerequisits": "## abans de la producció", "comentaris": "Màxim ## kg per container" },
    { "producte": "########", "pas": 4, "dia": 0, "accio": "Fabricat producte", "codi_intervinent": null, "linia": "Línia #", "massa": null, "temps_per_kg": "### unidades / hora", "minuts_min": 60, "minuts_max": 60, "temps_quantitat": 999, "temps_unitat": "unitat", "persones_necessaries": 3, "perfils_de_persona": "Directa", "es_pot_parar": "No", "frequencia": "cada_produccio", "minuts_abans_produccio": null, "depen_de_pas": "3", "alternativa_de": null, "prerequisits": "Massa a línia", "comentaris": null },
    { "producte": "########", "pas": 5, "dia": 0, "accio": "Encaixat", "codi_intervinent": null, "linia": "Encaixadora", "massa": null, "temps_per_kg": "## cajas / hora", "minuts_min": 60, "minuts_max": 60, "temps_quantitat": 75, "temps_unitat": "caixa", "persones_necessaries": 1, "perfils_de_persona": "Directa", "es_pot_parar": "Sí", "frequencia": "cada_produccio", "minuts_abans_produccio": null, "depen_de_pas": "4", "alternativa_de": null, "prerequisits": "Producte congelat", "comentaris": null },
    { "producte": "########", "pas": 6, "dia": 0, "accio": "Encaixat", "codi_intervinent": null, "linia": "Encaixadora", "massa": null, "temps_per_kg": "### cajas / hora", "minuts_min": 60, "minuts_max": 60, "temps_quantitat": 150, "temps_unitat": "caixa", "persones_necessaries": 2, "perfils_de_persona": "Directa", "es_pot_parar": "Sí", "frequencia": "cada_produccio", "minuts_abans_produccio": null, "depen_de_pas": "4", "alternativa_de": 5, "prerequisits": "Producte congelat", "comentaris": null },
    { "producte": "########", "pas": 7, "dia": 0, "accio": "Neteja circuit", "codi_intervinent": null, "linia": null, "massa": null, "temps_per_kg": "mitja hora", "minuts_min": 30, "minuts_max": 30, "temps_quantitat": null, "temps_unitat": "fix", "persones_necessaries": 1, "perfils_de_persona": "Encarregat", "es_pot_parar": "Sí", "frequencia": "final_setmana", "minuts_abans_produccio": null, "depen_de_pas": null, "alternativa_de": null, "prerequisits": null, "comentaris": null }
  ]
}

═══════════════════════════════════════════
REGLES:
═══════════════════════════════════════════
- MÚLTIPLES RECURSOS PARAL·LELS: si un pas pot fer-se en MÉS D'UN RECURS simultàniament, crea UNA FILA per cada recurs (mateix 'producte', 'pas', 'dia' i 'codi_intervinent').
- SUBPASSOS d'una mateixa matèria primera: usa sufix decimal al codi_intervinent (M#### → M####.1, M####.2...). El 'pas' segueix sent un índex global únic.
- Inclou SEMPRE un pas final que representi la sortida/producte acabat (ex: "Encaixat / Paletització").
- CAP DADA PERDUDA: abans de respondre, repassa la gravació frase per frase. Tot detall del procés sense camp propi va als 'comentaris' del pas on correspongui, amb les seves xifres: composició i capacitats (bandejas per carro, kg per container), límits ("més no es pot augmentar"), qui fa cada subtasca i característiques del producte que afectin el procés.
${PLACEHOLDER_RULE}
${DETERMINISM_RULE}
- Retorna ÚNICAMENT: {"flux":[...]}. Cap markdown, cap text extra.
- VALORS NO MENCIONATS: numèrics → null. Textos → null. MAI "".
- TIPUS ESTRICTES: numèrics → number o null. Textos → string o null.`;

const PROMPT_LINIES = `Ets un assistent expert en producció alimentària industrial. Treballes per a un sistema d'OPTIMITZACIÓ DE LA PRODUCCIÓ que necessita un catàleg de recursos físics (màquines, forns, estris, equips) per planificar la producció.

S'han definit els següents passos de producció:
{{PROPOSED_FLUX}}

Recursos ja existents al sistema (NO tornar a crear-los): {{EXISTING_RESOURCES}}

Analitza els passos i identifica els RECURSOS NOUS que apareixen al flux i que NO existeixen encara al sistema.

═══════════════════════════════════════════
CAMPS I FORMATS (NOMÉS els recursos nous):
═══════════════════════════════════════════
- 'linia'            text   → nom exacte del recurs tal com apareix al flux (ex: "Olla mediana", "Olla grande", "Freidora", "Turmix Grande / Balança", "Màquina #", "Detector Metalls").
- 'tipus'            text   → categoria física: "màquina", "forn", "olla", "freidora", "turmix", "balança", "cambra", "zona", "container", "fogó", "rustidor", "abatidor"...
- 'quantitat'        number → quantes unitats IDÈNTIQUES i intercanviables hi ha d'aquest recurs
                              (ex: 2 si hi ha dues olles medianes iguals que poden treballar en paral·lel).
                              Si no s'especifica, posa 1.
- 'descripcio'       text   → descripció breu de què fa o per a què s'utilitza. null si no es pot deduir.
- 'temps_preparacio' number → minuts de preparació/posada en marxa abans d'usar-lo (ex: 60 per "Preparació Màquina #"). null si no s'especifica.
- 'temps_neteja'     number → minuts de neteja després d'usar-lo (ex: 15, 30, 180). null si no s'especifica.
- 'temps_espera'     number → minuts d'espera fins poder tornar-lo a utilitzar (refredament, etc.). null si no s'especifica.
- 'comentaris'       text   → notes (ex: "Capacitat 35 kg / hora", "Mínim 90 kg / màxim 300 kg").

═══════════════════════════════════════════
QUÈ ÉS UN RECURS (regles estrictes):
═══════════════════════════════════════════
- Un RECURS és un element FÍSIC amb capacitat limitada: màquina, olla, forn, freidora, batedora, rustidor, container, zona de producció, equip. No es pot usar simultàniament per a més d'una tasca (o té un límit de capacitat).
- Exemples VÀLIDS pel que fa a la FORMA del nom: "Olla mediana", "Olla grande", "Freidora / Balanzas / Rustideros", "Fogón / Olla escaldar", "Turmix Grande / Balança", "Màquina #", "Detector Metalls", "Encaixadora".
- NO SÓN RECURSOS (no els registres):
  · "Espera", "Magatzem", "Emmagatzematge", "Control" — només estats.
  · Tasques administratives, preparacions sense màquina concreta (ex: "Preparació de carros", "Preparació etiquetes") → 'linia' del pas serà null.
  · Tasques de NETEJA d'un recurs ja registrat (ex: "Limpieza Olla mediana") → NO és un recurs nou; la neteja es modela amb 'temps_neteja' del recurs original.
- IMPORTANT: si el camp 'accio' d'un pas és una neteja, suma els seus minuts al 'temps_neteja' del recurs que es neteja (ex: 'accio' "Neteja Olla mediana", 15 min → afegir 15 min a 'temps_neteja' del recurs "Olla mediana"). Si una 'linia' antiga comença per "Limpieza" o "Neteja", NO la registris com a recurs separat.
- Ignora completament totes les files del flux on 'linia' sigui null.
- Si TOTS els recursos del flux amb 'linia' no null ja existeixen → retorna {"linies":[]}.

═══════════════════════════════════════════
EXEMPLE:
═══════════════════════════════════════════
Si al flux hi ha un pas a "Olla mediana" (45 min) i un altre amb 'accio' "Neteja Olla mediana" (15 min), i el recurs no existeix encara:
{
  "linies": [
    { "linia": "Olla mediana", "tipus": "olla", "quantitat": 1, "descripcio": "Olla de cocció mitjana", "temps_preparacio": null, "temps_neteja": 15, "temps_espera": null, "comentaris": null }
  ]
}

REGLES FINALS:
- EXHAUSTIVITAT: recorre TOTES les files del flux i fes la llista dels valors DISTINTS de 'linia'.
  Cada valor que no sigui null, que no sigui una neteja i que no existeixi ja al sistema ha de
  generar una fila. No te'n deixis cap, encara que no aparegui als exemples d'aquest prompt.
- Les variants NUMERADES del mateix tipus de màquina són recursos DIFERENTS: dues "Màquina #" amb
  números diferents són dos recursos independents, no un de sol. Registra exactament els números que
  apareixen al flux i cap altre. El mateix per a les variants per mida ("Olla mediana" vs "Olla grande").
${PLACEHOLDER_RULE}
${DETERMINISM_RULE}
- Retorna ÚNICAMENT: {"linies":[...]}. Cap markdown, cap text extra.
- VALORS NO MENCIONATS: numèrics → null. Textos → null. MAI "".
- TIPUS ESTRICTES: numèrics → number o null. Textos → string o null.`;

/* ═══ Prompt: Duplicar amb modificacions per veu ═══ */
const PROMPT_DUPLICATE = `Ets un assistent expert en producció alimentària. Estàs ajudant a crear una VARIANT d'un producte ja existent.

PRODUCTE BASE (JSON complet, inclou productes, recepta, farcit, masses, flux):
{{BASE_JSON}}

NOU CODI DE PRODUCTE: "{{NEW_CODE}}"

MODIFICACIONS DICTADES PER L'USUARI:
"{{USER_MODIFICATIONS}}"

INSTRUCCIONS:
- Retorna el JSON complet del NOU producte, com si fos una còpia del base amb les modificacions aplicades.
- Substitueix el codi de producte antic per "{{NEW_CODE}}" a TOTES les files (productes, recepta, flux).
- Aplica ÚNICAMENT les modificacions que l'usuari ha dictat. La resta ha de quedar IGUAL al base.
- Si l'usuari canvia el codi_farcit, actualitza'l a productes i recepta, i genera les files de farcit corresponents (si les descriu).
- Si NO canvia el codi_farcit, manté el mateix codi_farcit i NO tornis a duplicar files de farcit (retorna farcit:[] perquè es reutilitza el mateix R####).
- Mateixa regla per a la massa: si l'usuari canvia el codi_massa, actualitza'l a productes i recepta i genera les files de masses si en descriu la composició. Si NO el canvia, retorna masses:[] perquè es reutilitza la mateixa M####.
- Un producte pot tenir DIVERSES masses i DIVERSOS farcits: a recepta, cada fila és una combinació (producte + codi_farcit + codi_massa). Conserva totes les combinacions del base i afegeix-ne o modifica'n només les que l'usuari indiqui. A productes, els camps codi_massa i codi_farcit poden portar diversos codis separats per comes.
- Els números segueixen les mateixes regles de format que als prompts de veu (decimals per merma, etc.).
- Conserva TOTS els camps de cada fila del base, també els de temps (minuts_min, minuts_max, temps_quantitat, temps_unitat), frequencia, minuts_abans_produccio, depen_de_pas i alternativa_de, i la numeració de 'pas'.
- Si canvien els kg, les unitats o les caixes: actualitza 'massa' i els 'comentaris' que citin aquestes xifres. Si es dicta una altra velocitat o un altre temps, actualitza 'temps_per_kg' i els camps de temps. No recalculis cap temps que no s'hagi dictat.
- Si es dicten les unitats per carro o una restricció de línia, actualitza 'unitats_per_carro' i 'linies_permeses'.

Retorna ÚNICAMENT: {"productes":[...],"recepta":[...],"farcit":[...],"masses":[...],"flux":[...]}
Cap markdown, cap text extra. Numèrics no mencionats → null. Textos → null.`;

/* ═══ Colors ═══ */
const C = {
  bg: "#0A0E13", s1: "#111820", s2: "#19212D", s3: "#212C3A",
  b1: "#28374A", b2: "#3A5068",
  t1: "#E6EDF5", t2: "#94A3B5", t3: "#637486",
  ac: "#3B8EEA", acD: "#142D52",
  r: "#EF4444", rD: "#2C1215", g: "#22C55E", gD: "#0F2918",
  o: "#EAB308", oD: "#2A2006", p: "#A78BFA",
};

const Btn = ({ children, style, ...props }) => (
  <button {...props} style={{
    borderRadius: 6, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12,
    display: "flex", alignItems: "center", gap: 6, ...style,
  }}>{children}</button>
);

export default function App() {
  const { data, loading, insertRows, mergeRow, updateCell, deleteRow: dbDelete, deleteIds, reload } = useDatabase();

  const [act, setAct] = useState("productes");
  const [isRec, setIsRec] = useState(false);
  const [txt, setTxt] = useState("");
  const [interim, setInterim] = useState("");
  const [parsing, setParsing] = useState(false);
  const [pend, setPend] = useState(null);
  const [stat, setStat] = useState("");
  const [sb, setSb] = useState(true);
  const [ec, setEc] = useState(null);
  const [ev, setEv] = useState("");
  const [mr, setMr] = useState(null);
  const [pvt, setPvt] = useState("productes");
  const [changeLog, setChangeLog] = useState([]);
  const [fluxFilter, setFluxFilter] = useState("");
  const [expandedTx, setExpandedTx] = useState(new Set());
  const [dupSrc, setDupSrc] = useState(null);
  const [dupNewCode, setDupNewCode] = useState("");
  const [dupText, setDupText] = useState("");
  const [dupIsRec, setDupIsRec] = useState(false);
  const [dupProcessing, setDupProcessing] = useState(false);
  const [redoSrc, setRedoSrc] = useState(null);
  const [redoText, setRedoText] = useState("");
  const [redoIsRec, setRedoIsRec] = useState(false);
  // Codi del producte que la previsualització substituirà en confirmar (Refer)
  const [pendRedo, setPendRedo] = useState(null);
  const [rerunBusy, setRerunBusy] = useState(false);
  const stopRerun = useRef(false);
  const rRef = useRef(null);
  const eRef = useRef(null);
  const isStoppingRef = useRef(false);
  const txtRef = useRef("");

  const sc = SCHEMAS[act];
  const isV = sc.voice;
  const pTabs = pend ? CASCADE.filter(t => pend[t]?.length > 0) : [];

  // Codis que tenen fila però encara no tenen cap matèria primera registrada
  const incompleteCodes = useCallback((table, codeField) => {
    const byCode = new Map();
    for (const r of data[table] || []) {
      if (!r[codeField]) continue;
      const k = normalizeStr(r[codeField]);
      if (!byCode.has(k)) byCode.set(k, { code: r[codeField], hasMp: false });
      if (r.codi_nom_mp) byCode.get(k).hasMp = true;
    }
    return [...byCode.values()].filter(v => !v.hasMp).map(v => v.code);
  }, [data]);

  const incompleteFarcit = incompleteCodes('farcit', 'codi_farcit');
  const incompleteMasses = incompleteCodes('masses', 'codi_massa');

  // Codis ja registrats a la BD que no tenen ni tan sols fila de composició
  const missingRows = COMPOSITION_TABLES.map(spec => ({
    spec, rows: missingCompositionRows(data, data, spec),
  }));
  const missingTotal = missingRows.reduce((s, m) => s + m.rows.length, 0);

  // Recursos usats al flux que encara no són al catàleg
  const missingResources = missingResourceRows(data);

  // Codis de composició buits que ja no referencia ningú
  const orphanRows = COMPOSITION_TABLES.map(spec => ({
    spec, rows: orphanCompositionRows(data, spec),
  }));
  const orphanTotal = orphanRows.reduce((s, o) => s + o.rows.length, 0);

  // Files que s'esborrarien en refer el producte seleccionat
  const redoCounts = redoSrc
    ? Object.fromEntries(PER_PRODUCT_TABLES.map(t =>
        [t, (data[t] || []).filter(r => r.producte === redoSrc).length]))
    : null;

  // Qualsevol codi pendent, tingui fila buida o cap fila, per marcar-lo a recepta
  const incompleteSet = new Set([
    ...incompleteFarcit, ...incompleteMasses,
    ...missingRows.flatMap(({ spec, rows }) => rows.map(r => r[spec.codeField])),
  ].map(normalizeStr));

  useEffect(() => { if (ec && eRef.current) { eRef.current.focus(); eRef.current.select(); } }, [ec]);
  useEffect(() => { txtRef.current = txt; }, [txt]);

  /* ─── Speech ─── */
  const startRec = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStat("⚠️ Usa Chrome per reconeixement de veu."); return; }

    isStoppingRef.current = false;
    let acc = txtRef.current; // Acumula sobre el text ja existent (veu o enganxat)

    const makeR = () => {
      const r = new SR();
      r.lang = "es-ES"; r.continuous = true; r.interimResults = true;

      r.onresult = e => {
        let im = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) acc += e.results[i][0].transcript + " ";
          else im += e.results[i][0].transcript;
        }
        setTxt(acc); txtRef.current = acc; setInterim(im);
      };

      r.onerror = e => {
        // "no-speech" i "aborted" (parada manual) no son errors reals
        if (e.error === "no-speech" || e.error === "aborted") return;
        setStat(`⚠️ Error de veu: ${e.error}`);
      };

      r.onend = () => {
        if (isStoppingRef.current) { setIsRec(false); return; }
        // El browser ha parat per silenci — reiniciar automàticament
        setStat("🎙️ Micròfon actiu — pots continuar parlant...");
        try {
          const newR = makeR();
          rRef.current = newR;
          newR.start();
        } catch {
          setIsRec(false);
          setStat("⚠️ Micròfon desconnectat. Prem «Gravar» per continuar.");
        }
      };

      return r;
    };

    const r = makeR();
    rRef.current = r; r.start();
    setIsRec(true); setInterim("");
    setStat("🎙️ Micròfon actiu — parla quan vulguis.");
  }, []);

  const stopRec = useCallback(() => {
    isStoppingRef.current = true;
    rRef.current?.stop();
    setIsRec(false); setInterim("");
  }, []);

  /* ─── Speech per al modal de duplicació ─── */
  const dupTextRef = useRef("");
  useEffect(() => { dupTextRef.current = dupText; }, [dupText]);

  const redoTextRef = useRef("");
  useEffect(() => { redoTextRef.current = redoText; }, [redoText]);

  // Dictat dins d'un modal: acumula sobre el text que ja hi havia i es reinicia sol en silencis
  const startModalRec = useCallback((initialText, onText, setActive) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStat("⚠️ Usa Chrome per reconeixement de veu."); return; }

    // Atura el micro principal si estava actiu
    if (isRec) { isStoppingRef.current = true; rRef.current?.stop(); setIsRec(false); }

    isStoppingRef.current = false;
    let acc = initialText;

    const makeR = () => {
      const r = new SR();
      r.lang = "es-ES"; r.continuous = true; r.interimResults = true;

      r.onresult = e => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) acc += e.results[i][0].transcript + " ";
        }
        onText(acc);
      };

      r.onerror = e => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        setStat(`⚠️ Error de veu: ${e.error}`);
      };

      r.onend = () => {
        if (isStoppingRef.current) { setActive(false); return; }
        try {
          const newR = makeR();
          rRef.current = newR;
          newR.start();
        } catch {
          setActive(false);
        }
      };
      return r;
    };

    const r = makeR();
    rRef.current = r; r.start();
    setActive(true);
  }, [isRec]);

  const stopModalRec = useCallback(setActive => {
    isStoppingRef.current = true;
    rRef.current?.stop();
    setActive(false);
  }, []);

  const startDupRec = useCallback(() => startModalRec(
    dupTextRef.current,
    t => { setDupText(t); dupTextRef.current = t; },
    setDupIsRec,
  ), [startModalRec]);
  const stopDupRec = useCallback(() => stopModalRec(setDupIsRec), [stopModalRec]);

  const startRedoRec = useCallback(() => startModalRec(
    redoTextRef.current,
    t => { setRedoText(t); redoTextRef.current = t; },
    setRedoIsRec,
  ), [startModalRec]);
  const stopRedoRec = useCallback(() => stopModalRec(setRedoIsRec), [stopModalRec]);

  /* ─── callAI — crida genèrica a l'API d'Anthropic ─── */
  const callAI = useCallback(async (systemPrompt, userContent, { model = MODEL_DEFAULT, maxTokens = 16000 } = {}) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Falta VITE_ANTHROPIC_API_KEY a les variables d'entorn.");
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model, max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent || "Processa la informació del sistema." }],
      }),
    });
    const res = await resp.json();
    if (res.error) throw new Error(res.error.message);
    const raw = res.content?.map(c => c.type === "text" ? c.text : "").join("").replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  }, []);

  // Les tres crides d'extracció. Retorna les files tal com surten, sense resoldre-les contra la BD.
  const extractProduct = useCallback(async ({ text, src, redoCode, onStep = () => {} }) => {
    const existingProducts = src.productes.map(p => p.producte).filter(Boolean).join(", ") || "(cap)";
    const existingResources = resourceNamesForPrompt(src.linies).join(", ") || "(cap)";

    // Crida 1: Producte + Recepta + Farcit
    onStep("🤖 (1/3) Processant producte, recepta i farcit...");
    const res1 = await callAI(
      PROMPT_PROD_RECEPTA.replace("{{EXISTING_PRODUCTS}}", existingProducts),
      text,
      { model: MODEL_REASONING }
    );

    const proposedProducte = redoCode || res1.productes?.[0]?.producte || res1.productes?.[0]?.producto || "";
    const existingSteps = JSON.stringify(
      src.flux.filter(f => exactMatch(f.producte, proposedProducte))
        .map(({ pas, dia, accio, codi_intervinent, linia }) => ({ pas, dia, accio, codi_intervinent, linia }))
    );
    // En refer, el codi és el del producte que se substitueix encara que la IA en digui un altre
    const own = rows => normalizeAIFields(rows).map(r => redoCode ? { ...r, producte: redoCode } : r);

    // Crida 2: Flux
    onStep("🤖 (2/3) Processant flux de producció...");
    // El flux és la sortida més llarga: més marge per no truncar-la (només es paga el que genera)
    const res2 = await callAI(
      PROMPT_FLUX
        .replace("{{EXISTING_RESOURCES}}", existingResources)
        .replace("{{EXISTING_STEPS}}", existingSteps)
        .replace("{{PROPOSED_PRODUCTE}}", proposedProducte),
      text,
      { maxTokens: 32000 }
    );

    // Crida 3: Recursos / Línies
    onStep("🤖 (3/3) Identificant recursos necessaris...");
    const res3 = await callAI(
      PROMPT_LINIES
        .replace("{{EXISTING_RESOURCES}}", existingResources)
        .replace("{{PROPOSED_FLUX}}", JSON.stringify(res2.flux || [], null, 2)),
      text
    );

    const noClassificat = findUnplaced(text, { ...res1, flux: res2.flux || [], linies: res3.linies || [] });

    const parsed = {
      productes: own((res1.productes || []).map((p, i) => ({ ...p, transcripcio: text, no_classificat: i === 0 ? noClassificat : null }))),
      recepta:   own(res1.recepta   || []),
      farcit:    res1.farcit    || [],
      masses:    res1.masses    || [],
      flux:      own(res2.flux      || []),
      linies:    res3.linies    || [],
    };

    return parsed;
  }, [callAI]);

  /* ─── AI Parse — pipeline de 3 crides sequencials ─── */
  // textOverride i dataOverride els fa servir el reprocessament: just després d'esborrar el
  // producte, 'data' encara no s'ha re-renderitzat i cal treballar amb el snapshot ja filtrat.
  // redoCode indica que el resultat ha de substituir aquest producte en confirmar.
  const parseVoice = useCallback(async ({ textOverride, dataOverride, redoCode } = {}) => {
    const text = (textOverride ?? txt).trim();
    if (!text) { setStat("No hi ha text."); return; }
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) { setStat("❌ Falta VITE_ANTHROPIC_API_KEY a les variables d'entorn."); return; }

    const src = dataOverride || data;
    setParsing(true);

    try {
      const parsed = await extractProduct({ text, src, redoCode, onStep: setStat });

      const { resolved: named, changeLog: changes } = resolveCanonicalNames(parsed, src);
      const { resolved, added } = ensureCompositionStubs(named, src);

      const total = CASCADE.reduce((s, t) => s + (resolved[t]?.length || 0), 0);
      if (!total) {
        setStat("No s'han pogut extreure dades. Prova amb més detall.");
      } else {
        setPend(resolved);
        setPendRedo(redoCode || null);
        setChangeLog(changes);
        setPvt(CASCADE.find(t => resolved[t]?.length > 0) || "productes");
        const summary = CASCADE.filter(t => resolved[t]?.length > 0)
          .map(t => `${SCHEMAS[t].icon} ${SCHEMAS[t].label}: ${resolved[t].length}`)
          .join("  ·  ");
        const stubTxt = added ? `  ·  ⚠️ ${added} codis pendents de composició` : "";
        setStat(`✅ ${summary}${stubTxt}  — Revisa i confirma.`);
      }
    } catch (err) {
      console.error(err);
      setStat(`❌ Error: ${err.message}`);
    } finally { setParsing(false); }
  }, [txt, data]);

  /* ─── Confirm pending (save to DB) ─── */
  // Retorna true només si tot el lot ha quedat desat
  const saveBatch = useCallback(async (batch, redo) => {
    // Abans d'escriure res: si alguna fila no és vàlida, no es desa cap taula
    const problems = [];
    const prepared = Object.fromEntries(CASCADE.map(t => [t, (batch[t] || []).map(r => prepareRow(t, r, problems))]));
    for (const t of PER_PRODUCT_TABLES)
      if (prepared[t].some(r => !String(r.producte ?? "").trim()))
        problems.push(`${SCHEMAS[t].label}: falta el codi de producte`);
    if (problems.length) {
      setStat(`❌ No s'ha desat res — ${[...new Set(problems)].join("  ·  ")}`);
      return false;
    }

    setStat("💾 Guardant a la base de dades...");

    // La descripció es desa la primera: si no es pot guardar, no es toca res més
    const recordings = recordingsToAdd(prepared.productes, data.gravacions);
    if (recordings.length) {
      const { error } = await insertRows("gravacions", recordings);
      if (error) { setStat(`❌ No s'ha desat res: no s'ha pogut guardar la descripció — ${error}`); return false; }
    }

    let nInserted = 0, nUpdated = 0, nErrors = 0;
    const errMsgs = [];
    const remaining = {}; // files que no s'han pogut desar, per no perdre-les
    const newIds = {};    // files noves per taula, per poder desfer un Refer fallit

    // En un Refer les files antigues es guarden fins que les noves són a la BD
    const oldIds = redo
      ? Object.fromEntries(PER_PRODUCT_TABLES.map(t => [t, data[t].filter(r => r.producte === redo).map(r => r.id)]))
      : null;

    for (const t of CASCADE) {
      const rows = prepared[t];
      if (!rows.length) continue;

      const toInsert = rows.filter(r => r._action !== 'update');
      const toUpdate = rows.filter(r => r._action === 'update' && r._existingId);
      const failed = [];

      if (toInsert.length) {
        const { inserted, error } = await insertRows(t, toInsert);
        nInserted += inserted.length;
        newIds[t] = inserted.map(r => r.id);
        if (error) { errMsgs.push(`${SCHEMAS[t].label}: ${error}`); failed.push(...toInsert); nErrors += toInsert.length; }
      }

      for (const row of toUpdate) {
        const merged = await mergeRow(t, row._existingId, row);
        if (merged !== null) nUpdated++;
        else { nErrors++; failed.push(row); }
        // Una gravació nova s'afegeix a les anteriors: mai les substitueix
        if (t === 'productes' && row.transcripcio && merged && !merged.transcripcio?.includes(row.transcripcio)) {
          const joined = [merged.transcripcio, row.transcripcio].filter(Boolean).join(RECORDING_SEP);
          const { error } = await updateCell('productes', row._existingId, 'transcripcio', joined);
          if (error) errMsgs.push(`Transcripció: ${error}`);
        }
      }
      if (failed.length) remaining[t] = failed;
    }

    if (redo) {
      if (PER_PRODUCT_TABLES.some(t => remaining[t])) {
        // Desfà les files noves: el producte anterior es queda intacte i es pot tornar a confirmar
        for (const t of PER_PRODUCT_TABLES) {
          await deleteIds(t, newIds[t] || []);
          if (prepared[t].length) remaining[t] = prepared[t];
        }
      } else {
        for (const t of PER_PRODUCT_TABLES) {
          const { error } = await deleteIds(t, oldIds[t]);
          if (error) errMsgs.push(`No s'han pogut treure les files antigues de ${SCHEMAS[t].label}: ${error}`);
        }
      }
    }

    const parts = [];
    if (nInserted) parts.push(`${nInserted} nous`);
    if (nUpdated) parts.push(`${nUpdated} actualitzats`);

    const pendingTables = Object.keys(remaining);
    if (pendingTables.length) {
      setPend(remaining);
      setPvt(pendingTables[0]);
      setStat(`❌ ${parts.join(' · ') || 'Res desat'} — les files no desades continuen a la previsualització. ${errMsgs.join('  ·  ')}`);
      return false;
    }

    setPend(null); setPendRedo(null); setTxt(""); txtRef.current = ""; setChangeLog([]);
    if (errMsgs.length) {
      setStat(`❌ ${parts.join(' · ') || 'Res desat'} — ${errMsgs.join('  ·  ')}`);
      await reload();
      return false;
    }
    setStat(`✅ ${parts.join(' · ') || 'Sense canvis nous'}`);
    return true;
  }, [data, insertRows, mergeRow, updateCell, deleteIds, reload]);

  const confirmAll = () => saveBatch(pend, pendRedo);

  const editPendCell = (table, ri, key) => {
    const val = prompt(`Editar "${key}":`, pend[table][ri][key] ?? "");
    if (val !== null) {
      setPend(prev => {
        const copy = { ...prev, [table]: [...prev[table]] };
        copy[table][ri] = { ...copy[table][ri], [key]: val };
        return copy;
      });
    }
  };

  const removePendRow = (table, ri) => {
    setPend(prev => ({ ...prev, [table]: prev[table].filter((_, i) => i !== ri) }));
  };

  /* ─── Manual row (Torns) ─── */
  const openManual = () => {
    const row = {}; sc.fields.forEach(f => row[f.key] = ""); setMr(row);
  };
  const saveManual = async () => {
    const { error } = await insertRows(act, [mr]);
    if (error) { setStat(`❌ No s'ha pogut desar a ${sc.label}: ${error}`); return; }
    setMr(null); setStat(`✅ Registre afegit a ${sc.label}.`);
  };

  /* ─── Inline edit ─── */
  const startEdit = (ri, key, val) => { setEc({ ri, key }); setEv(val ?? ""); };
  const commitEdit = async () => {
    if (!ec) return;
    const row = data[act][ec.ri];
    if (String(row[ec.key] ?? "") === String(ev)) { setEc(null); return; }
    const { error } = await updateCell(act, row.id, ec.key, ev);
    setEc(null);
    if (error) {
      // L'estat local ja mostra el valor nou: cal rellegir perquè es vegi el que hi ha a la BD
      await reload();
      setStat(`❌ No s'ha pogut desar «${ec.key}»: ${error}`);
    }
  };
  const handleDelete = async (idx) => {
    const row = data[act][idx];
    await dbDelete(act, row.id);
  };

  // Genera un producte complet (files pròpies) a partir del seu base i les diferències.
  // src són les dades contra les quals es resol; redoCode, el producte que substituirà en confirmar.
  const variantRows = useCallback(async ({ base, newCode, modText, src, transcripcio }) => {
    // Recopilar tot el producte base sense metadades
    const stripMeta = r => { const c = { ...r }; delete c.id; delete c.created_at; return c; };
    // Els codis poden venir de recepta o de productes, i aquest darrer pot portar-ne diversos
    const codisDe = field => [...new Set([
      ...src.recepta.filter(r => r.producte === base).flatMap(r => splitCodes(r[field])),
      ...src.productes.filter(r => r.producte === base).flatMap(r => splitCodes(r[field])),
    ])];
    const codisFarcit = codisDe('codi_farcit');
    const codisMassa = codisDe('codi_massa');
    const baseJSON = {
      productes: src.productes.filter(r => r.producte === base)
        .map(r => { const c = stripMeta(r); delete c.transcripcio; return c; }),
      recepta: src.recepta.filter(r => r.producte === base).map(stripMeta),
      flux:    src.flux.filter(r => r.producte === base).map(stripMeta),
      farcit:  src.farcit.filter(r => codisFarcit.includes(r.codi_farcit)).map(stripMeta),
      masses:  src.masses.filter(r => codisMassa.includes(r.codi_massa)).map(stripMeta),
    };

    const prompt = PROMPT_DUPLICATE
      .replace("{{BASE_JSON}}", JSON.stringify(baseJSON, null, 2))
      .replaceAll("{{NEW_CODE}}", newCode)
      .replace("{{USER_MODIFICATIONS}}", modText || "(sense modificacions — copia idèntic amb el nou codi)");

    // Duplicar també és raonament estructural (quins codis es reutilitzen i quins canvien).
    // La sortida inclou tot el flux del base: mateix marge que la crida de flux per no truncar-la.
    const res = await callAI(prompt, "Aplica les modificacions i retorna el JSON del nou producte.", { model: MODEL_REASONING, maxTokens: 32000 });
    const noClassificat = findUnplaced(modText, res);

    const parsed = {
      productes: normalizeAIFields((res.productes || []).map(p => ({
        ...p, producte: newCode, basat_en: base, no_classificat: noClassificat,
        transcripcio: transcripcio ?? `[Duplicat de ${base}]${modText ? ` ${modText}` : ""}`,
      }))),
      recepta: normalizeAIFields((res.recepta || []).map(r => ({ ...r, producte: newCode }))),
      farcit:  res.farcit || [],
      masses:  res.masses || [],
      flux:    normalizeAIFields((res.flux || []).map(f => ({ ...f, producte: newCode }))),
      linies:  [],
    };
    return parsed;
  }, [callAI]);

  const generateVariant = useCallback(async ({ base, newCode, modText, src, transcripcio, redoCode }) => {
    const parsed = await variantRows({ base, newCode, modText, src, transcripcio });
    const { resolved: named, changeLog: changes } = resolveCanonicalNames(parsed, src);
    const { resolved, added } = ensureCompositionStubs(named, src);
    setPend(resolved);
    setPendRedo(redoCode || null);
    setChangeLog(changes);
    setPvt(CASCADE.find(t => resolved[t]?.length > 0) || "productes");
    return added;
  }, [variantRows]);

  const processDuplicateWithVoice = useCallback(async () => {
    const newCode = dupNewCode.trim();
    const modText = dupText.trim();
    if (!newCode) { setStat("Cal un nou codi de producte."); return; }

    setDupProcessing(true);
    setStat("🤖 Aplicant modificacions al producte base...");

    try {
      const added = await generateVariant({ base: dupSrc, newCode, modText, src: data });
      const stubTxt = added ? `  ·  ⚠️ ${added} codis pendents de composició` : "";
      setStat(`✅ Variant "${newCode}" preparada${stubTxt} — Revisa i confirma.`);
      setDupSrc(null); setDupNewCode(""); setDupText("");
    } catch (err) {
      console.error(err);
      setStat(`❌ Error: ${err.message}`);
    } finally {
      setDupProcessing(false);
    }
  }, [dupSrc, dupNewCode, dupText, data, generateVariant]);

  /* ─── Crear les files de composició que falten per a les dades ja registrades ─── */
  const backfillCompositions = useCallback(async () => {
    setStat("⏳ Creant les files de composició que falten...");
    const done = [], failed = [];
    for (const { spec, rows } of missingRows) {
      if (!rows.length) continue;
      const { inserted, error } = await insertRows(spec.table, rows);
      const label = `${SCHEMAS[spec.table].icon} ${SCHEMAS[spec.table].label}`;
      if (error) failed.push(`${label}: ${error}`);
      else done.push(`${label}: ${inserted.length}`);
    }
    if (failed.length) {
      setStat(`❌ ${failed.join("  ·  ")}${done.length ? `  ·  Creades → ${done.join(", ")}` : ""}`);
      return;
    }
    setStat(done.length
      ? `✅ Files creades — ${done.join("  ·  ")}. Omple-les amb les matèries primeres.`
      : "✅ Tots els codis ja tenen fila de composició.");
  }, [missingRows, insertRows]);

  /* ─── Crear els recursos que ja s'usen al flux però no són al catàleg ─── */
  const backfillResources = useCallback(async () => {
    setStat("⏳ Creant els recursos que falten...");
    const { inserted, error } = await insertRows('linies', missingResources);
    if (error) { setStat(`❌ No s'han pogut crear els recursos: ${error}`); return; }
    setStat(`✅ ${inserted.length} recursos creats. Revisa'n el tipus i la quantitat.`);
  }, [missingResources, insertRows]);

  /* ─── Esborrar els codis de composició orfes i buits ─── */
  const cleanOrphans = useCallback(async () => {
    setStat("⏳ Esborrant els codis orfes...");
    let n = 0;
    for (const { spec, rows } of orphanRows)
      for (const row of rows) { await dbDelete(spec.table, row.id); n++; }
    setStat(n ? `✅ ${n} ${n === 1 ? "codi orfe esborrat" : "codis orfes esborrats"}.` : "✅ No hi ha codis orfes.");
  }, [orphanRows, dbDelete]);

  /* ─── Refer un producte: tornar a processar la transcripció sense tocar res fins a confirmar ─── */
  const reprocessProduct = useCallback(async () => {
    const code = redoSrc;
    const text = redoText.trim();
    if (!code || !text) return;

    stopRedoRec();

    // Snapshot sense el producte. parseVoice l'ha de veure com a NOU: si encara hi constés,
    // el prompt diria "no duplicar" i les files es marcarien com a update (que no sobreescriu).
    const src = { ...data };
    for (const t of PER_PRODUCT_TABLES) src[t] = (data[t] || []).filter(r => r.producte !== code);

    // Una variant només descriu les diferències: s'ha de regenerar a partir del seu base
    const variant = parseVariantMarker(text);
    if (variant) {
      if (variant.base === code || !src.productes.some(p => p.producte === variant.base)) {
        setStat(`❌ No es troba el producte base ${variant.base}. No s'ha tocat res.`);
        setRedoSrc(null);
        return;
      }
      setRedoSrc(null);
      setParsing(true);
      setStat(`🤖 Regenerant ${code} a partir de ${variant.base}...`);
      try {
        const added = await generateVariant({ base: variant.base, newCode: code, modText: variant.diff, src, transcripcio: text, redoCode: code });
        const stubTxt = added ? `  ·  ⚠️ ${added} codis pendents de composició` : "";
        setStat(`✅ Variant ${code} regenerada${stubTxt} — Revisa i confirma.`);
      } catch (err) {
        console.error(err);
        setStat(`❌ Error: ${err.message}. No s'ha tocat res.`);
      } finally {
        setParsing(false);
      }
      return;
    }

    setRedoSrc(null);
    // Deixa el text a la caixa principal: si la IA falla, la transcripció no es perd
    setTxt(text); txtRef.current = text;
    await parseVoice({ textOverride: text, dataOverride: src, redoCode: code });
  }, [redoSrc, redoText, data, parseVoice, generateVariant, stopRedoRec]);

  /* ─── Reprocessar: extreu cada producte a la zona d'espera, sense tocar les dades ─── */
  // Sense codis, processa tot el que encara no té resultat
  const runRerun = useCallback(async codes => {
    const held = new Map(data.reprocessament.map(r => [r.producte, r]));
    const wanted = codes ? new Set(codes) : null;
    const queue = rerunOrder(data.productes).filter(q => wanted
      ? wanted.has(q.code)
      : !held.has(q.code) || held.get(q.code).estat === "error");
    if (!queue.length) { setStat("No hi ha cap producte per processar."); return; }

    stopRerun.current = false;
    setRerunBusy(true);
    let done = 0;
    for (const q of queue) {
      if (stopRerun.current) break;
      setStat(`🤖 ${done + 1}/${queue.length} · Processant ${q.code}...`);
      const src = withoutProduct(data, q.code);
      let row;
      try {
        let parsed;
        if (q.base) {
          // La variant parteix del resultat nou del seu base, no de les files antigues
          const b = held.get(q.base);
          if (!b || !["pendent", "aprovat"].includes(b.estat)) throw new Error(`Cal processar primer el base ${q.base}`);
          if (b.estat === "pendent") {
            const merged = mergeWithCurrent(b.resultat, data, null);
            for (const t of PER_PRODUCT_TABLES)
              src[t] = [...src[t].filter(r => r.producte !== q.base), ...(merged[t] || [])];
          }
          parsed = await variantRows({ base: q.base, newCode: q.code, modText: q.diff, src, transcripcio: q.text });
        } else {
          parsed = await extractProduct({ text: q.text, src, redoCode: q.code });
        }
        row = { producte: q.code, estat: "pendent", resultat: parsed, error: null };
      } catch (err) {
        console.error(err);
        row = { producte: q.code, estat: "error", resultat: null, error: err.message };
      }
      if (held.has(q.code)) await deleteIds("reprocessament", [held.get(q.code).id]);
      const { inserted, error } = await insertRows("reprocessament", [row]);
      if (error) {
        setStat(`❌ No s'ha pogut guardar el resultat de ${q.code}: ${error}`);
        setRerunBusy(false);
        return;
      }
      held.set(q.code, inserted[0]);
      done++;
    }
    setRerunBusy(false);
    setStat(`✅ ${done} de ${queue.length} processats. Revisa'ls i aprova'ls un per un.`);
  }, [data, extractProduct, variantRows, insertRows, deleteIds]);

  const approveRerun = useCallback(async h => {
    const code = h.producte;
    const held = new Map(data.reprocessament.map(r => [r.producte, r]));
    const merged = mergedRerun(h, data, held);
    const lost = vanishingCodes(rowsOfProduct(data, code), merged);
    if (lost.length && !window.confirm(`Aquests codis desapareixeran de ${code}: ${lost.join(", ")}.\n\nAprovar igualment?`)) return;

    const src = withoutProduct(data, code);
    const { resolved: named } = resolveCanonicalNames(merged, src);
    const { resolved } = ensureCompositionStubs(named, src);

    setRerunBusy(true);
    const saved = await saveBatch(resolved, code);
    if (saved) {
      const { error } = await updateCell("reprocessament", h.id, "estat", "aprovat");
      if (error) setStat(`❌ ${code} s'ha desat, però no s'ha pogut marcar com a aprovat: ${error}`);
      else setStat(`✅ ${code} aprovat i desat.`);
    }
    setRerunBusy(false);
  }, [data, saveBatch, updateCell]);

  const discardRerun = useCallback(async h => {
    const { error } = await updateCell("reprocessament", h.id, "estat", "descartat");
    setStat(error ? `❌ ${error}` : `${h.producte} descartat. Les dades no s'han tocat.`);
  }, [updateCell]);

  /* ─── Export ─── */
  const exportJSON = () => {
    const clean = {};
    Object.entries(data).forEach(([k, rows]) => {
      clean[k] = rows.map(r => {
        const o = { ...r }; delete o.id; delete o.created_at; return o;
      });
    });
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "production_data.json"; a.click();
  };
  const exportCSV = () => {
    const rows = data[act]; if (!rows.length) return;
    const keys = sc.fields.map(f => f.key);
    const lines = [keys.join(";"), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(";"))];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${act}.csv`; a.click();
  };

  const totalRows = Object.values(data).reduce((s, a) => s + a.length, 0);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.t2, fontFamily: "monospace" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏭</div>
          <div>Carregant dades...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", height: "100vh", background: C.bg, color: C.t1,
      fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace", fontSize: 13,
    }}>
      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: sb ? 234 : 54, background: C.s1, borderRight: `1px solid ${C.b1}`,
        transition: "width 0.2s ease", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden",
      }}>
        <div onClick={() => setSb(!sb)} style={{
          padding: sb ? "14px 16px" : "14px 15px", borderBottom: `1px solid ${C.b1}`,
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.ac} strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
          {sb && <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.ac }}>Producció</span>}
        </div>

        <nav style={{ flex: 1, padding: "6px 0", overflowY: "auto" }}>
          {Object.entries(SCHEMAS).map(([key, s]) => {
            const active = key === act; const count = data[key].length;
            return (
              <div key={key}
                onClick={() => { setAct(key); setPend(null); setTxt(""); txtRef.current = ""; setEc(null); setMr(null); setStat(""); setFluxFilter(""); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: sb ? "10px 16px" : "10px 15px", cursor: "pointer",
                  background: active ? C.acD : "transparent",
                  borderLeft: active ? `3px solid ${C.ac}` : "3px solid transparent",
                }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{s.icon}</span>
                {sb && <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.ac : C.t1 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: C.t3 }}>{count > 0 ? `${count} reg.` : s.voice ? "← veu" : "manual"}</div>
                </div>}
              </div>
            );
          })}
        </nav>

        {sb && <div style={{ padding: 14, borderTop: `1px solid ${C.b1}` }}>
          <div style={{ fontSize: 10, color: C.t3, marginBottom: 8 }}>{totalRows} registres totals</div>
          <Btn onClick={exportJSON} style={{ width: "100%", padding: 7, background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 10, justifyContent: "center", marginBottom: 4 }}>⬇ Exportar tot (JSON)</Btn>
          <Btn onClick={exportCSV} style={{ width: "100%", padding: 7, background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 10, justifyContent: "center" }}>⬇ {sc.label} (CSV)</Btn>
        </div>}
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <header style={{ padding: "16px 24px", borderBottom: `1px solid ${C.b1}`, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>{sc.icon}</span>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{sc.label}</h1>
            <p style={{ margin: 0, fontSize: 11, color: C.t3 }}>
              {sc.fields.length} camps · {data[act].length} registres
              {isV && <span style={{ color: C.p, marginLeft: 10 }}>🎙 Veu</span>}
              {!isV && !sc.custom && <span style={{ color: C.o, marginLeft: 10 }}>✏️ Manual</span>}
            </p>
            {act === "productes" && (
              <p style={{ margin: "4px 0 0", fontSize: 10, color: C.t3 }}>
                💡 <strong style={{ color: C.o }}>Copiar</strong> crea una variant del producte: dicta només les diferències i la IA aplica els canvis.
                {" "}<strong style={{ color: C.ac }}>Refer</strong> torna a extreure el producte, la seva recepta i el seu flux de la transcripció (que pots corregir abans), i només els substitueix quan confirmes.
              </p>
            )}
          </div>
        </header>

        {/* Missatges d'estat a les pestanyes sense panell de veu */}
        {stat && act !== "productes" && (
          <div style={{ padding: "8px 24px", borderBottom: `1px solid ${C.b1}`, fontSize: 11, lineHeight: 1.5, color: stat.includes("❌") ? C.r : stat.includes("✅") ? C.g : C.o }}>{stat}</div>
        )}

        {/* ═══ VOICE PANEL ═══ */}
        {act === "productes" && (
          <section style={{ padding: "16px 24px", borderBottom: `1px solid ${C.b1}`, background: C.s1 }}>
            <p style={{ margin: "0 0 12px", fontSize: 11, color: C.t2, lineHeight: 1.7 }}>
              🎙️ <strong style={{ color: C.t1 }}>Dicta tota la informació del producte d'un cop.</strong>{" "}
              La IA distribuirà a{" "}
              {CASCADE.map((t, i) => (
                <span key={t}><span style={{ color: C.ac }}>{SCHEMAS[t].icon} {SCHEMAS[t].label}</span>{i < CASCADE.length - 1 ? " · " : ""}</span>
              ))}
            </p>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              {!isRec ? (
                <Btn onClick={startRec} style={{ padding: "9px 22px", background: `linear-gradient(135deg, ${C.r}, #DC2626)`, border: "none", color: "#fff" }}>⏺ Micròfon</Btn>
              ) : (
                <Btn onClick={stopRec} style={{ padding: "9px 22px", background: C.rD, border: `2px solid ${C.r}`, color: C.r, animation: "pulse 1.5s infinite" }}>⏹ Parar mic</Btn>
              )}
              <Btn onClick={() => parseVoice()} disabled={!txt.trim() || parsing}
                style={{
                  padding: "9px 22px",
                  background: txt.trim() && !parsing ? C.acD : C.s2,
                  border: `1px solid ${txt.trim() && !parsing ? C.ac : C.b1}`,
                  color: txt.trim() && !parsing ? C.ac : C.t3,
                  cursor: txt.trim() && !parsing ? "pointer" : "not-allowed",
                }}>
                {parsing ? "⏳ Processant..." : "🤖 Processar → Totes les taules"}
              </Btn>
              {txt.trim() && !parsing && (
                <Btn onClick={() => { setTxt(""); txtRef.current = ""; setPend(null); setStat(""); setInterim(""); }}
                  style={{ padding: "9px 14px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t3, fontSize: 11 }}>
                  🗑 Netejar
                </Btn>
              )}
            </div>

            {/* Textarea sempre visible — pega, escriu o dicta */}
            <textarea
              value={txt}
              onChange={e => { setTxt(e.target.value); txtRef.current = e.target.value; }}
              style={{
                width: "100%", padding: 10,
                background: C.bg,
                border: `1px solid ${isRec ? C.r : C.b1}`,
                borderRadius: 8, color: C.t1, fontSize: 12, fontFamily: "inherit",
                resize: "vertical", minHeight: 80, boxSizing: "border-box",
                outline: "none", lineHeight: 1.7,
                transition: "border-color 0.2s",
              }}
              placeholder="Enganxa text aquí, escriu manualment o usa el micròfon... Tot s'acumula fins que prems Processar."
            />

            {/* Interim del micro mentre grava */}
            {isRec && interim && (
              <div style={{ marginTop: 6, padding: "6px 10px", background: C.rD, border: `1px solid ${C.r}`, borderRadius: 6, fontSize: 12, color: C.t2, fontStyle: "italic", lineHeight: 1.6 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: C.r, borderRadius: "50%", marginRight: 8, animation: "pulse 1s infinite" }} />
                {interim}
              </div>
            )}

            {isRec && !interim && (
              <div style={{ marginTop: 6, fontSize: 11, color: C.t3, fontStyle: "italic" }}>🎙️ Escoltant...</div>
            )}

            {stat && <div style={{ marginTop: 10, fontSize: 11, lineHeight: 1.5, color: stat.includes("❌") ? C.r : stat.includes("✅") ? C.g : C.o }}>{stat}</div>}
          </section>
        )}

        {isV && act !== "productes" && (
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.b1}`, background: C.s1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: C.t2 }}>
              💡 S'omple automàticament des de{" "}
              <strong style={{ color: C.ac, cursor: "pointer" }} onClick={() => setAct("productes")}>📦 Productes</strong>.
              {" "}També pots afegir registres manualment.
            </span>
            <Btn onClick={openManual} style={{ padding: "6px 16px", background: C.acD, border: `1px solid ${C.ac}`, color: C.ac, fontSize: 11, flexShrink: 0, marginLeft: 12 }}>+ Afegir registre</Btn>
          </div>
        )}

        {!isV && !sc.custom && (
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${C.b1}`, background: C.s1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: C.t2 }}>✏️ Entrada manual</span>
            <Btn onClick={openManual} style={{ padding: "6px 16px", background: C.acD, border: `1px solid ${C.ac}`, color: C.ac, fontSize: 11 }}>+ Afegir registre</Btn>
          </div>
        )}

        {/* ═══ MANUAL FORM ═══ */}
        {mr && (
          <div style={{ padding: "16px 24px", background: C.oD, borderBottom: `1px solid ${C.o}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.o, marginBottom: 12 }}>Nou registre — {sc.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }}>
              {sc.fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: 0.5 }}>{f.label} {f.req && <span style={{ color: C.r }}>*</span>}</label>
                  {f.options ? (
                    <select value={mr[f.key] || ""} onChange={e => setMr(p => ({ ...p, [f.key]: e.target.value }))} style={inpS}>
                      <option value="">—</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type === "number" ? "number" : "text"} value={mr[f.key] || ""} placeholder={f.placeholder || ""}
                      onChange={e => setMr(p => ({ ...p, [f.key]: e.target.value }))} style={inpS} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={saveManual} style={{ padding: "7px 18px", background: C.gD, border: `1px solid ${C.g}`, color: C.g }}>✓ Guardar</Btn>
              <Btn onClick={() => setMr(null)} style={{ padding: "7px 18px", background: C.rD, border: `1px solid ${C.r}`, color: C.r }}>✗ Cancel·lar</Btn>
            </div>
          </div>
        )}

        {/* ═══ PENDING PREVIEW ═══ */}
        {pend && pTabs.length > 0 && (
          <div style={{ borderBottom: `2px solid ${C.o}`, background: C.s1, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 24px", gap: 6, borderBottom: `1px solid ${C.b1}`, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: C.o, fontWeight: 700, marginRight: 6 }}>⚡ PREVISUALITZACIÓ{pendRedo ? ` · ♻️ substitueix ${pendRedo} en confirmar` : ""}</span>
              {pTabs.map(t => (
                <Btn key={t} onClick={() => setPvt(t)} style={{
                  padding: "4px 12px", fontSize: 11,
                  background: pvt === t ? C.oD : "transparent",
                  border: `1px solid ${pvt === t ? C.o : C.b1}`,
                  color: pvt === t ? C.o : C.t2,
                }}>{SCHEMAS[t].icon} {SCHEMAS[t].label} ({pend[t].length})</Btn>
              ))}
              <div style={{ flex: 1 }} />
              <Btn onClick={confirmAll} style={{ padding: "5px 16px", background: C.gD, border: `1px solid ${C.g}`, color: C.g, fontSize: 11 }}>✓ Confirmar tot</Btn>
              <Btn onClick={() => { setPend(null); setPendRedo(null); setChangeLog([]); setStat("Descartat."); }} style={{ padding: "5px 16px", background: C.rD, border: `1px solid ${C.r}`, color: C.r, fontSize: 11 }}>✗ Descartar</Btn>
            </div>
            {changeLog.length > 0 && (
              <div style={{ padding: "7px 24px", background: "#1E1A06", borderBottom: `1px solid ${C.o}`, fontSize: 10, color: C.o, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                <span style={{ fontWeight: 700, marginRight: 4 }}>⚠️ Noms normalitzats:</span>
                {changeLog.map((c, i) => (
                  <span key={i} style={{ background: C.oD, borderRadius: 3, padding: "2px 7px" }}>
                    "{c.from}" → <strong style={{ color: C.t1 }}>"{c.to}"</strong>
                    <span style={{ color: C.t3, marginLeft: 4 }}>({SCHEMAS[c.table]?.label || c.table})</span>
                  </span>
                ))}
              </div>
            )}
            <div style={{ padding: "10px 24px 16px", overflowX: "auto", maxHeight: 260, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead><tr>
                  <th style={{ ...thS, color: C.o, width: 80 }}>Acció</th>
                  {SCHEMAS[pvt].fields.filter(f => !f.hidden).map(f => <th key={f.key} style={{ ...thS, color: C.o }}>{f.label}</th>)}
                  <th style={{ ...thS, width: 30 }} />
                </tr></thead>
                <tbody>
                  {(pend[pvt] || []).map((row, ri) => (
                    <tr key={ri}>
                      <td style={{ padding: "6px 10px", borderBottom: `1px solid ${C.b1}`, whiteSpace: "nowrap" }}>
                        {row._action === 'update'
                          ? <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: C.acD, color: C.ac, fontWeight: 600 }}>↻ Actualitza</span>
                          : <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: C.gD, color: C.g, fontWeight: 600 }}>✦ Nou</span>
                        }
                      </td>
                      {SCHEMAS[pvt].fields.filter(f => !f.hidden).map(f => (
                        <td key={f.key} onClick={() => editPendCell(pvt, ri, f.key)}
                          style={{ padding: "6px 10px", borderBottom: `1px solid ${C.b1}`, color: row[f.key] != null && row[f.key] !== "" ? C.t1 : C.t3, cursor: "pointer" }}>
                          {row[f.key] != null && row[f.key] !== "" ? String(row[f.key]) : "—"}
                        </td>
                      ))}
                      <td style={{ padding: "6px 4px", borderBottom: `1px solid ${C.b1}` }}>
                        <span onClick={() => removePendRow(pvt, ri)} style={{ cursor: "pointer", color: C.t3 }} title="Treure">✕</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 10, color: C.t3, marginTop: 8, marginBottom: 0 }}>💡 Clic a cel·la per corregir · ✕ per eliminar fila · <span style={{ color: C.ac }}>↻ Actualitza</span> = omple camps buits · <span style={{ color: C.g }}>✦ Nou</span> = inserció nova</p>
            </div>
          </div>
        )}

        {/* ═══ FLUX FILTER ═══ */}
        {act === "flux" && data.flux.length > 0 && (
          <div style={{ padding: "8px 24px", borderBottom: `1px solid ${C.b1}`, background: C.s1, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.t3, flexShrink: 0 }}>Producte:</span>
            <select value={fluxFilter} onChange={e => setFluxFilter(e.target.value)}
              style={{ padding: "4px 8px", background: C.bg, border: `1px solid ${C.b1}`, borderRadius: 4, color: C.t1, fontSize: 12, fontFamily: "inherit" }}>
              <option value="">Tots els productes ({data.flux.length} passos)</option>
              {[...new Set(data.flux.map(r => r.producte).filter(Boolean))].sort().map(p => (
                <option key={p} value={p}>{p} ({data.flux.filter(r => r.producte === p).length} passos)</option>
              ))}
            </select>
            {fluxFilter && (
              <Btn onClick={() => setFluxFilter("")} style={{ padding: "3px 10px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t3, fontSize: 10 }}>× Tots</Btn>
            )}
          </div>
        )}

        {/* ═══ AVÍS DE COMPOSICIONS PENDENTS (farcit i massa) ═══ */}
        {["farcit", "masses", "recepta"].includes(act) && (() => {
          const empty = [...incompleteFarcit, ...incompleteMasses];
          if (!empty.length && !missingTotal) return null;
          return (
            <div style={{ padding: "8px 24px", borderBottom: `1px solid ${C.o}`, background: C.oD, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {missingTotal > 0 && (
                  <div style={{ fontSize: 11, color: C.o, fontWeight: 600 }}>
                    ⚠️ {missingTotal} {missingTotal === 1 ? "codi referenciat sense fila" : "codis referenciats sense fila"}
                    {missingRows.filter(m => m.rows.length).map(({ spec, rows }) =>
                      ` · ${SCHEMAS[spec.table].label}: ${rows.map(r => r[spec.codeField]).sort().join(", ")}`
                    ).join("")}
                  </div>
                )}
                {empty.length > 0 && (
                  <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginTop: missingTotal ? 3 : 0 }}>
                    Amb fila però sense matèries primeres ({empty.length}): {empty.sort().join(", ")}
                  </div>
                )}
              </div>
              {missingTotal > 0 && (
                <Btn onClick={backfillCompositions}
                  style={{ padding: "6px 14px", background: C.o, border: "none", color: C.bg, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  Crear les {missingTotal} files
                </Btn>
              )}
            </div>
          );
        })()}

        {/* ═══ AVÍS DE CODIS ORFES (buits i sense ningú que els referenciï) ═══ */}
        {["farcit", "masses"].includes(act) && orphanTotal > 0 && (
          <div style={{ padding: "8px 24px", borderBottom: `1px solid ${C.r}`, background: C.rD, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.r, fontWeight: 600 }}>
                🧹 {orphanTotal} {orphanTotal === 1 ? "codi orfe i buit" : "codis orfes i buits"} — cap producte ni recepta els referencia
              </div>
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginTop: 3 }}>
                {orphanRows.flatMap(({ spec, rows }) => rows.map(r => r[spec.codeField])).sort().join(", ")}
              </div>
            </div>
            <Btn onClick={cleanOrphans}
              style={{ padding: "6px 14px", background: C.r, border: "none", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              Esborrar-los
            </Btn>
          </div>
        )}

        {/* ═══ AVÍS DE RECURSOS REFERENCIATS SENSE FILA ═══ */}
        {act === "linies" && missingResources.length > 0 && (
          <div style={{ padding: "8px 24px", borderBottom: `1px solid ${C.o}`, background: C.oD, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: C.o, fontWeight: 600 }}>
                ⚠️ {missingResources.length} {missingResources.length === 1 ? "recurs usat al flux que no és al catàleg" : "recursos usats al flux que no són al catàleg"}
              </div>
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.6, marginTop: 3 }}>
                {missingResources.map(r => r.linia).sort().join(", ")}
              </div>
            </div>
            <Btn onClick={backfillResources}
              style={{ padding: "6px 14px", background: C.o, border: "none", color: C.bg, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              Crear els {missingResources.length}
            </Btn>
          </div>
        )}

        {/* ═══ DATA TABLE ═══ */}
        <div style={{ flex: 1, padding: "16px 24px", overflowX: "auto", overflowY: "auto" }}>
          {(() => {
            if (sc.custom) return (
              <RerunPanel data={data} busy={rerunBusy} onRun={runRerun}
                onStop={() => { stopRerun.current = true; }}
                onApprove={approveRerun} onDiscard={discardRerun} />
            );
            // Filtered + sorted rows with original indices preserved
            const displayRows = act === "flux"
              ? data[act]
                  .map((row, i) => ({ row, idx: i }))
                  .filter(({ row }) => !fluxFilter || row.producte === fluxFilter)
                  .sort((a, b) => (a.row.pas ?? 9999) - (b.row.pas ?? 9999))
              : data[act].map((row, i) => ({ row, idx: i }));

            if (displayRows.length === 0) return (
              <div style={{ textAlign: "center", padding: "50px 20px", color: C.t3 }}>
                <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.15 }}>{sc.icon}</div>
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  {fluxFilter ? `Cap pas per a "${fluxFilter}"` : `Encara no hi ha registres a ${sc.label}`}
                </div>
                <div style={{ fontSize: 11 }}>
                  {act === "productes" && 'Prem "Gravar veu" per dictar el primer producte'}
                  {isV && act !== "productes" && !sc.manual && "S'omplirà quan dictis un producte"}
                  {act === "linies" && 'S\'afegiran automàticament en dictar un producte, o prem "+ Afegir recurs"'}
                  {!isV && 'Prem "+ Afegir registre"'}
                </div>
              </div>
            );

            const visibleFields = sc.fields.filter(f => !f.hidden);
            const hasTx = act === "productes";
            const txColSpan = 1 + visibleFields.length + 2; // # + fields + 📄 col + 🗑 col

            const toggleTx = (id) => setExpandedTx(prev => {
              const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
            });

            return (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr>
                  {hasTx && <th style={{ ...thS, width: 70 }} />}
                  <th style={{ ...thS, width: 36, textAlign: "center" }}>#</th>
                  {hasTx && <th style={{ ...thS, width: 28 }} title="Transcripció" />}
                  {visibleFields.map(f => <th key={f.key} style={thS}>{f.label}</th>)}
                  <th style={{ ...thS, width: 36 }} />
                </tr></thead>
                <tbody>
                  {displayRows.map(({ row, idx }, ri) => {
                    const rowId = row.id || ri;
                    const txOpen = expandedTx.has(rowId);
                    return (
                      <>
                        <tr key={rowId}
                          onMouseEnter={e => e.currentTarget.style.background = C.s2}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          {hasTx && (
                            <td style={{ ...tdS, whiteSpace: "nowrap" }}>
                              <div style={{ display: "flex", gap: 5 }}>
                                <Btn
                                  onClick={() => { setDupSrc(row.producte); setDupNewCode(""); setDupText(""); }}
                                  style={{
                                    padding: "3px 9px", fontSize: 10,
                                    background: C.oD, border: `1px solid ${C.o}`,
                                    color: C.o, borderRadius: 4,
                                  }}>
                                  Copiar
                                </Btn>
                                {row.transcripcio && (
                                  <Btn
                                    onClick={() => { setRedoSrc(row.producte); setRedoText(row.transcripcio); }}
                                    title="Tornar a processar aquest producte. Res no es substitueix fins que confirmes"
                                    style={{
                                      padding: "3px 9px", fontSize: 10,
                                      background: C.acD, border: `1px solid ${C.ac}`,
                                      color: C.ac, borderRadius: 4,
                                    }}>
                                    Refer
                                  </Btn>
                                )}
                              </div>
                            </td>
                          )}
                          <td style={{ ...tdS, textAlign: "center", color: C.t3, fontSize: 10 }}>{ri + 1}</td>
                          {hasTx && (
                            <td style={{ ...tdS, textAlign: "center" }}>
                              {row.transcripcio ? (
                                <span
                                  onClick={() => toggleTx(rowId)}
                                  title={txOpen ? "Amagar transcripció" : "Veure transcripció"}
                                  style={{ cursor: "pointer", fontSize: 13, opacity: txOpen ? 1 : 0.5 }}>
                                  📄
                                </span>
                              ) : null}
                            </td>
                          )}
                          {visibleFields.map(f => {
                            const isEd = ec?.ri === idx && ec?.key === f.key;
                            const isText = f.type !== "number" && !f.options;
                            // A recepta, avisa si el codi referenciat encara no té composició
                            const codesPending = act === "recepta"
                              && (f.key === "codi_farcit" || f.key === "codi_massa")
                              && splitCodes(row[f.key]).filter(c => incompleteSet.has(normalizeStr(c)));
                            return (
                              <td key={f.key} onClick={() => !isEd && startEdit(idx, f.key, row[f.key])}
                                style={{
                                  ...tdS, cursor: "pointer", padding: isEd ? "2px 4px" : undefined,
                                  ...(isText && !isEd ? { maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}),
                                }}>
                                {isEd ? (
                                  f.options ? (
                                    <select ref={eRef} value={ev} onChange={e => setEv(e.target.value)} onBlur={commitEdit}
                                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEc(null); }}
                                      style={ceS}>
                                      <option value="">—</option>{f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  ) : (
                                    <input ref={eRef} type={f.type === "number" ? "number" : "text"} value={ev}
                                      onChange={e => setEv(e.target.value)} onBlur={commitEdit}
                                      onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEc(null); }}
                                      style={ceS} />
                                  )
                                ) : (
                                  <>
                                    <span title={isText && row[f.key] ? String(row[f.key]) : undefined}
                                      style={{ color: row[f.key] != null && row[f.key] !== "" ? C.t1 : C.t3 }}>
                                      {row[f.key] != null && row[f.key] !== "" ? String(row[f.key]) : "—"}
                                    </span>
                                    {codesPending && codesPending.length > 0 && (
                                      <span
                                        title={`Sense composició registrada: ${codesPending.join(", ")}`}
                                        style={{ marginLeft: 5, color: C.o, fontSize: 11 }}>
                                        ⚠️
                                      </span>
                                    )}
                                  </>
                                )}
                              </td>
                            );
                          })}
                          <td style={tdS}>
                            <span onClick={() => handleDelete(idx)} style={{ cursor: "pointer", color: C.t3, fontSize: 13 }} title="Eliminar">🗑</span>
                          </td>
                        </tr>
                        {hasTx && txOpen && row.transcripcio && (
                          <tr key={`${rowId}-tx`}>
                            <td colSpan={txColSpan}
                              style={{ padding: "10px 16px", background: C.s1, borderBottom: `1px solid ${C.b1}` }}>
                              <div style={{ fontSize: 10, color: C.t3, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" }}>Transcripció original</div>
                              <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 200, overflowY: "auto" }}>
                                {row.transcripcio}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>
      </main>

      {/* ═══ MODAL DUPLICAR AMB MODIFICACIONS PER VEU ═══ */}
      {dupSrc !== null && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => { if (!dupProcessing) { stopDupRec(); setDupSrc(null); } }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.s1, border: `1px solid ${C.b1}`, borderRadius: 8,
            padding: 28, width: 460, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            {/* Capçalera */}
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>🔁 Crear variant de producte</div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 20 }}>
              Base: <span style={{ color: C.ac, fontWeight: 600 }}>{dupSrc}</span>
              <span style={{ marginLeft: 8 }}>· Dicta o escriu només el que canvia. La resta es copia del base.</span>
            </div>

            {/* Nou codi */}
            <label style={{ fontSize: 11, color: C.t2, display: "block", marginBottom: 16 }}>
              Nou codi de producte <span style={{ color: C.r }}>*</span>
              <input
                autoFocus
                type="text"
                value={dupNewCode}
                onChange={e => setDupNewCode(e.target.value)}
                placeholder="Ex: 24155538"
                disabled={dupProcessing}
                style={{ ...inpS, marginTop: 5 }}
              />
            </label>

            {/* Zona de modificacions — mic + textarea */}
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 8 }}>
              Modificacions respecte al base{" "}
              <span style={{ color: C.t3 }}>(opcional — si no dius res, es copia tal qual)</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {!dupIsRec ? (
                <Btn onClick={startDupRec} disabled={dupProcessing}
                  style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${C.r}, #DC2626)`, border: "none", color: "#fff", fontSize: 11 }}>
                  ⏺ Micròfon
                </Btn>
              ) : (
                <Btn onClick={stopDupRec}
                  style={{ padding: "7px 14px", background: C.rD, border: `2px solid ${C.r}`, color: C.r, fontSize: 11, animation: "pulse 1.5s infinite" }}>
                  ⏹ Parar
                </Btn>
              )}
              {dupText && (
                <Btn onClick={() => setDupText("")} disabled={dupProcessing}
                  style={{ padding: "7px 10px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t3, fontSize: 11 }}>
                  🗑 Netejar
                </Btn>
              )}
            </div>
            <textarea
              value={dupText}
              onChange={e => setDupText(e.target.value)}
              disabled={dupProcessing}
              placeholder={`Ex: "canvia el codi de farcit a R3060, el farcit ara pesa 200 grams, i la freidora tarda 25 minuts"`}
              rows={5}
              style={{
                ...inpS, resize: "vertical", lineHeight: 1.6,
                color: dupText ? C.t1 : C.t3,
                marginBottom: 20,
              }}
            />

            {/* Botons */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={() => { stopDupRec(); setDupSrc(null); setDupNewCode(""); setDupText(""); }}
                disabled={dupProcessing}
                style={{ padding: "8px 18px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 12 }}>
                Cancel·lar
              </Btn>
              <Btn
                disabled={!dupNewCode.trim() || dupProcessing}
                onClick={processDuplicateWithVoice}
                style={{
                  padding: "8px 20px", fontSize: 12,
                  background: dupNewCode.trim() && !dupProcessing ? C.ac : C.s2,
                  border: "none",
                  color: dupNewCode.trim() && !dupProcessing ? "#fff" : C.t3,
                  opacity: dupNewCode.trim() && !dupProcessing ? 1 : 0.5,
                }}>
                {dupProcessing ? "🤖 Processant..." : "✨ Crear variant"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: REFER UN PRODUCTE ═══ */}
      {redoSrc && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }} onClick={() => { if (!parsing) { stopRedoRec(); setRedoSrc(null); } }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.s1, border: `1px solid ${C.b1}`, borderRadius: 8,
            padding: 28, width: 560, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>♻️ Refer el producte</div>
            <div style={{ fontSize: 11, color: C.t3, marginBottom: 18 }}>
              Producte: <span style={{ color: C.ac, fontWeight: 600 }}>{redoSrc}</span>
            </div>

            {/* Què s'esborra */}
            <div style={{
              padding: "10px 14px", marginBottom: 18, borderRadius: 6,
              background: C.rD, border: `1px solid ${C.r}`,
            }}>
              <div style={{ fontSize: 11, color: C.r, fontWeight: 600, marginBottom: 4 }}>
                En confirmar el resultat, aquestes files se substituiran (fins llavors no es toca res):
              </div>
              <div style={{ fontSize: 11, color: C.t2, lineHeight: 1.7 }}>
                {PER_PRODUCT_TABLES.map(t =>
                  `${SCHEMAS[t].icon} ${SCHEMAS[t].label}: ${redoCounts?.[t] ?? 0}`).join("  ·  ")}
              </div>
              <div style={{ fontSize: 10, color: C.t3, marginTop: 5 }}>
                Farcit, Masses i Recursos no es toquen: són catàlegs compartits amb altres productes.
              </div>
            </div>

            {/* Transcripció editable */}
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 8 }}>
              Transcripció{" "}
              <span style={{ color: C.t3 }}>(corregeix-la o afegeix-hi el que faltava abans de refer)</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {!redoIsRec ? (
                <Btn onClick={startRedoRec} disabled={parsing}
                  style={{ padding: "7px 14px", background: `linear-gradient(135deg, ${C.r}, #DC2626)`, border: "none", color: "#fff", fontSize: 11 }}>
                  ⏺ Afegir dictant
                </Btn>
              ) : (
                <Btn onClick={stopRedoRec}
                  style={{ padding: "7px 14px", background: C.rD, border: `2px solid ${C.r}`, color: C.r, fontSize: 11, animation: "pulse 1.5s infinite" }}>
                  ⏹ Parar
                </Btn>
              )}
            </div>
            <textarea
              value={redoText}
              onChange={e => setRedoText(e.target.value)}
              disabled={parsing}
              rows={10}
              style={{ ...inpS, resize: "vertical", lineHeight: 1.6, marginBottom: 20 }}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={() => { stopRedoRec(); setRedoSrc(null); setRedoText(""); }}
                disabled={parsing}
                style={{ padding: "8px 18px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 12 }}>
                Cancel·lar
              </Btn>
              <Btn
                disabled={!redoText.trim() || parsing}
                onClick={reprocessProduct}
                style={{
                  padding: "8px 20px", fontSize: 12,
                  background: redoText.trim() && !parsing ? C.r : C.s2,
                  border: "none",
                  color: redoText.trim() && !parsing ? "#fff" : C.t3,
                  opacity: redoText.trim() && !parsing ? 1 : 0.5,
                }}>
                {parsing ? "🤖 Processant..." : "♻️ Refer"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:${C.b1};border-radius:3px}
        select option{background:${C.s1};color:${C.t1}}
      `}</style>
    </div>
  );
}

const RERUN_STATUS = {
  pendent:   { label: "Per revisar", color: C.o },
  aprovat:   { label: "Aprovat",     color: C.g },
  descartat: { label: "Descartat",   color: C.t3 },
  error:     { label: "Error",       color: C.r },
};

const RERUN_STEP_COLUMNS = [
  ["pas", "Pas"], ["dia", "Dia"], ["accio", "Què es fa"], ["linia", "Recurs"], ["temps_per_kg", "Temps"],
  ["minuts_min", "Min"], ["minuts_max", "Màx"], ["temps_quantitat", "Quant."], ["temps_unitat", "Unitat"],
  ["persones_necessaries", "Pers."], ["perfils_de_persona", "Perfil"], ["frequencia", "Freqüència"],
  ["minuts_abans_produccio", "Abans"], ["depen_de_pas", "Depèn"], ["alternativa_de", "Alt."], ["comentaris", "Comentaris"],
];

const sectionTitle = { fontSize: 11, fontWeight: 700, color: "#94A3B5", margin: "16px 0 6px", textTransform: "uppercase", letterSpacing: 0.5 };

function RerunSteps({ rows }) {
  const sorted = [...rows].sort((a, b) => (a.dia - b.dia) || (a.pas - b.pas));
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%" }}>
      <thead><tr>{RERUN_STEP_COLUMNS.map(([k, l]) => <th key={k} style={thS}>{l}</th>)}</tr></thead>
      <tbody>
        {sorted.map((r, i) => (
          <tr key={i}>{RERUN_STEP_COLUMNS.map(([k]) => <td key={k} style={tdS}>{r[k] ?? ""}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

function RerunChanges({ changes }) {
  if (!changes.length) return <div style={{ fontSize: 11, color: C.t3 }}>Sense canvis.</div>;
  return (
    <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
      <thead><tr><th style={thS}>Camp</th><th style={thS}>Ara</th><th style={thS}>Després</th></tr></thead>
      <tbody>
        {changes.map(c => (
          <tr key={c.key}>
            <td style={tdS}>{c.label}</td>
            <td style={{ ...tdS, color: C.t3 }}>{String(c.from ?? "—")}</td>
            <td style={{ ...tdS, color: c.kind === "substitueix" ? C.o : C.g }}>{String(c.to)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RerunDetail({ row, data, held, busy, onApprove, onDiscard, onRun }) {
  if (row.estat === "error") return (
    <div style={{ fontSize: 12, color: C.r }}>{row.error}
      <div><Btn disabled={busy} onClick={() => onRun([row.producte])} style={{ marginTop: 10, padding: "6px 14px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 11 }}>↻ Tornar a processar</Btn></div>
    </div>
  );

  const merged = mergedRerun(row, data, held);
  const current = rowsOfProduct(data, row.producte);
  const product = merged.productes?.[0] || {};
  const productChanges = fieldChanges("productes", current.productes[0], product);
  const lost = vanishingCodes(current, merged);
  const reviewed = row.estat !== "pendent";

  return (
    <div>
      {lost.length > 0 && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: C.rD, border: `1px solid ${C.r}`, color: C.r, fontSize: 11, marginBottom: 10 }}>
          ⚠️ Aquests codis desapareixeran en aprovar: {lost.join(", ")}
        </div>
      )}
      {product.no_classificat && (
        <div style={{ padding: "8px 12px", borderRadius: 6, background: C.oD, border: `1px solid ${C.o}`, color: C.o, fontSize: 11, marginBottom: 10, whiteSpace: "pre-wrap" }}>
          ⚠️ Frases amb xifres que no consten enlloc:{"\n"}{product.no_classificat}
        </div>
      )}

      <div style={sectionTitle}>Producte</div>
      <RerunChanges changes={productChanges} />

      <div style={sectionTitle}>Recepta ({current.recepta.length} → {merged.recepta.length})</div>
      {merged.recepta.map((r, i) => {
        const sameRecipe = SECONDARY_CHECKS.find(c => c.table === "recepta").matchFn;
        const old = current.recepta.find(o => sameRecipe(r, o));
        return (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.t2, marginBottom: 3 }}>{r.codi_farcit || "—"} · {r.codi_massa || "—"}{old ? "" : " (nova)"}</div>
            <RerunChanges changes={fieldChanges("recepta", old, r)} />
          </div>
        );
      })}

      <div style={sectionTitle}>Passos ({current.flux.length} → {(merged.flux || []).length}). Els nous substitueixen els actuals</div>
      <div style={{ overflowX: "auto" }}><RerunSteps rows={merged.flux || []} /></div>
      <details style={{ marginTop: 10 }}>
        <summary style={{ fontSize: 11, color: C.t3, cursor: "pointer" }}>Veure els passos actuals</summary>
        <div style={{ overflowX: "auto", marginTop: 6 }}><RerunSteps rows={current.flux} /></div>
      </details>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Btn disabled={busy || reviewed} onClick={() => onApprove(row)} style={{ padding: "8px 20px", background: reviewed ? C.s2 : C.g, border: "none", color: reviewed ? C.t3 : C.bg, fontSize: 12 }}>✓ Aprovar i desar</Btn>
        <Btn disabled={busy || reviewed} onClick={() => onDiscard(row)} style={{ padding: "8px 18px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 12 }}>Descartar</Btn>
        <Btn disabled={busy} onClick={() => onRun([row.producte])} style={{ padding: "8px 18px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 12 }}>↻ Tornar a processar</Btn>
      </div>
    </div>
  );
}

function RerunPanel({ data, busy, onRun, onStop, onApprove, onDiscard }) {
  const [codes, setCodes] = useState("24100832, 24382, 236948");
  const [open, setOpen] = useState(null);
  const held = new Map(data.reprocessament.map(r => [r.producte, r]));
  const queue = rerunOrder(data.productes);
  const names = new Map(data.productes.map(p => [p.producte, p.grup]));
  const left = queue.filter(q => !held.has(q.code) || held.get(q.code).estat === "error").length;

  const runAll = () => {
    if (window.confirm(`Es processaran ${left} productes amb la IA, cosa que té un cost. Les dades no es tocaran fins que els aprovis. Continuar?`)) onRun(null);
  };

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: C.t2, lineHeight: 1.7 }}>
        Torna a extreure cada producte de la seva gravació. El resultat queda en espera i les dades no canvien fins que aproves el producte.
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <input value={codes} onChange={e => setCodes(e.target.value)} disabled={busy} style={{ ...inpS, width: 280, marginTop: 0 }} />
        <Btn disabled={busy} onClick={() => onRun(splitCodes(codes))} style={{ padding: "7px 16px", background: C.acD, border: `1px solid ${C.ac}`, color: C.ac, fontSize: 11 }}>🤖 Processar aquests</Btn>
        <Btn disabled={busy || !left} onClick={runAll} style={{ padding: "7px 16px", background: C.s2, border: `1px solid ${C.b1}`, color: C.t2, fontSize: 11 }}>Processar tots els pendents ({left})</Btn>
        {busy && <Btn onClick={onStop} style={{ padding: "7px 16px", background: C.rD, border: `1px solid ${C.r}`, color: C.r, fontSize: 11 }}>⏹ Aturar</Btn>}
      </div>

      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
        <thead><tr>{["Codi", "Producte", "Base", "Estat", ""].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
        <tbody>
          {queue.map(q => {
            const row = held.get(q.code);
            const status = row ? RERUN_STATUS[row.estat] : null;
            return [
              <tr key={q.code} onClick={() => row && setOpen(open === q.code ? null : q.code)} style={{ cursor: row ? "pointer" : "default" }}>
                <td style={tdS}>{q.code}{FLAGGED_PRODUCTS.has(q.code) && <span title="Té valors que no consten a la gravació" style={{ color: C.o, marginLeft: 6 }}>⚠</span>}</td>
                <td style={tdS}>{names.get(q.code)}</td>
                <td style={{ ...tdS, color: C.t3 }}>{q.base || ""}</td>
                <td style={{ ...tdS, color: status?.color || C.t3 }}>{status?.label || "Sense processar"}</td>
                <td style={{ ...tdS, color: C.t3 }}>{row ? (open === q.code ? "▲" : "▼") : ""}</td>
              </tr>,
              open === q.code && row && (
                <tr key={q.code + "-detail"}>
                  <td colSpan={5} style={{ padding: "14px 16px", background: C.s1, borderBottom: `1px solid ${C.b1}` }}>
                    <RerunDetail row={row} data={data} held={held} busy={busy} onApprove={onApprove} onDiscard={onDiscard} onRun={onRun} />
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

const thS = { padding: "8px 10px", textAlign: "left", color: "#637486", fontWeight: 600, borderBottom: "2px solid #28374A", whiteSpace: "nowrap", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 };
const tdS = { padding: "6px 10px", borderBottom: "1px solid #28374A" };
const inpS = { width: "100%", padding: "6px 8px", background: "#0A0E13", border: "1px solid #28374A", borderRadius: 4, color: "#E6EDF5", fontSize: 12, fontFamily: "inherit", marginTop: 3, boxSizing: "border-box" };
const ceS = { width: "100%", padding: "5px 8px", background: "#0A0E13", border: "2px solid #3B8EEA", borderRadius: 4, color: "#E6EDF5", fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
