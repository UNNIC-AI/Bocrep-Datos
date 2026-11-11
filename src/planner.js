// Què li falta a cada producte perquè el planificador el pugui programar.
// Tot es calcula a partir de les dades desades, de manera que l'informe es pot tornar a generar
// sempre que s'omplin dades noves.

const isBlank = v => v === null || v === undefined || String(v).trim() === ''

// Operacions que es repeteixen a gairebé tots els productes: es pregunten UNA sola vegada per a
// tots, no producte per producte. L'ordre importa: guanya el primer grup que coincideix.
export const COMMON_OPERATIONS = [
  { key: 'retractilat', label: 'Retractilado y almacenaje del palet', re: /retractil/i },
  { key: 'paletitzacio', label: 'Paletizado', re: /paletitz/i },
  { key: 'etiquetat', label: 'Etiquetado de cajas', re: /etiquet/i },
  { key: 'carros_buits', label: 'Llevar y lavar los carros vacíos', re: /carros? buits|rentat de carros/i },
  { key: 'preparacio_carros', label: 'Preparación de carros', re: /preparaci[óo] (de )?carros/i },
  { key: 'materies_primeres', label: 'Preparación de materias primas', re: /mat[èe]ries primeres|matèria primera/i },
  { key: 'llaunes', label: 'Abrir latas y pesar ingredientes', re: /llaunes/i },
  { key: 'rustideres', label: 'Vaciar el relleno en rustideras', re: /(buidat|dividir|passar).*rustider/i },
  { key: 'nevera', label: 'Guardar o pasar el relleno a la nevera', re: /nevera/i },
  { key: 'neteja_containers', label: 'Limpieza de containers y rustideras', re: /neteja.*(container|rustider)/i },
  { key: 'neteja_turmix', label: 'Limpieza del túrmix', re: /neteja.*turmix|neteja.*túrmix/i },
  { key: 'dosificador', label: 'Preparar, purgar y calibrar el dosificador', re: /(prepar|purg|calibr|c[àa]rrega).*dosificador/i },
  { key: 'calibratge_detectors', label: 'Calibrar los detectores de metales', re: /calibr.*detector/i },
  { key: 'neteja_encaixat', label: 'Limpieza de precintadora, máquina de encajar y detectores', re: /neteja.*(precintador|detector|encaixar)/i },
  { key: 'encaixat', label: 'Encajado', re: /^encaixat/i },
  { key: 'neteja_cuina', label: 'Limpieza de ollas, fogones, abrelatas y utensilios', re: /neteja.*(olla|olles|fog|abrelatas|estris|utensilis|mezcladora|remo)/i },
  { key: 'encolant', label: 'Batido del encolante', re: /encolant/i },
  { key: 'oblees', label: 'Abrir obleas y pasarlas a cajas', re: /obrir.*oblea|oblea.*caixes/i },
  { key: 'safates', label: 'Preparación de bandejas (lámina de plástico)', re: /safates/i },
]

// Un pas de dosificació ocupa el dosificador durant el fabricat: el seu temps és el del fabricat
const SHARES_PRODUCTION_TIME = /^dosificaci[óo]$/i

// Famílies de producte: algunes dades (unitats per carro) solen ser iguals dins d'una família
const FAMILIES = [
  ['Crepes', /cr[eêé]p/i], ['Rolls', /(^|\s)rol/i], ['Burritos', /burrito/i], ['Tacos', /(^|\s)taco/i],
  ['Quesadillas', /quesadilla/i], ['Miniflautas', /flauta/i],
]
export const familyOf = name => FAMILIES.find(([, re]) => re.test(name || ''))?.[0] || 'Otros'

export const PRODUCT_FIELDS = [
  { key: 'unitats_per_palet', q: '¿Cuántas unidades hay en un palet?' },
  { key: 'caixes_per_palet', q: '¿Cuántas cajas hay en un palet?' },
  { key: 'unitats_per_caixa', q: '¿Cuántas unidades van en una caja?' },
  { key: 'unitats_per_carro', q: '¿Cuántas unidades caben en un carro?' },
  { key: 'dies_permesos', q: '¿Qué días de la semana se puede fabricar? (o «todos»)' },
  { key: 'linies_permeses', q: '¿En qué línea o máquina se puede fabricar?' },
]

const hasTime = f => !isBlank(f.minuts_min) || !isBlank(f.minuts_max)

const commonOperation = accio => COMMON_OPERATIONS.find(o => o.re.test(accio || ''))

const splitProfiles = s => String(s || '').split(/[\/,]| o /).map(x => x.trim()).filter(Boolean)

// Agrupa les files de flux d'un producte per pas: les files d'un mateix pas són un sol pas
// que ocupa diversos recursos alhora
function stepsOf(flux, code) {
  const byPas = new Map()
  for (const f of flux) {
    if (f.producte !== code) continue
    const k = String(f.pas)
    if (!byPas.has(k)) byPas.set(k, [])
    byPas.get(k).push(f)
  }
  return [...byPas.values()]
    .map(rows => ({ pas: rows[0].pas, accio: rows.find(r => !isBlank(r.accio))?.accio || '', rows }))
    .sort((a, b) => (Number(a.rows[0].dia) || 0) - (Number(b.rows[0].dia) || 0) || (Number(a.pas) || 0) - (Number(b.pas) || 0))
}

function productGaps(p, data) {
  const code = p.producte
  const questions = []
  // 'target' diu on es desa la resposta: un camp del producte o les files d'un pas
  const ask = (on, q, kind = 'dada', target = { table: 'productes', ids: [p.id], field: on }) => questions.push({ on, q, kind, target })

  if (isBlank(code)) ask('Código', 'Este producto no tiene código. ¿Cuál es?', 'codi', { table: 'productes', ids: [p.id], field: 'producte' })
  // Sense gravació, tota la resta sortirà d'ella quan es gravi
  if (isBlank(p.transcripcio)) {
    ask('Grabación', 'No hay grabación de este producto: hay que grabarlo como los demás.', 'gravacio', null)
    return { id: p.id, code, name: p.grup || '', family: familyOf(p.grup), questions, common: [], steps: 0 }
  }

  for (const f of PRODUCT_FIELDS) if (isBlank(p[f.key])) ask(f.key, f.q)

  // Massa i farcit: el codi sense kg, o res de res
  for (const [codeKey, kgKey, name] of [['codi_massa', 'kg_massa_palet', 'masa'], ['codi_farcit', 'kg_farcit_palet', 'relleno']]) {
    if (isBlank(p[codeKey]) && isBlank(p[kgKey])) ask(codeKey, `¿Lleva ${name}? Si lleva, ¿qué código y cuántos kg por palet?`, 'dada', { table: 'productes', ids: [p.id], field: codeKey, field2: kgKey })
    else if (isBlank(p[kgKey])) ask(kgKey, `¿Cuántos kg de ${name} (${p[codeKey]}) se necesitan por palet?`)
    else if (isBlank(p[codeKey])) ask(codeKey, `¿Qué código tiene la ${name} (${p[kgKey]} kg por palet)?`)
  }

  if (!isBlank(p.no_classificat)) ask('no_classificat', `La grabación dice estas cifras y no sabemos a qué corresponden: «${p.no_classificat}»`)

  const steps = stepsOf(data.flux, code)
  if (!isBlank(code) && !isBlank(p.transcripcio) && steps.length === 0) ask('Pasos', 'No tiene pasos: hay que procesar la grabación.', 'gravacio', null)

  const common = []
  for (const s of steps) {
    const label = `Paso ${s.pas} «${s.accio || 'sin nombre'}»`
    const op = commonOperation(s.accio)
    const people = s.rows.map(r => r.persones_necessaries).filter(v => !isBlank(v))
    const noTime = !s.rows.some(hasTime) && !SHARES_PRODUCTION_TIME.test(s.accio.trim())
    const noPeople = s.rows.some(hasTime) && people.length === 0
    const noProfile = people.some(n => Number(n) > 0) && !s.rows.some(r => !isBlank(r.perfils_de_persona))
    // Les operacions comunes es pregunten una sola vegada per a tots els productes
    const ids = s.rows.map(r => r.id)
    if (op) {
      if (noTime) common.push({ key: op.key, what: 'temps', ids })
      if (noPeople) common.push({ key: op.key, what: 'persones', ids })
      if (noProfile) common.push({ key: op.key, what: 'perfil', ids })
    } else {
      const step = { table: 'flux', ids }
      if (noTime) ask(`pas ${s.pas}`, `${label}: ¿cuánto tarda? (tiempo fijo, o por kg, caja, carro o palet)`, 'temps', step)
      if (noPeople) ask(`pas ${s.pas}`, `${label}: ¿cuántas personas y de qué perfil? (o «nadie», o «lo hace quien ya está en otro paso»)`, 'persones', step)
      if (noProfile) ask(`pas ${s.pas}`, `${label}: ¿qué perfil tienen las ${Math.max(...people.map(Number))} persona(s)?`, 'perfil', step)
    }
    if (!s.rows.some(r => !isBlank(r.frequencia))) ask(`pas ${s.pas}`, `${label}: ¿se hace en cada producción, al final de la jornada o de la semana?`, 'frequencia', { table: 'flux', ids })
  }

  return { id: p.id, code, name: p.grup || '', family: familyOf(p.grup), questions, common, steps: steps.length }
}

export function findGaps(data) {
  const products = data.productes
    .map(p => productGaps(p, data))
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true }))

  // Per a cada operació comuna: quins productes hi tenen buits i de quina mena
  const operations = COMMON_OPERATIONS
    .map(o => {
      const of = what => products.flatMap(p => p.common.filter(c => c.key === o.key && c.what === what).flatMap(c => c.ids))
      const ids = { temps: of('temps'), persones: of('persones'), perfil: of('perfil') }
      const missing = Object.keys(ids).filter(w => ids[w].length)
      const products_ = products.filter(p => p.common.some(c => c.key === o.key)).map(p => p.code)
      return { ...o, missing, ids, products: products_ }
    })
    .filter(o => o.products.length)

  // Perfils que surten als passos: el planificador ha de saber quantes persones de cada perfil hi ha
  const profileUse = new Map()
  // «Qualsevol» vol dir que ho pot fer qualsevol: no és un perfil de plantilla
  for (const f of data.flux) for (const prof of splitProfiles(f.perfils_de_persona).filter(x => !/^qualsevol$/i.test(x))) {
    if (!profileUse.has(prof)) profileUse.set(prof, new Set())
    profileUse.get(prof).add(f.producte)
  }
  // Un perfil està cobert quan hi ha almenys una persona d'aquest tipus a Torns
  const staffed = new Set(data.torns.map(t => String(t.tipus_personal || '').trim().toLowerCase()))
  const profiles = [...profileUse].map(([name, set]) => ({ name, products: set.size, staff: data.torns.filter(t => String(t.tipus_personal || '').trim().toLowerCase() === name.toLowerCase()), done: staffed.has(name.toLowerCase()) }))
    .sort((a, b) => b.products - a.products)

  const resourceUse = new Map()
  for (const f of data.flux) if (!isBlank(f.linia)) resourceUse.set(f.linia, (resourceUse.get(f.linia) || new Set()).add(f.producte))
  const resources = data.linies
    .filter(l => isBlank(l.quantitat))
    .map(l => ({ id: l.id, name: l.linia, products: resourceUse.get(l.linia)?.size || 0 }))
    .sort((a, b) => b.products - a.products)

  return {
    products,
    operations,
    profiles,
    resources,
    noStaff: data.torns.length === 0,
    total: products.reduce((n, p) => n + p.questions.length, 0) + operations.length + resources.length,
  }
}

export { stepsOf, isBlank }
